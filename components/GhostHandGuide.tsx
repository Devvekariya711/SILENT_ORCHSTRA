/**
 * Ghost Hand Guide - Visual hand overlay that shows users where to move
 * AI plays the melody automatically, user follows the "ghost" hands
 * Makes users feel like musical geniuses from day 1!
 */

import React, { useState, useEffect, useRef } from 'react';
import { InstrumentRole } from '../types';
import { audioEngine } from '../utils/audio';

interface GhostHandGuideProps {
    instrument: InstrumentRole;
    isActive: boolean;
    canvasWidth: number;
    canvasHeight: number;
    onMelodyComplete?: () => void;
}

// Song melody definitions with hand positions
interface MelodyNote {
    time: number;           // Time in ms from start
    handX: number;          // Ghost hand X position (0-1)
    handY: number;          // Ghost hand Y position (0-1)
    gesture: 'tap' | 'strum' | 'hold' | 'swipe';
    duration: number;       // How long to show (ms)
    noteY?: number;         // Audio trigger Y position
    velocity?: number;      // Volume/intensity
}

interface Melody {
    id: string;
    name: string;
    artist: string;
    bpm: number;
    notes: MelodyNote[];
}

// Famous melodies with ghost hand choreography
const MELODIES: Record<string, Melody> = {
    carol: {
        id: 'carol',
        name: '🔔 Carol of the Bells',
        artist: 'Ukrainian Carol',
        bpm: 150,
        notes: [
            // G - F# - G - E pattern (first phrase)
            { time: 0, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, noteY: 0.3, velocity: 0.7 },
            { time: 400, handX: 0.45, handY: 0.35, gesture: 'tap', duration: 200, noteY: 0.35, velocity: 0.6 },
            { time: 800, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, noteY: 0.3, velocity: 0.7 },
            { time: 1200, handX: 0.5, handY: 0.5, gesture: 'tap', duration: 400, noteY: 0.5, velocity: 0.8 },
            // Repeat
            { time: 1600, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, noteY: 0.3, velocity: 0.7 },
            { time: 2000, handX: 0.45, handY: 0.35, gesture: 'tap', duration: 200, noteY: 0.35, velocity: 0.6 },
            { time: 2400, handX: 0.4, handY: 0.3, gesture: 'tap', duration: 200, noteY: 0.3, velocity: 0.7 },
            { time: 2800, handX: 0.5, handY: 0.5, gesture: 'tap', duration: 400, noteY: 0.5, velocity: 0.8 },
            // Second phrase - ascending
            { time: 3200, handX: 0.35, handY: 0.25, gesture: 'tap', duration: 200, noteY: 0.25, velocity: 0.7 },
            { time: 3600, handX: 0.35, handY: 0.25, gesture: 'tap', duration: 200, noteY: 0.25, velocity: 0.7 },
            { time: 4000, handX: 0.3, handY: 0.2, gesture: 'tap', duration: 200, noteY: 0.2, velocity: 0.8 },
            { time: 4400, handX: 0.35, handY: 0.25, gesture: 'hold', duration: 600, noteY: 0.25, velocity: 0.9 },
        ]
    },
    kgf: {
        id: 'kgf',
        name: '⚔️ KGF Theme',
        artist: 'Ravi Basrur',
        bpm: 90,
        notes: [
            // Powerful, dramatic hits - BOOM pattern
            { time: 0, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, noteY: 0.9, velocity: 1.0 },
            { time: 667, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, noteY: 0.9, velocity: 1.0 },
            { time: 1333, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, noteY: 0.9, velocity: 1.0 },
            { time: 2000, handX: 0.3, handY: 0.4, gesture: 'tap', duration: 200, noteY: 0.4, velocity: 0.8 },
            // Second phrase
            { time: 2667, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, noteY: 0.9, velocity: 1.0 },
            { time: 3333, handX: 0.5, handY: 0.8, gesture: 'tap', duration: 300, noteY: 0.9, velocity: 1.0 },
            { time: 4000, handX: 0.7, handY: 0.4, gesture: 'tap', duration: 200, noteY: 0.4, velocity: 0.8 },
            { time: 4667, handX: 0.5, handY: 0.8, gesture: 'hold', duration: 500, noteY: 0.9, velocity: 1.0 },
        ]
    },
    wednesday: {
        id: 'wednesday',
        name: '🖤 Paint It Black',
        artist: 'Wednesday Theme',
        bpm: 120,
        notes: [
            // Cello-like descending then ascending
            { time: 0, handX: 0.5, handY: 0.2, gesture: 'hold', duration: 250, noteY: 0.2, velocity: 0.6 },
            { time: 250, handX: 0.5, handY: 0.3, gesture: 'hold', duration: 250, noteY: 0.3, velocity: 0.65 },
            { time: 500, handX: 0.5, handY: 0.4, gesture: 'hold', duration: 250, noteY: 0.4, velocity: 0.7 },
            { time: 750, handX: 0.5, handY: 0.5, gesture: 'hold', duration: 250, noteY: 0.5, velocity: 0.75 },
            { time: 1000, handX: 0.5, handY: 0.6, gesture: 'hold', duration: 250, noteY: 0.6, velocity: 0.8 },
            { time: 1250, handX: 0.5, handY: 0.5, gesture: 'hold', duration: 250, noteY: 0.5, velocity: 0.75 },
            { time: 1500, handX: 0.5, handY: 0.4, gesture: 'hold', duration: 500, noteY: 0.4, velocity: 0.9 },
            // Dark accent
            { time: 2000, handX: 0.5, handY: 0.7, gesture: 'tap', duration: 300, noteY: 0.8, velocity: 1.0 },
        ]
    },
    tara: {
        id: 'tara',
        name: '🎪 Tara Rum Pum',
        artist: 'Popular Melody',
        bpm: 100,
        notes: [
            // Ta-ra-ra-ra-ra pattern - bouncy and fun
            { time: 0, handX: 0.3, handY: 0.4, gesture: 'tap', duration: 200, noteY: 0.4, velocity: 0.7 },
            { time: 300, handX: 0.4, handY: 0.45, gesture: 'tap', duration: 200, noteY: 0.45, velocity: 0.6 },
            { time: 600, handX: 0.5, handY: 0.5, gesture: 'tap', duration: 200, noteY: 0.5, velocity: 0.65 },
            { time: 900, handX: 0.6, handY: 0.45, gesture: 'tap', duration: 200, noteY: 0.45, velocity: 0.6 },
            { time: 1200, handX: 0.7, handY: 0.4, gesture: 'tap', duration: 200, noteY: 0.4, velocity: 0.7 },
            // Big finish
            { time: 1800, handX: 0.5, handY: 0.3, gesture: 'hold', duration: 600, noteY: 0.3, velocity: 0.9 },
        ]
    }
};

