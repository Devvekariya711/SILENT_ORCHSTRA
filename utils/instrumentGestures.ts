import { TwoHandGestureData, HandData, Vector3D } from './handsGestures';
import { InstrumentRole } from '../types';

// ========== DRUM GESTURE HANDLER ==========
export interface DrumHitEvent {
    drumType: 'hihat' | 'snare' | 'kick' | 'tom' | 'crash';
    velocity: number;
    timestamp: number;
    hand: 'left' | 'right';
    position: { x: number, y: number };
}

export class DrumGestureHandler {
    private lastHitTime = { left: 0, right: 0 };
    private readonly HIT_COOLDOWN = 80; // ms - prevent double-triggering
    private readonly VELOCITY_THRESHOLD = 2.0; // Minimum downward velocity for hit

    public process(data: TwoHandGestureData): DrumHitEvent[] {
        const events: DrumHitEvent[] = [];
        const now = performance.now();

        // Check both hands - use INDEX FINGER as drumstick
        [data.leftHand, data.rightHand].forEach((hand) => {
            if (!hand) return;

            const handSide = hand.handedness === 'Left' ? 'left' : 'right';

            // Cooldown check
            if (now - this.lastHitTime[handSide] < this.HIT_COOLDOWN) {
                return;
            }

            // Use INDEX FINGER velocity (like a drumstick tip)
            const indexFinger = hand.fingers.index;
            const fingerVelocity = indexFinger.velocity.y;

            // Detect sharp DOWNWARD motion of index finger (drumstick hit)
            // Positive Y velocity = moving down in screen coordinates
            if (fingerVelocity > this.VELOCITY_THRESHOLD) {
                this.lastHitTime[handSide] = now;

                const indexTip = indexFinger.tip;

                events.push({
                    drumType: this.getDrumType(indexTip.x),
                    velocity: Math.min(1.0, fingerVelocity / 5.0), // Normalize to 0-1
                    timestamp: now,
                    hand: handSide,
                    position: { x: indexTip.x, y: indexTip.y }
                });
            }
        });

        return events;
    }

    private getDrumType(xPosition: number): DrumHitEvent['drumType'] {
        // Map X position (0-1) to drum kit layout
        if (xPosition < 0.2) return 'hihat';    // Far left
        if (xPosition < 0.4) return 'snare';    // Left-center
        if (xPosition < 0.6) return 'kick';     // Center
        if (xPosition < 0.8) return 'tom';      // Right-center
        return 'crash';                          // Far right
    }
}

// ========== PIANO GESTURE HANDLER ==========
export interface PianoKeyEvent {
    type: 'press' | 'release';
    keyId: string;
    keyIndex: number;  // 0-11 for an octave
    velocity: number;
    hand: 'left' | 'right';
    finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
    timestamp: number;
}

export class PianoGestureHandler {
    private activeKeys = new Set<string>();
    private readonly KEYS_PER_HAND = 6; // Each hand covers 6 keys (half octave)
    private readonly TAP_THRESHOLD = 0.15; // Y distance considered a "tap"
    private readonly TAP_VELOCITY_THRESHOLD = 0.8; // Finger velocity threshold for tap detection

