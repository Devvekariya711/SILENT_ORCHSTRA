/**
 * Instrument Guide - Full tutorial modal
 */

import React from 'react';
import { InstrumentRole } from '../types';

interface InstrumentGuideProps {
  instrument: InstrumentRole;
  onDismiss: () => void;
  onStartPlaying: () => void;
}

const guides: Record<InstrumentRole, { title: string; steps: string[] }> = {
  [InstrumentRole.DRUMS]: {
    title: '🥁 Drums',
    steps: [
      'Stand with imaginary drum kit around you',
      'Both hands act as drumsticks',
      'Punch DOWN to hit drums',
      'HIGH position = cymbals (hi-hat, crash)',
      'MIDDLE position = snare, toms',
      'LOW position = kick drum',
      'Faster motion = louder hit'
    ]
  },
  [InstrumentRole.PIANO]: {
    title: '🎹 Piano',
    steps: [
      'Imagine keyboard in front of you',
      'All 10 fingers can play different keys',
      'TAP DOWN to trigger notes',
      'Higher hand = higher pitch',
      'Lower hand = lower pitch',
      'Use both hands for chords'
    ]
  },
  [InstrumentRole.GUITAR]: {
    title: '🎸 Guitar',
    steps: [
      'Hold imaginary guitar at mid-body',
      'Right hand strums (camera sees back of hand)',
      'Strum UP or DOWN vertically',
      'Left hand frets (palm toward camera)',
      'Horizontal swipe = palm mute'
    ]
  },
  [InstrumentRole.BASS]: {
    title: '🎸 Bass',
    steps: [
      'Similar to guitar, lower position',
      'Pluck with finger motion',
      'Focus on rhythm over melody',
      'Deep, punchy notes'
    ]
  },
  [InstrumentRole.THEREMIN]: {
    title: '〰️ Theremin',
    steps: [
      'Hands control sound in space',
      'Vertical movement = pitch',
      'Horizontal = volume',
      'Smooth, flowing motions'
    ]
  },
  [InstrumentRole.STRINGS]: {
    title: '🎻 Strings',
    steps: [
      'Gentle pushing motion = bow stroke',
      'Height controls note selection',
      'Slow = sustained notes',
      'Fast = staccato'
    ]
  },
  [InstrumentRole.PADS]: {
    title: '🌌 Pads',
    steps: [
      'Slow, zen movements',
      'Floating hands = ambient textures',
      'Position affects tone color',
      'Just relax and explore'
    ]
  },
  [InstrumentRole.NONE]: {
    title: '🎵 Select Instrument',
    steps: ['Choose an instrument to see its guide']
  }
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modal: {
    background: 'rgba(20,20,30,0.95)',
    border: '1px solid rgba(34,211,238,0.3)',
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    width: '90%',
    color: 'white'
  },
  title: { fontSize: 24, fontWeight: 600, marginBottom: 20, textAlign: 'center' as const },
  step: { fontSize: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  btn: { width: '100%', padding: 14, background: '#22d3ee', border: 'none', borderRadius: 10, color: 'black', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 20 },
  close: { position: 'absolute' as const, top: 15, right: 15, background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }
};

const InstrumentGuide: React.FC<InstrumentGuideProps> = ({ instrument, onDismiss, onStartPlaying }) => {
  const guide = guides[instrument];

  return (
    <div style={styles.overlay} onClick={onDismiss}>
      <div style={{ ...styles.modal, position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button style={styles.close} onClick={onDismiss}>×</button>
        <div style={styles.title}>{guide.title}</div>
        <div>
          {guide.steps.map((step, i) => (
            <div key={i} style={styles.step}>{i + 1}. {step}</div>
          ))}
        </div>
        <button style={styles.btn} onClick={onStartPlaying}>
          Start Playing →
        </button>
      </div>
    </div>
  );
};

export default InstrumentGuide;
