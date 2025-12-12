/**
 * Silent Orchestra - AI Auto-Accompaniment System
 * Provides AI-driven musical fill when user gestures pause
 * Creates smooth transitions and maintains musical continuity
 */

import * as Tone from 'tone';
import { InstrumentRole, ConductorState } from '../types';
import { audioEngine } from './audio';

// Musical patterns for each instrument (simple generative)
const PATTERNS = {
    [InstrumentRole.DRUMS]: [
        { note: 0.8, velocity: 0.6, duration: 0.125 }, // Kick pattern
        { note: 0.2, velocity: 0.4, duration: 0.25 },  // Hat
        { note: 0.5, velocity: 0.5, duration: 0.25 },  // Snare
    ],
    [InstrumentRole.BASS]: [
        { note: 0.3, velocity: 0.5, duration: 0.5 },
        { note: 0.5, velocity: 0.4, duration: 0.25 },
        { note: 0.7, velocity: 0.5, duration: 0.5 },
    ],
    [InstrumentRole.PIANO]: [
        { note: 0.4, velocity: 0.3, duration: 1 },
        { note: 0.5, velocity: 0.3, duration: 0.5 },
        { note: 0.6, velocity: 0.4, duration: 0.5 },
    ],
    [InstrumentRole.GUITAR]: [
        { note: 0.3, velocity: 0.4, duration: 0.5 },
        { note: 0.6, velocity: 0.5, duration: 0.5 },
    ],
    [InstrumentRole.THEREMIN]: [
        { note: 0.5, velocity: 0.3, duration: 2 },
    ],
    [InstrumentRole.STRINGS]: [
        { note: 0.5, velocity: 0.4, duration: 2 },
        { note: 0.6, velocity: 0.5, duration: 1 },
    ],
    [InstrumentRole.PADS]: [
        { note: 0.5, velocity: 0.3, duration: 4 },
    ],
    [InstrumentRole.NONE]: [],
};

interface AIFillConfig {
    enabled: boolean;
    fadeInTime: number;      // seconds to fade in AI fill
    fadeOutTime: number;     // seconds to fade out when user resumes
    idleThreshold: number;   // ms of inactivity before AI kicks in
    intensity: number;       // 0-1 how prominent the AI fill should be
}

const DEFAULT_CONFIG: AIFillConfig = {
    enabled: true,
    fadeInTime: 0.5,
    fadeOutTime: 0.3,
    idleThreshold: 1500, // 1.5 seconds of no gestures
    intensity: 0.4,      // 40% volume relative to user
};

class AIAutoAccompaniment {
    private config: AIFillConfig;
    private lastUserActivity: number = 0;
    private isAIPlaying: boolean = false;
    private aiFillVolume: number = 0;
    private currentRole: InstrumentRole = InstrumentRole.NONE;
    private patternIndex: number = 0;
    private loopInterval: number | null = null;
    private tempo: number = 120;

    constructor(config: Partial<AIFillConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Called when user makes a gesture - resets idle timer
     */
    markUserActivity() {
        this.lastUserActivity = performance.now();

        // If AI is playing, start fading out
        if (this.isAIPlaying) {
            this.fadeOutAI();
        }
    }

    /**
     * Set the current instrument role
     */
    setRole(role: InstrumentRole) {
        this.currentRole = role;
        this.patternIndex = 0;
    }

    /**
     * Update tempo from conductor
     */
    updateTempo(tempo: number) {
        this.tempo = tempo;
        // Restart loop with new tempo if active
        if (this.loopInterval && this.isAIPlaying) {
            this.stopLoop();
            this.startLoop();
        }
    }

    /**
     * Enable or disable AI accompaniment
     */
    setEnabled(enabled: boolean) {
        this.config.enabled = enabled;
        if (!enabled && this.isAIPlaying) {
            this.fadeOutAI();
        }
    }

    /**
     * Start the AI monitoring loop
     */
    start() {
        if (!this.config.enabled) return;

        // Check every 500ms if AI should kick in
        this.loopInterval = window.setInterval(() => {
            this.checkAndTrigger();
        }, 500) as unknown as number;
    }

    /**
     * Stop the AI system
     */
    stop() {
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.isAIPlaying = false;
    }

    /**
     * Check if AI should start filling
     */
    private checkAndTrigger() {
        if (!this.config.enabled || this.currentRole === InstrumentRole.NONE) return;

        const idleTime = performance.now() - this.lastUserActivity;

        if (idleTime > this.config.idleThreshold && !this.isAIPlaying) {
            this.startAIFill();
        }
    }

    /**
     * Start AI accompaniment with fade-in
     */
    private startAIFill() {
        this.isAIPlaying = true;
        this.aiFillVolume = 0;

        // Fade in over config.fadeInTime
        const fadeSteps = 10;
        const stepTime = (this.config.fadeInTime * 1000) / fadeSteps;
        const volumeStep = this.config.intensity / fadeSteps;

        let step = 0;
        const fadeIn = setInterval(() => {
            step++;
            this.aiFillVolume = Math.min(this.config.intensity, step * volumeStep);
            if (step >= fadeSteps) {
                clearInterval(fadeIn);
            }
        }, stepTime);

        this.startLoop();
    }

    /**
     * Fade out AI when user resumes
     */
    private fadeOutAI() {
        const fadeSteps = 10;
        const stepTime = (this.config.fadeOutTime * 1000) / fadeSteps;
        const volumeStep = this.aiFillVolume / fadeSteps;

        let step = 0;
        const fadeOut = setInterval(() => {
            step++;
            this.aiFillVolume = Math.max(0, this.aiFillVolume - volumeStep);
            if (step >= fadeSteps) {
                clearInterval(fadeOut);
                this.isAIPlaying = false;
                this.stopLoop();
            }
        }, stepTime);
    }

    /**
     * Start the generative pattern loop
     */
    private startLoop() {
        const beatDuration = (60 / this.tempo) * 1000; // ms per beat

        const playNextNote = () => {
            if (!this.isAIPlaying) return;

            const pattern = PATTERNS[this.currentRole];
            if (pattern.length === 0) return;

            const note = pattern[this.patternIndex % pattern.length];

            // Trigger the note at reduced volume (AI fill level)
            audioEngine.triggerNote(
                this.currentRole,
                note.velocity * this.aiFillVolume,
                note.note,
                0.5
            );

            this.patternIndex++;

            // Schedule next note
            setTimeout(playNextNote, beatDuration * note.duration);
        };

        playNextNote();
    }

    /**
     * Stop the pattern loop
     */
    private stopLoop() {
        this.patternIndex = 0;
    }

    /**
     * Get current AI state
     */
    getState() {
        return {
            isPlaying: this.isAIPlaying,
            volume: this.aiFillVolume,
            idleTime: performance.now() - this.lastUserActivity,
        };
    }
}

// Singleton instance
export const aiAccompaniment = new AIAutoAccompaniment();
