import React, { useState, useEffect } from 'react';
import { InstrumentRole, ConductorState } from '../types';
import { audioEngine } from '../utils/audio';
import { audioPreloader } from '../utils/audioPreloader';
import Lobby from './Lobby';
import Stage from './Stage';
import SettingsMenu from './SettingsMenu';

type AppView = 'LOBBY' | 'INSTRUMENT_SELECT' | 'STAGE';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LOBBY');
  const [role, setRole] = useState<InstrumentRole>(InstrumentRole.NONE);
  const [roomId, setRoomId] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  const [conductorState, setConductorState] = useState<ConductorState>({
    tempo: 120,
    key: 'C Major',
    scale: 'pentatonic',
    mood: 'Waiting for band...',
    instruction: 'Select an instrument to begin'
  });

  // Pre-load all audio on app startup
  useEffect(() => {
    // Audio preloader will auto-trigger on first user interaction
    console.log('🎵 Silent Orchestra - Audio preloading enabled');
  }, []);

  // Handle mock socket connection for the demo
  useEffect(() => {
    // In a real deployment, we would connect to the WebSocket here.
    const interval = setInterval(() => {
      if (view === 'STAGE') {
        // Simulate random AI updates if no server is running
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [view]);

  // Called from Lobby when user selects instrument
  const handleStart = async (selectedRole: InstrumentRole, selectedRoomId: string) => {
    await audioEngine.initialize();
    setRole(selectedRole);
    setRoomId(selectedRoomId);
    setView('STAGE');
  };

  // Called from Stage - goes back to instrument selection (stays in room)
  const handleLeaveStage = () => {
    setRole(InstrumentRole.NONE);
    setView('INSTRUMENT_SELECT');
  };

  // Called from Lobby/InstrumentSelect - completely exit room
  const handleLeaveRoom = () => {
    setView('LOBBY');
    setRole(InstrumentRole.NONE);
    setRoomId("");
  };

  // Called when entering a room (before instrument selection)
  const handleEnterRoom = (selectedRoomId: string) => {
    setRoomId(selectedRoomId);
    setView('INSTRUMENT_SELECT');
  };

  // Called when selecting instrument from instrument select screen
  const handleSelectInstrument = async (selectedRole: InstrumentRole) => {
    await audioEngine.initialize();
    setRole(selectedRole);
    setView('STAGE');
  };

  const isInRoom = view === 'INSTRUMENT_SELECT' || view === 'STAGE';

  return (
    <div className="w-full h-screen bg-black text-white relative">
      <div className="scanline"></div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <h1 className="text-xl font-bold tracking-widest neon-text text-cyan-400">
          SILENT ORCHESTRA
        </h1>
        <div className="flex items-center space-x-4">
          {isInRoom && (
            <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded border border-white/20">
              ROOM: <span className="text-cyan-300 font-bold">{roomId}</span>
            </div>
          )}
          <div className="text-xs text-gray-400 hidden sm:block">
            AI CONDUCTOR: <span className={isInRoom ? "text-green-400" : "text-red-400"}>{isInRoom ? "ONLINE" : "OFFLINE"}</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors border border-white/10 rounded-full hover:bg-white/10"
            title="Audio Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full h-full pt-16">
        {view === 'LOBBY' && (
          <Lobby
            onSelect={handleStart}
            onEnterRoom={handleEnterRoom}
          />
        )}
        {view === 'INSTRUMENT_SELECT' && (
          <Lobby
            onSelect={handleSelectInstrument}
            onLeaveRoom={handleLeaveRoom}
            roomId={roomId}
            isInRoom={true}
          />
        )}
        {view === 'STAGE' && (
          <Stage
            role={role}
            roomId={roomId}
            conductorState={conductorState}
            setConductorState={setConductorState}
            onBack={handleLeaveStage}
          />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsMenu onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default App;
