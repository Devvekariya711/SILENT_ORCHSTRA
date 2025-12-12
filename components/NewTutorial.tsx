/**
 * INSTRUMENT-SPECIFIC TUTORIAL
 * Each instrument has its OWN tutorial style:
 * - Piano: Shows which finger (1-5) on which hand
 * - Drums: Shows which drum to hit (Hi-Hat, Snare, Kick, etc.)
 * - Guitar: Shows strum direction and chord position
 * - Theremin: Shows hand height for pitch
 * - Pads: Shows which pad to press
 * - Strings/Bass: Similar to Guitar
 */

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { InstrumentRole } from '../types';
import { audioEngine } from '../utils/audio';

interface TutorialProps {
    instrument: InstrumentRole;
    isActive: boolean;
    canvasWidth: number;
    canvasHeight: number;
    onControlsRender?: (controls: React.ReactElement) => void;
}

// Generic step interface
interface TutorialStep {
    time: number;
    x: number;          // 0-1 position
    y: number;          // 0-1 position
    label: string;      // What to show (e.g., "HIT SNARE" or "STRUM DOWN")
}

// PIANO Tutorial Steps
const PIANO_STEPS: TutorialStep[] = [
    { time: 0, x: 0.6, y: 0.4, label: 'Right Index' },
    { time: 400, x: 0.55, y: 0.5, label: 'Right Thumb' },
    { time: 800, x: 0.6, y: 0.4, label: 'Right Index' },
    { time: 1200, x: 0.7, y: 0.7, label: 'Right Middle' },
    { time: 1600, x: 0.35, y: 0.35, label: 'Left Index' },
    { time: 2000, x: 0.3, y: 0.3, label: 'Left Middle' },
];

// DRUMS Tutorial Steps
const DRUMS_STEPS: TutorialStep[] = [
    { time: 0, x: 0.3, y: 0.3, label: 'HIT HI-HAT' },
    { time: 400, x: 0.5, y: 0.5, label: 'HIT SNARE' },
    { time: 800, x: 0.7, y: 0.7, label: 'HIT KICK' },
    { time: 1200, x: 0.5, y: 0.5, label: 'HIT SNARE' },
    { time: 1600, x: 0.3, y: 0.3, label: 'HIT HI-HAT' },
    { time: 2000, x: 0.8, y: 0.4, label: 'HIT CRASH' },
];

// GUITAR Tutorial Steps
const GUITAR_STEPS: TutorialStep[] = [
    { time: 0, x: 0.5, y: 0.3, label: 'STRUM DOWN ↓' },
    { time: 500, x: 0.5, y: 0.4, label: 'STRUM UP ↑' },
    { time: 1000, x: 0.5, y: 0.3, label: 'STRUM DOWN ↓' },
    { time: 1500, x: 0.5, y: 0.5, label: 'STRUM DOWN ↓' },
    { time: 2000, x: 0.5, y: 0.4, label: 'STRUM UP ↑' },
];

// THEREMIN Tutorial Steps
const THEREMIN_STEPS: TutorialStep[] = [
    { time: 0, x: 0.5, y: 0.2, label: 'HIGH PITCH' },
    { time: 800, x: 0.5, y: 0.5, label: 'MIDDLE PITCH' },
    { time: 1600, x: 0.5, y: 0.8, label: 'LOW PITCH' },
    { time: 2400, x: 0.5, y: 0.5, label: 'MIDDLE PITCH' },
];

// PADS Tutorial Steps
const PADS_STEPS: TutorialStep[] = [
    { time: 0, x: 0.3, y: 0.3, label: 'PAD 1' },
    { time: 400, x: 0.7, y: 0.3, label: 'PAD 2' },
    { time: 800, x: 0.3, y: 0.7, label: 'PAD 3' },
    { time: 1200, x: 0.7, y: 0.7, label: 'PAD 4' },
    { time: 1600, x: 0.5, y: 0.5, label: 'PAD 5' },
];

// Get steps based on instrument
const getStepsForInstrument = (instrument: InstrumentRole): TutorialStep[] => {
    switch (instrument) {
        case InstrumentRole.PIANO:
            return PIANO_STEPS;
        case InstrumentRole.DRUMS:
            return DRUMS_STEPS;
        case InstrumentRole.GUITAR:
        case InstrumentRole.BASS:
            return GUITAR_STEPS;
        case InstrumentRole.THEREMIN:
            return THEREMIN_STEPS;
        case InstrumentRole.PADS:
            return PADS_STEPS;
        case InstrumentRole.STRINGS:
            return GUITAR_STEPS; // Similar to guitar
        default:
            return PIANO_STEPS;
    }
};

