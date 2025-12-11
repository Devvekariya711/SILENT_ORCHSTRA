
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { InstrumentRole, ConductorState, PlayerState, WSMessage } from '../types';
import { audioEngine } from '../utils/audio';
import { performanceMonitor } from '../utils/performanceMonitor';
import { TwoHandGestureDetector, TwoHandGestureData } from '../utils/handsGestures';
import {
    createInstrumentHandlers,
    InstrumentGestureHandlers,
    DrumHitEvent,
    PianoKeyEvent,
    GuitarStrumEvent,
    ThereminEvent,
    StringsEvent,
    PadsEvent
} from '../utils/instrumentGestures';
import { updateSpatialAudio } from '../utils/spatialAudio';
import PlayerList from './PlayerList';
import TutorialHUD from './TutorialHUD';
import InstrumentGuide from './InstrumentGuide';

// Declare MediaPipe globals (loaded via CDN)
declare global {
    interface Window {
        vision: any;
        drawConnectors: any;
        drawLandmarks: any;
        HAND_CONNECTIONS: any;
    }
}

interface StageProps {
    role: InstrumentRole;
    roomId: string;
    conductorState: ConductorState;
    setConductorState: (state: ConductorState) => void;
    onBack: () => void;
}

const Stage: React.FC<StageProps> = ({ role, roomId, conductorState, setConductorState, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gestureDetectorRef = useRef<TwoHandGestureDetector | null>(null);
    const gestureHandlersRef = useRef<InstrumentGestureHandlers | null>(null);

    const [status, setStatus] = useState("Initializing Vision...");
    const [lastVelocity, setLastVelocity] = useState(0);
    const [triggerVisual, setTriggerVisual] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [lastGesture, setLastGesture] = useState<string>('');
    const [handsDetected, setHandsDetected] = useState<number>(0);

    // Mock player data
    const [players, setPlayers] = useState([
        { id: '1', name: 'You', role, isPlaying: false, volume: 0, color: '#22d3ee' }
    ]);

    const socketRef = useRef<WebSocket | null>(null);

    // Initialize gesture handlers once
    useEffect(() => {
        gestureHandlersRef.current = createInstrumentHandlers();
        return () => {
            gestureHandlersRef.current = null;
        };
    }, []);

    // --- WEBSOCKET CONNECTION ---
    useEffect(() => {
        let ws: WebSocket;
        try {
            ws = new WebSocket('ws://localhost:8080');

            ws.onopen = () => {
                console.log('Connected to Orchestra Server');
                setStatus("Connected to Conductor");

                const joinMsg: WSMessage = { type: 'JOIN', roomId, role };
                ws.send(JSON.stringify(joinMsg));
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'CONDUCTOR_UPDATE') {
                        setConductorState(msg.data);
                        audioEngine.updateConductorState(msg.data);
                    }
                } catch (e) { console.error(e); }
            };

            ws.onerror = () => {
                setStatus("Offline (Demo Mode)");
            };

            socketRef.current = ws;
            return () => { ws.close(); };
        } catch (e) {
            console.log("Running in offline/demo mode");
            setStatus("Offline Mode");
        }
    }, [roomId, role, setConductorState]);

    // --- GESTURE PROCESSING ---
    const processGestureData = (data: TwoHandGestureData) => {
        if (!gestureHandlersRef.current) return;

        const handlers = gestureHandlersRef.current;
        const timestamp = data.timestamp;

        // Count detected hands for UI
        let handCount = 0;
        if (data.leftHand) handCount++;
        if (data.rightHand) handCount++;
        setHandsDetected(handCount);

        // Route to instrument-specific handler
        switch (role) {
            case InstrumentRole.DRUMS:
                handleDrums(handlers.drums.process(data), data, timestamp);
                break;
            case InstrumentRole.PIANO:
                handlePiano(handlers.piano.process(data), data, timestamp);
                break;
            case InstrumentRole.GUITAR:
                handleGuitar(handlers.guitar.process(data), data, timestamp);
                break;
            case InstrumentRole.BASS:
                handleBass(data, timestamp);
                break;
            case InstrumentRole.THEREMIN:
                handleTheremin(handlers.theremin.process(data), data, timestamp);
                break;
            case InstrumentRole.STRINGS:
                handleStrings(handlers.strings.process(data), data, timestamp);
                break;
            case InstrumentRole.PADS:
                handlePads(handlers.pads.process(data), data, timestamp);
                break;
        }
    };

    // --- INSTRUMENT HANDLERS ---
    const handleDrums = (events: DrumHitEvent[], data: TwoHandGestureData, timestamp: number) => {
        events.forEach(event => {
            // Play the drum sound
            audioEngine.triggerNote(InstrumentRole.DRUMS, event.velocity, event.position.y, event.position.x);

            // Update spatial audio
            updateSpatialAudio(InstrumentRole.DRUMS, event.position.x, event.position.y, event.velocity);

            // Visual feedback
            setLastVelocity(event.velocity);
            setTriggerVisual(true);
            setTimeout(() => setTriggerVisual(false), 100);
            setLastGesture(`${event.drumType} - ${event.hand}`);

            // Network sync
            sendNetworkUpdate(event.velocity, event.position.x, event.position.y, event.drumType, timestamp);
        });
    };

    const handlePiano = (events: PianoKeyEvent[], data: TwoHandGestureData, timestamp: number) => {
        events.forEach(event => {
            if (event.type === 'press') {
                // Map keyIndex to Y position for pitch
                const yPos = 1 - (event.keyIndex / 12);
                audioEngine.triggerNote(InstrumentRole.PIANO, event.velocity, yPos, 0.5);

                updateSpatialAudio(InstrumentRole.PIANO, 0.5, yPos, event.velocity);

                setLastVelocity(event.velocity);
                setTriggerVisual(true);
                setTimeout(() => setTriggerVisual(false), 100);
                setLastGesture(`Key ${event.keyIndex} - ${event.finger}`);

                sendNetworkUpdate(event.velocity, 0.5, yPos, `key-${event.keyIndex}`, timestamp);
            }
        });
    };

    const handleGuitar = (events: GuitarStrumEvent[], data: TwoHandGestureData, timestamp: number) => {
        events.forEach(event => {
            // Map string/fret to note
            const yPos = event.stringIndex / 6;
            audioEngine.triggerNote(InstrumentRole.GUITAR, event.velocity, yPos, 0.5);

            updateSpatialAudio(InstrumentRole.GUITAR, 0.5, yPos, event.velocity);

            setLastVelocity(event.velocity);
            setTriggerVisual(true);
            setTimeout(() => setTriggerVisual(false), 100);
            setLastGesture(`${event.type} - String ${event.stringIndex}`);

            sendNetworkUpdate(event.velocity, 0.5, yPos, event.type, timestamp);
        });
    };

    const handleBass = (data: TwoHandGestureData, timestamp: number) => {
        // Bass uses INDEX FINGER velocity for plucking (like bass finger technique)
        const hand = data.rightHand || data.leftHand;
        if (!hand) return;

        // Use INDEX FINGER velocity for pluck detection
        const indexFinger = hand.fingers.index;
        const fingerVelocityY = Math.abs(indexFinger.velocity.y);

        if (fingerVelocityY > 1.5) {
            const velocity = Math.min(1, fingerVelocityY / 4);
            const yPos = indexFinger.tip.y;
            const xPos = indexFinger.tip.x;

            audioEngine.triggerNote(InstrumentRole.BASS, velocity, yPos, xPos);
            updateSpatialAudio(InstrumentRole.BASS, xPos, yPos, velocity);

            setLastVelocity(velocity);
            setTriggerVisual(true);
            setTimeout(() => setTriggerVisual(false), 100);
            setLastGesture('Pluck');

            sendNetworkUpdate(velocity, xPos, yPos, 'pluck', timestamp);
        }
    };

    const handleTheremin = (event: ThereminEvent | null, data: TwoHandGestureData, timestamp: number) => {
        if (!event) return;

        if (event.isActive) {
            // Continuous theremin - trigger on every frame when hand detected
            audioEngine.triggerNote(InstrumentRole.THEREMIN, event.volume, 1 - event.pitch, 0.5);
            updateSpatialAudio(InstrumentRole.THEREMIN, 0.5, event.pitch, event.volume);

            setLastVelocity(event.volume);
            setLastGesture(`Pitch: ${Math.round(event.pitch * 100)}%`);
        }
    };

    const handleStrings = (event: StringsEvent | null, data: TwoHandGestureData, timestamp: number) => {
        if (!event) return;

        if (event.type === 'swell' || event.type === 'accent') {
            audioEngine.triggerNote(InstrumentRole.STRINGS, event.intensity, event.yPosition, event.spread);
            updateSpatialAudio(InstrumentRole.STRINGS, event.spread, event.yPosition, event.intensity);

            setLastVelocity(event.intensity);
            setTriggerVisual(true);
            setTimeout(() => setTriggerVisual(false), 150);
            setLastGesture(`${event.type} - Spread ${Math.round(event.spread * 100)}%`);

            sendNetworkUpdate(event.intensity, event.spread, event.yPosition, event.type, timestamp);
        }
    };

    const handlePads = (event: PadsEvent | null, data: TwoHandGestureData, timestamp: number) => {
        if (!event) return;

        if (event.type === 'start' || (event.type === 'sustain' && event.intensity > 0.3)) {
            audioEngine.triggerNote(InstrumentRole.PADS, event.intensity, 1 - event.position.y, event.position.x);
            updateSpatialAudio(InstrumentRole.PADS, event.position.x, event.position.y, event.intensity);

            setLastVelocity(event.intensity);
            setLastGesture(`${event.fingers} fingers open`);
        }
    };

    const sendNetworkUpdate = (velocity: number, x: number, y: number, zone: string, timestamp: number) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const payload: PlayerState = {
                role,
                velocity,
                isActive: true,
                handPosition: { x, y },
                zone,
                timestamp
            };
            const msg: WSMessage = { type: 'UPDATE', data: payload };
            socketRef.current.send(JSON.stringify(msg));
        }
    };

    // --- VISION SETUP with TwoHandGestureDetector ---
    useEffect(() => {
        const startGestureDetection = async () => {
            if (!videoRef.current) return;

            try {
                // Get camera stream first
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 }
                    }
                });

                videoRef.current.srcObject = stream;

                // Wait for video to load
                await new Promise<void>((resolve) => {
                    videoRef.current!.addEventListener("loadeddata", () => resolve(), { once: true });
                });

                // Initialize the TwoHandGestureDetector
                gestureDetectorRef.current = new TwoHandGestureDetector(
                    videoRef.current,
                    (data: TwoHandGestureData) => {
                        processGestureData(data);

                        // Draw hand skeleton on canvas
                        if (canvasRef.current && videoRef.current) {
                            const ctx = canvasRef.current.getContext('2d');
                            if (ctx) {
                                canvasRef.current.width = videoRef.current.videoWidth;
                                canvasRef.current.height = videoRef.current.videoHeight;
                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                                // Draw landmarks for both hands
                                [data.leftHand, data.rightHand].forEach(hand => {
                                    if (!hand) return;

                                    const w = canvasRef.current!.width;
                                    const h = canvasRef.current!.height;
                                    const color = hand.handedness === 'Left' ? '#00FF00' : '#00FFFF';

                                    // Hand connections (finger bones)
                                    const connections = [
                                        // Thumb
                                        [0, 1], [1, 2], [2, 3], [3, 4],
                                        // Index
                                        [0, 5], [5, 6], [6, 7], [7, 8],
                                        // Middle
                                        [0, 9], [9, 10], [10, 11], [11, 12],
                                        // Ring
                                        [0, 13], [13, 14], [14, 15], [15, 16],
                                        // Pinky
                                        [0, 17], [17, 18], [18, 19], [19, 20],
                                        // Palm
                                        [5, 9], [9, 13], [13, 17]
                                    ];

                                    // Draw connections (finger bones)
                                    ctx.strokeStyle = color;
                                    ctx.lineWidth = 2;
                                    connections.forEach(([start, end]) => {
                                        const p1 = hand.landmarks[start];
                                        const p2 = hand.landmarks[end];
                                        if (p1 && p2) {
                                            ctx.beginPath();
                                            ctx.moveTo(p1.x * w, p1.y * h);
                                            ctx.lineTo(p2.x * w, p2.y * h);
                                            ctx.stroke();
                                        }
                                    });

                                    // Draw all 21 landmarks
                                    for (let i = 0; i < 21; i++) {
                                        const landmark = hand.landmarks[i];
                                        if (landmark) {
                                            ctx.beginPath();
                                            // Tips are larger (indices 4, 8, 12, 16, 20)
                                            const isTip = [4, 8, 12, 16, 20].includes(i);
                                            const radius = isTip ? 8 : 4;
                                            ctx.arc(landmark.x * w, landmark.y * h, radius, 0, 2 * Math.PI);
                                            ctx.fillStyle = isTip ? color : 'rgba(255,255,255,0.8)';
                                            ctx.fill();
                                        }
                                    }

                                    // Draw wrist circle
                                    const wrist = hand.landmarks[0];
                                    if (wrist) {
                                        ctx.beginPath();
                                        ctx.arc(wrist.x * w, wrist.y * h, 12, 0, 2 * Math.PI);
                                        ctx.strokeStyle = color;
                                        ctx.lineWidth = 3;
                                        ctx.stroke();
                                    }
                                });
                            }
                        }
                    }
                );

                setStatus("Camera Active. Move hands to play!");

            } catch (error) {
                console.error("Vision Error:", error);
                setStatus("Camera Error. Check Permissions.");
            }
        };

        startGestureDetection();

        return () => {
            if (gestureDetectorRef.current) {
                gestureDetectorRef.current.destroy();
                gestureDetectorRef.current = null;
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [role]);

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 overflow-hidden">

            {/* Background Visualizer */}
            <div className="absolute inset-0 opacity-20 transition-all duration-1000 ease-in-out"
                style={{
                    backgroundColor: conductorState.mood.toLowerCase().includes("aggressive") ? "#500000" : "#000050",
                    filter: `blur(${conductorState.tempo / 5}px)`
                }}>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors bg-black/40 px-3 py-2 rounded-full backdrop-blur border border-white/10 hover:border-white/30"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold tracking-widest uppercase">Leave Stage</span>
            </button>

            {/* Hands Detected Indicator */}
            <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-black/40 px-3 py-2 rounded-full backdrop-blur border border-white/10">
                <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Hands:</span>
                <span className={`text-lg font-bold ${handsDetected > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {handsDetected}/2
                </span>
            </div>

            {/* Main Container */}
            <div className="z-10 w-full max-w-md p-4 flex flex-col items-center space-y-4">

                {/* Conductor HUD */}
                <div className="w-full bg-black/60 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg shadow-neon">
                    <h3 className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1">AI CONDUCTOR (ROOM {roomId})</h3>
                    <p className="text-2xl font-light text-white animate-pulse">{conductorState.instruction}</p>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                        <span>{conductorState.tempo} BPM</span>
                        <span className="uppercase text-white">{conductorState.key}</span>
                        <span>{conductorState.mood}</span>
                    </div>
                </div>

                {/* Camera View / Feedback */}
                <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 shadow-2xl transition-colors duration-100 ${triggerVisual ? 'border-cyan-400' : isMuted ? 'border-red-500' : 'border-white/10'}`}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-60 z-0"
                    />

                    {/* Hand Skeleton Canvas */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-10 pointer-events-none"
                    />

                    {/* Action Feedback Overlay */}
                    <div className={`absolute inset-0 bg-cyan-500/20 pointer-events-none transition-opacity duration-75 z-20 ${triggerVisual ? 'opacity-100' : 'opacity-0'}`}></div>

                    {/* Mute Feedback Overlay */}
                    <div className={`absolute inset-0 bg-red-500/30 pointer-events-none transition-opacity duration-75 z-20 ${isMuted ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white tracking-widest border-4 border-white p-2 transform -rotate-12">MUTE</span>
                        </div>
                    </div>

                    {/* Instrument-specific Visual Zones */}
                    {role === InstrumentRole.DRUMS && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none z-10">
                            <div className="absolute top-0 left-0 w-1/2 h-2/5 border-r border-b border-white/20 flex items-center justify-center text-xs uppercase">Hi-Hat</div>
                            <div className="absolute top-0 right-0 w-1/2 h-2/5 border-b border-white/20 flex items-center justify-center text-xs uppercase">Crash</div>
                            <div className="absolute top-[40%] left-0 w-[45%] h-[35%] border-r border-b border-white/20 flex items-center justify-center text-xs">Snare</div>
                            <div className="absolute top-[40%] left-[45%] w-[10%] h-[35%] border-r border-b border-white/20 flex items-center justify-center text-xs">Tom</div>
                            <div className="absolute top-[40%] right-0 w-[45%] h-[35%] border-b border-white/20 flex items-center justify-center text-xs uppercase">Floor Tom</div>
                            <div className="absolute bottom-0 left-0 w-full h-1/4 flex items-center justify-center text-xs uppercase bg-white/5">Kick</div>
                        </div>
                    )}

                    {role === InstrumentRole.THEREMIN && (
                        <div className="absolute inset-0 opacity-30 pointer-events-none z-10">
                            <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-purple-500/50 to-transparent flex items-center">
                                <span className="text-xs -rotate-90 text-white whitespace-nowrap">LOW PITCH</span>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cyan-500/50 to-transparent flex items-center justify-end">
                                <span className="text-xs -rotate-90 text-white whitespace-nowrap">HIGH PITCH</span>
                            </div>
                        </div>
                    )}

                    {/* Velocity Meter */}
                    <div className="absolute bottom-4 left-4 z-20">
                        <div className="text-xs uppercase text-gray-400">Velocity</div>
                        <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                            <div
                                className="h-full bg-cyan-400 transition-all duration-75"
                                style={{ width: `${lastVelocity * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Instrument & Gesture Display */}
                    <div className="absolute top-4 right-4 text-right z-20">
                        <div className="text-xs uppercase text-gray-400">Instrument</div>
                        <div className="text-xl font-bold text-white tracking-widest">{role}</div>
                        {lastGesture && (
                            <div className="text-xs text-cyan-400 mt-1">{lastGesture}</div>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="text-xs font-mono text-gray-500">
                    SYSTEM: {status}
                </div>

            </div>
        </div>
    );
};

export default Stage;
