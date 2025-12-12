/**
 * Synth Pads Visual Component
 * Hexagonal pad grid inspired by Hexpress
 */

import React, { useState } from 'react';

interface PadsVisualProps {
    activePad: number | null;
    onPadPress: (padIndex: number, velocity: number) => void;
    canvasWidth: number;
    canvasHeight: number;
}

export const PadsVisual: React.FC<PadsVisualProps> = ({
    activePad,
    onPadPress,
    canvasWidth,
    canvasHeight
}) => {
    const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());

    // 4x4 grid of pads
    const pads = [
        // Row 1
        { x: 100, y: 100, color: '#4CAF50', label: '1' },
        { x: 250, y: 100, color: '#F44336', label: '2' },
        { x: 400, y: 100, color: '#2196F3', label: '3' },
        { x: 550, y: 100, color: '#FF9800', label: '4' },
        // Row 2
        { x: 100, y: 220, color: '#9C27B0', label: '5' },
        { x: 250, y: 220, color: '#00BCD4', label: '6' },
        { x: 400, y: 220, color: '#FFEB3B', label: '7' },
        { x: 550, y: 220, color: '#795548', label: '8' },
        // Row 3
        { x: 100, y: 340, color: '#E91E63', label: '9' },
        { x: 250, y: 340, color: '#3F51B5', label: '10' },
        { x: 400, y: 340, color: '#8BC34A', label: '11' },
        { x: 550, y: 340, color: '#FF5722', label: '12' },
        // Row 4
        { x: 100, y: 460, color: '#607D8B', label: '13' },
        { x: 250, y: 460, color: '#009688', label: '14' },
        { x: 400, y: 460, color: '#FFC107', label: '15' },
        { x: 550, y: 460, color: '#673AB7', label: '16' }
    ];

    const handlePadClick = (padIndex: number) => {
        const velocity = 0.8;
        onPadPress(padIndex, velocity);

        setPressedPads(prev => new Set(prev).add(padIndex));
        setTimeout(() => {
            setPressedPads(prev => {
                const next = new Set(prev);
                next.delete(padIndex);
                return next;
            });
        }, 200);
    };

    // Hexagon path
    const hexPath = "M60,0 L120,35 L120,105 L60,140 L0,105 L0,35 Z";

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 700 600"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                opacity: 0.9
            }}
        >
            <defs>
                {pads.map((pad, i) => (
                    <linearGradient key={`grad-${i}`} id={`padGrad${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={pad.color} stopOpacity="1" />
                        <stop offset="100%" stopColor={pad.color} stopOpacity="0.6" />
                    </linearGradient>
                ))}

                <filter id="padGlow">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {pads.map((pad, index) => {
                const isActive = activePad === index;
                const isPressed = pressedPads.has(index);
                const scale = isPressed ? 0.95 : 1;

                return (
                    <g
                        key={`pad-${index}`}
                        transform={`translate(${pad.x}, ${pad.y}) scale(${scale})`}
                        style={{
                            cursor: 'pointer',
                            transformOrigin: '60px 70px',
                            transition: 'transform 0.1s ease-out'
                        }}
                        onClick={() => handlePadClick(index)}
                    >
                        {/* Outer hex (border) */}
                        <path
                            d={hexPath}
                            fill="none"
                            stroke={isActive ? '#FFFFFF' : pad.color}
                            strokeWidth={isActive ? 4 : 3}
                            filter={isActive ? 'url(#padGlow)' : undefined}
                        >
                            {isActive && (
                                <animate
                                    attributeName="stroke-width"
                                    values="3;6;3"
                                    dur="0.6s"
                                    repeatCount="indefinite"
                                />
                            )}
                        </path>

                        {/* Inner hex (fill) */}
                        <path
                            d="M60,8 L110,38 L110,98 L60,128 L10,98 L10,38 Z"
                            fill={`url(#padGrad${index})`}
                            opacity={isPressed ? 0.8 : 1}
                        />

                        {/* Pad number */}
                        <text
                            x="60"
                            y="85"
                            textAnchor="middle"
                            fill="white"
                            fontSize="40"
                            fontWeight="bold"
                            opacity={isPressed ? 0.7 : 1}
                        >
                            {pad.label}
                        </text>

                        {/* Active pulse effect */}
                        {isActive && (
                            <path
                                d={hexPath}
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                opacity="0"
                            >
                                <animate
                                    attributeName="opacity"
                                    values="0.8;0"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                                <animateTransform
                                    attributeName="transform"
                                    type="scale"
                                    values="1;1.2"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                            </path>
                        )}
                    </g>
                );
            })}

            {/* Title */}
            <text x="350" y="30" textAnchor="middle" fill="white" fontSize="20" opacity="0.7">
                SYNTH PADS
            </text>
        </svg>
    );
};

export default PadsVisual;
