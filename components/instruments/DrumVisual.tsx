/**
 * Drum Kit Visual Component
 * Interactive SVG drums with wobble physics
 * Inspired by Hexpress drum design
 */

import React, { useState, useRef, useEffect } from 'react';

interface DrumVisualProps {
    activeDrum: string | null;
    onDrumHit: (drumType: string, velocity: number) => void;
    canvasWidth: number;
    canvasHeight: number;
}

interface WobbleState {
    magnitude: number;
    angle: number;
    time: number;
}

export const DrumVisual: React.FC<DrumVisualProps> = ({
    activeDrum,
    onDrumHit,
    canvasWidth,
    canvasHeight
}) => {
    const [wobbles, setWobbles] = useState<Record<string, WobbleState>>({});
    const [activeTouches, setActiveTouches] = useState<Map<number, string>>(new Map()); // touchId -> drumType
    const animationFrame = useRef<number | undefined>(undefined);

    // Trigger wobble animation
    const triggerWobble = (drumId: string, magnitude: number = 1) => {
        setWobbles(prev => ({
            ...prev,
            [drumId]: {
                magnitude,
                angle: Math.random() * Math.PI * 2,
                time: 0
            }
        }));
    };

    // Animation loop
    useEffect(() => {
        const animate = () => {
            setWobbles(prev => {
                const next: Record<string, WobbleState> = {};
                let hasActive = false;

                Object.entries(prev).forEach(([id, wobble]) => {
                    const newMagnitude = wobble.magnitude * 0.95; // Decay

                    if (newMagnitude > 0.01) {
                        next[id] = {
                            magnitude: newMagnitude,
                            angle: wobble.angle,
                            time: wobble.time + 0.1
                        };
                        hasActive = true;
                    }
                });

                return next;
            });

            animationFrame.current = requestAnimationFrame(animate);
        };

        animationFrame.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, []);

    const handleDrumClick = (drumType: string, e: React.MouseEvent) => {
        e.stopPropagation();

        // Calculate velocity from click intensity
        const velocity = 0.8; // Can be dynamic based on touch/click

        onDrumHit(drumType, velocity);
        triggerWobble(drumType, velocity);
    };


    // Find which drum is at coordinates
    const getDrumAtPoint = (x: number, y: number): string | null => {
        const drums = [
            { type: 'crash', x: 600, y: 80, r: 55 },
            { type: 'hihat', x: 100, y: 100, r: 45 },
            { type: 'snare', x: 180, y: 280, rx: 55, ry: 30 },
            { type: 'tom', x: 360, y: 220, rx: 50, ry: 35 },
            { type: 'kick', x: 300, y: 450, rx: 90, ry: 65 }
        ];

        for (const drum of drums) {
            if ('r' in drum) { // Circle
                const dist = Math.sqrt((x - (drum.x + 60)) ** 2 + (y - (drum.y + 60)) ** 2);
                if (dist < drum.r) return drum.type;
            } else { // Ellipse
                const dx = (x - (drum.x + 60)) / (drum.rx || 60);
                const dy = (y - (drum.y + 40)) / (drum.ry || 40);
                if (dx * dx + dy * dy < 1) return drum.type;
            }
        }
        return null;
    };

    // MULTI-TOUCH SUPPORT
    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        const svg = e.currentTarget.getBoundingClientRect();

        Array.from(e.changedTouches).forEach(touch => {
            const x = (touch.clientX - svg.left) / svg.width * 800;
            const y = (touch.clientY - svg.top) / svg.height * 600;
            const drumType = getDrumAtPoint(x, y);

            if (drumType) {
                setActiveTouches(prev => new Map(prev).set(touch.identifier, drumType));
                onDrumHit(drumType, 0.8);
                triggerWobble(drumType, 0.8);
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

    const getWobbleTransform = (drumId: string) => {
        const wobble = wobbles[drumId];
        if (!wobble || wobble.magnitude < 0.01) return '';

        const rotate = wobble.magnitude * Math.sin(wobble.time * 5) * 3;
        const scale = 1 + wobble.magnitude * Math.sin(wobble.time * 10) * 0.08;

        return `rotate(${rotate}) scale(${scale})`;
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
                opacity: 0.85  // Reduced opacity
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <defs>
                {/* Cymbal gradient - golden */}
                <radialGradient id="cymbalGradient" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#FFE680" />
                    <stop offset="70%" stopColor="#CCAD00" />
                    <stop offset="100%" stopColor="#AA8800" />
                </radialGradient>

                {/* Tom/Snare gradient - cream */}
                <radialGradient id="drumGradient" cx="50%" cy="40%">
                    <stop offset="0%" stopColor="#F5F5F0" />
                    <stop offset="60%" stopColor="#D7D0AE" />
                    <stop offset="100%" stopColor="#B8B090" />
                </radialGradient>

                {/* Kick drum gradient - dark */}
                <radialGradient id="kickGradient" cx="50%" cy="40%">
                    <stop offset="0%" stopColor="#4A4A4A" />
                    <stop offset="60%" stopColor="#2C2C2C" />
                    <stop offset="100%" stopColor="#1A1A1A" />
                </radialGradient>

                {/* Shadow filter */}
                <filter id="drumShadow">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.4" />
                </filter>

                {/* Active glow */}
                <filter id="activeGlow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* CRASH CYMBAL - Top Right */}
            <g
                transform={`translate(600, 80) ${getWobbleTransform('crash')}`}
                style={{ transformOrigin: '60px 60px', cursor: 'pointer' }}
                onClick={(e) => handleDrumClick('crash', e)}
            >
                <circle
                    cx="60"
                    cy="60"
                    r="55"
                    fill="url(#cymbalGradient)"
                    stroke={activeDrum === 'crash' ? '#22d3ee' : '#DDB800'}
                    strokeWidth={activeDrum === 'crash' ? 3 : 1}
                    filter="url(#drumShadow)"
                />
                {/* Cymbal grooves */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="#DDB800" strokeWidth="0.5" opacity="0.6" />
                <circle cx="60" cy="60" r="45" fill="none" stroke="#DDB800" strokeWidth="0.5" opacity="0.6" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="#DDB800" strokeWidth="0.5" opacity="0.6" />
                {/* Center bell */}
                <circle cx="60" cy="60" r="12" fill="#FFD700" />
                {/* Light reflection */}
                <path d="M30,35 Q60,40 90,35" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* HI-HAT - Top Left */}
            <g
                transform={`translate(100, 100) ${getWobbleTransform('hihat')}`}
                style={{ transformOrigin: '50px 50px', cursor: 'pointer' }}
                onClick={(e) => handleDrumClick('hihat', e)}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="url(#cymbalGradient)"
                    stroke={activeDrum === 'hihat' ? '#22d3ee' : '#DDB800'}
                    strokeWidth={activeDrum === 'hihat' ? 3 : 1}
                    filter="url(#drumShadow)"
                />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#DDB800" strokeWidth="0.5" opacity="0.6" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="#DDB800" strokeWidth="0.5" opacity="0.6" />
                <circle cx="50" cy="50" r="10" fill="#FFD700" />
            </g>

            {/* SNARE - Left Center */}
            <g
                transform={`translate(180, 280) ${getWobbleTransform('snare')}`}
                style={{ transformOrigin: '60px 40px', cursor: 'pointer' }}
                onClick={(e) => handleDrumClick('snare', e)}
            >
                {/* Drum shell */}
                <ellipse
                    cx="60"
                    cy="35"
                    rx="55"
                    ry="10"
                    fill="#606060"
                    filter="url(#drumShadow)"
                />
                {/* Drum head */}
                <ellipse
                    cx="60"
                    cy="30"
                    rx="55"
                    ry="30"
                    fill="url(#drumGradient)"
                    stroke={activeDrum === 'snare' ? '#22d3ee' : '#8B7355'}
                    strokeWidth={activeDrum === 'snare' ? 3 : 2}
                />
                {/* Rim */}
                <ellipse cx="60" cy="30" rx="55" ry="30" fill="none" stroke="#606060" strokeWidth="3" />
            </g>

            {/* TOM 1 - Center */}
            <g
                transform={`translate(360, 220) ${getWobbleTransform('tom1')}`}
                style={{ transformOrigin: '60px 50px', cursor: 'pointer' }}
                onClick={(e) => handleDrumClick('tom', e)}
            >
                <ellipse cx="60" cy="45" rx="50" ry="10" fill="#555555" filter="url(#drumShadow)" />
                <ellipse
                    cx="60"
                    cy="40"
                    rx="50"
                    ry="35"
                    fill="url(#drumGradient)"
                    stroke={activeDrum === 'tom' ? '#22d3ee' : '#8B7355'}
                    strokeWidth={activeDrum === 'tom' ? 3 : 2}
                />
                <ellipse cx="60" cy="40" rx="50" ry="35" fill="none" stroke="#606060" strokeWidth="2" />
            </g>

            {/* FLOOR TOM - Right Center */}
            <g
                transform={`translate(540, 300) ${getWobbleTransform('floortom')}`}
                style={{ transformOrigin: '70px 50px', cursor: 'pointer' }}
                onClick={(e) => handleDrumClick('tom', e)}
            >
                <ellipse cx="70" cy="50" rx="60" ry="12" fill="#555555" filter="url(#drumShadow)" />
                <ellipse
                    cx="70"
                    cy="45"
                    rx="60"
                    ry="40"
                    fill="url(#drumGradient)"
                    stroke={activeDrum === 'tom' ? '#22d3ee' : '#8B7355'}
                    strokeWidth={activeDrum === 'tom' ? 3 : 2}
                />
                <ellipse cx="70" cy="45" rx="60" ry="40" fill="none" stroke="#606060" strokeWidth="2" />
            </g>

            {/* KICK DRUM - Bottom Center */}
            <g
                transform={`translate(300, 450) ${getWobbleTransform('kick')}`}
                style={{ transformOrigin: '100px 70px', cursor: 'pointer' }}
                onClick={(e) => handleDrumClick('kick', e)}
            >
                {/* Shadow */}
                <ellipse cx="100" cy="78" rx="95" ry="15" fill="#000000" opacity="0.3" />
                {/* Drum shell */}
                <ellipse cx="100" cy="20" rx="90" ry="15" fill="#2C2C2C" />
                <ellipse cx="100" cy="70" rx="90" ry="15" fill="#1A1A1A" />
                <rect x="10" y="20" width="180" height="50" fill="#2C2C2C" />
                {/* Front head */}
                <ellipse
                    cx="100"
                    cy="70"
                    rx="90"
                    ry="65"
                    fill="url(#kickGradient)"
                    stroke={activeDrum === 'kick' ? '#22d3ee' : '#000000'}
                    strokeWidth={activeDrum === 'kick' ? 4 : 3}
                    filter="url(#drumShadow)"
                />
                {/* Rim */}
                <ellipse cx="100" cy="70" rx="90" ry="65" fill="none" stroke="#606060" strokeWidth="4" />
                {/* Center dot */}
                <circle cx="100" cy="70" r="8" fill="#1A1A1A" />
            </g>

            {/* Labels */}
            <text x="100" y="190" textAnchor="middle" fill="white" fontSize="12" opacity="0.6">HI-HAT</text>
            <text x="180" y="370" textAnchor="middle" fill="white" fontSize="12" opacity="0.6">SNARE</text>
            <text x="360" y="310" textAnchor="middle" fill="white" fontSize="12" opacity="0.6">TOM</text>
            <text x="660" y="150" textAnchor="middle" fill="white" fontSize="12" opacity="0.6">CRASH</text>
            <text x="400" y="580" textAnchor="middle" fill="white" fontSize="14" opacity="0.6">KICK</text>
        </svg>
    );
};

export default DrumVisual;