    public process(data: TwoHandGestureData): PianoKeyEvent[] {
        const events: PianoKeyEvent[] = [];
        const currentActiveKeys = new Set<string>();
        const now = performance.now();

        // Process each hand
        [data.leftHand, data.rightHand].forEach((hand) => {
            if (!hand) return;

            const handSide = hand.handedness === 'Left' ? 'left' : 'right';

            // Check each finger
            Object.entries(hand.fingers).forEach(([fingerName, finger]) => {
                const typedFingerName = fingerName as keyof HandData['fingers'];

                // Only process extended fingers
                if (!finger.extended) return;

                // Detect "tap" gesture - use INDIVIDUAL FINGER velocity
                const fingerVelocityY = finger.velocity.y;
                const isTapping = fingerVelocityY > this.TAP_VELOCITY_THRESHOLD;

                if (isTapping) {
                    const keyIndex = this.getKeyIndex(finger.tip.x, handSide);
                    const keyId = `${handSide}-${fingerName}-${keyIndex}`;

                    currentActiveKeys.add(keyId);

                    // Detect "press" (newly active key)
                    if (!this.activeKeys.has(keyId)) {
                        events.push({
                            type: 'press',
                            keyId,
                            keyIndex,
                            velocity: Math.min(1.0, fingerVelocityY / 3.0), // Normalize finger velocity
                            hand: handSide,
                            finger: typedFingerName,
                            timestamp: now
                        });
                    }
                }
            });
        });

        // Detect "release" (keys that were active but aren't anymore)
        this.activeKeys.forEach(keyId => {
            if (!currentActiveKeys.has(keyId)) {
                const [hand, finger, keyIndexStr] = keyId.split('-');
                events.push({
                    type: 'release',
                    keyId,
                    keyIndex: parseInt(keyIndexStr),
                    velocity: 0,
                    hand: hand as 'left' | 'right',
                    finger: finger as PianoKeyEvent['finger'],
                    timestamp: now
                });
            }
        });

        this.activeKeys = currentActiveKeys;
        return events;
    }

    // Check if finger is moving downward fast enough
    private isFingerTapping(finger: HandData['fingers']['index']): boolean {
        return finger.velocity.y > this.TAP_VELOCITY_THRESHOLD;
    }

    private getKeyIndex(xPosition: number, hand: 'left' | 'right'): number {
        // Divide screen into 12 keys (one octave)
        // Left hand: keys 0-5, Right hand: keys 6-11
        const totalKeys = 12;
        const rawIndex = Math.floor(xPosition * totalKeys);

        // Clamp to valid range
        return Math.max(0, Math.min(totalKeys - 1, rawIndex));
    }
}

// ========== GUITAR GESTURE HANDLER ==========
export interface GuitarStrumEvent {
    type: 'downstrum' | 'upstrum';
    velocity: number;
    stringIndex: number; // 0-5 for 6 strings
    fretPosition: number; // 0-12 for fret number
    timestamp: number;
}

export class GuitarGestureHandler {
    private lastStrumTime = 0;
    private readonly STRUM_COOLDOWN = 150; // ms
    private readonly STRUM_THRESHOLD = 1.5; // Horizontal velocity threshold

    // Track which hand is which
    private fretHand: 'left' | 'right' | null = null;
    private strumHand: 'left' | 'right' | null = null;

    public process(data: TwoHandGestureData): GuitarStrumEvent[] {
        const events: GuitarStrumEvent[] = [];
        const now = performance.now();

        // Identify which hand is fretting vs strumming
        this.identifyHands(data);

        if (!this.strumHand || !this.fretHand) {
            return events; // Need both hands detected
        }

        // Get the actual hand data
        const strumHandData = this.strumHand === 'left' ? data.leftHand : data.rightHand;
        const fretHandData = this.fretHand === 'left' ? data.leftHand : data.rightHand;

        if (!strumHandData || !fretHandData) return events;

        // Cooldown check
        if (now - this.lastStrumTime < this.STRUM_COOLDOWN) {
            return events;
        }

        // Use INDEX FINGER velocity for strumming (more precise than hand)
        const indexFinger = strumHandData.fingers.index;
        const horizontalVelocity = indexFinger.velocity.x;

        if (Math.abs(horizontalVelocity) > this.STRUM_THRESHOLD) {
            this.lastStrumTime = now;

            const strumType: GuitarStrumEvent['type'] =
                horizontalVelocity > 0 ? 'downstrum' : 'upstrum';

            // Determine which string based on index finger Y position
            const stringIndex = this.getStringIndex(indexFinger.tip.y);

            // Determine fret position from fret hand fingers
            const fretPosition = this.getFretPosition(fretHandData);

            events.push({
                type: strumType,
                velocity: Math.min(1.0, Math.abs(horizontalVelocity) / 3.0),
                stringIndex,
                fretPosition,
                timestamp: now
            });
        }

        return events;
    }

