/**
 * TutorialHUD - Non-blocking corner tips overlay
 */

import React, { useState } from 'react';
import { InstrumentRole } from '../types';

interface TutorialHUDProps {
  instrument: InstrumentRole;
  lastGesture?: string;
  onRequestFullGuide?: () => void;
}

const quickTips: Record<InstrumentRole, string[]> = {
  [InstrumentRole.DRUMS]: [
    "🔔 Be the bells! Flick ☝️ finger DOWN sharply",
    "🎄 Left→Right = Hi-Hat → Snare → Kick → Tom → Crash",
    "💨 Faster flicks = louder 'DONG!'",
    "🥁 Try: tap-tap-tap-TAP for the Carol rhythm!"
  ],
  [InstrumentRole.PIANO]: [
    "🎹 Your 10 fingers = 10 piano keys!",
    "🔔 TAP each finger DOWN independently",
    "🎄 Higher hand = higher bells chiming",
    "✨ Try: G-F#-G-E pattern for Carol melody!"
  ],
  [InstrumentRole.GUITAR]: [
    "🎸 One hand frets, one hand strums",
    "🔔 Swipe ☝️ LEFT→RIGHT for down strum",
    "🎄 Hold Em chord for Carol of the Bells",
    "💫 Quick strums on each beat = festive feel!"
  ],
  [InstrumentRole.BASS]: [
    "🎻 Pluck with ☝️ finger - deep & steady",
    "🔔 Low position = rumbling foundation",
    "🎄 Quarter notes on E for Carol bass",
    "✨ You're the 'DONG' in 'Ding Dong'!"
  ],
  [InstrumentRole.THEREMIN]: [
    "〰️ Float your ☝️ finger through the air",
    "🔔 UP/DOWN = pitch, LEFT/RIGHT = volume",
    "🎄 Add gentle trembling for eerie vibrato",
    "👻 Create ghostly bell sounds!"
  ],
  [InstrumentRole.STRINGS]: [
    "🎼 Conduct with your ☝️ finger as baton",
    "🔔 Sweep UP = swell, Push DOWN = accent",
    "🎄 Build epic crescendos for the carol!",
    "✨ Spread hands wide for full orchestra"
  ],
  [InstrumentRole.PADS]: [
    "🌌 Open palm, spread fingers, float slowly",
    "🔔 Move in slow circles like peaceful snow",
    "🎄 Create shimmering bed of sound",
    "🧘 You're the atmosphere behind the bells"
  ],
  [InstrumentRole.NONE]: ["🎄 Pick an instrument to join the Silent Orchestra!"]
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    left: 20,
    width: 260,
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(34, 211, 238, 0.4)',
    borderRadius: 14,
    padding: 14,
    color: 'white',
    fontFamily: 'Inter, sans-serif',
    zIndex: 1000
  },
  header: { fontSize: 10, color: '#22d3ee', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 8 },
  tip: { fontSize: 15, marginBottom: 10, textAlign: 'center' as const },
  nav: { display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 10 },
  navBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', padding: '4px 12px', cursor: 'pointer' },
  feedback: { background: 'rgba(34,211,238,0.2)', border: '1px solid #22d3ee', borderRadius: 8, padding: 8, marginBottom: 10, fontSize: 13, color: '#22d3ee' },
  guideBtn: { width: '100%', padding: 10, background: 'linear-gradient(135deg, #22d3ee, #06b6d4)', border: 'none', borderRadius: 8, color: 'black', fontWeight: 600, cursor: 'pointer' }
};

const TutorialHUD: React.FC<TutorialHUDProps> = ({ instrument, lastGesture, onRequestFullGuide }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const tips = quickTips[instrument] || [];

  if (minimized) {
    return (
      <button onClick={() => setMinimized(false)} style={{ ...styles.container, width: 'auto', padding: '8px 16px', cursor: 'pointer' }}>
        💡 Tips
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={styles.header}>Quick Tips</span>
        <button onClick={() => setMinimized(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>⊟</button>
      </div>

      <div style={styles.tip}>{tips[tipIndex]}</div>

      {tips.length > 1 && (
        <div style={styles.nav}>
          <button style={styles.navBtn} onClick={() => setTipIndex((tipIndex - 1 + tips.length) % tips.length)}>‹</button>
          <span style={{ fontSize: 11, opacity: 0.6 }}>{tipIndex + 1}/{tips.length}</span>
          <button style={styles.navBtn} onClick={() => setTipIndex((tipIndex + 1) % tips.length)}>›</button>
        </div>
      )}

      {lastGesture && <div style={styles.feedback}>✓ {lastGesture}</div>}

      <button style={styles.guideBtn} onClick={onRequestFullGuide}>📖 Full Guide</button>
    </div>
  );
};

export default TutorialHUD;
