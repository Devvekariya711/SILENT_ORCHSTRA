/**
 * Theremin Visual Component
 * Hexagonal electromagnetic field with glowing hand tracking
 */

import React from 'react';

interface ThereminVisualProps {
    handPosition: { x: number; y: number } | null;
    pitch: number; // 0-1
    volume: number; // 0-1
    canvasWidth: number;
    canvasHeight: number;
}

export const ThereminVisual: React.FC<ThereminVisualProps> = ({
    handPosition,
    pitch,
    volume,
    canvasWidth,
    canvasHeight
}) => {
    // Map pitch to color hue (0=cyan, 180=purple)
    const hue = pitch * 180;
    const glowRadius = 50 + pitch * 150;
    const glowOpacity = volume * 0.8;

    const handX = handPosition ? handPosition.x * canvasWidth : canvasWidth / 2;
    const handY = handPosition ? handPosition.y * canvasHeight : canvasHeight / 2;

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
                pointerEvents: 'none',
                opacity: 0.7
            }}
        >
            <defs>
                {/* Hexagonal pattern */}
                <pattern id="hexPattern" x="0" y="0" width="60" height="52"
                    patternUnits="userSpaceOnUse">
                    <path
                        d="M30,0 L52,13 L52,39 L30,52 L8,39 L8,13 Z"
                        fill="none"
                        stroke={`hsl(${hue}, 80%, 50%)`}
                        strokeWidth="0.5"
                        opacity="0.2"
                    >
                        <animate
                            attributeName="opacity"
                            values="0.1;0.3;0.1"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </path>
                </pattern>

                {/* Dynamic glow gradient */}
                <radialGradient id="handGlow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor={`hsl(${hue}, 100%, 70%)`} stopOpacity={glowOpacity} />
                    <stop offset="50%" stopColor={`hsl(${hue}, 90%, 50%)`} stopOpacity={glowOpacity * 0.5} />
                    <stop offset="100%" stopColor={`hsl(${hue}, 80%, 30%)`} stopOpacity="0" />
                </radialGradient>

                {/* Glow filter */}
                <filter id="thereminGlow">
                    <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Ripple filter */}
                <filter id="ripple">
                    <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" result="turbulence" />
                    <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
                </filter>
            </defs>

            {/* Background hexagonal field */}
            <rect width="800" height="600" fill="url(#hexPattern)" />

            {/* Vertical pitch indicator lines */}
            {[...Array(10)].map((_, i) => {
                const y = 60 + i * 48;
                const isNearHand = Math.abs(handY - y) < 30;
                return (
                    <line
                        key={`pitch-${i}`}
                        x1="50"
                        y1={y}
                        x2="750"
                        y2={y}
                        stroke={isNearHand ? `hsl(${hue}, 100%, 60%)` : '#00FFFF'}
                        strokeWidth={isNearHand ? 2 : 0.5}
                        opacity={isNearHand ? 0.8 : 0.2}
                    >
                        {isNearHand && (
                            <animate
                                attributeName="opacity"
                                values="0.5;1;0.5"
                                dur="0.5s"
                                repeatCount="indefinite"
                            />
                        )}
                    </line>
                );
            })}

            {/* Hand glow/cursor */}
            {handPosition && (
                <g transform={`translate(${handX}, ${handY})`}>
                    {/* Outer glow */}
                    <circle
                        cx="0"
                        cy="0"
                        r={glowRadius}
                        fill="url(#handGlow)"
                        filter="url(#thereminGlow)"
                    >
                        <animate
                            attributeName="r"
                            values={`${glowRadius * 0.9};${glowRadius * 1.1};${glowRadius * 0.9}`}
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>

                    {/* Center core */}
                    <circle
                        cx="0"
                        cy="0"
                        r="15"
                        fill={`hsl(${hue}, 100%, 70%)`}
                        opacity="0.9"
                    />

                    {/* Ripple rings */}
                    <circle
                        cx="0"
                        cy="0"
                        r="30"
                        fill="none"
                        stroke={`hsl(${hue}, 100%, 60%)`}
                        strokeWidth="2"
                        opacity="0"
                    >
                        <animate
                            attributeName="r"
                            values="15;100"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.8;0"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </g>
            )}

            {/* Pitch and Volume indicators */}
            <g transform="translate(700, 50)">
                <text x="0" y="0" fill="white" fontSize="12" opacity="0.7">PITCH</text>
                <rect x="0" y="10" width="20" height="200" fill="none" stroke="white" strokeWidth="1" />
                <rect
                    x="0"
                    y={10 + (1 - pitch) * 200}
                    width="20"
                    height={pitch * 200}
                    fill={`hsl(${hue}, 100%, 50%)`}
                    opacity="0.6"
                />

                <text x="0" y="230" fill="white" fontSize="12" opacity="0.7">VOLUME</text>
                <rect x="0" y="240" width="20" height="100" fill="none" stroke="white" strokeWidth="1" />
                <rect
                    x="0"
                    y={240 + (1 - volume) * 100}
                    width="20"
                    height={volume * 100}
                    fill="#00FFFF"
                    opacity="0.6"
                />
            </g>
        </svg>
    );
};

export default ThereminVisual;
