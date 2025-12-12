/**
 * Visual Piano Keyboard - 8 white keys like the reference image
 * Keys are WHITE, active key is CYAN
 */

import React from 'react';

interface PianoKeyboardProps {
    canvasWidth: number;
    canvasHeight: number;
    activeKeyIndex: number | null;  // 0-7, which key is pressed
}

// 8 keys like in the image
const NUM_KEYS = 8;

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
    canvasWidth,
    canvasHeight,
    activeKeyIndex
}) => {
    const keyboardWidth = canvasWidth * 0.85;
    const keyboardX = (canvasWidth - keyboardWidth) / 2;
    const keyWidth = keyboardWidth / NUM_KEYS;
    const keyHeight = canvasHeight * 0.4;  // Tall keys like image
    const keyboardY = canvasHeight - keyHeight - 10;
    const gap = 6;  // Gap between keys

    return (
        <g>
            {/* Render each key */}
            {Array.from({ length: NUM_KEYS }).map((_, i) => {
                const x = keyboardX + i * keyWidth;
                const isActive = activeKeyIndex === i;

                return (
                    <g key={i}>
                        {/* Key rectangle - WHITE default, CYAN when active */}
                        <rect
                            x={x + gap / 2}
                            y={keyboardY}
                            width={keyWidth - gap}
                            height={keyHeight}
                            rx={4}
                            fill={isActive ? '#22d3ee' : 'white'}
                            stroke={isActive ? '#22d3ee' : 'rgba(0,0,0,0.2)'}
                            strokeWidth={1}
                        />

                        {/* Key number when active */}
                        {isActive && (
                            <text
                                x={x + keyWidth / 2}
                                y={keyboardY + keyHeight - 30}
                                textAnchor="middle"
                                fill="white"
                                fontSize={32}
                                fontWeight="bold"
                            >
                                {i + 1}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
};

// Helper to convert X position to key index (0-7)
export const getKeyFromX = (x: number): number => {
    // x is 0-1, map to 0-7
    const keyIndex = Math.floor(x * NUM_KEYS);
    return Math.max(0, Math.min(NUM_KEYS - 1, keyIndex));
};

export default PianoKeyboard;
