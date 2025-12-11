/**
 * Player List Component - Live room participants display
 * Shows connected players, instruments, and activity
 */

import React from 'react';
import { InstrumentRole } from '../types';

interface Player {
  id: string;
  name: string;
  role: InstrumentRole;
  isPlaying: boolean;
  volume: number;
  color: string;
}

interface PlayerListProps {
  players: Player[];
  roomId: string;
  currentUserId: string;
}

const instrumentIcons: Record<InstrumentRole, string> = {
  [InstrumentRole.DRUMS]: '🥁',
  [InstrumentRole.PIANO]: '🎹',
  [InstrumentRole.GUITAR]: '🎸',
  [InstrumentRole.BASS]: '🎸',
  [InstrumentRole.THEREMIN]: '〰️',
  [InstrumentRole.STRINGS]: '🎻',
  [InstrumentRole.PADS]: '🌌',
  [InstrumentRole.NONE]: '🎵'
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    width: 280,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    color: 'white',
    fontFamily: 'Inter, sans-serif',
    zIndex: 100
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  roomCode: {
    fontSize: 14,
    fontWeight: 600,
    color: '#22d3ee',
    fontFamily: 'monospace'
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 8
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 16
  },
  playerName: { fontSize: 14, fontWeight: 500 },
  instrument: { fontSize: 12, opacity: 0.7 },
  volumeBar: {
    width: 40,
    height: 4,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden'
  }
};

const PlayerList: React.FC<PlayerListProps> = ({ players, roomId, currentUserId }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ fontSize: 11, opacity: 0.6 }}>Room:</span>
        <span style={styles.roomCode}>{roomId}</span>
        <span style={{ fontSize: 13 }}>👥 {players.length}/8</span>
      </div>

      <div>
        {players.map(player => (
          <div key={player.id} style={{
            ...styles.playerCard,
            border: player.id === currentUserId ? '1px solid #22d3ee' : '1px solid transparent'
          }}>
            <div style={{ ...styles.avatar, backgroundColor: player.color }}>
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.playerName}>
                {player.name}
                {player.id === currentUserId && (
                  <span style={{ marginLeft: 6, fontSize: 10, background: '#22d3ee', color: 'black', padding: '2px 6px', borderRadius: 4 }}>You</span>
                )}
              </div>
              <div style={styles.instrument}>
                {instrumentIcons[player.role]} {player.role}
              </div>
            </div>
            <div style={styles.volumeBar}>
              <div style={{ width: `${player.volume * 100}%`, height: '100%', background: '#22d3ee' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;
