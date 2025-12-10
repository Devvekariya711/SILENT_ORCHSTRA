
// Instrument Roles
export enum InstrumentRole {
  DRUMS = 'DRUMS',
  GUITAR = 'GUITAR',
  PIANO = 'PIANO',
  BASS = 'BASS',
  NONE = 'NONE'
}

// Data sent from Client to Server
export interface PlayerState {
  role: InstrumentRole;
  velocity: number; // 0.0 to 1.0 (Speed of movement)
  isActive: boolean; // Is currently playing/triggering
  handPosition: { x: number; y: number }; // Normalized coordinates
  zone: string; // "top-left", "top-right", "bottom-left", "bottom-right"
  timestamp: number;
}

// Data sent from Server/Gemini to Client
export interface ConductorState {
  tempo: number; // BPM
  key: string; // e.g., "C", "F#", "Am"
  scale: string; // e.g., "pentatonic", "chromatic"
  mood: string; // Description for UI, e.g., "Aggressive", "Ethereal"
  instruction: string; // Text for the UI, e.g., "Play Faster!"
}

// WebSocket Messages
export type WSMessageType = 'JOIN' | 'UPDATE' | 'CONDUCTOR_UPDATE';

export interface WSMessage {
  type: WSMessageType;
  roomId?: string;
  role?: InstrumentRole;
  data?: any;
}

// Internal Vision Types
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// Audio Settings
export type InstrumentPreset = 'acoustic' | 'electric' | 'electronic' | 'synth';

export interface AudioSettings {
  volumes: Record<InstrumentRole, number>; // dB value (-60 to 0)
  presets: Record<InstrumentRole, InstrumentPreset>;
}