const GhostHandGuide: React.FC<GhostHandGuideProps> = ({
    instrument,
    isActive,
    canvasWidth,
    canvasHeight,
    onMelodyComplete
}) => {
    const [currentMelody, setCurrentMelody] = useState<Melody>(MELODIES.carol);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeNotes, setActiveNotes] = useState<MelodyNote[]>([]);
    const [showGuide, setShowGuide] = useState(true);
    const startTimeRef = useRef<number>(0);
    const animationRef = useRef<number>(0);

    // Get melody list
    const melodyList = Object.values(MELODIES);
    const [melodyIndex, setMelodyIndex] = useState(0);

    // Start playing the melody with ghost hands
    const startMelody = () => {
        setIsPlaying(true);
        startTimeRef.current = performance.now();
        setCurrentTime(0);

        // Start the animation loop
        const animate = () => {
            const elapsed = performance.now() - startTimeRef.current;
            setCurrentTime(elapsed);

            // Find active notes (within their time window)
            const active = currentMelody.notes.filter(note =>
                elapsed >= note.time && elapsed <= note.time + note.duration
            );
            setActiveNotes(active);

            // Trigger audio for notes that just started
            currentMelody.notes.forEach(note => {
                if (elapsed >= note.time && elapsed <= note.time + 50) { // 50ms window
                    // AI plays the note automatically!
                    audioEngine.triggerNote(
                        instrument,
                        note.velocity || 0.7,
                        note.noteY || 0.5,
                        0.5
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
                onMelodyComplete?.();
            } else {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Stop playing
    const stopMelody = () => {
        setIsPlaying(false);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Auto-start when active
    useEffect(() => {
        if (isActive && !isPlaying) {
            const timer = setTimeout(startMelody, 1000);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    if (!isActive || !showGuide) return null;

    return (
        <>
            {/* Ghost Hands Overlay */}
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
                {/* Render ghost hands for active notes */}
                {activeNotes.map((note, i) => (
                    <g key={i}>
                        {/* Glowing circle showing where to move */}
                        <circle
                            cx={note.handX * canvasWidth}
                            cy={note.handY * canvasHeight}
                            r={40 + (note.velocity || 0.7) * 20}
                            fill="none"
                            stroke="rgba(34, 211, 238, 0.8)"
                            strokeWidth={3}
                            style={{
                                filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.8))',
                                animation: 'pulse 0.5s ease-in-out infinite'
                            }}
                        />

                        {/* Ghost hand shape */}
                        <GhostHandIcon
                            x={note.handX * canvasWidth}
                            y={note.handY * canvasHeight}
                            gesture={note.gesture}
                            scale={0.5 + (note.velocity || 0.7) * 0.3}
                        />

                        {/* Ripple effect on tap */}
                        {note.gesture === 'tap' && (
                            <circle
                                cx={note.handX * canvasWidth}
                                cy={note.handY * canvasHeight}
                                r={60}
                                fill="none"
                                stroke="rgba(34, 211, 238, 0.4)"
                                strokeWidth={2}
                                style={{
                                    animation: 'ripple 0.5s ease-out'
                                }}
                            />
                        )}
                    </g>
                ))}

                {/* Upcoming notes preview (faded) */}
                {currentMelody.notes
                    .filter(note => note.time > currentTime && note.time < currentTime + 1000)
                    .map((note, i) => {
                        const opacity = 1 - (note.time - currentTime) / 1000;
                        return (
                            <circle
                                key={`upcoming-${i}`}
                                cx={note.handX * canvasWidth}
                                cy={note.handY * canvasHeight}
                                r={25}
                                fill={`rgba(255, 255, 255, ${opacity * 0.3})`}
                                stroke={`rgba(255, 255, 255, ${opacity * 0.5})`}
                                strokeWidth={1}
                            />
                        );
                    })}
            </svg>

            {/* Song info and controls */}
            <div style={styles.controlPanel}>
                <div style={styles.songInfo}>
                    <span style={{ fontSize: 20 }}>{currentMelody.name}</span>
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

                    <button
                        onClick={() => setShowGuide(false)}
                        style={styles.hideBtn}
                    >
                        Hide Guide
                    </button>
                </div>

                <div style={styles.hint}>
                    👻 Follow the ghost hand! AI plays the music for you ✨
                </div>
            </div>

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

// Ghost hand icon SVG component
const GhostHandIcon: React.FC<{ x: number; y: number; gesture: string; scale: number }> = ({
    x, y, gesture, scale
}) => {
    // Pointing hand for tap/strum
    const handPath = gesture === 'hold'
        ? "M10,0 L10,20 M5,5 L15,5 M5,10 L15,10" // Open palm lines
        : "M0,15 L5,10 L5,0 L7,0 L7,8 L9,8 L9,3 L11,3 L11,8 L13,8 L13,5 L15,5 L15,15 Z"; // Pointing finger

    return (
        <g transform={`translate(${x - 15 * scale}, ${y - 15 * scale}) scale(${scale})`}>
            <path
                d={handPath}
                fill="rgba(34, 211, 238, 0.6)"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth={1}
                style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))' }}
            />
        </g>
    );
};

const styles: Record<string, React.CSSProperties> = {
    controlPanel: {
        position: 'absolute',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: '15px 25px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        zIndex: 150,
        border: '1px solid rgba(34, 211, 238, 0.3)'
    },
    songInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white'
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
    hideBtn: {
        padding: '8px 16px',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer'
    },
    hint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center'
    }
};

export default GhostHandGuide;
