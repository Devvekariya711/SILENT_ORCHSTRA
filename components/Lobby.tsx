
import React, { useState } from 'react';
import { InstrumentRole } from '../types';

interface LobbyProps {
  onSelect: (role: InstrumentRole, roomId: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onSelect }) => {
  const [roomId, setRoomId] = useState('');
  const [selectedRole, setSelectedRole] = useState<InstrumentRole | null>(null);
  const [step, setStep] = useState<'ROOM' | 'INSTRUMENT'>('ROOM');
  const [error, setError] = useState<string | null>(null);

  const instruments = [
    { id: InstrumentRole.DRUMS, label: 'AIR DRUMS', color: 'border-red-500 text-red-400', desc: 'Punch the air to trigger kicks and snares.' },
    { id: InstrumentRole.BASS, label: 'AIR BASS', color: 'border-purple-500 text-purple-400', desc: 'Move vertically for pitch, punch to pluck.' },
    { id: InstrumentRole.GUITAR, label: 'AIR GUITAR', color: 'border-yellow-500 text-yellow-400', desc: 'Strum heavily for chords.' },
    { id: InstrumentRole.PIANO, label: 'AIR PIANO', color: 'border-blue-500 text-blue-400', desc: 'Tap zones in the air to play melodies.' },
  ];

  const handleCreateRoom = () => {
    // Generate random 4-char room code client-side for simplicity
    const newRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(newRoomId);
    setError(null);
    setStep('INSTRUMENT');
  };

  const handleEnterRoom = () => {
      const code = roomId.trim().toUpperCase();
      
      // Basic Validation
      if (code.length < 4) {
          setError("Invalid Code (Min 4 chars)");
          return;
      }
      
      // Alphanumeric Regex
      if (!/^[A-Z0-9]+$/.test(code)) {
           setError("Code must be alphanumeric");
           return;
      }

      setError(null);
      setStep('INSTRUMENT');
  };

  const handleStartGame = () => {
    if (selectedRole && roomId.length > 0) {
      onSelect(selectedRole, roomId.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col items-center h-full p-6 overflow-y-auto pt-10 pb-32 w-full">
      
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white tracking-[0.2em] neon-text mb-2">
            {step === 'ROOM' ? 'JOIN SESSION' : 'SELECT INSTRUMENT'}
        </h2>
        <p className="text-gray-400 text-xs uppercase tracking-widest">
            {step === 'ROOM' ? 'Connect with friends via Room Code' : `Connected to Room: ${roomId}`}
        </p>
      </div>

      {step === 'ROOM' && (
          <div className="w-full max-w-4xl mb-12 p-1 bg-gradient-to-b from-white/10 to-transparent rounded-2xl animate-pulse-slow">
            <div className="bg-black/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                    
                    {/* Room Code Input */}
                    <div className="flex-1 w-full max-w-sm">
                        <label className="block text-[10px] font-bold text-cyan-500 tracking-widest uppercase mb-2">Room Code</label>
                        <input 
                            type="text" 
                            placeholder="CODE" 
                            value={roomId}
                            onChange={(e) => {
                                setRoomId(e.target.value.toUpperCase());
                                setError(null);
                            }}
                            maxLength={6}
                            onKeyDown={(e) => e.key === 'Enter' && handleEnterRoom()}
                            className={`w-full bg-black border ${error ? 'border-red-500 text-red-500' : 'border-white/20 text-white'} rounded-lg px-4 py-4 placeholder-gray-700 text-center tracking-[0.3em] font-bold text-2xl focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all`}
                        />
                        {error && (
                            <p className="text-red-500 text-[10px] uppercase tracking-widest mt-2 text-center animate-pulse font-bold">{error}</p>
                        )}
                         <button 
                            onClick={handleEnterRoom}
                            disabled={roomId.length === 0}
                            className="w-full mt-4 py-3 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-400 font-bold tracking-widest uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                        >
                            Join Room
                        </button>
                    </div>
                    
                    {/* Divider / Helper Text */}
                    <div className="hidden md:flex flex-col items-center justify-center h-full px-4 min-h-[80px]">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap mb-1">OR</span>
                        <div className="h-full w-px bg-white/10 min-h-[50px]"></div>
                    </div>
                    <div className="md:hidden w-full text-center text-[10px] text-gray-500 uppercase tracking-widest my-2">OR</div>

                    {/* Generate Button */}
                    <div className="flex-1 w-full max-w-sm">
                         <button 
                            onClick={handleCreateRoom}
                            className="w-full h-full min-h-[140px] bg-gradient-to-r from-blue-900/20 to-cyan-900/20 hover:from-blue-800/40 hover:to-cyan-800/40 border border-blue-500/30 hover:border-cyan-400/50 rounded-xl flex flex-col items-center justify-center text-cyan-400 font-bold tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] group gap-2"
                        >
                            <svg className="w-8 h-8 opacity-70 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            <span>Create New Room</span>
                        </button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {step === 'INSTRUMENT' && (
          <>
            {/* Instrument Selection Container (Blue Border Box) */}
            <div className="w-full max-w-5xl border border-blue-500/30 rounded-3xl p-2 relative mt-4 animate-fadeIn">
                {/* Floating Header */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#050505] px-6 text-white font-bold tracking-[0.2em] uppercase flex items-center whitespace-nowrap z-10">
                    <span className="w-8 h-0.5 bg-cyan-500 mr-4 shadow-[0_0_5px_cyan]"></span>
                    Select Instrument
                    <span className="w-8 h-0.5 bg-cyan-500 ml-4 shadow-[0_0_5px_cyan]"></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 sm:p-10 pt-12">
                    {instruments.map((inst) => (
                    <button
                        key={inst.id}
                        onClick={() => setSelectedRole(inst.id)}
                        className={`relative p-6 border transition-all duration-300 rounded-2xl text-left group overflow-hidden
                        ${selectedRole === inst.id 
                            ? 'bg-white/5 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                            : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/30'}
                        `}
                    >
                        {/* Accent Line */}
                        <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-300 ${selectedRole === inst.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'} ${inst.color.split(' ')[0].replace('border', 'bg')}`}></div>
                        
                        <div className="pl-4">
                            <h3 className={`text-2xl font-bold mb-2 tracking-wider ${inst.color.split(' ')[1]}`}>{inst.label}</h3>
                            <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors leading-relaxed font-mono">{inst.desc}</p>
                        </div>
                    </button>
                    ))}
                </div>
            </div>

            {/* Back to Room selection */}
             <button 
                onClick={() => setStep('ROOM')}
                className="mt-6 text-xs text-gray-500 hover:text-white uppercase tracking-widest underline decoration-gray-700 hover:decoration-white underline-offset-4 transition-all"
            >
                Change Room
            </button>

            {/* Start Button */}
            <div className="fixed bottom-8 left-0 w-full flex justify-center z-50 pointer-events-none px-4">
                <button
                    onClick={handleStartGame}
                    disabled={!selectedRole}
                    className={`
                    pointer-events-auto w-full max-w-md py-4 rounded-full font-bold text-xl tracking-[0.25em] uppercase transition-all duration-500
                    ${(!selectedRole) 
                        ? 'bg-black/50 text-gray-600 border border-gray-800 backdrop-blur-sm' 
                        : 'bg-cyan-500 text-black shadow-[0_0_40px_rgba(34,211,238,0.6)] hover:bg-white hover:scale-105 border border-cyan-400'}
                    `}
                >
                    Enter Stage
                </button>
            </div>
          </>
      )}

    </div>
  );
};

export default Lobby;
