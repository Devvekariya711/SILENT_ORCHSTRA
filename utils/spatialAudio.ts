/**
 * Silent Orchestra - Spatial Audio Module
 * Provides 3D audio positioning based on hand movement
 */

import { InstrumentRole } from '../types';

// Spatial audio configuration
interface SpatialConfig {
    enableStereo: boolean;
    enableDepth: boolean;
    stereoWidth: number;      // 0-1 (how wide the stereo field is)
    maxReverbDecay: number;   // Max reverb decay in seconds
}

const defaultConfig: SpatialConfig = {
    enableStereo: true,
    enableDepth: true,
    stereoWidth: 1.0,
    maxReverbDecay: 3.5
};

/**
 * SpatialAudioController - Manages 3D audio positioning
 */
export class SpatialAudioController {
    private config: SpatialConfig;
    private currentPan: number = 0;    // -1 to 1
    private currentDepth: number = 0;  // 0 to 1

    constructor(config: Partial<SpatialConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    /**
     * Calculate stereo pan from X position
     * @param xPosition - Normalized X (0 = left, 0.5 = center, 1 = right)
     * @returns Pan value from -1 (left) to 1 (right)
     */
    calculatePan(xPosition: number): number {
        if (!this.config.enableStereo) return 0;

        // Convert 0-1 to -1 to 1
        const rawPan = (xPosition - 0.5) * 2;

        // Apply stereo width
        const pan = rawPan * this.config.stereoWidth;

        // Clamp to valid range
        this.currentPan = Math.max(-1, Math.min(1, pan));
        return this.currentPan;
    }

    /**
     * Calculate depth/reverb from velocity or Z position
     * Higher velocity = more present (less reverb)
     * Lower velocity = more distant (more reverb)
     * @param velocity - Normalized velocity (0-1)
     * @returns Depth value (0 = close, 1 = far)
     */
    calculateDepth(velocity: number): number {
        if (!this.config.enableDepth) return 0;

        // Inverse: fast = close, slow = distant
        this.currentDepth = Math.max(0, Math.min(1, 1 - velocity));
        return this.currentDepth;
    }

    /**
     * Get reverb decay time based on depth
     */
    getReverbDecay(): number {
        const minDecay = 0.5;
        return minDecay + (this.currentDepth * this.config.maxReverbDecay);
    }

    /**
     * Get current pan value
     */
    getPan(): number {
        return this.currentPan;
    }

    /**
     * Get current depth value
     */
    getDepth(): number {
        return this.currentDepth;
    }

    /**
     * Update spatial position from hand coordinates
     * @param x - Hand X position (0-1)
     * @param y - Hand Y position (0-1)
     * @param velocity - Hand velocity (0-1)
     * @returns Object with pan and depth values
     */
    update(x: number, y: number, velocity: number): { pan: number; depth: number } {
        return {
            pan: this.calculatePan(x),
            depth: this.calculateDepth(velocity)
        };
    }

    /**
     * Get audio context parameters for applying spatial effects
     * Can be used with Web Audio API or Tone.js
     */
    getSpatialParams(): {
        pan: number;
        depth: number;
        reverbDecay: number;
        reverbWet: number;
    } {
        return {
            pan: this.currentPan,
            depth: this.currentDepth,
            reverbDecay: this.getReverbDecay(),
            reverbWet: 0.1 + (this.currentDepth * 0.6)  // 10% to 70% wet
        };
    }

    /**
     * Reset to center position
     */
    reset(): void {
        this.currentPan = 0;
        this.currentDepth = 0;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<SpatialConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Per-instrument spatial controllers
const spatialControllers = new Map<InstrumentRole, SpatialAudioController>();

/**
 * Get or create spatial controller for an instrument
 */
export function getSpatialController(role: InstrumentRole): SpatialAudioController {
    if (!spatialControllers.has(role)) {
        spatialControllers.set(role, new SpatialAudioController());
    }
    return spatialControllers.get(role)!;
}

/**
 * Update spatial audio for an instrument based on hand position
 */
export function updateSpatialAudio(
    role: InstrumentRole,
    x: number,
    y: number,
    velocity: number
): { pan: number; depth: number } {
    const controller = getSpatialController(role);
    return controller.update(x, y, velocity);
}

// Default singleton controller
export const spatialAudio = new SpatialAudioController();