    private identifyHands(data: TwoHandGestureData) {
        // Heuristic: Fret hand is more stationary (lower velocity)
        // Strum hand moves more (higher velocity) - use INDEX FINGER velocity

        if (!data.leftHand || !data.rightHand) {
            // Can't determine with only one hand
            return;
        }

        // Use INDEX FINGER velocity for more accurate detection
        const leftIndex = data.leftHand.fingers.index;
        const rightIndex = data.rightHand.fingers.index;

        const leftSpeed = Math.sqrt(
            leftIndex.velocity.x ** 2 +
            leftIndex.velocity.y ** 2
        );

        const rightSpeed = Math.sqrt(
            rightIndex.velocity.x ** 2 +
            rightIndex.velocity.y ** 2
        );

        // Hand whose index finger moves more is probably strumming
        if (leftSpeed > rightSpeed * 1.5) {
            this.strumHand = 'left';
            this.fretHand = 'right';
        } else if (rightSpeed > leftSpeed * 1.5) {
            this.strumHand = 'right';
            this.fretHand = 'left';
        }
        // Otherwise keep previous assignment
    }

    private getStringIndex(yPosition: number): number {
        // Map Y position (0-1) to guitar strings (0-5)
        // Lower Y (top of screen) = higher string
        return Math.floor((1 - yPosition) * 6);
    }

    private getFretPosition(fretHand: HandData): number {
        // Count how many fingers are extended = fret complexity
        const extendedCount = Object.values(fretHand.fingers)
            .filter(f => f.extended).length;

        // Use Y position to determine fret number
        const fretNumber = Math.floor(fretHand.fingers.index.tip.y * 12);

        return Math.max(0, Math.min(12, fretNumber));
    }
}

// ========== THEREMIN GESTURE HANDLER ==========
export interface ThereminEvent {
    pitch: number;        // 0-1 (mapped to Y position - up = high)
    volume: number;       // 0-1 (mapped to X position - right = loud)
    vibrato: number;      // 0-1 (mapped to finger velocity for tremolo effect)
    isActive: boolean;    // Whether hand is detected
    timestamp: number;
}

export class ThereminGestureHandler {
    private isPlaying = false;
    private lastPitch = 0.5;
    private lastVolume = 0.5;

    public process(data: TwoHandGestureData): ThereminEvent | null {
        // Theremin uses INDEX FINGER for precise control
        const hand = data.rightHand || data.leftHand;

        if (!hand) {
            if (this.isPlaying) {
                this.isPlaying = false;
                return {
                    pitch: this.lastPitch,
                    volume: 0,
                    vibrato: 0,
                    isActive: false,
                    timestamp: data.timestamp
                };
            }
            return null;
        }

        this.isPlaying = true;

        // Use INDEX FINGER tip for control
        const indexFinger = hand.fingers.index;

        // Y position = pitch (inverted - up is higher pitch)
        const pitch = 1 - indexFinger.tip.y;

        // X position = volume (right = louder)
        const volume = indexFinger.tip.x;

        // Finger velocity = vibrato/tremolo effect
        const vibrato = Math.min(1, Math.abs(indexFinger.velocity.y) / 2);

        this.lastPitch = pitch;
        this.lastVolume = volume;

        return {
            pitch,
            volume,
            vibrato,
            isActive: true,
            timestamp: data.timestamp
        };
    }
}

// ========== STRINGS GESTURE HANDLER ==========
export interface StringsEvent {
    type: 'swell' | 'accent' | 'sustain' | 'release';
    intensity: number;    // 0-1
    spread: number;       // How wide the gesture (0-1)
    yPosition: number;    // Pitch range
    timestamp: number;
}

export class StringsGestureHandler {
    private readonly SWELL_THRESHOLD = 0.8;
    private lastIntensity = 0;
    private isPlaying = false;

