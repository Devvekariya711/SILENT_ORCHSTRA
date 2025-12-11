import React from 'react';

interface SyncStatusProps {
    isConnected: boolean;
    latency: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
    playerCount: number;
    roomId?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({
    isConnected,
    latency,
    quality,
    playerCount,
    roomId
}) => {
    const getQualityColor = () => {
        switch (quality) {
            case 'excellent': return 'bg-green-500';
            case 'good': return 'bg-lime-500';
            case 'fair': return 'bg-yellow-500';
            case 'poor': return 'bg-orange-500';
            case 'offline': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getQualityBars = () => {
        let bars = 1;
        if (quality === 'excellent') bars = 4;
        else if (quality === 'good') bars = 3;
        else if (quality === 'fair') bars = 2;
        return bars;
    };

    return (
        <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs uppercase tracking-wider text-gray-400">
                    {isConnected ? 'SYNCED' : 'OFFLINE'}
                </span>
            </div>

            {/* Signal Quality Bars */}
            <div className="flex items-end space-x-0.5 h-4">
                {[1, 2, 3, 4].map((bar) => (
                    <div
                        key={bar}
                        className={`w-1 transition-all ${bar <= getQualityBars() ? getQualityColor() : 'bg-gray-700'}`}
                        style={{ height: `${bar * 4}px` }}
                    />
                ))}
            </div>

            {/* Latency */}
            {isConnected && (
                <div className="text-xs font-mono text-gray-400">
                    <span className="text-cyan-400">{latency}</span>
                    <span className="text-gray-600">ms</span>
                </div>
            )}

            {/* Player Count */}
            <div className="flex items-center space-x-1 text-xs">
                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span className="text-gray-400">{playerCount}</span>
            </div>

            {/* Room ID */}
            {roomId && (
                <div className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    <span className="text-gray-500">ROOM:</span>
                    <span className="text-cyan-300 ml-1 font-bold">{roomId}</span>
                </div>
            )}
        </div>
    );
};

export default SyncStatus;
