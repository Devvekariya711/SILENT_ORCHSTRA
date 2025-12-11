/**
 * Interactive Music Tutorial - Learn to Play with Famous Melodies! 🎵
 * Onboarding experience for new users with iconic songs
 */

import React, { useState, useEffect } from 'react';
import { InstrumentRole } from '../types';
import { audioEngine } from '../utils/audio';

interface MusicTutorialProps {
    instrument: InstrumentRole;
    onComplete: () => void;
    onSkip: () => void;
}

// Song data for each melody
interface Song {
    id: string;
    title: string;
    artist: string;
    emoji: string;
    color: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    bpm: number;
    pattern: { y: number; beat: number; label: string }[]; // y = 0-1 position, beat = timing
    instructions: string[];
}

const SONGS: Song[] = [
    {
        id: 'carol',
        title: 'Carol of the Bells',
        artist: 'Ukrainian Carol',
        emoji: '🔔',
        color: '#22d3ee',
        difficulty: 'Easy',
        bpm: 150,
        pattern: [
            { y: 0.3, beat: 1, label: 'G' },
            { y: 0.35, beat: 2, label: 'F#' },
            { y: 0.3, beat: 3, label: 'G' },
            { y: 0.5, beat: 4, label: 'E' },
            { y: 0.3, beat: 5, label: 'G' },
            { y: 0.35, beat: 6, label: 'F#' },
            { y: 0.3, beat: 7, label: 'G' },
            { y: 0.5, beat: 8, label: 'E' },
        ],
        instructions: [
            '🔔 The iconic "Ding Dong" pattern',
            '☝️ Use your index finger',
            '⬆️⬇️ Move to the highlighted zones',
            '🎵 Follow the falling notes!'
        ]
    },
    {
        id: 'kgf',
        title: 'KGF Theme',
        artist: 'Ravi Basrur',
        emoji: '⚔️',
        color: '#ef4444',
        difficulty: 'Medium',
        bpm: 90,
        pattern: [
            { y: 0.8, beat: 1, label: 'BOOM' },
            { y: 0.8, beat: 2, label: 'BOOM' },
            { y: 0.8, beat: 3, label: 'BOOM' },
            { y: 0.4, beat: 4, label: 'TAK' },
            { y: 0.8, beat: 5, label: 'BOOM' },
            { y: 0.4, beat: 6, label: 'TAK' },
            { y: 0.4, beat: 7, label: 'TAK' },
            { y: 0.8, beat: 8, label: 'BOOM' },
        ],
        instructions: [
            '⚔️ The powerful Rocky Bhai rhythm!',
            '💪 Strong, dramatic hits',
            '🥁 LOW position = thundering bass',
            '💥 Feel the power in each hit!'
        ]
    },
    {
        id: 'wednesday',
        title: 'Paint It Black',
        artist: 'Wednesday Theme',
        emoji: '🖤',
        color: '#8b5cf6',
        difficulty: 'Medium',
        bpm: 120,
        pattern: [
            { y: 0.2, beat: 1, label: 'Da' },
            { y: 0.3, beat: 1.5, label: 'da' },
            { y: 0.4, beat: 2, label: 'da' },
            { y: 0.5, beat: 2.5, label: 'da' },
            { y: 0.6, beat: 3, label: 'da' },
            { y: 0.5, beat: 3.5, label: 'da' },
            { y: 0.4, beat: 4, label: 'DAAA' },
        ],
        instructions: [
            '🖤 Wednesday\'s iconic cello piece',
            '🎻 Smooth, flowing movements',
            '⬇️ Descend slowly then ascend',
            '✨ Dark and mysterious!'
        ]
    },
    {
        id: 'tara',
        title: 'Tara Rum Pum',
        artist: 'Popular Melody',
        emoji: '🎪',
        color: '#fbbf24',
        difficulty: 'Easy',
        bpm: 100,
        pattern: [
            { y: 0.3, beat: 1, label: 'Ta' },
            { y: 0.4, beat: 2, label: 'ra' },
            { y: 0.5, beat: 3, label: 'ra' },
            { y: 0.4, beat: 4, label: 'ra' },
            { y: 0.3, beat: 5, label: 'ra' },
            { y: 0.5, beat: 7, label: 'TARA!' },
        ],
        instructions: [
            '🎪 Fun and playful rhythm!',
            '👆 Bouncy finger movements',
            '🎵 Ta-ra-ra-ra-ra... TA-RA!',
            '😄 Let the joy flow!'
        ]
    }
];

