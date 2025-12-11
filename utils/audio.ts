
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

// Default volume: -12dB = comfortable listening level (matches 50% on slider)
const DEFAULT_VOLUME = -12;

class AudioEngine {
    // Synths - Original 4
    private drumSynth: Tone.MembraneSynth | null = null;
    private metalSynth: Tone.MetalSynth | null = null;
    private noiseSynth: Tone.NoiseSynth | null = null;
    private bassSynth: Tone.MonoSynth | null = null;
    private guitarSynth: Tone.PolySynth | null = null;
    private pianoSynth: Tone.PolySynth | null = null;

    // NEW Synths - THEREMIN, STRINGS, PADS
    private thereminSynth: Tone.MonoSynth | null = null;
    private stringsSynth: Tone.PolySynth | null = null;
    private padsSynth: Tone.PolySynth | null = null;

    // Effects & Volume
    private reverb: Tone.Reverb | null = null;
    private volumeNodes: Record<InstrumentRole, Tone.Volume> | null = null;

    private currentScaleName: string = 'major';
    private currentScale: string[] = SCALES['major'];
    private isReady: boolean = false;

    // State Tracking - Default volumes at -50dB (maps to 10 on 0-100 scale)
    private currentPresets: Record<InstrumentRole, InstrumentPreset> = {
        [InstrumentRole.DRUMS]: 'acoustic',
        [InstrumentRole.BASS]: 'electronic',
        [InstrumentRole.GUITAR]: 'acoustic',
        [InstrumentRole.PIANO]: 'acoustic',
        [InstrumentRole.THEREMIN]: 'classic',
        [InstrumentRole.STRINGS]: 'orchestra',
        [InstrumentRole.PADS]: 'ambient',
        [InstrumentRole.NONE]: 'acoustic'
    };

    private currentVolumes: Record<InstrumentRole, number> = {
        [InstrumentRole.DRUMS]: DEFAULT_VOLUME,
        [InstrumentRole.BASS]: DEFAULT_VOLUME,
        [InstrumentRole.GUITAR]: DEFAULT_VOLUME,
        [InstrumentRole.PIANO]: DEFAULT_VOLUME,
        [InstrumentRole.THEREMIN]: DEFAULT_VOLUME,
        [InstrumentRole.STRINGS]: DEFAULT_VOLUME,
        [InstrumentRole.PADS]: DEFAULT_VOLUME,
        [InstrumentRole.NONE]: DEFAULT_VOLUME
    };

    public async initialize() {
        if (this.isReady) return;
        await Tone.start();

        // Safety chain: Limiter prevents clipping, EQ rolls off harsh highs
        const limiter = new Tone.Limiter(-3).toDestination(); // Prevent peaks above -3dB
        const highFreqFilter = new Tone.Filter({
            type: 'lowpass',
            frequency: 12000, // Roll off above 12kHz to protect ears
            rolloff: -12
        }).connect(limiter);

        // Master Effects - reverb feeds into safety chain
        this.reverb = new Tone.Reverb(2).connect(highFreqFilter);

        // Initialize Volume Nodes
        this.volumeNodes = {
            [InstrumentRole.DRUMS]: new Tone.Volume(this.currentVolumes[InstrumentRole.DRUMS]).connect(this.reverb),
            [InstrumentRole.BASS]: new Tone.Volume(this.currentVolumes[InstrumentRole.BASS]).connect(this.reverb),
            [InstrumentRole.GUITAR]: new Tone.Volume(this.currentVolumes[InstrumentRole.GUITAR]).connect(this.reverb),
            [InstrumentRole.PIANO]: new Tone.Volume(this.currentVolumes[InstrumentRole.PIANO]).connect(this.reverb),
            [InstrumentRole.THEREMIN]: new Tone.Volume(this.currentVolumes[InstrumentRole.THEREMIN]).connect(this.reverb),
            [InstrumentRole.STRINGS]: new Tone.Volume(this.currentVolumes[InstrumentRole.STRINGS]).connect(this.reverb),
            [InstrumentRole.PADS]: new Tone.Volume(this.currentVolumes[InstrumentRole.PADS]).connect(this.reverb),
            [InstrumentRole.NONE]: new Tone.Volume(-60)
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

        // 2. Bass
        this.bassSynth = new Tone.MonoSynth({
            oscillator: { type: "square" },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 1.2 },
            filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0.5, release: 0.5, baseFrequency: 50, octaves: 2 }
        }).connect(this.volumeNodes[InstrumentRole.BASS]);

