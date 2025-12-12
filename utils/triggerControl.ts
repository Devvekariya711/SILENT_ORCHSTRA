/**
 * Trigger Control Utilities
 * Implements cooldown timers and note retrigger detection
 * Based on patterns from Hexpress and Paper-Piano repos
 */

// ===============================
// COOLDOWN TIMER SYSTEM
// Prevents accidental double-triggers
// ===============================

interface TriggerState {
    lastTriggerTime: number;
    lastKeyIndex: number | null;
    buffer: boolean[];  // Last N frames of touch state
}

const triggerStates: Map<string, TriggerState> = new Map();

// Cooldown settings per instrument (milliseconds)
export const COOLDOWN_MS: Record<string, number> = {
    piano: 50,      // Fast for piano trills
    drums: 80,      // Slightly slower for drums
    guitar: 100,    // Slower for strums
    bass: 120,      // Slowest for bass plucks
    theremin: 0,    // No cooldown - continuous
    strings: 150,   // Slow for bowing
    pads: 200,      // Very slow for ambient pads
    default: 100
};

// Frame buffer size for debouncing
const BUFFER_SIZE = 3;

/**
 * Get or create trigger state for an ID
 */
function getState(id: string): TriggerState {
    if (!triggerStates.has(id)) {
        triggerStates.set(id, {
            lastTriggerTime: 0,
            lastKeyIndex: null,
            buffer: Array(BUFFER_SIZE).fill(false)
        });
    }
    return triggerStates.get(id)!;
}

/**
 * Check if a trigger is allowed based on cooldown timer
 * Returns true if enough time has passed since last trigger
 */
export function canTrigger(id: string, instrumentType: string = 'default'): boolean {
    const state = getState(id);
    const now = performance.now();
    const cooldown = COOLDOWN_MS[instrumentType] || COOLDOWN_MS.default;

    if (now - state.lastTriggerTime >= cooldown) {
        state.lastTriggerTime = now;
        return true;
    }
    return false;
}

/**
 * Check if a trigger is allowed AND record the trigger
 * Use this when you want to automatically update the timer
 */
export function tryTrigger(id: string, instrumentType: string = 'default'): boolean {
    const allowed = canTrigger(id, instrumentType);
    if (allowed) {
        recordTrigger(id);
    }
    return allowed;
}

/**
 * Record a trigger without checking cooldown
 */
export function recordTrigger(id: string): void {
    const state = getState(id);
    state.lastTriggerTime = performance.now();
}

// ===============================
// NOTE RETRIGGER DETECTION
// Only triggers when key/note changes
// ===============================

/**
 * Check if a note should be retriggered based on key change
 * Returns true if the key index has changed from last time
 */
export function shouldRetrigger(id: string, currentKeyIndex: number): boolean {
    const state = getState(id);
    const shouldTrigger = state.lastKeyIndex !== currentKeyIndex;
    state.lastKeyIndex = currentKeyIndex;
    return shouldTrigger;
}

/**
 * Combined check: cooldown AND retrigger
 * Most common use case - only trigger if:
 * 1. Key has changed from last trigger
 * 2. Enough time has passed since last trigger
 */
export function shouldTriggerNote(
    id: string,
    currentKeyIndex: number,
    instrumentType: string = 'default'
): boolean {
    const state = getState(id);
    const keyChanged = state.lastKeyIndex !== currentKeyIndex;
    const cooldownPassed = canTrigger(id, instrumentType);

    if (keyChanged && cooldownPassed) {
        state.lastKeyIndex = currentKeyIndex;
        state.lastTriggerTime = performance.now();
        return true;
    }
    return false;
}

// ===============================
// FRAME BUFFER DEBOUNCING
// Only trigger if NOT touched in previous N frames
// ===============================

/**
 * Update the touch buffer and check if trigger is allowed
 * Based on Paper-Piano's debouncing pattern
 */
export function updateBuffer(id: string, isTouching: boolean): void {
    const state = getState(id);
    state.buffer.push(isTouching);
    if (state.buffer.length > BUFFER_SIZE) {
        state.buffer.shift();
    }
}

/**
 * Check if a fresh trigger is allowed based on buffer
 * Returns true if NOT touching in any of the previous frames
 */
export function isCleanTrigger(id: string): boolean {
    const state = getState(id);
    return !state.buffer.some(touched => touched);
}

/**
 * Combined buffer check with trigger
 */
export function shouldTriggerWithBuffer(
    id: string,
    isTouching: boolean,
    instrumentType: string = 'default'
): boolean {
    const wasClean = isCleanTrigger(id);
    updateBuffer(id, isTouching);

    if (isTouching && wasClean && canTrigger(id, instrumentType)) {
        return true;
    }
    return false;
}

// ===============================
// VELOCITY THRESHOLD
// Only trigger if hand is moving fast enough
// ===============================

export const MIN_VELOCITY_THRESHOLD = 0.02;  // Minimum movement per frame
export const MIN_TAP_VELOCITY = 0.5;         // Minimum downward velocity for tap

/**
 * Check if velocity is above threshold for triggering
 */
export function hasEnoughVelocity(velocity: number, threshold: number = MIN_VELOCITY_THRESHOLD): boolean {
    return Math.abs(velocity) >= threshold;
}

/**
 * Check if this is a valid tap (downward motion above threshold)
 */
export function isValidTap(velocityY: number, threshold: number = MIN_TAP_VELOCITY): boolean {
    return velocityY >= threshold;  // Positive Y = moving down (in screen coords)
}

// ===============================
// CLEANUP
// ===============================

/**
 * Clear trigger state for an ID
 */
export function clearTriggerState(id: string): void {
    triggerStates.delete(id);
}

/**
 * Clear all trigger states
 */
export function clearAllTriggerStates(): void {
    triggerStates.clear();
}

/**
 * Get current cooldown remaining (for UI display)
 */
export function getCooldownRemaining(id: string, instrumentType: string = 'default'): number {
    const state = getState(id);
    const cooldown = COOLDOWN_MS[instrumentType] || COOLDOWN_MS.default;
    const elapsed = performance.now() - state.lastTriggerTime;
    return Math.max(0, cooldown - elapsed);
}