// Get instrument name
const getInstrumentName = (instrument: InstrumentRole): string => {
    switch (instrument) {
        case InstrumentRole.PIANO: return '🎹 Piano';
        case InstrumentRole.DRUMS: return '🥁 Drums';
        case InstrumentRole.GUITAR: return '🎸 Guitar';
        case InstrumentRole.BASS: return '🎸 Bass';
        case InstrumentRole.THEREMIN: return '👋 Theremin';
        case InstrumentRole.PADS: return '🎛️ Pads';
        case InstrumentRole.STRINGS: return '🎻 Strings';
        default: return '🎵 Tutorial';
    }
};

const NewTutorial: React.FC<TutorialProps> = ({
    instrument,
    isActive,
    canvasWidth,
    canvasHeight,
    onControlsRender
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
    const startTimeRef = useRef<number>(0);
    const animationRef = useRef<number>(0);

    const steps = getStepsForInstrument(instrument);

    useEffect(() => {
        if (isActive) {
            audioEngine.initialize();
        }
    }, [isActive]);

    const startTutorial = async () => {
        await Tone.start();
        setIsPlaying(true);
        startTimeRef.current = performance.now();

        const animate = () => {
            const elapsed = performance.now() - startTimeRef.current;

            const active = steps.find(
                step => elapsed >= step.time && elapsed <= step.time + 350
            );
            setCurrentStep(active || null);

            steps.forEach(step => {
                if (elapsed >= step.time && elapsed <= step.time + 50) {
                    audioEngine.triggerNote(instrument, 0.9, step.y, step.x);
                }
            });

            const maxTime = Math.max(...steps.map(s => s.time)) + 1000;
            if (elapsed >= maxTime) {
                startTimeRef.current = performance.now();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const stopTutorial = () => {
        setIsPlaying(false);
        cancelAnimationFrame(animationRef.current);
        setCurrentStep(null);
    };

    useEffect(() => {
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    // Render controls
    useEffect(() => {
        if (!isActive || !onControlsRender) return;

        onControlsRender(
            <div style={{
                background: 'rgba(0, 0, 0, 0.9)',
                borderRadius: 16,
                padding: '20px 30px',
                border: '2px solid #22d3ee',
                color: 'white',
                textAlign: 'center'
            }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: 22 }}>
                    {getInstrumentName(instrument)} Tutorial
                </h3>

                <button
                    onClick={isPlaying ? stopTutorial : startTutorial}
                    style={{
                        padding: '12px 30px',
                        background: isPlaying ? '#ef4444' : '#22d3ee',
                        border: 'none',
                        borderRadius: 10,
                        color: isPlaying ? 'white' : 'black',
                        fontSize: 18,
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    {isPlaying ? '⏹️ Stop' : '▶️ Start'}
                </button>
            </div>
        );
    }, [isActive, isPlaying, instrument, onControlsRender]);

    if (!isActive) return null;

    return (
        <svg
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
                overflow: 'visible'
            }}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {currentStep && (
                <>
                    {/* CLEAN WHITE/CYAN TEXT - MIDDLE OF SCREEN */}
                    <text
                        x={canvasWidth / 2}
                        y={canvasHeight / 2 - 80}
                        textAnchor="middle"
                        fill="white"
                        fontSize={50}
                        fontWeight="bold"
                        style={{ stroke: '#22d3ee', strokeWidth: 2 }}
                    >
                        {currentStep.label}
                    </text>

                    {/* TARGET CIRCLE - CYAN */}
                    <circle
                        cx={currentStep.x * canvasWidth}
                        cy={currentStep.y * canvasHeight}
                        r="100"
                        fill="rgba(34, 211, 238, 0.15)"
                        stroke="#22d3ee"
                        strokeWidth="6"
                    >
                        <animate
                            attributeName="r"
                            values="80;120;80"
                            dur="1s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* CENTER DOT */}
                    <circle
                        cx={currentStep.x * canvasWidth}
                        cy={currentStep.y * canvasHeight}
                        r="15"
                        fill="#22d3ee"
                    />

                    {/* TAP/ACTION TEXT */}
                    <text
                        x={currentStep.x * canvasWidth}
                        y={currentStep.y * canvasHeight + 140}
                        textAnchor="middle"
                        fill="white"
                        fontSize={35}
                        fontWeight="bold"
                        style={{ stroke: 'black', strokeWidth: 2 }}
                    >
                        TAP
                    </text>
                </>
            )}
        </svg>
    );
};

export default NewTutorial;
