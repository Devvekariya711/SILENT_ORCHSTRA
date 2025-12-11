/**
 * Audio Preloader - Eliminates first-note latency
 * Pre-loads all Tone.js instruments and samples on app startup
 */

import * as Tone from 'tone';
import { InstrumentRole } from '../types';

interface PreloadStatus {
    loaded: boolean;
    instrument: InstrumentRole;
    loadTime: number;
}

class AudioPreloader {
    private loadStatus: Map<InstrumentRole, PreloadStatus> = new Map();
    private startTime: number = 0;

    /**
     * Pre-load all instruments before user plays
     * Target: Reduce first-note latency from 200ms → 5ms
     */
    async preloadAll(): Promise<void> {
        this.startTime = performance.now();
        console.log('🎵 Preloading all instruments...');

        // Start Tone.js audio context immediately
        await Tone.start();
        console.log('✓ Audio context started');

        // Pre-load all instruments in parallel
        await Promise.all([
            this.preloadDrums(),
            this.preloadPiano(),
            this.preloadGuitar(),
            this.preloadBass(),
            this.preloadTheremin(),
            this.preloadStrings(),
            this.preloadPads()
        ]);

        const totalTime = performance.now() - this.startTime;
        console.log(`✅ All instruments preloaded in ${totalTime.toFixed(0)}ms`);
    }

    private async preloadDrums(): Promise<void> {
        const start = performance.now();

        // Pre-create drum sampler with samples
        const drumSampler = new Tone.Sampler({
            urls: {
                C3: "kick.wav",
                D3: "snare.wav",
                E3: "hihat.wav",
                F3: "tom.wav",
                G3: "crash.wav"
            },
            baseUrl: "https://tonejs.github.io/audio/drum-samples/acoustic-kit/"
        }).toDestination();

        await Tone.loaded();

        this.loadStatus.set(InstrumentRole.DRUMS, {
            loaded: true,
            instrument: InstrumentRole.DRUMS,
            loadTime: performance.now() - start
        });
    }

    private async preloadPiano(): Promise<void> {
        const start = performance.now();

        // Pre-create piano sampler
        const pianoSampler = new Tone.Sampler({
            urls: {
                A0: "A0.mp3",
                C1: "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                A1: "A1.mp3",
                C2: "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                A2: "A2.mp3",
                C3: "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                A3: "A3.mp3",
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
                C5: "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                A5: "A5.mp3",
                C6: "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                A6: "A6.mp3",
                C7: "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                A7: "A7.mp3",
                C8: "C8.mp3"
            },
            baseUrl: "https://tonejs.github.io/audio/salamander/"
        }).toDestination();

        await Tone.loaded();

        this.loadStatus.set(InstrumentRole.PIANO, {
            loaded: true,
            instrument: InstrumentRole.PIANO,
            loadTime: performance.now() - start
        });
    }

    private async preloadGuitar(): Promise<void> {
        const start = performance.now();

        // Pre-create guitar synthesizer
        const guitarSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.008,
                decay: 0.3,
                sustain: 0.1,
                release: 1.2
            }
        }).toDestination();

        this.loadStatus.set(InstrumentRole.GUITAR, {
            loaded: true,
            instrument: InstrumentRole.GUITAR,
            loadTime: performance.now() - start
        });
    }

    private async preloadBass(): Promise<void> {
        const start = performance.now();

        // Pre-create bass synthesizer
        const bassSynth = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.4,
                release: 0.8
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.5,
                release: 0.6,
                baseFrequency: 200,
                octaves: 2.6
            }
        }).toDestination();

        this.loadStatus.set(InstrumentRole.BASS, {
            loaded: true,
            instrument: InstrumentRole.BASS,
            loadTime: performance.now() - start
        });
    }

    private async preloadTheremin(): Promise<void> {
        const start = performance.now();

        // Pre-create theremin synthesizer (always on)
        const thereminSynth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.02,
                decay: 0,
                sustain: 1,
                release: 0.5
            }
        }).toDestination();

        this.loadStatus.set(InstrumentRole.THEREMIN, {
            loaded: true,
            instrument: InstrumentRole.THEREMIN,
            loadTime: performance.now() - start
        });
    }

    private async preloadStrings(): Promise<void> {
        const start = performance.now();

        // Pre-create string ensemble
        const stringsSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.4,
                decay: 0.3,
                sustain: 0.8,
                release: 1.5
            }
        }).toDestination();

        this.loadStatus.set(InstrumentRole.STRINGS, {
            loaded: true,
            instrument: InstrumentRole.STRINGS,
            loadTime: performance.now() - start
        });
    }

    private async preloadPads(): Promise<void> {
        const start = performance.now();

        // Pre-create ambient pad synthesizer
        const padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.8,
                decay: 0.5,
                sustain: 0.9,
                release: 3.0
            }
        }).toDestination();

        // Add reverb for ambient effect
        const reverb = new Tone.Reverb({ decay: 8, wet: 0.5 });
        await reverb.generate();
        padSynth.connect(reverb);

        this.loadStatus.set(InstrumentRole.PADS, {
            loaded: true,
            instrument: InstrumentRole.PADS,
            loadTime: performance.now() - start
        });
    }

    /**
     * Get load status for debugging
     */
    getStatus(): Map<InstrumentRole, PreloadStatus> {
        return this.loadStatus;
    }

    /**
     * Check if specific instrument is ready
     */
    isReady(instrument: InstrumentRole): boolean {
        return this.loadStatus.get(instrument)?.loaded || false;
    }

    /**
     * Get average load time
     */
    getAverageLoadTime(): number {
        const times = Array.from(this.loadStatus.values()).map(s => s.loadTime);
        return times.reduce((a, b) => a + b, 0) / times.length;
    }
}

// Singleton instance
export const audioPreloader = new AudioPreloader();

// Auto-preload on module import (runs during app startup)
if (typeof window !== 'undefined') {
    // Preload after user interaction (required for web audio)
    let hasPreloaded = false;

    const preloadOnInteraction = () => {
        if (!hasPreloaded) {
            hasPreloaded = true;
            audioPreloader.preloadAll().catch(console.error);

            // Remove listeners after first interaction
            document.removeEventListener('click', preloadOnInteraction);
            document.removeEventListener('keydown', preloadOnInteraction);
            document.removeEventListener('touchstart', preloadOnInteraction);
        }
    };

    // Listen for any user interaction
    document.addEventListener('click', preloadOnInteraction);
    document.addEventListener('keydown', preloadOnInteraction);
    document.addEventListener('touchstart', preloadOnInteraction);
}
