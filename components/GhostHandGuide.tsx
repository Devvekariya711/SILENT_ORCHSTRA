/**
 * Ghost Hand Guide - Visual hand overlay (CLEANER VERSION)
 * - Ghost hands appear ONLY in the video preview
 * - Controls are OUTSIDE the preview area
 * - AI plays real musical notes using Tone.js
 */

import React, { useState, useEffect, useRef } from 'react';
import { InstrumentRole } from '../types';
import * as Tone from 'tone';

interface GhostHandGuideProps {
    instrument: InstrumentRole;
    isActive: boolean;
    canvasWidth: number;
    canvasHeight: number;
    onControlsRender?: (controls: React.ReactElement) => void;
}

// Real musical notes with Tone.js
interface MelodyNote {
    time: number;
    handX: number;
    handY: number;
    gesture: 'tap' | 'strum' | 'hold' | 'swipe';
    duration: number;
    note: string;          // Real Tone.js note (e.g., "C4", "D4", "E4")
    velocity: number;
}

interface Melody {
    id: string;
    name: string;
    artist: string;
    bpm: number;
    notes: MelodyNote[];
}

// Famous melodies with REAL musical notes
const MELODIES: Record<string, Melody> = {
    carol: {
        id: 'carol',
        name: '🔔 Carol of the Bells',
        artist: 'Ukrainian Carol',
        bpm: 150,
        notes: [
            // G - F# - G - E pattern (the famous motif!)
            { time: 0, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, note: 'G4', velocity: 0.8 },
            { time: 400, handX: 0.45, handY: 0.35, gesture: 'tap', duration: 200, note: 'F#4', velocity: 0.7 },
            { time: 800, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, note: 'G4', velocity: 0.8 },
            { time: 1200, handX: 0.5, handY: 0.5, gesture: 'tap', duration: 400, note: 'E4', velocity: 0.9 },
            // Repeat
            { time: 1600, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, note: 'G4', velocity: 0.8 },
            { time: 2000, handX: 0.45, handY: 0.35, gesture: 'tap', duration: 200, note: 'F#4', velocity: 0.7 },
            { time: 2400, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, note: 'G4', velocity: 0.8 },
            { time: 2800, handX: 0.5, handY: 0.5, gesture: 'tap', duration: 400, note: 'E4', velocity: 0.9 },
            // Ascending phrase
            { time: 3200, handX: 0.35, handY: 0.25, gesture: 'tap', duration: 200, note: 'B4', velocity: 0.75 },
            { time: 3600, handX: 0.35, handY: 0.25, gesture: 'tap', duration: 200, note: 'B4', velocity: 0.75 },
            { time: 4000, handX: 0.3, handY: 0.2, gesture: 'tap', duration: 200, note: 'C5', velocity: 0.85 },
            { time: 4400, handX: 0.35, handY: 0.25, gesture: 'hold', duration: 600, note: 'B4', velocity: 0.95 },
        ]
    },
    kgf: {
        id: 'kgf',
        name: '⚔️ KGF Theme',
        artist: 'Ravi Basrur',
        bpm: 90,
        notes: [
            // Heavy, dramatic E minor
            { time: 0, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, note: 'E2', velocity: 1.0 },
            { time: 667, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, note: 'E2', velocity: 1.0 },
            { time: 1333, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, note: 'E2', velocity: 1.0 },
            { time: 2000, handX: 0.3, handY: 0.4, gesture: 'tap', duration: 200, note: 'G3', velocity: 0.9 },
            // Second phrase
            { time: 2667, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, note: 'E2', velocity: 1.0 },
            { time: 3333, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, note: 'D3', velocity: 0.95 },
            { time: 4000, handX: 0.7, handY: 0.4, gesture: 'tap', duration: 200, note: 'G3', velocity: 0.9 },
            { time: 4667, handX: 0.5, handY: 0.8, gesture: 'hold', duration: 500, note: 'E2', velocity: 1.0 },
        ]
    },
    wednesday: {
        id: 'wednesday',
        name: '🖤 Paint It Black',
        artist: 'Wednesday Theme',
        bpm: 120,
        notes: [
            // Descending then ascending cello line
            { time: 0, handX: 0.5, handY: 0.2, gesture: 'hold', duration: 250, note: 'E4', velocity: 0.7 },
            { time: 250, handX: 0.5, handY: 0.3, gesture: 'hold', duration: 250, note: 'D4', velocity: 0.72 },
            { time: 500, handX: 0.5, handY: 0.4, gesture: 'hold', duration: 250, note: 'C4', velocity: 0.75 },
            { time: 750, handX: 0.5, handY: 0.5, gesture: 'hold', duration: 250, note: 'B3', velocity: 0.78 },
            { time: 1000, handX: 0.5, handY: 0.6, gesture: 'hold', duration: 250, note: 'A3', velocity: 0.8 },
            { time: 1250, handX: 0.5, handY: 0.5, gesture: 'hold', duration: 250, note: 'B3', velocity: 0.78 },
            { time: 1500, handX: 0.5, handY: 0.4, gesture: 'hold', duration: 500, note: 'C4', velocity: 0.95 },
            // Dark accent
            { time: 2000, handX: 0.5, handY: 0.7, gesture: 'tap', duration: 300, note: 'E3', velocity: 1.0 },
        ]
    },
    tara: {
        id: 'tara',
        name: '🎪 Tara Rum Pum',
        artist: 'Popular Melody',
        bpm: 100,
        notes: [
            // Ta-ra-ra-ra-ra - Indian classical inspired
            { time: 0, handX: 0.3, handY: 0.4, gesture: 'tap', duration: 200, note: 'D4', velocity: 0.8 },
            { time: 300, handX: 0.4, handY: 0.45, gesture: 'tap', duration: 200, note: 'E4', velocity: 0.7 },
            { time: 600, handX: 0.5, handY: 0.5, gesture: 'tap', duration: 200, note: 'F#4', velocity: 0.75 },
            { time: 900, handX: 0.6, handY: 0.45, gesture: 'tap', duration: 200, note: 'E4', velocity: 0.7 },
            { time: 1200, handX: 0.7, handY: 0.4, gesture: 'tap', duration: 200, note: 'D4', velocity: 0.8 },
            // Big finish
            { time: 1800, handX: 0.5, handY: 0.3, gesture: 'hold', duration: 600, note: 'A4', velocity: 0.95 },
        ]
    }
};