// Tutorial steps
const TUTORIAL_STEPS = [
    { id: 'welcome', title: 'Welcome to the Stage! 🎭' },
    { id: 'hands', title: 'Position Your Hands 🤚' },
    { id: 'gesture', title: 'Learn the Gesture ☝️' },
    { id: 'practice', title: 'Practice with Music 🎵' },
    { id: 'play', title: 'You\'re Ready! 🎉' }
];

const MusicTutorial: React.FC<MusicTutorialProps> = ({ instrument, onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedSong, setSelectedSong] = useState<Song>(SONGS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [score, setScore] = useState(0);
    const [showSongSelect, setShowSongSelect] = useState(false);

    // Get instrument-specific content
    const getInstrumentEmoji = () => {
        const emojis: Record<InstrumentRole, string> = {
            [InstrumentRole.DRUMS]: '🥁',
            [InstrumentRole.PIANO]: '🎹',
            [InstrumentRole.GUITAR]: '🎸',
            [InstrumentRole.BASS]: '🎻',
            [InstrumentRole.THEREMIN]: '〰️',
            [InstrumentRole.STRINGS]: '🎼',
            [InstrumentRole.PADS]: '🌌',
            [InstrumentRole.NONE]: '🎵'
        };
        return emojis[instrument];
    };

    const getInstrumentName = () => {
        const names: Record<InstrumentRole, string> = {
            [InstrumentRole.DRUMS]: 'Air Drums',
            [InstrumentRole.PIANO]: 'Air Piano',
            [InstrumentRole.GUITAR]: 'Air Guitar',
            [InstrumentRole.BASS]: 'Air Bass',
            [InstrumentRole.THEREMIN]: 'Theremin',
            [InstrumentRole.STRINGS]: 'Strings',
            [InstrumentRole.PADS]: 'Ambient Pads',
            [InstrumentRole.NONE]: 'Instrument'
        };
        return names[instrument];
    };

    const getGestureGuide = () => {
        const guides: Record<InstrumentRole, { main: string; tips: string[] }> = {
            [InstrumentRole.DRUMS]: {
                main: '☝️ Flick your INDEX FINGER down like a drumstick!',
                tips: ['Point your finger forward', 'Quick downward flick', 'Left→Right changes drums']
            },
            [InstrumentRole.PIANO]: {
                main: '🖐️ TAP each finger down independently!',
                tips: ['Spread all 10 fingers', 'Tap down = play note', 'Up/Down changes pitch']
            },
            [InstrumentRole.GUITAR]: {
                main: '👆 SWIPE your finger left/right to strum!',
                tips: ['One hand holds position', 'Other hand strums', 'Horizontal motion']
            },
            [InstrumentRole.BASS]: {
                main: '☝️ PLUCK with your index finger UP/DOWN!',
                tips: ['Like plucking a real bass', 'Deep, deliberate motions', 'Feel the groove']
            },
            [InstrumentRole.THEREMIN]: {
                main: '〰️ FLOAT your finger through the air!',
                tips: ['Up/Down = pitch change', 'Left/Right = volume', 'Smooth movements']
            },
            [InstrumentRole.STRINGS]: {
                main: '🎼 CONDUCT with your finger like a baton!',
                tips: ['Up = crescendo swell', 'Down = accent', 'Wide = full sound']
            },
            [InstrumentRole.PADS]: {
                main: '🖐️ OPEN your palm and float SLOWLY!',
                tips: ['Spread fingers = richer', 'Slow movements only', 'Very zen']
            },
            [InstrumentRole.NONE]: {
                main: 'Select an instrument first!',
                tips: []
            }
        };
        return guides[instrument];
    };

    // Practice mode beat animation
    useEffect(() => {
        if (isPlaying && currentStep === 3) {
            const beatDuration = (60 / selectedSong.bpm) * 1000;
            const maxBeat = Math.max(...selectedSong.pattern.map(p => p.beat));

            const interval = setInterval(() => {
                setCurrentBeat(prev => {
                    const next = prev + 0.5;
                    if (next > maxBeat + 1) {
                        return 0;
                    }
                    return next;
                });
            }, beatDuration / 2);

            return () => clearInterval(interval);
        }
    }, [isPlaying, currentStep, selectedSong]);

    const nextStep = () => {
        if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0: // Welcome
                return (
                    <div style={styles.stepContent}>
                        <div style={{ fontSize: 80, marginBottom: 20 }}>{getInstrumentEmoji()}</div>
                        <h2 style={{ fontSize: 28, marginBottom: 10 }}>Welcome to {getInstrumentName()}!</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 300, margin: '0 auto' }}>
                            Let's learn how to play with your hands in the air.
                            No physical instrument needed - just your gestures!
                        </p>
                    </div>
                );

            case 1: // Position hands
                return (
                    <div style={styles.stepContent}>
                        <div style={{ fontSize: 60, marginBottom: 20 }}>🤚 📷 🤚</div>
                        <h2 style={{ fontSize: 24, marginBottom: 15 }}>Position Your Hands</h2>
                        <div style={styles.tipBox}>
                            <div style={styles.tipItem}>✅ Stand about arm's length from camera</div>
                            <div style={styles.tipItem}>✅ Make sure both hands are visible</div>
                            <div style={styles.tipItem}>✅ Good lighting helps tracking</div>
                            <div style={styles.tipItem}>✅ Keep hands inside the camera frame</div>
                        </div>
                    </div>
                );

            case 2: // Gesture
                return (
                    <div style={styles.stepContent}>
                        <div style={{ fontSize: 60, marginBottom: 20 }}>☝️</div>
                        <h2 style={{ fontSize: 22, marginBottom: 15 }}>Your Gesture</h2>
                        <div style={{ ...styles.gestureBox, borderColor: selectedSong.color }}>
                            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 15 }}>
                                {getGestureGuide().main}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {getGestureGuide().tips.map((tip, i) => (
                                    <div key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                                        {i + 1}. {tip}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 3: // Practice with music
                return (
                    <div style={styles.stepContent}>
                        {!showSongSelect ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                    <span style={{ fontSize: 40 }}>{selectedSong.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedSong.title}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedSong.artist}</div>
                                    </div>
                                    <button
                                        onClick={() => setShowSongSelect(true)}
                                        style={styles.changeSongBtn}
                                    >
                                        Change ▼
                                    </button>
                                </div>

                                {/* Visual rhythm guide */}
                                <div style={styles.rhythmContainer}>
                                    <div style={styles.rhythmTrack}>
                                        {selectedSong.pattern.map((note, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    ...styles.noteMarker,
                                                    top: `${note.y * 100}%`,
                                                    left: `${(note.beat / 8) * 100}%`,
                                                    background: currentBeat >= note.beat - 0.5 && currentBeat <= note.beat + 0.5
                                                        ? selectedSong.color
                                                        : 'rgba(255,255,255,0.3)',
                                                    transform: currentBeat >= note.beat - 0.5 && currentBeat <= note.beat + 0.5
                                                        ? 'scale(1.3)'
                                                        : 'scale(1)'
                                                }}
                                            >
                                                {note.label}
                                            </div>
                                        ))}
                                        {/* Playhead */}
                                        <div
                                            style={{
                                                ...styles.playhead,
                                                left: `${(currentBeat / 8) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 15 }}>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        style={{ ...styles.playBtn, background: selectedSong.color }}
                                    >
                                        {isPlaying ? '⏸️ Pause' : '▶️ Play Pattern'}
                                    </button>
                                </div>

                                {/* Quick tips for this song */}
                                <div style={{ marginTop: 20 }}>
                                    {selectedSong.instructions.map((tip, i) => (
                                        <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                                            {tip}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* Song selection */
                            <div>
                                <h3 style={{ marginBottom: 15 }}>Choose a Song to Practice:</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {SONGS.map(song => (
                                        <button
                                            key={song.id}
                                            onClick={() => { setSelectedSong(song); setShowSongSelect(false); setCurrentBeat(0); }}
                                            style={{
                                                ...styles.songOption,
                                                borderColor: song.color,
                                                background: selectedSong.id === song.id ? `${song.color}30` : 'transparent'
                                            }}
                                        >
                                            <span style={{ fontSize: 24 }}>{song.emoji}</span>
                                            <div style={{ flex: 1, textAlign: 'left' }}>
                                                <div style={{ fontWeight: 600 }}>{song.title}</div>
                                                <div style={{ fontSize: 12, opacity: 0.6 }}>{song.artist}</div>
                                            </div>
                                            <span style={{
                                                fontSize: 10,
                                                padding: '4px 8px',
                                                borderRadius: 10,
                                                background: song.difficulty === 'Easy' ? '#22c55e' : song.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                                                color: 'black'
                                            }}>
                                                {song.difficulty}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 4: // Ready
                return (
                    <div style={styles.stepContent}>
                        <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
                        <h2 style={{ fontSize: 28, marginBottom: 10 }}>You're Ready!</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 300, margin: '0 auto 20px' }}>
                            Now go create some music! Remember, the more you practice, the better you'll get.
                        </p>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>
                            {getInstrumentEmoji()} 🎵 ✨
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={styles.overlay}>
            {/* Skip button (side button) */}
            <button onClick={onSkip} style={styles.skipBtn}>
                Skip Tutorial →
            </button>

            <div style={styles.modal}>
                {/* Progress dots */}
                <div style={styles.progressDots}>
                    {TUTORIAL_STEPS.map((step, i) => (
                        <div
                            key={step.id}
                            style={{
                                ...styles.dot,
                                background: i === currentStep ? selectedSong.color : 'rgba(255,255,255,0.2)',
                                width: i === currentStep ? 30 : 10
                            }}
                        />
                    ))}
                </div>

                {/* Step title */}
                <div style={styles.stepTitle}>
                    {TUTORIAL_STEPS[currentStep].title}
                </div>

                {/* Content */}
                {renderStep()}

                {/* Navigation */}
                <div style={styles.navigation}>
                    {currentStep > 0 && (
                        <button onClick={prevStep} style={styles.navBtn}>
                            ← Back
                        </button>
                    )}
                    <button
                        onClick={nextStep}
                        style={{ ...styles.navBtn, ...styles.nextBtn, background: selectedSong.color }}
                    >
                        {currentStep === TUTORIAL_STEPS.length - 1 ? 'Start Playing! 🎵' : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,10,30,0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000
    },
    skipBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: 20,
        cursor: 'pointer',
        fontSize: 14
    },
    modal: {
        background: 'rgba(20,20,30,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: '40px 30px',
        maxWidth: 500,
        width: '90%',
        color: 'white',
        textAlign: 'center'
    },
    progressDots: {
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 30
    },
    dot: {
        height: 10,
        borderRadius: 5,
        transition: 'all 0.3s'
    },
    stepTitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: 25
    },
    stepContent: {
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    tipBox: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 20,
        textAlign: 'left'
    },
    tipItem: {
        fontSize: 14,
        marginBottom: 10,
        color: 'rgba(255,255,255,0.8)'
    },
    gestureBox: {
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid',
        borderRadius: 16,
        padding: 25,
        maxWidth: 350
    },
    rhythmContainer: {
        width: '100%',
        height: 150,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden'
    },
    rhythmTrack: {
        position: 'absolute',
        inset: 10,
    },
    noteMarker: {
        position: 'absolute',
        width: 40,
        height: 30,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        color: 'black',
        transition: 'all 0.2s',
        transform: 'translateX(-50%)'
    },
    playhead: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 3,
        background: 'white',
        borderRadius: 2,
        transition: 'left 0.1s linear'
    },
    playBtn: {
        padding: '12px 24px',
        border: 'none',
        borderRadius: 20,
        color: 'black',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer'
    },
    changeSongBtn: {
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: 15,
        fontSize: 12,
        cursor: 'pointer'
    },
    songOption: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 15,
        background: 'transparent',
        border: '1px solid',
        borderRadius: 12,
        color: 'white',
        cursor: 'pointer',
        textAlign: 'left'
    },
    navigation: {
        display: 'flex',
        justifyContent: 'center',
        gap: 15,
        marginTop: 30
    },
    navBtn: {
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 12,
        color: 'white',
        fontSize: 14,
        cursor: 'pointer'
    },
    nextBtn: {
        color: 'black',
        fontWeight: 700,
        border: 'none'
    }
};

export default MusicTutorial;
