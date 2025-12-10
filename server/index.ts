
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from 'ws';
import { PlayerState, ConductorState, InstrumentRole, WSMessage } from '../types';

// --- CONFIG ---
const PORT = 8080;
const GEMINI_API_KEY = process.env.API_KEY || ''; 

// --- SERVER STATE ---
interface Client {
  ws: WebSocket;
  id: string;
  role: InstrumentRole;
  lastActivity: number;
}

interface Room {
  id: string;
  clients: Map<string, Client>; // ClientID -> Client
  playerStates: Map<string, PlayerState>; // ClientID -> Last State
  conductorState: ConductorState;
}

const rooms = new Map<string, Room>();

// --- GEMINI SETUP ---
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are the AI Conductor of "The Silent Orchestra", a real-time band where users play Air Instruments.
Your goal is to analyze the aggregate behavior of the musicians in this specific room and DIRECT them.

INPUTS:
You will receive a description of the current scene, e.g., "Drums are playing fast (Velocity: 0.9), Bass is silent."

OUTPUT:
Return a JSON object with:
- "tempo": (integer 60-180)
- "key": (string, e.g., "C Major")
- "scale": (string, e.g., "major", "pentatonic")
- "mood": (string, creative description)
- "instruction": (short command)

LOGIC:
- High Energy -> Fast Tempo, Major Key.
- Low Energy -> Slow Tempo, Minor Key.
- Balanced -> Mid Tempo.
`;

// --- WEBSOCKET SERVER ---
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7);
  let currentRoomId: string | null = null;

  console.log(`Client connected: ${clientId}`);

  ws.on('message', (message: WebSocket.RawData) => {
    try {
      const msgStr = message.toString();
      const msg: WSMessage = JSON.parse(msgStr);

      // 1. JOIN ROOM
      if (msg.type === 'JOIN' && msg.roomId) {
        currentRoomId = msg.roomId;
        const role = msg.role || InstrumentRole.NONE;

        // Create Room if not exists
        if (!rooms.has(currentRoomId)) {
          rooms.set(currentRoomId, {
            id: currentRoomId,
            clients: new Map(),
            playerStates: new Map(),
            conductorState: { 
              tempo: 120, key: 'C Major', scale: 'major', mood: 'Waiting...', instruction: 'Let\'s Play!' 
            }
          });
          console.log(`Room created: ${currentRoomId}`);
        }

        const room = rooms.get(currentRoomId)!;
        room.clients.set(clientId, { ws, id: clientId, role, lastActivity: Date.now() });
        
        // Send initial conductor state to new joiner
        ws.send(JSON.stringify({
            type: 'CONDUCTOR_UPDATE',
            data: room.conductorState
        }));

        console.log(`Client ${clientId} joined Room ${currentRoomId} as ${role}`);
      }

      // 2. PLAYER UPDATE & RELAY
      if (msg.type === 'UPDATE' && currentRoomId && msg.data) {
        const room = rooms.get(currentRoomId);
        if (room) {
           // Store state
           room.playerStates.set(clientId, msg.data);
           const client = room.clients.get(clientId);
           if (client) {
             client.lastActivity = Date.now();
             client.role = msg.data.role; // Update role if changed
           }

           // BROADCAST TO OTHERS IN ROOM (Peer-to-Peer Relay)
           const broadcastMsg = JSON.stringify({
             type: 'UPDATE', // Use UPDATE type so clients can treat it as remote player data
             roomId: currentRoomId,
             data: { ...msg.data, clientId } // Append clientId to identify source
           });

           room.clients.forEach((c) => {
               if (c.id !== clientId && c.ws.readyState === WebSocket.OPEN) {
                   c.ws.send(broadcastMsg);
               }
           });
        }
      }

    } catch (e) {
      console.error('Invalid Message', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && rooms.has(currentRoomId)) {
      const room = rooms.get(currentRoomId)!;
      room.clients.delete(clientId);
      room.playerStates.delete(clientId);
      
      console.log(`Client ${clientId} disconnected from Room ${currentRoomId}`);

      // Cleanup empty rooms
      if (room.clients.size === 0) {
        rooms.delete(currentRoomId);
        console.log(`Room ${currentRoomId} deleted (empty)`);
      }
    }
  });
});

console.log(`Orchestra Server running on port ${PORT}`);

// --- THE AI CONDUCTOR LOOP (PER ROOM) ---
setInterval(async () => {
  
  for (const [roomId, room] of rooms.entries()) {
    if (room.clients.size === 0) continue;

    // 1. Aggregate Data
    let totalVelocity = 0;
    let activeCount = 0;
    const roleDescriptions: string[] = [];
    const now = Date.now();

    room.playerStates.forEach((state, clientId) => {
      // Only count activity from last 3 seconds
      if (now - state.timestamp < 3000) {
        totalVelocity += state.velocity;
        activeCount++;
        roleDescriptions.push(`${state.role} (${(state.velocity * 100).toFixed(0)}%)`);
      }
    });

    // Skip AI call if band is completely silent to save API quota
    // But if state is "Waiting", do nothing.
    if (activeCount === 0) {
       if (room.conductorState.mood !== "Waiting for input...") {
          room.conductorState.mood = "Waiting for input...";
          room.conductorState.instruction = "Start playing to wake the AI";
          const resetMsg = JSON.stringify({ type: 'CONDUCTOR_UPDATE', data: room.conductorState });
          room.clients.forEach(c => c.ws.send(resetMsg));
       }
       continue;
    }

    const avgVelocity = totalVelocity / activeCount;
    const description = `Room ${roomId} Status: ${activeCount} active players. Energy Level: ${avgVelocity.toFixed(2)}. Instruments: ${roleDescriptions.join(', ')}.`;

    // 2. Consult Gemini
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: description,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        const conductorState: ConductorState = JSON.parse(jsonText);
        room.conductorState = conductorState; // Update local state
        
        console.log(`Room ${roomId} Instruction:`, conductorState.instruction);

        // 3. Broadcast to Room
        const broadcastMsg = JSON.stringify({
          type: 'CONDUCTOR_UPDATE',
          data: conductorState
        });

        room.clients.forEach((client) => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(broadcastMsg);
          }
        });
      }
    } catch (error) {
      console.error(`Gemini Error Room ${roomId}:`, error);
    }
  }

}, 4000); // 4-second interval