        // 3. Guitar
        this.guitarSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fmsawtooth" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1.5 },
        }).connect(this.volumeNodes[InstrumentRole.GUITAR]);

        // 4. Piano
        this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.02, decay: 0.5, sustain: 0.1, release: 1.2 },
        }).connect(this.volumeNodes[InstrumentRole.PIANO]);

        // 5. THEREMIN - Continuous, eerie sine wave with vibrato
        this.thereminSynth = new Tone.MonoSynth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 1.5 },
            filterEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1.0, baseFrequency: 200, octaves: 3 }
        }).connect(this.volumeNodes[InstrumentRole.THEREMIN]);

        // 6. STRINGS - Rich orchestral strings (polyphonic)
        this.stringsSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 2.0 },
        }).connect(this.volumeNodes[InstrumentRole.STRINGS]);

        // 7. PADS - Ambient, atmospheric pads
        this.padsSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 3.0 },
        }).connect(this.volumeNodes[InstrumentRole.PADS]);

        this.isReady = true;
        console.log("Audio Engine Ready - All 7 instruments loaded");
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
                switch (preset) {
                    case 'electronic':
                        this.drumSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 1.0 }, pitchDecay: 0.01, octaves: 2 });
                        break;
                    case 'jazz':
                        this.drumSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 }, pitchDecay: 0.02, octaves: 4 });
                        break;
                    case 'rock':
                        this.drumSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.5, sustain: 0.05, release: 1.2 }, pitchDecay: 0.03, octaves: 6 });
                        break;
                    case 'latin':
                        this.drumSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.2, release: 0.5 }, pitchDecay: 0.08, octaves: 5 });
                        break;
                    case 'lofi':
                        this.drumSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.05, decay: 0.6, sustain: 0.02, release: 1.8 }, pitchDecay: 0.02, octaves: 3 });
                        break;
                    default: // acoustic
                        this.drumSynth?.set({ pitchDecay: 0.05, octaves: 8, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } });
                        break;
                }
                break;

            case InstrumentRole.PIANO:
                this.pianoSynth?.releaseAll();
                switch (preset) {
                    case 'electric':
                        this.pianoSynth?.set({ oscillator: { type: "pulse" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1 } });
                        break;
                    case 'organ':
                        this.pianoSynth?.set({ oscillator: { type: "triangle6" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.8 } });
                        break;
                    case 'chiptune':
                        this.pianoSynth?.set({ oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.01 } });
                        break;
                    case 'vibraphone':
                        this.pianoSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1.5 } });
                        break;
                    case 'synth':
                        this.pianoSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.8 } });
                        break;
                    default: // acoustic
                        this.pianoSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.5, sustain: 0.1, release: 1.2 } });
                        break;
                }
                break;

            case InstrumentRole.GUITAR:
                switch (preset) {
                    case 'electric':
                        this.guitarSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 } });
                        break;
                    case 'distorted':
                        this.guitarSynth?.set({ oscillator: { type: "fatsawtooth" }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.8 } });
                        break;
                    case 'clean':
                        this.guitarSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 1.0 } });
                        break;
                    case 'jazz':
                        this.guitarSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1.2 } });
                        break;
                    case 'flamenco':
                        this.guitarSynth?.set({ oscillator: { type: "fmsawtooth" }, envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.8 } });
                        break;
                    default: // acoustic
                        this.guitarSynth?.set({ oscillator: { type: "fmsawtooth" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 1.5 } });
                        break;
                }
                break;

            case InstrumentRole.BASS:
                switch (preset) {
                    case 'electronic':
                        this.bassSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 } });
                        break;
                    case 'slap':
                        this.bassSynth?.set({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.5 } });
                        break;
                    case 'synth':
                        this.bassSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.8 } });
                        break;
                    case 'dubstep':
                        this.bassSynth?.set({ oscillator: { type: "fatsawtooth" }, envelope: { attack: 0.01, decay: 0.4, sustain: 0.6, release: 0.3 } });
                        break;
                    case 'upright':
                        this.bassSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.1, decay: 0.4, sustain: 0.3, release: 1.5 } });
                        break;
                    default: // acoustic/funk
                        this.bassSynth?.set({ oscillator: { type: "square" }, envelope: { attack: 0.1, decay: 0.3, sustain: 0.2, release: 1.2 } });
                        break;
                }
                break;

            case InstrumentRole.THEREMIN:
                switch (preset) {
                    case 'classic':
                        this.thereminSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 1.5 } });
                        break;
                    case 'eerie':
                        this.thereminSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.5, decay: 0.2, sustain: 0.7, release: 2.0 } });
                        break;
                    case 'scifi':
                        this.thereminSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.5 } });
                        break;
                    case 'warm':
                        this.thereminSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.4, decay: 0.3, sustain: 0.6, release: 2.5 } });
                        break;
                    case 'bright':
                        this.thereminSynth?.set({ oscillator: { type: "square" }, envelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 1.0 } });
                        break;
                    case 'alien':
                        this.thereminSynth?.set({ oscillator: { type: "fmsine" }, envelope: { attack: 0.1, decay: 0.05, sustain: 0.95, release: 0.3 } });
                        break;
                    default:
                        this.thereminSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 1.5 } });
                        break;
                }
                break;

            case InstrumentRole.STRINGS:
                this.stringsSynth?.releaseAll();
                switch (preset) {
                    case 'orchestra':
                        this.stringsSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 2.0 } });
                        break;
                    case 'chamber':
                        this.stringsSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.4, decay: 0.3, sustain: 0.5, release: 2.5 } });
                        break;
                    case 'synth':
                        this.stringsSynth?.set({ oscillator: { type: "fatsawtooth" }, envelope: { attack: 0.2, decay: 0.2, sustain: 0.7, release: 1.5 } });
                        break;
                    case 'solo':
                        this.stringsSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.15, decay: 0.2, sustain: 0.7, release: 1.8 } });
                        break;
                    case 'pizzicato':
                        this.stringsSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.3 } });
                        break;
                    case 'cinematic':
                        this.stringsSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 3.0 } });
                        break;
                    default:
                        this.stringsSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.3, decay: 0.4, sustain: 0.6, release: 2.0 } });
                        break;
                }
                break;

            case InstrumentRole.PADS:
                this.padsSynth?.releaseAll();
                switch (preset) {
                    case 'ambient':
                        this.padsSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 3.0 } });
                        break;
                    case 'warm':
                        this.padsSynth?.set({ oscillator: { type: "triangle" }, envelope: { attack: 0.8, decay: 0.4, sustain: 0.7, release: 2.5 } });
                        break;
                    case 'ethereal':
                        this.padsSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 1.5, decay: 0.8, sustain: 0.9, release: 4.0 } });
                        break;
                    case 'dark':
                        this.padsSynth?.set({ oscillator: { type: "sawtooth" }, envelope: { attack: 1.2, decay: 0.6, sustain: 0.6, release: 3.5 } });
                        break;
                    case 'bright':
                        this.padsSynth?.set({ oscillator: { type: "square" }, envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 2.0 } });
                        break;
                    case 'crystal':
                        this.padsSynth?.set({ oscillator: { type: "fmsine" }, envelope: { attack: 0.6, decay: 0.4, sustain: 0.7, release: 2.8 } });
                        break;
                    default:
                        this.padsSynth?.set({ oscillator: { type: "sine" }, envelope: { attack: 1.0, decay: 0.5, sustain: 0.8, release: 3.0 } });
                        break;
                }
                break;
        }
    }

    public updateConductorState(state: ConductorState) {
        if (!this.isReady) return;
        Tone.Transport.bpm.rampTo(state.tempo, 2);

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

        switch (role) {
            case InstrumentRole.GUITAR:
                this.guitarSynth?.releaseAll();
                this.guitarSynth?.triggerAttackRelease(['C2', 'G2'], "32n", Tone.now(), 0.3);
                break;
            case InstrumentRole.STRINGS:
                this.stringsSynth?.releaseAll();
                break;
            case InstrumentRole.PADS:
                this.padsSynth?.releaseAll();
                break;
        }
    }

    public previewNote(role: InstrumentRole) {
        if (!this.isReady) return;
        const now = Tone.now();

        switch (role) {
            case InstrumentRole.DRUMS:
                this.drumSynth?.triggerAttackRelease("C1", "8n", now);
                this.drumSynth?.triggerAttackRelease("C3", "8n", now + 0.15);
                this.drumSynth?.triggerAttackRelease("C1", "8n", now + 0.3);
                break;
            case InstrumentRole.PIANO:
                this.pianoSynth?.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
                break;
            case InstrumentRole.GUITAR:
                this.guitarSynth?.triggerAttackRelease("C3", "8n", now);
                this.guitarSynth?.triggerAttackRelease("E3", "8n", now + 0.05);
                this.guitarSynth?.triggerAttackRelease("G3", "8n", now + 0.1);
                break;
            case InstrumentRole.BASS:
                this.bassSynth?.triggerAttackRelease("C2", "8n", now);
                this.bassSynth?.triggerAttackRelease("C3", "16n", now + 0.2);
                break;
            case InstrumentRole.THEREMIN:
                // Eerie theremin glide
                this.thereminSynth?.triggerAttackRelease("C4", "4n", now);
                break;
            case InstrumentRole.STRINGS:
                // Orchestral swell
                this.stringsSynth?.triggerAttackRelease(["C3", "E3", "G3", "B3"], "2n", now);
                break;
            case InstrumentRole.PADS:
                // Ambient pad chord
                this.padsSynth?.triggerAttackRelease(["C3", "G3", "C4"], "1n", now);
                break;
        }
    }

    public triggerNote(role: InstrumentRole, velocity: number, yPosition: number, xPosition: number = 0.5) {
        if (!this.isReady) return;
        const now = Tone.now();

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

            case InstrumentRole.THEREMIN:
                // Theremin - continuous pitch based on Y position
                const thereminNote = this.currentScale[Math.floor(yPosition * (this.currentScale.length - 1))];
                this.thereminSynth?.triggerAttackRelease(thereminNote, "4n", now, velocity);
                break;

            case InstrumentRole.STRINGS:
                // Strings - rich chords based on position
                const stringNotes = [note, this.currentScale[(safeIndex + 2) % this.currentScale.length], this.currentScale[(safeIndex + 4) % this.currentScale.length]];
                this.stringsSynth?.triggerAttackRelease(stringNotes, "2n", now, velocity);
                break;

            case InstrumentRole.PADS:
                // Pads - ambient chord swells
                const padNotes = [note, this.currentScale[(safeIndex + 4) % this.currentScale.length]];
                this.padsSynth?.triggerAttackRelease(padNotes, "1n", now, velocity * 0.7);
                break;
        }
    }
}

export const audioEngine = new AudioEngine();