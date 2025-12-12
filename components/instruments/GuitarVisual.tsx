/**
 * Guitar Visual Component
 * Interactive SVG guitar with vibrating strings
 */

import React, { useState, useRef, useEffect } from 'react';

interface GuitarVisualProps {
    activeString: number | null;
    onStrum: (stringIndex: number, velocity: number) => void;
    canvasWidth: number;
    canvasHeight: number;
}

interface StringVibration {
    amplitude: number;
    time: number;
}

export const GuitarVisual: React.FC<GuitarVisualProps> = ({
    activeString,
    onStrum,
    canvasWidth,
    canvasHeight
}) => {
    const [vibrations, setVibrations] = useState<Record<number, StringVibration>>({});
    const animationFrame = useRef<number | undefined>(undefined);

    const strings = [
        { y: 200, thickness: 1, color: '#E0E0E0' },  // E (thinnest)
        { y: 240, thickness: 1.5, color: '#D0D0D0' }, // B
        { y: 280, thickness: 2, color: '#C0C0C0' },   // G
        { y: 320, thickness: 2.5, color: '#B0B0B0' }, // D
        { y: 360, thickness: 3, color: '#A0A0A0' },   // A
        { y: 400, thickness: 3.5, color: '#909090' }  // E (thickest)
    ];

    const triggerVibration = (stringIndex: number, velocity: number) => {
        setVibrations(prev => ({
            ...prev,
            [stringIndex]: {
                amplitude: velocity * 10,
                time: 0
            }
        }));
    };

    useEffect(() => {
        const animate = () => {
            setVibrations(prev => {
                const next: Record<number, StringVibration> = {};

                Object.entries(prev).forEach(([idx, vib]) => {
                    const newAmplitude = vib.amplitude * 0.97;

                    if (newAmplitude > 0.1) {
                        next[parseInt(idx)] = {
                            amplitude: newAmplitude,
                            time: vib.time + 0.1
                        };
                    }
                });

                return next;
            });

            animationFrame.current = requestAnimationFrame(animate);
        };

        animationFrame.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        };
    }, []);

    const getStringPath = (stringIndex: number, y: number) => {
        const vibration = vibrations[stringIndex];

        if (!vibration || vibration.amplitude < 0.1) {
            return `M 100 ${y} L 700 ${y}`;
        }

        // Sine wave vibration
        const frequency = 5 + stringIndex * 2;
        const points = [];
        for (let x = 100; x <= 700; x += 20) {
            const offset = vibration.amplitude *
                Math.sin((x / 100) * Math.PI * 2) *
                Math.sin(vibration.time * frequency) *
                Math.exp(-vibration.time * 0.3);
            points.push(`${x},${y + offset}`);
        }

        return `M ${points.join(' L ')}`;
    };

    const handleStringClick = (stringIndex: number) => {
        const velocity = 0.7;
        onStrum(stringIndex, velocity);
        triggerVibration(stringIndex, velocity);
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 600"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                opacity: 0.8
            }}
        >
            <defs>
                <linearGradient id="guitarBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B4513" />
                    <stop offset="50%" stopColor="#CD853F" />
                    <stop offset="100%" stopColor="#8B4513" />
                </linearGradient>

                <radialGradient id="soundHole" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="80%" stopColor="#1A1A1A" />
                    <stop offset="100%" stopColor="#2C2C2C" />
                </radialGradient>
            </defs>

            {/* Guitar body outline */}
            <ellipse cx="400" cy="300" rx="250" ry="200"
                fill="url(#guitarBody)" stroke="#654321" strokeWidth="3" />

            {/* Sound hole */}
            <circle cx="400" cy="300" r="60" fill="url(#soundHole)" />
            <circle cx="400" cy="300" r="55" fill="none" stroke="#8B4513" strokeWidth="2" />

            {/* Rosette decoration */}
            <circle cx="400" cy="300" r="65" fill="none" stroke="#CD853F"
                strokeWidth="1" strokeDasharray="5,5" opacity="0.6" />

            {/* Bridge */}
            <rect x="350" y="470" width="100" height="15" rx="3"
                fill="#2C1810" stroke="#000000" strokeWidth="1" />

            {/* Fret markers */}
            {[150, 250, 350, 450, 550, 650].map((x, i) => (
                <line key={`fret-${i}`} x1={x} y1="180" x2={x} y2="420"
                    stroke="#CCCCCC" strokeWidth="0.5" opacity="0.3" />
            ))}

            {/* Strings */}
            {strings.map((string, index) => (
                <g key={`string-${index}`}>
                    <path
                        d={getStringPath(index, string.y)}
                        stroke={activeString === index ? '#22d3ee' : string.color}
                        strokeWidth={string.thickness}
                        fill="none"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleStringClick(index)}
                    />
                    {/* Click target (wider) */}
                    <path
                        d={`M 100 ${string.y} L 700 ${string.y}`}
                        stroke="transparent"
                        strokeWidth="20"
                        fill="none"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleStringClick(index)}
                    />
                </g>
            ))}

            {/* String labels */}
            <text x="50" y="205" fill="white" fontSize="12">E</text>
            <text x="50" y="245" fill="white" fontSize="12">B</text>
            <text x="50" y="285" fill="white" fontSize="12">G</text>
            <text x="50" y="325" fill="white" fontSize="12">D</text>
            <text x="50" y="365" fill="white" fontSize="12">A</text>
            <text x="50" y="405" fill="white" fontSize="12">E</text>
        </svg>
    );
};

export default GuitarVisual;
