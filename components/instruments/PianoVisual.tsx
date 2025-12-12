/**
 * Piano Visual Component - IMPROVED
 * Interactive SVG piano keyboard with multi-touch support
 * Fixed: visibility, opacity, size, multi-touch
 */

import React, { useState } from 'react';

interface PianoVisualProps {
    activeKeys: Set<number>;
    onKeyPress: (keyIndex: number, velocity: number) => void;
    canvasWidth: number;
    canvasHeight: number;
}

export const PianoVisual: React.FC<PianoVisualProps> = ({
    activeKeys,
    onKeyPress,
    canvasWidth,
    canvasHeight
}) => {
    const [pressedKeys, setPressedKeys] = useState<Set<number>>(new Set());
    const [activeTouches, setActiveTouches] = useState<Map<number, number>>(new Map());

    // Piano dimensions - INCREASED FOR VISIBILITY
    const octaveWidth = 161;
    const whiteKeyWidth = 23;
    const blackKeyWidth = 13;
    const whiteKeyHeight = 120;
    const blackKeyHeight = 80;

    const numOctaves = 1;
    const totalWidth = octaveWidth * numOctaves;

    // MUCH LARGER SCALE (90% width, 70% height)
    const scale = Math.min(
        canvasWidth * 0.9 / totalWidth,
        canvasHeight * 0.7 / whiteKeyHeight
    );

    const scaledWidth = totalWidth * scale;
    const scaledHeight = whiteKeyHeight * scale;
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = canvasHeight - scaledHeight - 5;  // Almost at bottom

    const whiteKeys = [
        { note: 'C', x: 0, index: 0 },
        { note: 'D', x: 23, index: 2 },
        { note: 'E', x: 46, index: 4 },
        { note: 'F', x: 69, index: 5 },
        { note: 'G', x: 92, index: 7 },
        { note: 'A', x: 115, index: 9 },
        { note: 'B', x: 138, index: 11 }
    ];

    const blackKeys = [
        { note: 'C#', x: 14.33333, index: 1 },
        { note: 'D#', x: 41.66666, index: 3 },
        { note: 'F#', x: 82.25, index: 6 },
        { note: 'G#', x: 108.25, index: 8 },
        { note: 'A#', x: 134.75, index: 10 }
    ];

    // Find which key is at coordinates
    const getKeyAtPoint = (svgX: number, svgY: number): number | null => {
        // Check black keys first (they're on top)
        for (const key of blackKeys) {
            if (svgX >= key.x && svgX <= key.x + blackKeyWidth &&
                svgY >= 0 && svgY <= blackKeyHeight) {
                return key.index;
            }
        }

        // Check white keys
        for (const key of whiteKeys) {
            if (svgX >= key.x && svgX <= key.x + whiteKeyWidth &&
                svgY >= 0 && svgY <= whiteKeyHeight) {
                return key.index;
            }
        }

        return null;
    };

    const handleKeyInput = (keyIndex: number, velocity: number = 0.8) => {
        onKeyPress(keyIndex, velocity);
        setPressedKeys(prev => new Set(prev).add(keyIndex));
        setTimeout(() => {
            setPressedKeys(prev => {
                const next = new Set(prev);
                next.delete(keyIndex);
                return next;
            });
        }, 150);
    };

    // MULTI-TOUCH SUPPORT
    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        const svg = e.currentTarget.getBoundingClientRect();

        Array.from(e.changedTouches).forEach(touch => {
            const svgX = (touch.clientX - svg.left - offsetX) / scale;
            const svgY = (touch.clientY - svg.top - offsetY) / scale;
            const keyIndex = getKeyAtPoint(svgX, svgY);

            if (keyIndex !== null) {
                setActiveTouches(prev => new Map(prev).set(touch.identifier, keyIndex));
                handleKeyInput(keyIndex);
            }
        });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault();
        Array.from(e.changedTouches).forEach(touch => {
            setActiveTouches(prev => {
                const next = new Map(prev);
                next.delete(touch.identifier);
                return next;
            });
        });
    };

    const handleClick = (keyIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const velocity = Math.min(1, clickY / rect.height);
        handleKeyInput(keyIndex, velocity);
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${totalWidth} ${whiteKeyHeight}`}
            style={{
                position: 'absolute',
                left: offsetX,
                top: offsetY,
                width: scaledWidth,
                height: scaledHeight,
                pointerEvents: 'auto',
                opacity: 0.95  // Slight transparency
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <defs>
                {/* STRONGER COLORS FOR VISIBILITY */}
                <linearGradient id="whiteKeyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E0E0E0" />
                </linearGradient>

                <linearGradient id="whiteKeyPressedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#C0C0C0" />
                    <stop offset="100%" stopColor="#A0A0A0" />
                </linearGradient>

                <linearGradient id="blackKeyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#333333" />
                    <stop offset="100%" stopColor="#000000" />
                </linearGradient>

                <linearGradient id="blackKeyPressedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#444444" />
                    <stop offset="100%" stopColor="#222222" />
                </linearGradient>

                <filter id="pianoKeyGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* White keys */}
            {whiteKeys.map(({ note, x, index }) => {
                const isActive = activeKeys.has(index);
                const isPressed = pressedKeys.has(index);

                return (
                    <rect
                        key={`white-${index}`}
                        x={x}
                        y={isPressed ? 4 : 0}
                        width={whiteKeyWidth}
                        height={whiteKeyHeight}
                        fill={isPressed ? 'url(#whiteKeyPressedGrad)' : 'url(#whiteKeyGrad)'}
                        stroke={isActive ? '#00FFFF' : '#222222'}
                        strokeWidth={isActive ? 3 : 2}
                        filter={isActive ? 'url(#pianoKeyGlow)' : undefined}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleClick(index, e)}
                    >
                        {isActive && (
                            <animate
                                attributeName="stroke"
                                values="#00FFFF;#FFFFFF;#00FFFF"
                                dur="0.4s"
                                repeatCount="indefinite"
                            />
                        )}
                    </rect>
                );
            })}

            {/* Black keys */}
            {blackKeys.map(({ note, x, index }) => {
                const isActive = activeKeys.has(index);
                const isPressed = pressedKeys.has(index);

                return (
                    <rect
                        key={`black-${index}`}
                        x={x}
                        y={isPressed ? 3 : 0}
                        width={blackKeyWidth}
                        height={blackKeyHeight}
                        fill={isPressed ? 'url(#blackKeyPressedGrad)' : 'url(#blackKeyGrad)'}
                        stroke={isActive ? '#00FFFF' : '#000000'}
                        strokeWidth={isActive ? 3 : 1}
                        filter={isActive ? 'url(#pianoKeyGlow)' : undefined}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => handleClick(index, e)}
                    >
                        {isActive && (
                            <animate
                                attributeName="stroke"
                                values="#00FFFF;#FFFFFF;#00FFFF"
                                dur="0.4s"
                                repeatCount="indefinite"
                            />
                        )}
                    </rect>
                );
            })}

            {/* Key labels - BIGGER AND MORE VISIBLE */}
            {whiteKeys.map(({ note, x, index }) => (
                <text
                    key={`label-${index}`}
                    x={x + whiteKeyWidth / 2}
                    y={whiteKeyHeight - 8}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#666666"
                    pointerEvents="none"
                >
                    {note}
                </text>
            ))}
        </svg>
    );
};

export default PianoVisual;
