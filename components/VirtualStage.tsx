import React from 'react';
import { InstrumentRole } from '../types';

interface StagePlayer {
    id: string;
    instrument: InstrumentRole;
    isActive: boolean;
    nickname?: string;
    isHost?: boolean;
}

interface VirtualStageProps {
    players: StagePlayer[];
    currentPlayerId: string;
    roomId: string;
}

// Instrument icons (simple SVG paths)
const instrumentIcons: Record<InstrumentRole, string> = {
    [InstrumentRole.DRUMS]: 'M12 2C7 2 3 6 3 11v6a3 3 0 003 3h12a3 3 0 003-3v-6c0-5-4-9-9-9z M7 13h2v4H7z M11 11h2v6h-2z M15 13h2v4h-2z',
    [InstrumentRole.GUITAR]: 'M19.5 2l-4 4-1.5-1.5L12 6.5 17.5 12l2-2-1.5-1.5 4-4-2.5-2.5zM3 21h3l8-8-3-3-8 8v3z',
    [InstrumentRole.PIANO]: 'M4 3h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2zm2 2v8h2V5H6zm4 0v8h2V5h-2zm4 0v8h2V5h-2z',
    [InstrumentRole.BASS]: 'M12 2a10 10 0 00-2 19.8v-3.6A7 7 0 1119 12h2A10 10 0 0012 2z M12 8a4 4 0 100 8 4 4 0 000-8z',
    [InstrumentRole.THEREMIN]: 'M12 2v10m0 0l-3-3m3 3l3-3M4 12h4m8 0h4M12 22V12',
    [InstrumentRole.STRINGS]: 'M3 3l18 18M21 3L3 21M12 3v18M3 12h18',
    [InstrumentRole.PADS]: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    [InstrumentRole.NONE]: 'M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0'
};

// Position players in a semi-circle
const getPlayerPosition = (index: number, total: number) => {
    // Semi-circle from left to right
    const angle = ((index + 1) / (total + 1)) * Math.PI;
    const radius = 120;
    return {
        x: 150 + radius * Math.cos(angle - Math.PI),
        y: 140 + radius * Math.sin(angle - Math.PI) * 0.6
    };
};

const VirtualStage: React.FC<VirtualStageProps> = ({
    players,
    currentPlayerId,
    roomId
}) => {
    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Stage Background */}
            <div className="relative aspect-[4/3] bg-gradient-to-b from-gray-900 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">

                {/* Stage Floor */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber-900/20 to-transparent" />

                {/* Stage Lights */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-4">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-lg shadow-cyan-500/50" />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-lg shadow-pink-500/50" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50" style={{ animationDelay: '0.4s' }} />
                </div>

                {/* Room ID Banner */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-1 rounded-full border border-white/20">
                    <span className="text-xs text-gray-400">ROOM:</span>
                    <span className="text-xs text-cyan-300 ml-1 font-mono font-bold">{roomId}</span>
                </div>

                {/* Player Positions */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200">
                    {/* Center Stage Indicator */}
                    <circle cx="150" cy="140" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4,4" />

                    {players.map((player, index) => {
                        const pos = getPlayerPosition(index, players.length);
                        const isMe = player.id === currentPlayerId;
                        const color = player.isActive ? '#22d3ee' : '#4b5563';

                        return (
                            <g key={player.id} transform={`translate(${pos.x}, ${pos.y})`}>
                                {/* Player Circle */}
                                <circle
                                    r={isMe ? 24 : 20}
                                    fill={isMe ? 'rgba(34, 211, 238, 0.2)' : 'rgba(0,0,0,0.6)'}
                                    stroke={isMe ? '#22d3ee' : color}
                                    strokeWidth={isMe ? 2 : 1}
                                    className={player.isActive ? 'animate-pulse' : ''}
                                />

                                {/* Instrument Icon */}
                                <path
                                    d={instrumentIcons[player.instrument]}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="1.5"
                                    transform="translate(-12, -12) scale(1)"
                                    className="opacity-80"
                                />

                                {/* Host Crown */}
                                {player.isHost && (
                                    <text x="0" y="-28" textAnchor="middle" fontSize="10">👑</text>
                                )}

                                {/* Label */}
                                <text
                                    y="35"
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill={isMe ? '#22d3ee' : '#9ca3af'}
                                    className="uppercase font-bold"
                                >
                                    {isMe ? 'YOU' : player.nickname || `P${index + 1}`}
                                </text>

                                {/* Instrument Label */}
                                <text
                                    y="45"
                                    textAnchor="middle"
                                    fontSize="6"
                                    fill="#6b7280"
                                    className="uppercase"
                                >
                                    {player.instrument}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Empty State */}
                {players.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-gray-600 text-sm uppercase tracking-wider mb-2">Empty Stage</div>
                            <div className="text-gray-700 text-xs">Waiting for players to join...</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Player Count */}
            <div className="flex justify-center mt-3">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span>{players.length} {players.length === 1 ? 'player' : 'players'} on stage</span>
                </div>
            </div>
        </div>
    );
};

export default VirtualStage;
