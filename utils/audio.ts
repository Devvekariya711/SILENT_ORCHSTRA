import * as Tone from 'tone';
import { InstrumentRole, ConductorState, InstrumentPreset, AudioSettings } from '../types';

// Simple Scale Mapping (C Major default)
const SCALES: Record<string, string[]> = {
  'major': ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
  'minor': ['C3', 'D3', 'Eb3', 'F3', 'G3', 'Ab3', 'Bb3', 'C4'],
  'pentatonic': ['C3', 'D3', 'E3', 'G3', 'A3', 'C4'],
};

// Open Chords for Guitar (Open Tuning emulation)
const CHORDS: Record<string, string[][]> = {
    'major': [['C3', 'E3', 'G3'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4']],
    'minor': [['C3', 'Eb3', 'G3'], ['F3', 'Ab3', 'C4'], ['G3', 'Bb3', 'D4'], ['Ab3', 'C4', 'Eb4']],
};

class AudioEngine {
  // Synths
  private drumSynth: Tone.MembraneSynth | null = null;
  private metalSynth: Tone.MetalSynth | null = null;
  private noiseSynth: Tone.NoiseSynth | null = null;
  private bassSynth: Tone.MonoSynth | null = null;
  private guitarSynth: Tone.PolySynth | null = null;
  private pianoSynth: Tone.PolySynth | null = null;
  
  // Effects & Volume
  private reverb: Tone.Reverb | null = null;
  private volumeNodes: Record<InstrumentRole, Tone.Volume> | null = null;
  
  private currentScaleName: string = 'major';
  private currentScale: string[] = SCALES['major'];
  private isReady: boolean = false;

  // State Tracking
  private currentPresets: Record<InstrumentRole, InstrumentPreset> = {
    [InstrumentRole.DRUMS]: 'acoustic',
    [InstrumentRole.BASS]: 'electronic',
    [InstrumentRole.GUITAR]: 'acoustic',
    [InstrumentRole.PIANO]: 'acoustic',
    [InstrumentRole.NONE]: 'acoustic'
  };

  private currentVolumes: Record<InstrumentRole, number> = {
    [InstrumentRole.DRUMS]: 0,
    [InstrumentRole.BASS]: 0,
    [InstrumentRole.GUITAR]: 0,
    [InstrumentRole.PIANO]: 0,
    [InstrumentRole.NONE]: 0
  };

  public async initialize() {
    if (this.isReady) return;
    await Tone.start();

    // Master Effects
    this.reverb = new Tone.Reverb(2).toDestination();

    // Initialize Volume Nodes (Default 0dB)
    this.volumeNodes = {
        [InstrumentRole.DRUMS]: new Tone.Volume(this.currentVolumes[InstrumentRole.DRUMS]).connect(this.reverb),
        [InstrumentRole.BASS]: new Tone.Volume(this.currentVolumes[InstrumentRole.BASS]).connect(this.reverb),
        [InstrumentRole.GUITAR]: new Tone.Volume(this.currentVolumes[InstrumentRole.GUITAR]).connect(this.reverb),
        [InstrumentRole.PIANO]: new Tone.Volume(this.currentVolumes[InstrumentRole.PIANO]).connect(this.reverb),
        [InstrumentRole.NONE]: new Tone.Volume(0)
    };

    // 1. Drums
    this.drumSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 8,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" }
    }).connect(this.volumeNodes[InstrumentRole.DRUMS]);

    this.metalSynth = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(this.volumeNodes[InstrumentRole.DRUMS]);

    this.noiseSynth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).connect(this.volumeNodes[InstrumentRole.DRUMS]);


    // 2. Bass (Thick, funky)
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 1.2 },
      filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.5, baseFrequency: 50, octaves: 2 }
    }).connect(this.volumeNodes[InstrumentRole.BASS]);

    // 3. Guitar (Plucky Poly) - Open Tuning Strumming
    this.guitarSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fmsawtooth" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1.5 },
    }).connect(this.volumeNodes[InstrumentRole.GUITAR]);

    // 4. Piano
    this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.5, sustain: 0.1, release: 1.2 },
    }).connect(this.volumeNodes[InstrumentRole.PIANO]);

    this.isReady = true;
    console.log("Audio Engine Ready");
  }

  public getSettings(): AudioSettings {
      return {
          volumes: { ...this.currentVolumes },
          presets: { ...this.currentPresets }
      };
  }

  public setVolume(role: InstrumentRole, db: number) {
    this.currentVolumes[role] = db;
    if (this.volumeNodes && this.volumeNodes[role]) {
        this.volumeNodes[role].volume.rampTo(db, 0.1);
    }
  }

  public setPreset(role: InstrumentRole, preset: InstrumentPreset) {
      if (!this.isReady) return;
      this.currentPresets[role] = preset;
      
      switch (role) {
          case InstrumentRole.DRUMS:
              if (preset === 'electronic') {
                  // 808 Style
                  this.drumSynth?.set({
                      oscillator: { type: "sine" },
                      envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 1.0 },
                      pitchDecay: 0.01,
                      octaves: 2
                  });
              } else {
                  // Acoustic Style
                  this.drumSynth?.set({
                    pitchDecay: 0.05,
                    octaves: 8,
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
                  });
              }
              break;
          case InstrumentRole.PIANO:
              if (preset === 'electric') {
                  this.pianoSynth?.set({
                      oscillator: { type: "pulse" },
                      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1 }
                  });
              } else {
                  this.pianoSynth?.set({
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.02, decay: 0.5, sustain: 0.1, release: 1.2 }
                  });
              }
              break;
          case InstrumentRole.GUITAR:
            if (preset === 'electric') {
                this.guitarSynth?.set({
                    oscillator: { type: "sawtooth" },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 }
                });
            } else {
                // Acoustic
                this.guitarSynth?.set({
                    oscillator: { type: "fmsawtooth" },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1.5 }
                });
            }
            break;
        case InstrumentRole.BASS:
            if (preset === 'electronic') {
                // Sub Bass
                this.bassSynth?.set({
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 }
                });
            } else {
                // Funk Bass
                this.bassSynth?.set({
                    oscillator: { type: "square" },
                    envelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 1.2 }
                });
            }
            break;
      }
  }

  public updateConductorState(state: ConductorState) {
    if (!this.isReady) return;
    Tone.Transport.bpm.rampTo(state.tempo, 2);
    
    // Determine scale type for chord/note mapping
    const mood = state.mood.toLowerCase();
    if (mood.includes('minor') || mood.includes('sad') || mood.includes('dark')) {
        this.currentScale = SCALES['minor'];
        this.currentScaleName = 'minor';
    } else {
        this.currentScale = SCALES['major'];
        this.currentScaleName = 'major';
    }
  }

  public triggerMute(role: InstrumentRole) {
    if (!this.isReady) return;
    
    if (role === InstrumentRole.GUITAR) {
        // Kill resonance immediately
        this.guitarSynth?.releaseAll();
        // Play a "dead" strum
        const now = Tone.now();
        this.guitarSynth?.triggerAttackRelease(['C2', 'G2'], "32n", now, 0.3);
    }
  }

  public triggerNote(role: InstrumentRole, velocity: number, yPosition: number, xPosition: number = 0.5) {
    if (!this.isReady) return;
    const now = Tone.now();

    // Map Y Position (0 top - 1 bottom) to a note index
    const noteIndex = Math.floor((1 - yPosition) * (this.currentScale.length - 1));
    const safeIndex = Math.max(0, Math.min(noteIndex, this.currentScale.length - 1));
    const note = this.currentScale[safeIndex];

    switch (role) {
      case InstrumentRole.DRUMS:
        if (yPosition > 0.75) {
            this.drumSynth?.triggerAttackRelease("C1", "8n", now, velocity);
        } else if (yPosition < 0.4) {
             if (xPosition < 0.5) {
                this.metalSynth?.triggerAttackRelease("32n", now, velocity * 0.6); 
             } else {
                this.metalSynth?.triggerAttackRelease("16n", now, velocity); 
             }
        } else {
            if (xPosition < 0.45) {
                this.drumSynth?.triggerAttackRelease("G2", "16n", now, velocity);
                this.noiseSynth?.triggerAttackRelease("16n", now, velocity * 0.5);
            } else if (xPosition > 0.55) {
                this.drumSynth?.triggerAttackRelease("F2", "8n", now, velocity);
            } else {
                this.drumSynth?.triggerAttackRelease("C3", "8n", now, velocity);
            }
        }
        break;

      case InstrumentRole.BASS:
        this.bassSynth?.triggerAttackRelease(note, "8n", now, velocity); 
        break;

      case InstrumentRole.GUITAR:
        const chordSet = CHORDS[this.currentScaleName as keyof typeof CHORDS] || CHORDS['major'];
        const chordIndex = Math.floor((1 - yPosition) * (chordSet.length - 1));
        const chord = chordSet[chordIndex] || chordSet[0];
        
        chord.forEach((n, i) => {
            this.guitarSynth?.triggerAttackRelease(n, "8n", now + i * 0.03, velocity);
        });
        break;
      
      case InstrumentRole.PIANO:
        this.pianoSynth?.triggerAttackRelease(note, "8n", now, velocity);
        break;
    }
  }
}

export const audioEngine = new AudioEngine();