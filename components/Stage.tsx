
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { InstrumentRole, ConductorState, PlayerState, WSMessage } from '../types';
import { audioEngine } from '../utils/audio';

// Declare MediaPipe globals (loaded via CDN)
declare global {
  interface Window {
    vision: any;
  }
}

interface StageProps {
  role: InstrumentRole;
  roomId: string;
  conductorState: ConductorState;
  setConductorState: (state: ConductorState) => void;
  onBack: () => void;
}

// Helper to track individual hand physics
interface HandState {
  y: number;
  x: number;
  lastTrigger: number;
  lastFrameTime: number; // To detect tracking loss and calc velocity
}

const Stage: React.FC<StageProps> = ({ role, roomId, conductorState, setConductorState, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Initializing Vision...");
  const [lastVelocity, setLastVelocity] = useState(0);
  const [triggerVisual, setTriggerVisual] = useState(false); // Visual flash on hit
  const [isMuted, setIsMuted] = useState(false); // Visual state for mute
  
  // Track multiple hands: Map<HandIndex, HandState>
  const handStates = useRef<Map<number, HandState>>(new Map());

  const lastTime = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const socketRef = useRef<WebSocket | null>(null);

  // --- INSTRUMENT TUNING CONFIGURATION ---
  const config = useMemo(() => {
    // Thresholds are in "Screen Heights per Second"
    // e.g., 2.0 means crossing the full screen height twice in a second.
    switch (role) {
      case InstrumentRole.DRUMS:
        return { 
          // DRUMSTICK SIMULATION:
          // Requires a sharp, fast strike (snap).
          threshold: 2.0, 
          cooldown: 80,   // Very fast re-trigger for rolls
          triggerDir: 'down', // Gravity only
          muteThreshold: 0
        };
      case InstrumentRole.PIANO:
        return { 
          threshold: 1.2, // Lighter touch
          cooldown: 100, 
          triggerDir: 'down',
          muteThreshold: 0
        };
      case InstrumentRole.BASS:
        return { 
          threshold: 1.5, 
          cooldown: 120, 
          triggerDir: 'both', // Plucking up or down
          muteThreshold: 0
        };
      case InstrumentRole.GUITAR:
        return { 
          threshold: 1.8, // Strumming requires intent
          cooldown: 100, // Fast strumming allowed
          triggerDir: 'both',
          muteThreshold: 4.0 // High horizontal speed for mute
        };
      default:
        return { threshold: 1.5, cooldown: 150, triggerDir: 'none', muteThreshold: 0 };
    }
  }, [role]);

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    let ws: WebSocket;
    try {
        ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
            console.log('Connected to Orchestra Server');
            setStatus("Connected to Conductor");
            
            // JOIN ROOM MESSAGE
            const joinMsg: WSMessage = {
                type: 'JOIN',
                roomId,
                role
            };
            ws.send(JSON.stringify(joinMsg));
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'CONDUCTOR_UPDATE') {
                    setConductorState(msg.data);
                    audioEngine.updateConductorState(msg.data);
                }
            } catch (e) { console.error(e); }
        };

        ws.onerror = () => {
             setStatus("Offline (Demo Mode)");
        }

        socketRef.current = ws;

        return () => {
            ws.close();
        };
    } catch (e) {
        console.log("Running in offline/demo mode");
        setStatus("Offline Mode");
    }
  }, [roomId, role, setConductorState]);


  // --- VISION SETUP ---
  useEffect(() => {
    let handLandmarker: any = null;

    const startCamera = async () => {
      if (!videoRef.current) return;
      
      try {
        // Initialize MediaPipe HandLandmarker
        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js");
        const { HandLandmarker, FilesetResolver } = vision;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          // CRITICAL: Lower confidence thresholds to maintain tracking during fast/blurry motion
          minHandDetectionConfidence: 0.3, 
          minHandTrackingConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
        });

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30 }
            } 
        });
        
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", () => {
           predictWebcam();
        });
        
        setStatus("Camera Active. Move hands to play!");

      } catch (error) {
        console.error("Vision Error:", error);
        setStatus("Camera Error. Check Permissions.");
      }
    };

    const predictWebcam = () => {
        if (!handLandmarker || !videoRef.current) return;
        
        const nowInMs = Date.now();
        const startTimeMs = performance.now();

        if (videoRef.current.currentTime !== lastTime.current) {
            lastTime.current = videoRef.current.currentTime;
            const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

            if (results.landmarks) {
                // Process EVERY detected hand
                results.landmarks.forEach((landmarks: any[], index: number) => {
                    processHand(landmarks, index, nowInMs);
                });
            }
        }
        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    const processHand = (landmarks: any[], handIndex: number, timestamp: number) => {
        // --- TRACKING POINT SELECTION ---
        // For Drums: Use Index Finger MCP (Knuckle - 5) instead of Tip (8).
        // The tip blurs too much during fast strikes. The knuckle is more stable but still follows the "stick" motion.
        // For Others: Use Wrist (0) for general stability.
        const pointIndex = role === InstrumentRole.DRUMS ? 5 : 0;
        const point = landmarks[pointIndex];
        
        if (!point) return;

        // Initialize state for this hand if missing
        if (!handStates.current.has(handIndex)) {
            handStates.current.set(handIndex, { 
                y: point.y, 
                x: point.x, 
                lastTrigger: 0,
                lastFrameTime: timestamp 
            });
            return; 
        }

        const state = handStates.current.get(handIndex)!;

        // --- TRACKING LOSS RECOVERY ---
        const timeDiff = timestamp - state.lastFrameTime;

        // 1. If tracking was lost for too long (> 250ms), reset physics to prevent teleporting velocity spikes
        if (timeDiff > 250) {
            state.y = point.y;
            state.x = point.x;
            state.lastFrameTime = timestamp;
            return;
        }

        // 2. Ignore extremely small time steps (noise/jitter filter)
        if (timeDiff < 10) return;

        // 3. Calculate Physics (Time-Normalized Velocity)
        // velocity = distance / time (units: screen heights per second)
        const deltaY = point.y - state.y; // Positive = DOWN
        const deltaX = point.x - state.x;
        
        // Convert milliseconds to seconds for intuitive thresholding
        const velocityY = (deltaY / timeDiff) * 1000; 
        const velocityX = (deltaX / timeDiff) * 1000;

        // Update state
        state.y = point.y;
        state.x = point.x;
        state.lastFrameTime = timestamp;

        const { threshold, cooldown, triggerDir, muteThreshold } = config;

        // 4. Cooldown Check (Per Hand)
        if (timestamp - state.lastTrigger < cooldown) {
            return;
        }

        // --- GUITAR MUTE LOGIC (Horizontal Swipe) ---
        if (role === InstrumentRole.GUITAR && muteThreshold > 0) {
            if (Math.abs(velocityX) > muteThreshold) { 
                audioEngine.triggerMute(role);
                setIsMuted(true);
                setTimeout(() => setIsMuted(false), 150);
                state.lastTrigger = timestamp; 
                
                // Network Mute Event
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    const payload: PlayerState = {
                         role, velocity: 0, isActive: true, handPosition: { x: point.x, y: point.y }, zone: 'mute', timestamp
                    };
                    const msg: WSMessage = { type: 'UPDATE', data: payload };
                    socketRef.current.send(JSON.stringify(msg));
                }
                return;
            }
        }

        // 5. Vertical Trigger Check
        const absVelocityY = Math.abs(velocityY);
        
        // Normalize velocity for audio volume (Map threshold..5.0 to 0.1..1.0)
        let outputVelocity = Math.min(Math.max((absVelocityY - threshold) / (5.0 - threshold), 0.1), 1.0);

        if (absVelocityY > threshold) {
            let isValidTrigger = false;

            if (triggerDir === 'down') {
                // Must be moving strictly down
                if (velocityY > 0) isValidTrigger = true; 
            } else if (triggerDir === 'both') {
                isValidTrigger = true;
            }

            if (isValidTrigger) {
                // Determine implicit zone string
                const zoneX = point.x < 0.5 ? "left" : "right";
                const zoneY = point.y < 0.5 ? "top" : "bottom";
                const zone = `${zoneY}-${zoneX}`;

                // Dynamic Velocity Curve for Drums (make hard hits louder)
                if (role === InstrumentRole.DRUMS) {
                     outputVelocity = Math.pow(outputVelocity, 0.8); 
                }

                // Fire Audio - Pass X coordinate for Spatial Drums
                audioEngine.triggerNote(role, outputVelocity, point.y, point.x);
                
                // Visual Feedback
                setLastVelocity(outputVelocity);
                setTriggerVisual(true);
                setTimeout(() => setTriggerVisual(false), 100);

                state.lastTrigger = timestamp;

                // Network Sync
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    const payload: PlayerState = {
                        role,
                        velocity: outputVelocity,
                        isActive: true,
                        handPosition: { x: point.x, y: point.y },
                        zone,
                        timestamp
                    };
                    const msg: WSMessage = { type: 'UPDATE', data: payload };
                    socketRef.current.send(JSON.stringify(msg));
                }
            }
        }
    };

    startCamera();

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [role, config, roomId]); // Re-run if room changes

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
      
      {/* Background Visualizer */}
      <div className="absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out"
           style={{ 
               backgroundColor: conductorState.mood.toLowerCase().includes("aggressive") ? "#500000" : "#000050",
               filter: `blur(${conductorState.tempo / 5}px)`
            }}>
      </div>

      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 z-50 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors bg-black/40 px-3 py-2 rounded-full backdrop-blur border border-white/10 hover:border-white/30"
      >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
         </svg>
         <span className="text-xs font-bold tracking-widest uppercase">Leave Stage</span>
      </button>

      {/* Main Container */}
      <div className="z-10 w-full max-w-md p-4 flex flex-col items-center space-y-4">
        
        {/* Conductor HUD */}
        <div className="w-full bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg shadow-neon">
            <h3 className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">AI CONDUCTOR (ROOM {roomId})</h3>
            <p className="text-2xl font-light text-white animate-pulse">{conductorState.instruction}</p>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{conductorState.tempo} BPM</span>
                <span className="uppercase text-white">{conductorState.key}</span>
                <span>{conductorState.mood}</span>
            </div>
        </div>

        {/* Camera View / Feedback */}
        <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 shadow-2xl transition-colors duration-100 ${triggerVisual ? 'border-cyan-400' : isMuted ? 'border-red-500' : 'border-white/10'}`}>
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100 opacity-60" 
            />
            
            {/* Action Feedback Overlay (Flash) */}
            <div className={`absolute inset-0 bg-cyan-500/20 pointer-events-none transition-opacity duration-75 ${triggerVisual ? 'opacity-100' : 'opacity-0'}`}></div>
            
            {/* Mute Feedback Overlay (Red Flash) */}
            <div className={`absolute inset-0 bg-red-500/30 pointer-events-none transition-opacity duration-75 ${isMuted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white tracking-widest border-4 border-white p-2 transform -rotate-12">MUTE</span>
                </div>
            </div>

            {/* DRUM VISUAL ZONES (Only show for Drums) */}
            {role === InstrumentRole.DRUMS && (
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 left-0 w-1/2 h-2/5 border-r border-b border-white/20 flex items-center justify-center text-xs uppercase">Hi-Hat</div>
                    <div className="absolute top-0 right-0 w-1/2 h-2/5 border-b border-white/20 flex items-center justify-center text-xs uppercase">Crash</div>
                    <div className="absolute top-[40%] left-0 w-[45%] h-[35%] border-r border-b border-white/20 flex items-center justify-center text-xs">Snare</div>
                    <div className="absolute top-[40%] left-[45%] w-[10%] h-[35%] border-r border-b border-white/20 flex items-center justify-center text-xs">Tom</div>
                    <div className="absolute top-[40%] right-0 w-[45%] h-[35%] border-b border-white/20 flex items-center justify-center text-xs uppercase">Floor Tom</div>
                    <div className="absolute bottom-0 left-0 w-full h-1/4 flex items-center justify-center text-xs uppercase bg-white/5">Kick</div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-20">
                <div className="text-xs uppercase text-gray-400">Velocity</div>
                <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div 
                        className="h-full bg-cyan-400 transition-all duration-75" 
                        style={{ width: `${lastVelocity * 100}%` }}
                    />
                </div>
            </div>

            <div className="absolute top-4 right-4 text-right z-20">
                <div className="text-xs uppercase text-gray-400">Instrument</div>
                <div className="text-xl font-bold text-white tracking-widest">{role}</div>
            </div>
        </div>

        {/* Status */}
        <div className="text-xs font-mono text-gray-500">
            SYSTEM: {status}
        </div>

      </div>
    </div>
  );
};

export default Stage;
