
import React, { useEffect, useState } from 'react';
import { InstrumentRole, InstrumentPreset, AudioSettings } from '../types';
import { audioEngine } from '../utils/audio';

interface SettingsMenuProps {
  onClose: () => void;
}

// Convert 0-100 slider to dB (logarithmic perception)
// 0 = -40dB (nearly silent), 50 = -12dB (comfortable), 100 = 0dB (max)
const sliderToDb = (value: number): number => {
  if (value === 0) return -60; // Mute
  // Logarithmic mapping for natural volume perception
  // At 50%, output -12dB which is a comfortable listening level
  const normalized = value / 100;
  return -40 * Math.pow(1 - normalized, 2); // Quadratic curve: 0=-40, 50=-10, 100=0
};

// Convert dB to 0-100 slider (inverse of above)
const dbToSlider = (db: number): number => {
  if (db <= -40) return 0;
  if (db >= 0) return 100;
  // Inverse of quadratic: value = 100 * (1 - sqrt(-db/40))
  return 100 * (1 - Math.sqrt(-db / 40));
};

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<InstrumentRole>(InstrumentRole.DRUMS);
  const [settings, setSettings] = useState<AudioSettings | null>(null);

  // Load current settings from audio engine on mount
  useEffect(() => {
    setSettings(audioEngine.getSettings());
  }, []);

  const handleVolumeChange = (role: InstrumentRole, e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderVal = parseFloat(e.target.value);
    const dbVal = sliderToDb(sliderVal);
    audioEngine.setVolume(role, dbVal);

    // Update local state to reflect change in UI
    setSettings(prev => prev ? ({
      ...prev,
      volumes: {
        ...prev.volumes,
        [role]: dbVal
      }
    }) : null);
  };

  const handlePresetSelect = (role: InstrumentRole, preset: InstrumentPreset) => {
    // Commit the change
    audioEngine.setPreset(role, preset);
    setSettings(prev => prev ? ({
      ...prev,
      presets: {
        ...prev.presets,
        [role]: preset
      }
    }) : null);

    // Play preview
    audioEngine.previewNote(role);
  };

  const handlePresetHover = (role: InstrumentRole, preset: InstrumentPreset) => {
    // Temporarily switch the engine to the hovered preset so the preview sounds correct
    audioEngine.setPreset(role, preset);
    audioEngine.previewNote(role);
  };

  const handlePresetLeave = (role: InstrumentRole) => {
    // Revert the engine back to the actually selected preset in state
    if (settings) {
      audioEngine.setPreset(role, settings.presets[role]);
    }
  };

  // Instrument Metadata with 6 presets each
  const instrumentConfig = [
    {
      role: InstrumentRole.DRUMS,
      label: 'Drums',
      presets: [
        { id: 'acoustic', name: 'Acoustic Kit' },
        { id: 'electronic', name: '808 Trap' },
        { id: 'jazz', name: 'Jazz Brush' },
        { id: 'rock', name: 'Rock Power' },
        { id: 'latin', name: 'Latin Percussion' },
        { id: 'lofi', name: 'Lo-Fi Beats' }
      ]
    },
    {
      role: InstrumentRole.PIANO,
      label: 'Piano',
      presets: [
        { id: 'acoustic', name: 'Grand Piano' },
        { id: 'electric', name: 'Rhodes Electric' },
        { id: 'organ', name: 'Vintage Organ' },
        { id: 'synth', name: 'Synth Lead' },
        { id: 'vibraphone', name: 'Glassy Vibes' },
        { id: 'chiptune', name: '8-Bit Arcade' }
      ]
    },
    {
      role: InstrumentRole.GUITAR,
      label: 'Guitar',
      presets: [
        { id: 'acoustic', name: 'Nylon Acoustic' },
        { id: 'electric', name: 'Clean Electric' },
        { id: 'distorted', name: 'Distorted Rock' },
        { id: 'clean', name: 'Crystal Clean' },
        { id: 'jazz', name: 'Jazz Hollow' },
        { id: 'flamenco', name: 'Flamenco' }
      ]
    },
    {
      role: InstrumentRole.BASS,
      label: 'Bass',
      presets: [
        { id: 'acoustic', name: 'Funk Slap' },
        { id: 'electronic', name: 'Sub Bass' },
        { id: 'slap', name: 'Slap Pop' },
        { id: 'synth', name: 'Synth Bass' },
        { id: 'dubstep', name: 'Dubstep Wobble' },
        { id: 'upright', name: 'Upright Jazz' }
      ]
    },
    {
      role: InstrumentRole.THEREMIN,
      label: 'Theremin',
      presets: [
        { id: 'classic', name: 'Classic Theremin' },
        { id: 'eerie', name: 'Eerie Ghost' },
        { id: 'scifi', name: 'Sci-Fi Beam' },
        { id: 'warm', name: 'Warm Vintage' },
        { id: 'bright', name: 'Bright Lead' },
        { id: 'alien', name: 'Alien Signal' }
      ]
    },
    {
      role: InstrumentRole.STRINGS,
      label: 'Strings',
      presets: [
        { id: 'orchestra', name: 'Full Orchestra' },
        { id: 'chamber', name: 'Chamber Quartet' },
        { id: 'synth', name: 'Synth Strings' },
        { id: 'solo', name: 'Solo Violin' },
        { id: 'pizzicato', name: 'Pizzicato' },
        { id: 'cinematic', name: 'Cinematic Epic' }
      ]
    },
    {
      role: InstrumentRole.PADS,
      label: 'Pads',
      presets: [
        { id: 'ambient', name: 'Ambient Space' },
        { id: 'warm', name: 'Warm Analog' },
        { id: 'ethereal', name: 'Ethereal Dream' },
        { id: 'dark', name: 'Dark Atmosphere' },
        { id: 'bright', name: 'Bright Crystal' },
        { id: 'crystal', name: 'Glass Shimmer' }
      ]
    },
  ];

  const activeConfig = instrumentConfig.find(i => i.role === activeTab);

  if (!settings) return null;

  // Get current volume as 0-100 slider value
  const currentSliderValue = dbToSlider(settings.volumes[activeTab]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
          <h2 className="text-xl font-bold text-white tracking-wider">Studio Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        {/* Instrument Tabs */}
        <div className="flex flex-wrap gap-2 p-4 border-b border-white/5 bg-black/20 overflow-x-auto">
          {instrumentConfig.map((inst) => (
            <button
              key={inst.role}
              onClick={() => setActiveTab(inst.role)}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeTab === inst.role
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              {inst.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto flex-1">

          {/* Volume Control - 0 to 100 scale */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase text-cyan-400 font-bold tracking-widest">
                {activeConfig?.label} Volume
              </label>
              <span className="text-xs font-mono text-gray-400">
                {Math.round(currentSliderValue)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={currentSliderValue}
              onChange={(e) => handleVolumeChange(activeTab, e)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
            />
            <div className="flex justify-between text-[10px] text-gray-600 font-mono uppercase">
              <span>0</span>
              <span>Default: 10</span>
              <span>100</span>
            </div>
          </div>

          {/* Sound Profile Selection */}
          <div>
            <label className="block text-xs uppercase text-cyan-400 mb-4 font-bold tracking-widest">Sound Profile</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeConfig?.presets.map((preset) => {
                const isActive = settings.presets[activeTab] === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(activeTab, preset.id as InstrumentPreset)}
                    onMouseEnter={() => handlePresetHover(activeTab, preset.id as InstrumentPreset)}
                    onMouseLeave={() => handlePresetLeave(activeTab)}
                    className={`p-3 rounded-lg border text-left transition-all text-xs ${isActive
                      ? 'bg-cyan-500/20 border-cyan-500/70 text-cyan-300 shadow-lg shadow-cyan-500/10'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                      }`}
                  >
                    <span className="font-semibold">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Sound Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => audioEngine.previewNote(activeTab)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-bold uppercase tracking-widest hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
            >
              🎵 Test Sound
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
