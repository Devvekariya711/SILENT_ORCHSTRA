import React, { useEffect, useState } from 'react';
import { InstrumentRole, InstrumentPreset, AudioSettings } from '../types';
import { audioEngine } from '../utils/audio';

interface SettingsMenuProps {
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<InstrumentRole>(InstrumentRole.DRUMS);
  const [settings, setSettings] = useState<AudioSettings | null>(null);

  // Load current settings from audio engine on mount
  useEffect(() => {
    setSettings(audioEngine.getSettings());
  }, []);

  const handleVolumeChange = (role: InstrumentRole, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioEngine.setVolume(role, val);
    
    // Update local state to reflect change in UI
    setSettings(prev => prev ? ({
        ...prev,
        volumes: {
            ...prev.volumes,
            [role]: val
        }
    }) : null);
  };

  const handlePresetChange = (role: InstrumentRole, preset: InstrumentPreset) => {
    audioEngine.setPreset(role, preset);
    
    setSettings(prev => prev ? ({
        ...prev,
        presets: {
            ...prev.presets,
            [role]: preset
        }
    }) : null);
  };

  // Instrument Metadata
  const instrumentConfig = [
    { 
        role: InstrumentRole.DRUMS, 
        label: 'Drums', 
        presets: [
            { id: 'acoustic', name: 'Acoustic Kit' },
            { id: 'electronic', name: '808 Trap Kit' }
        ] 
    },
    { 
        role: InstrumentRole.PIANO, 
        label: 'Piano', 
        presets: [
            { id: 'acoustic', name: 'Grand Piano' },
            { id: 'electric', name: 'Rhodes / Electric' }
        ] 
    },
    { 
        role: InstrumentRole.GUITAR, 
        label: 'Guitar', 
        presets: [
            { id: 'acoustic', name: 'Nylon Acoustic' },
            { id: 'electric', name: 'Clean Electric' }
        ] 
    },
    { 
        role: InstrumentRole.BASS, 
        label: 'Bass', 
        presets: [
            { id: 'electronic', name: 'Sub Bass' },
            { id: 'acoustic', name: 'Slap / Funk' }
        ] 
    },
  ];

  const activeConfig = instrumentConfig.find(i => i.role === activeTab);

  if (!settings) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
          <h2 className="text-xl font-bold tracking-widest text-cyan-400 uppercase">Studio Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-gray-800/50">
          {instrumentConfig.map((inst) => (
            <button
              key={inst.role}
              onClick={() => setActiveTab(inst.role)}
              className={`flex-1 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === inst.role 
                  ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {inst.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto flex-1">
            
            {/* Volume Control */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-xs uppercase text-cyan-400 font-bold tracking-widest">
                        {activeConfig?.label} Volume
                    </label>
                    <span className="text-xs font-mono text-gray-400">
                        {settings.volumes[activeTab].toFixed(1)} dB
                    </span>
                </div>
                
                <input 
                    type="range" 
                    min="-60" 
                    max="0"
                    step="0.5"
                    value={settings.volumes[activeTab]}
                    onChange={(e) => handleVolumeChange(activeTab, e)}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300" 
                />
                <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase">
                    <span>Silent</span>
                    <span>Max</span>
                </div>
            </div>

            {/* Kit Selection */}
            <div>
                <label className="block text-xs uppercase text-cyan-400 mb-4 font-bold tracking-widest">Sound Profile</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeConfig?.presets.map((preset) => {
                        const isActive = settings.presets[activeTab] === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetChange(activeTab, preset.id as InstrumentPreset)}
                                className={`
                                    relative px-4 py-4 rounded-lg border transition-all text-sm uppercase font-bold text-left group
                                    ${isActive 
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'}
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{preset.name}</span>
                                    {isActive && (
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_cyan]"></div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
        
        <div className="p-4 bg-black/40 border-t border-white/10 text-center">
             <p className="text-[10px] uppercase tracking-widest text-gray-600">
                Powered by Tone.js & Gemini 2.5
             </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsMenu;