/**
 * Instrument Guide - Carol of the Bells Edition 🎄
 * Creative, festive tutorial modal for each instrument
 */

import React, { useState } from 'react';
import { InstrumentRole } from '../types';

interface InstrumentGuideProps {
  instrument: InstrumentRole;
  onDismiss: () => void;
  onStartPlaying: () => void;
}

interface GuideContent {
  title: string;
  emoji: string;
  theme: string;        // "Carol of the Bells" inspired theme
  tagline: string;      // Poetic one-liner
  color: string;        // Accent color
  steps: {
    gesture: string;    // What to do
    result: string;     // What happens
    tip: string;        // Pro tip
  }[];
  carolTip: string;     // How to play Carol of the Bells on this instrument
}

const guides: Record<InstrumentRole, GuideContent> = {
  [InstrumentRole.DRUMS]: {
    title: 'Air Drums',
    emoji: '🥁',
    theme: 'The Heartbeat of the Bells',
    tagline: '"Ding, dong, ding, dong" — be the pulse that drives the carol',
    color: '#ef4444',
    steps: [
      {
        gesture: '☝️ Point your index finger like a drumstick',
        result: 'Your fingertip becomes the striking point',
        tip: 'The faster you flick, the louder the hit'
      },
      {
        gesture: '⬇️ Flick your finger DOWN sharply',
        result: 'BOOM! Drum hit registers',
        tip: 'Think of tapping a nail — quick and precise'
      },
      {
        gesture: '↔️ Move across 5 zones: Left→Right',
        result: 'Hi-Hat → Snare → Kick → Tom → Crash',
        tip: 'Each zone triggers a different drum'
      },
      {
        gesture: '🤲 Use BOTH hands for drum rolls',
        result: 'Alternating left-right = fast fills',
        tip: 'Keep steady rhythm for the best sound'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Tap a steady 4/4 rhythm — tap-tap-tap-TAP (emphasis on 4th beat) to match the iconic "ding dong" pattern!'
  },

  [InstrumentRole.PIANO]: {
    title: 'Air Piano',
    emoji: '🎹',
    theme: 'The Dancing Melody',
    tagline: '"Hark! how the bells" — let your fingers tell the story',
    color: '#3b82f6',
    steps: [
      {
        gesture: '🖐️ Spread all 10 fingers in front of you',
        result: 'Each finger is an individual piano key',
        tip: 'Left hand = lower octave, Right = higher'
      },
      {
        gesture: '👇 TAP each finger down independently',
        result: 'That finger triggers its note',
        tip: 'Higher position = higher pitch notes'
      },
      {
        gesture: '✊→🖐️ Make a fist, then spread fingers',
        result: 'Creates a sweeping arpeggio effect',
        tip: 'Roll your fingers one by one for runs'
      },
      {
        gesture: '🤲 Bring both hands together then apart',
        result: 'Play chords by tapping multiple fingers',
        tip: 'Sync both hands for full harmony'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Play the famous pattern G-F#-G-E with your right hand fingers (high position), then descend slowly. The melody goes round and round like bells chiming!'
  },

  [InstrumentRole.GUITAR]: {
    title: 'Air Guitar',
    emoji: '🎸',
    theme: 'The Strumming Spirit',
    tagline: '"Sweet silver bells" — strum the chords of celebration',
    color: '#eab308',
    steps: [
      {
        gesture: '🤚 One hand holds "frets" (stays still)',
        result: 'This hand selects which chord to play',
        tip: 'Fingers extended = major, closed = minor'
      },
      {
        gesture: '👆 Other hand strums with index finger',
        result: 'Swipe LEFT→RIGHT for down strum',
        tip: 'Swipe RIGHT→LEFT for up strum'
      },
      {
        gesture: '⬆️⬇️ Strum hand Y position = string',
        result: 'High = thin strings, Low = thick bass strings',
        tip: 'Power chords: focus on lower position'
      },
      {
        gesture: '🏃 Fast horizontal swipes',
        result: 'Fast strumming for energetic parts',
        tip: 'Slow swipes for gentle arpeggios'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Strum quick downstrokes on each beat — Em chord throughout. Add accents by strumming harder on beats 1 and 3!'
  },

  [InstrumentRole.BASS]: {
    title: 'Air Bass',
    emoji: '🎻',
    theme: 'The Foundation of Joy',
    tagline: '"Merry, merry Christmas" — lay the ground for harmony',
    color: '#8b5cf6',
    steps: [
      {
        gesture: '☝️ Use your index finger as the plucking finger',
        result: 'Like a real bassist plucks the strings',
        tip: 'Deep, deliberate movements work best'
      },
      {
        gesture: '⬇️ Flick finger DOWN like plucking',
        result: 'THUMP! Deep bass note plays',
        tip: 'Slower motion = deeper, more resonant'
      },
      {
        gesture: '⬆️⬇️ Your Y position = pitch',
        result: 'High hand = higher bass notes',
        tip: 'Stay low for that rumbling foundation'
      },
      {
        gesture: '🔄 Create a walking bassline',
        result: 'Move position while plucking for melody',
        tip: 'Lock into the drum rhythm for groove'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Play steady quarter notes on E (low position). Add the occasional octave jump for drama during the crescendo sections!'
  },

  [InstrumentRole.THEREMIN]: {
    title: 'Air Theremin',
    emoji: '〰️',
    theme: 'The Ghostly Bells',
    tagline: '"O how they pound, raising the sound" — eerie and ethereal',
    color: '#ec4899',
    steps: [
      {
        gesture: '👆 Raise your index finger like an antenna',
        result: 'Your finger position controls everything',
        tip: 'Smooth, floating movements are key'
      },
      {
        gesture: '⬆️⬇️ Move UP and DOWN slowly',
        result: 'Controls PITCH — higher = higher note',
        tip: 'Think of an invisible piano in the air'
      },
      {
        gesture: '↔️ Move LEFT and RIGHT',
        result: 'Controls VOLUME — right = louder',
        tip: 'Fade in by moving from left to right'
      },
      {
        gesture: '🌊 Add gentle vibrato with finger trembling',
        result: 'Creates that classic theremin warble',
        tip: 'Subtle shaking = beautiful vibrato'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Create an eerie, haunting version! Slowly glide through the G-F#-G-E pattern with plenty of vibrato. It sounds like distant, ghostly bells!'
  },

  [InstrumentRole.STRINGS]: {
    title: 'Air Strings',
    emoji: '🎼',
    theme: 'The Orchestral Swell',
    tagline: '"All seems to say, throw cares away" — conduct the symphony',
    color: '#10b981',
    steps: [
      {
        gesture: '☝️ Index finger becomes your conductor\'s baton',
        result: 'Motion intensity controls string dynamics',
        tip: 'Smooth movements = legato strings'
      },
      {
        gesture: '⬆️ Sweep your finger UPWARD',
        result: 'SWELL — strings crescendo beautifully',
        tip: 'The faster you rise, the bigger the swell'
      },
      {
        gesture: '⬇️ Push your finger DOWNWARD',
        result: 'ACCENT — sharp, dramatic string hit',
        tip: 'Quick stabs for staccato effects'
      },
      {
        gesture: '🤲 Spread both hands apart',
        result: 'Controls the WIDTH of the string sound',
        tip: 'Wide = full orchestra, narrow = solo voice'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Start with gentle swells on the main theme, then conduct dramatic upward flourishes during "Ding dong ding dong" — make it epic!'
  },

  [InstrumentRole.PADS]: {
    title: 'Ambient Pads',
    emoji: '🌌',
    theme: 'The Dreamscape',
    tagline: '"\'Tis the season to be jolly" — float through sonic clouds',
    color: '#6366f1',
    steps: [
      {
        gesture: '🖐️ Open your palm and spread fingers',
        result: 'More extended fingers = richer texture',
        tip: 'Like opening a flower to the sun'
      },
      {
        gesture: '🐢 Move SLOWLY and deliberately',
        result: 'Smooth, ambient pad evolves with you',
        tip: 'Fast movements break the zen'
      },
      {
        gesture: '🌊 Float your hand through space',
        result: 'Position affects tone color and warmth',
        tip: 'Left = darker tones, Right = brighter'
      },
      {
        gesture: '⬆️⬇️ Height changes the atmosphere',
        result: 'High = airy, ethereal | Low = deep, warm',
        tip: 'Find your sweet spot and breathe'
      }
    ],
    carolTip: '🎄 For "Carol of the Bells": Create a shimmering bed of sound! Open palm, move in slow circles, and let the pad sustain beneath the melody. Perfect for backing the choir!'
  },

  [InstrumentRole.NONE]: {
    title: 'Select Instrument',
    emoji: '🎵',
    theme: 'The Overture',
    tagline: 'Choose your voice in the Silent Orchestra',
    color: '#22d3ee',
    steps: [
      {
        gesture: 'Pick an instrument to begin',
        result: 'Full instructions will appear',
        tip: 'Each instrument has unique gestures'
      }
    ],
    carolTip: '🎄 Carol of the Bells awaits your performance!'
  }
};

const InstrumentGuide: React.FC<InstrumentGuideProps> = ({ instrument, onDismiss, onStartPlaying }) => {
  const guide = guides[instrument];
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div style={styles.overlay} onClick={onDismiss}>
      <div
        style={{
          ...styles.modal,
          borderColor: guide.color,
          boxShadow: `0 0 40px ${guide.color}40`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button style={styles.close} onClick={onDismiss}>×</button>

        {/* Header */}
        <div style={styles.header}>
          <div style={{ fontSize: 48 }}>{guide.emoji}</div>
          <div style={{ ...styles.title, color: guide.color }}>{guide.title}</div>
          <div style={styles.theme}>{guide.theme}</div>
          <div style={styles.tagline}>"{guide.tagline}"</div>
        </div>

        {/* Steps Navigation */}
        <div style={styles.stepsNav}>
          {guide.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              style={{
                ...styles.stepBtn,
                background: activeStep === i ? guide.color : 'rgba(255,255,255,0.1)',
                color: activeStep === i ? 'black' : 'white'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        {guide.steps[activeStep] && (
          <div style={styles.stepContent}>
            <div style={{ ...styles.gestureBox, borderColor: guide.color }}>
              <div style={styles.label}>GESTURE</div>
              <div style={styles.gestureText}>{guide.steps[activeStep].gesture}</div>
            </div>
            <div style={styles.resultBox}>
              <div style={styles.label}>RESULT</div>
              <div style={styles.resultText}>{guide.steps[activeStep].result}</div>
            </div>
            <div style={styles.tipBox}>
              <span style={{ color: '#fbbf24' }}>💡</span> {guide.steps[activeStep].tip}
            </div>
          </div>
        )}

        {/* Carol of the Bells Special Tip */}
        <div style={{ ...styles.carolTip, background: `${guide.color}15`, borderColor: guide.color }}>
          {guide.carolTip}
        </div>

        {/* Start Button */}
        <button
          style={{ ...styles.startBtn, background: guide.color }}
          onClick={onStartPlaying}
        >
          🎄 Start Playing
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.9)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: 20
  },
  modal: {
    position: 'relative',
    background: 'linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,20,0.98) 100%)',
    border: '2px solid',
    borderRadius: 24,
    padding: '30px 25px',
    maxWidth: 450,
    width: '100%',
    color: 'white',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  close: {
    position: 'absolute',
    top: 15,
    right: 15,
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    fontSize: 24,
    width: 36,
    height: 36,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase'
  },
  theme: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontStyle: 'italic'
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    fontStyle: 'italic'
  },
  stepsNav: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  stepContent: {
    marginBottom: 20
  },
  gestureBox: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6
  },
  gestureText: {
    fontSize: 18,
    fontWeight: 600
  },
  resultBox: {
    background: 'rgba(34,211,238,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  resultText: {
    fontSize: 15,
    color: '#22d3ee'
  },
  tipBox: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  carolTip: {
    fontSize: 12,
    lineHeight: 1.5,
    padding: 14,
    borderRadius: 12,
    border: '1px solid',
    marginBottom: 20
  },
  startBtn: {
    width: '100%',
    padding: 16,
    border: 'none',
    borderRadius: 12,
    color: 'black',
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    textTransform: 'uppercase'
  }
};

export default InstrumentGuide;