const GhostHandGuide: React.FC<GhostHandGuideProps> = ({
    instrument,
    isActive,
    canvasWidth,
    canvasHeight,
    onControlsRender
}) => {
    const [currentMelody, setCurrentMelody] = useState<Melody>(MELODIES.carol);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeNotes, setActiveNotes] = useState<MelodyNote[]>([]);
    const startTimeRef = useRef<number>(0);
    const animationRef = useRef<number>(0);
    const synthRef = useRef<Tone.Synth | null>(null);

    const melodyList = Object.values(MELODIES);
    const [melodyIndex, setMelodyIndex] = useState(0);

    // Initialize Tone.js synth
    useEffect(() => {
        synthRef.current = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();

        return () => {
            synthRef.current?.dispose();
        };
    }, []);

    // Start playing the melody
    const startMelody = async () => {
        await Tone.start(); // Ensure Tone.js is ready
        setIsPlaying(true);
        startTimeRef.current = performance.now();
        setCurrentTime(0);

        const animate = () => {
            const elapsed = performance.now() - startTimeRef.current;
            setCurrentTime(elapsed);

            // Find active notes
            const active = currentMelody.notes.filter(note =>
                elapsed >= note.time && elapsed <= note.time + note.duration
            );
            setActiveNotes(active);

            // Trigger audio using REAL Tone.js notes!
            currentMelody.notes.forEach(note => {
                if (elapsed >= note.time && elapsed <= note.time + 50) {
                    synthRef.current?.triggerAttackRelease(
                        note.note,          // Real note! (e.g., "C4", "D4")
                        note.duration / 1000,
                        undefined,
                        note.velocity
                    );
                }
            });

            // Check if melody is complete
            const maxTime = Math.max(...currentMelody.notes.map(n => n.time + n.duration));
            if (elapsed >= maxTime + 500) {
                setIsPlaying(false);
                // Auto-advance to next melody
                const next = (melodyIndex + 1) % melodyList.length;
                setMelodyIndex(next);
                setCurrentMelody(melodyList[next]);
            } else {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const stopMelody = () => {
        setIsPlaying(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Render controls OUTSIDE preview (parent component handles)
    useEffect(() => {
        if (!isActive || !onControlsRender) return;

        const controls = (
            <div style={styles.externalControls}>
                <div style={styles.songInfo}>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>{currentMelody.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{currentMelody.artist}</span>
                </div>

                <div style={styles.buttons}>
                    {!isPlaying ? (
                        <button onClick={startMelody} style={styles.playBtn}>
                            ▶️ Play
                        </button>
                    ) : (
                        <button onClick={stopMelody} style={styles.stopBtn}>
                            ⏹️ Stop
                        </button>
                    )}

                    <button
                        onClick={() => {
                            const next = (melodyIndex + 1) % melodyList.length;
                            setMelodyIndex(next);
                            setCurrentMelody(melodyList[next]);
                            stopMelody();
                        }}
                        style={styles.nextBtn}
                    >
                        ⏭️ Next Song
                    </button>
                </div>

                <div style={styles.hint}>
                    👻 Follow the glowing ghost hand in the preview! AI plays the notes for you ✨
                </div>
            </div>
        );

        onControlsRender(controls);
    }, [isActive, isPlaying, currentMelody, onControlsRender]);

    if (!isActive) return null;

    // ONLY render ghost hands - no controls in preview!
    return (
        <>
            <svg
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 100
                }}
            >
                {/* Ghost hands for active notes */}
                {activeNotes.map((note, i) => (
                    <g key={i}>
                        {/* Glowing circle */}
                        <circle
                            cx={note.handX * canvasWidth}
                            cy={note.handY * canvasHeight}
                            r={40 + note.velocity * 20}
                            fill="none"
                            stroke="rgba(34, 211, 238, 0.8)"
                            strokeWidth={3}
                            style={{
                                filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))',
                                animation: 'pulse 0.5s ease-in-out infinite'
                            }}
                        />

                        {/* Ghost hand icon */}
                        <GhostHandIcon
                            x={note.handX * canvasWidth}
                            y={note.handY * canvasHeight}
                            gesture={note.gesture}
                            scale={0.5 + note.velocity * 0.3}
                        />

                        {/* Note label */}
                        <text
                            x={note.handX * canvasWidth}
                            y={note.handY * canvasHeight - 60}
                            textAnchor="middle"
                            fill="white"
                            fontSize={14}
                            fontWeight="bold"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                        >
                            {note.note}
                        </text>

                        {/* Ripple on tap */}
                        {note.gesture === 'tap' && (
                            <circle
                                cx={note.handX * canvasWidth}
                                cy={note.handY * canvasHeight}
                                r={60}
                                fill="none"
                                stroke="rgba(34, 211, 238, 0.4)"
                                strokeWidth={2}
                                style={{ animation: 'ripple 0.5s ease-out' }}
                            />
                        )}
                    </g>
                ))}

                {/* Upcoming notes preview */}
                {currentMelody.notes
                    .filter(note => note.time > currentTime && note.time < currentTime + 1000)
                    .map((note, i) => {
                        const opacity = 1 - (note.time - currentTime) / 1000;
                        return (
                            <g key={`upcoming-${i}`}>
                                <circle
                                    cx={note.handX * canvasWidth}
                                    cy={note.handY * canvasHeight}
                                    r={25}
                                    fill={`rgba(255, 255, 255, ${opacity * 0.3})`}
                                    stroke={`rgba(255, 255, 255, ${opacity * 0.5})`}
                                    strokeWidth={1}
                                />
                                <text
                                    x={note.handX * canvasWidth}
                                    y={note.handY * canvasHeight - 30}
                                    textAnchor="middle"
                                    fill={`rgba(255, 255, 255, ${opacity * 0.6})`}
                                    fontSize={10}
                                >
                                    {note.note}
                                </text>
                            </g>
                        );
                    })}
            </svg>

            {/* CSS animations */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                }
                @keyframes ripple {
                    0% { r: 40; opacity: 0.8; }
                    100% { r: 80; opacity: 0; }
                }
            `}</style>
        </>
    );
};

// Realistic Ghost Hand with all 5 fingers visible
const GhostHandIcon: React.FC<{ x: number; y: number; gesture: string; scale: number }> = ({
    x, y, gesture, scale
}) => {
    // Different finger positions for different gestures
    const getFingerPositions = () => {
        switch (gesture) {
            case 'tap':
                // Index finger extended, others curled (tapping motion)
                return {
                    thumb: { x: -35, y: 15, angle: -45 },
                    index: { x: -10, y: -60, angle: 0, extended: true },
                    middle: { x: 5, y: -25, angle: 0, extended: false },
                    ring: { x: 18, y: -22, angle: 0, extended: false },
                    pinky: { x: 30, y: -18, angle: 0, extended: false }
                };
            case 'strum':
                // All fingers slightly spread (strumming motion)
                return {
                    thumb: { x: -40, y: 10, angle: -30 },
                    index: { x: -15, y: -55, angle: -15, extended: true },
                    middle: { x: 0, y: -60, angle: 0, extended: true },
                    ring: { x: 15, y: -55, angle: 15, extended: true },
                    pinky: { x: 28, y: -45, angle: 25, extended: true }
                };
            case 'hold':
                // Open palm with all fingers extended
                return {
                    thumb: { x: -45, y: 5, angle: -40 },
                    index: { x: -15, y: -65, angle: -10, extended: true },
                    middle: { x: 0, y: -70, angle: 0, extended: true },
                    ring: { x: 15, y: -65, angle: 10, extended: true },
                    pinky: { x: 28, y: -55, angle: 20, extended: true }
                };
            case 'swipe':
                // Flat hand for swiping
                return {
                    thumb: { x: -40, y: 20, angle: -60 },
                    index: { x: -12, y: -55, angle: -5, extended: true },
                    middle: { x: 2, y: -58, angle: 0, extended: true },
                    ring: { x: 16, y: -55, angle: 5, extended: true },
                    pinky: { x: 28, y: -48, angle: 12, extended: true }
                };
            default:
                return {
                    thumb: { x: -35, y: 15, angle: -45 },
                    index: { x: -10, y: -55, angle: 0, extended: true },
                    middle: { x: 5, y: -55, angle: 0, extended: true },
                    ring: { x: 18, y: -50, angle: 0, extended: true },
                    pinky: { x: 30, y: -42, angle: 0, extended: true }
                };
        }
    };

    const fingers = getFingerPositions();
    const handScale = scale * 1.5; // Larger for visibility

    return (
        <g
            transform={`translate(${x}, ${y}) scale(${handScale})`}
            style={{ filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.9))' }}
        >
            {/* Palm */}
            <ellipse
                cx={0}
                cy={0}
                rx={30}
                ry={35}
                fill="rgba(34, 211, 238, 0.3)"
                stroke="rgba(34, 211, 238, 0.8)"
                strokeWidth={2}
            />

            {/* Thumb */}
            <g transform={`translate(${fingers.thumb.x}, ${fingers.thumb.y}) rotate(${fingers.thumb.angle})`}>
                <ellipse cx={0} cy={-12} rx={8} ry={18} fill="rgba(34, 211, 238, 0.35)" stroke="rgba(34, 211, 238, 0.8)" strokeWidth={1.5} />
                <circle cx={0} cy={-25} r={6} fill="rgba(255, 255, 255, 0.4)" /> {/* Fingertip */}
            </g>

            {/* Index Finger */}
            <g transform={`translate(${fingers.index.x}, 0) rotate(${fingers.index.angle})`}>
                <rect
                    x={-6}
                    y={fingers.index.extended ? -65 : -30}
                    width={12}
                    height={fingers.index.extended ? 65 : 30}
                    rx={6}
                    fill="rgba(34, 211, 238, 0.35)"
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth={1.5}
                />
                <circle cx={0} cy={fingers.index.extended ? -65 : -30} r={6} fill={fingers.index.extended ? "rgba(255, 200, 100, 0.8)" : "rgba(255, 255, 255, 0.4)"} />
            </g>

            {/* Middle Finger */}
            <g transform={`translate(${fingers.middle.x}, 0) rotate(${fingers.middle.angle})`}>
                <rect
                    x={-6}
                    y={fingers.middle.extended ? -70 : -30}
                    width={12}
                    height={fingers.middle.extended ? 70 : 30}
                    rx={6}
                    fill="rgba(34, 211, 238, 0.35)"
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth={1.5}
                />
                <circle cx={0} cy={fingers.middle.extended ? -70 : -30} r={6} fill="rgba(255, 255, 255, 0.4)" />
            </g>

            {/* Ring Finger */}
            <g transform={`translate(${fingers.ring.x}, 0) rotate(${fingers.ring.angle})`}>
                <rect
                    x={-6}
                    y={fingers.ring.extended ? -65 : -28}
                    width={12}
                    height={fingers.ring.extended ? 65 : 28}
                    rx={6}
                    fill="rgba(34, 211, 238, 0.35)"
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth={1.5}
                />
                <circle cx={0} cy={fingers.ring.extended ? -65 : -28} r={6} fill="rgba(255, 255, 255, 0.4)" />
            </g>

            {/* Pinky Finger */}
            <g transform={`translate(${fingers.pinky.x}, 0) rotate(${fingers.pinky.angle})`}>
                <rect
                    x={-5}
                    y={fingers.pinky.extended ? -55 : -25}
                    width={10}
                    height={fingers.pinky.extended ? 55 : 25}
                    rx={5}
                    fill="rgba(34, 211, 238, 0.35)"
                    stroke="rgba(34, 211, 238, 0.8)"
                    strokeWidth={1.5}
                />
                <circle cx={0} cy={fingers.pinky.extended ? -55 : -25} r={5} fill="rgba(255, 255, 255, 0.4)" />
            </g>

            {/* Wrist */}
            <rect
                x={-20}
                y={30}
                width={40}
                height={25}
                rx={8}
                fill="rgba(34, 211, 238, 0.25)"
                stroke="rgba(34, 211, 238, 0.6)"
                strokeWidth={1.5}
            />

            {/* Gesture indicator text */}
            <text
                x={0}
                y={70}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 0.9)"
                fontSize={10}
                fontWeight="bold"
            >
                {gesture.toUpperCase()}
            </text>
        </g>
    );
};

const styles: Record<string, React.CSSProperties> = {
    externalControls: {
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: '15px 25px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        border: '1px solid rgba(34, 211, 238, 0.3)',
        color: 'white'
    },
    songInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    buttons: {
        display: 'flex',
        gap: 10
    },
    playBtn: {
        padding: '8px 16px',
        background: '#22d3ee',
        border: 'none',
        borderRadius: 10,
        color: 'black',
        fontWeight: 700,
        cursor: 'pointer'
    },
    stopBtn: {
        padding: '8px 16px',
        background: '#ef4444',
        border: 'none',
        borderRadius: 10,
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer'
    },
    nextBtn: {
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 10,
        color: 'white',
        cursor: 'pointer'
    },
    hint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center'
    }
};

export default GhostHandGuide;