    public process(data: TwoHandGestureData): StringsEvent | null {
        // Strings work best with both hands for conducting gestures
        const leftHand = data.leftHand;
        const rightHand = data.rightHand;

        // Calculate spread (distance between index finger tips)
        let spread = 0.5;
        if (leftHand && rightHand) {
            spread = Math.abs(rightHand.fingers.index.tip.x - leftHand.fingers.index.tip.x);
        }

        // Use any available hand for intensity
        const primaryHand = rightHand || leftHand;

        if (!primaryHand) {
            if (this.isPlaying) {
                this.isPlaying = false;
                return {
                    type: 'release',
                    intensity: 0,
                    spread,
                    yPosition: 0.5,
                    timestamp: data.timestamp
                };
            }
            return null;
        }

        // Use INDEX FINGER velocity for conducting (like baton)
        const indexFinger = primaryHand.fingers.index;
        const velocityMag = Math.sqrt(
            indexFinger.velocity.x ** 2 +
            indexFinger.velocity.y ** 2
        );
        const intensity = Math.min(1, velocityMag / 3);

        // Determine gesture type based on INDEX FINGER vertical movement
        let type: StringsEvent['type'] = 'sustain';
        if (Math.abs(indexFinger.velocity.y) > this.SWELL_THRESHOLD) {
            type = indexFinger.velocity.y < 0 ? 'swell' : 'accent'; // Moving up = swell
        }

        if (!this.isPlaying && intensity > 0.1) {
            this.isPlaying = true;
        }

        this.lastIntensity = intensity;

        return {
            type,
            intensity,
            spread,
            yPosition: 1 - indexFinger.tip.y,
            timestamp: data.timestamp
        };
    }
}

// ========== PADS GESTURE HANDLER ==========
export interface PadsEvent {
    type: 'start' | 'sustain' | 'release';
    intensity: number;    // 0-1
    position: { x: number; y: number };
    fingers: number;      // Count of extended fingers (affects texture)
    timestamp: number;
}

export class PadsGestureHandler {
    private isPlaying = false;
    private lastPosition = { x: 0.5, y: 0.5 };
    private readonly SMOOTHING = 0.3;

    public process(data: TwoHandGestureData): PadsEvent | null {
        // Pads use slow, smooth hand movements
        const hand = data.leftHand || data.rightHand;

        if (!hand) {
            if (this.isPlaying) {
                this.isPlaying = false;
                return {
                    type: 'release',
                    intensity: 0,
                    position: this.lastPosition,
                    fingers: 0,
                    timestamp: data.timestamp
                };
            }
            return null;
        }

        // Count extended fingers (affects pad texture)
        const extendedFingers = Object.values(hand.fingers)
            .filter(f => f.extended).length;

        // Smooth the position for ambient feel
        const targetX = hand.fingers.index.tip.x;
        const targetY = hand.fingers.index.tip.y;

        this.lastPosition = {
            x: this.lastPosition.x + (targetX - this.lastPosition.x) * this.SMOOTHING,
            y: this.lastPosition.y + (targetY - this.lastPosition.y) * this.SMOOTHING
        };

        // Calculate intensity from how open the hand is
        const intensity = Math.min(1, extendedFingers / 5);

        const wasPlaying = this.isPlaying;
        this.isPlaying = extendedFingers >= 2; // Need at least 2 fingers extended

        let type: PadsEvent['type'] = 'sustain';
        if (!wasPlaying && this.isPlaying) {
            type = 'start';
        } else if (!this.isPlaying && wasPlaying) {
            type = 'release';
        }

        return {
            type,
            intensity,
            position: this.lastPosition,
            fingers: extendedFingers,
            timestamp: data.timestamp
        };
    }
}

// ========== EXPORT ALL HANDLERS ==========
export interface InstrumentGestureHandlers {
    drums: DrumGestureHandler;
    piano: PianoGestureHandler;
    guitar: GuitarGestureHandler;
    theremin: ThereminGestureHandler;
    strings: StringsGestureHandler;
    pads: PadsGestureHandler;
}

export function createInstrumentHandlers(): InstrumentGestureHandlers {
    return {
        drums: new DrumGestureHandler(),
        piano: new PianoGestureHandler(),
        guitar: new GuitarGestureHandler(),
        theremin: new ThereminGestureHandler(),
        strings: new StringsGestureHandler(),
        pads: new PadsGestureHandler()
    };
}

