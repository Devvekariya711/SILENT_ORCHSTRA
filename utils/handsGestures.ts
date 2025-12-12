import { Hands, Results, NormalizedLandmarkList } from '@mediapipe/hands';

// Hand landmark indices
export const HandLandmarks = {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_FINGER_MCP: 5,
    INDEX_FINGER_PIP: 6,
    INDEX_FINGER_DIP: 7,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    MIDDLE_FINGER_DIP: 11,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
    RING_FINGER_DIP: 15,
    RING_FINGER_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20,
};

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface FingerState {
    extended: boolean;
    tip: Vector3D;
    velocity: Vector3D;
}

export interface HandData {
    landmarks: NormalizedLandmarkList;
    worldLandmarks: NormalizedLandmarkList;
    handedness: 'Left' | 'Right';
    velocity: Vector3D;
    acceleration: Vector3D;
    fingers: {
        thumb: FingerState;
        index: FingerState;
        middle: FingerState;
        ring: FingerState;
        pinky: FingerState;
    };
}

export interface TwoHandGestureData {
    leftHand: HandData | null;
    rightHand: HandData | null;
    timestamp: number;
}

interface PreviousHandData {
    landmarks: NormalizedLandmarkList;
    velocity: Vector3D;
    timestamp: number;
}

export class TwoHandGestureDetector {
    private hands: Hands | null = null;
    private camera: Camera | null = null;
    private callback: (data: TwoHandGestureData) => void;
    private previousLeftHand: PreviousHandData | null = null;
    private previousRightHand: PreviousHandData | null = null;
    // Track previous finger positions for per-finger velocity
    private previousFingerTips: {
        left: { [key: string]: { x: number; y: number; z: number; timestamp: number } };
        right: { [key: string]: { x: number; y: number; z: number; timestamp: number } };
    } = { left: {}, right: {} };
    private isInitialized = false;

    constructor(videoElement: HTMLVideoElement, onGesture: (data: TwoHandGestureData) => void) {
        this.callback = onGesture;
        this.initialize(videoElement);
    }

    private async initialize(videoElement: HTMLVideoElement) {
        try {
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,              // Track both hands
                modelComplexity: 1,          // 0=lite (fastest), 1=full (balanced), 2=heavy (most accurate)
                minDetectionConfidence: 0.3, // LOWERED for fast movements
                minTrackingConfidence: 0.3,  // LOWERED for fast movements
            });

            this.hands.onResults((results) => this.onResults(results));

            // Start camera
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.hands && videoElement) {
                        await this.hands.send({ image: videoElement });
                    }
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();
            this.isInitialized = true;
            console.log('✅ MediaPipe Hands initialized - 2-hand tracking active');
        } catch (error) {
            console.error('❌ Failed to initialize MediaPipe Hands:', error);
        }
    }

    private onResults(results: Results) {
        const gestureData: TwoHandGestureData = {
            leftHand: null,
            rightHand: null,
            timestamp: performance.now()
        };

        // Process each detected hand
        if (results.multiHandLandmarks && results.multiHandedness) {
            results.multiHandLandmarks.forEach((landmarks, index) => {
                const handedness = results.multiHandedness[index].label as 'Left' | 'Right';
                const worldLandmarks = results.multiHandWorldLandmarks?.[index] || landmarks;

                const handData: HandData = {
                    landmarks,
                    worldLandmarks,
                    handedness,
                    velocity: this.calculateVelocity(landmarks, handedness),
                    acceleration: this.calculateAcceleration(landmarks, handedness),
                    fingers: this.detectFingerStates(landmarks, handedness)
                };

                if (handedness === 'Left') {
                    gestureData.leftHand = handData;
                } else {
                    gestureData.rightHand = handData;
                }
            });
        }

        // Call callback with gesture data
        this.callback(gestureData);
    }

    private calculateVelocity(
        landmarks: NormalizedLandmarkList,
        handedness: 'Left' | 'Right'
    ): Vector3D {
        const previousHand = handedness === 'Left' ? this.previousLeftHand : this.previousRightHand;

        if (!previousHand) {
            // First frame for this hand, store and return zero velocity
            const newPrevious: PreviousHandData = {
                landmarks,
                velocity: { x: 0, y: 0, z: 0 },
                timestamp: performance.now()
            };
            if (handedness === 'Left') {
                this.previousLeftHand = newPrevious;
            } else {
                this.previousRightHand = newPrevious;
            }
            return { x: 0, y: 0, z: 0 };
        }

        // Use wrist (landmark 0) for overall hand velocity
        const currentWrist = landmarks[HandLandmarks.WRIST];
        const prevWrist = previousHand.landmarks[HandLandmarks.WRIST];
        const dt = (performance.now() - previousHand.timestamp) / 1000; // Convert to seconds

        if (dt === 0) return previousHand.velocity;

        const velocity: Vector3D = {
            x: (currentWrist.x - prevWrist.x) / dt,
            y: (currentWrist.y - prevWrist.y) / dt,
            z: ((currentWrist.z || 0) - (prevWrist.z || 0)) / dt
        };

        // Update previous hand data
        const newPrevious: PreviousHandData = {
            landmarks,
            velocity,
            timestamp: performance.now()
        };
        if (handedness === 'Left') {
            this.previousLeftHand = newPrevious;
        } else {
            this.previousRightHand = newPrevious;
        }

        return velocity;
    }

    private calculateAcceleration(
        landmarks: NormalizedLandmarkList,
        handedness: 'Left' | 'Right'
    ): Vector3D {
        const previousHand = handedness === 'Left' ? this.previousLeftHand : this.previousRightHand;

        if (!previousHand) {
            return { x: 0, y: 0, z: 0 };
        }

        const currentVelocity = this.calculateVelocity(landmarks, handedness);
        const dt = (performance.now() - previousHand.timestamp) / 1000;

        if (dt === 0) return { x: 0, y: 0, z: 0 };

        return {
            x: (currentVelocity.x - previousHand.velocity.x) / dt,
            y: (currentVelocity.y - previousHand.velocity.y) / dt,
            z: (currentVelocity.z - previousHand.velocity.z) / dt
        };
    }

    private detectFingerStates(landmarks: NormalizedLandmarkList, handedness: 'Left' | 'Right'): HandData['fingers'] {
        return {
            thumb: this.getFingerState('thumb', landmarks, handedness),
            index: this.getFingerState('index', landmarks, handedness),
            middle: this.getFingerState('middle', landmarks, handedness),
            ring: this.getFingerState('ring', landmarks, handedness),
            pinky: this.getFingerState('pinky', landmarks, handedness)
        };
    }

    private getFingerState(
        finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky',
        landmarks: NormalizedLandmarkList,
        handedness: 'Left' | 'Right'
    ): FingerState {
        // Landmark indices for each finger tip
        const tipIndices = {
            thumb: HandLandmarks.THUMB_TIP,
            index: HandLandmarks.INDEX_FINGER_TIP,
            middle: HandLandmarks.MIDDLE_FINGER_TIP,
            ring: HandLandmarks.RING_FINGER_TIP,
            pinky: HandLandmarks.PINKY_TIP
        };

        // Joint indices for extension check
        const fingerJoints = {
            thumb: [HandLandmarks.THUMB_CMC, HandLandmarks.THUMB_MCP, HandLandmarks.THUMB_IP, HandLandmarks.THUMB_TIP],
            index: [HandLandmarks.INDEX_FINGER_MCP, HandLandmarks.INDEX_FINGER_PIP, HandLandmarks.INDEX_FINGER_DIP, HandLandmarks.INDEX_FINGER_TIP],
            middle: [HandLandmarks.MIDDLE_FINGER_MCP, HandLandmarks.MIDDLE_FINGER_PIP, HandLandmarks.MIDDLE_FINGER_DIP, HandLandmarks.MIDDLE_FINGER_TIP],
            ring: [HandLandmarks.RING_FINGER_MCP, HandLandmarks.RING_FINGER_PIP, HandLandmarks.RING_FINGER_DIP, HandLandmarks.RING_FINGER_TIP],
            pinky: [HandLandmarks.PINKY_MCP, HandLandmarks.PINKY_PIP, HandLandmarks.PINKY_DIP, HandLandmarks.PINKY_TIP]
        };

        const tipIndex = tipIndices[finger];
        const tip = landmarks[tipIndex];
        const now = performance.now();
        const side = handedness.toLowerCase() as 'left' | 'right';

        // Calculate finger velocity
        const prevData = this.previousFingerTips[side][finger];
        let velocity: Vector3D = { x: 0, y: 0, z: 0 };

        if (prevData) {
            const dt = (now - prevData.timestamp) / 1000; // seconds
            if (dt > 0 && dt < 0.5) { // Ignore if too long (hand was lost)
                velocity = {
                    x: (tip.x - prevData.x) / dt,
                    y: (tip.y - prevData.y) / dt,
                    z: ((tip.z || 0) - prevData.z) / dt
                };
            }
        }

        // Store current position for next frame
        this.previousFingerTips[side][finger] = {
            x: tip.x,
            y: tip.y,
            z: tip.z || 0,
            timestamp: now
        };

        // Determine if finger is extended
        const joints = fingerJoints[finger];
        const pip = landmarks[joints[2]]; // Proximal interphalangeal joint
        const mcp = landmarks[joints[0]]; // Metacarpophalangeal joint

        let extended = false;
        if (finger === 'thumb') {
            // Thumb extends horizontally (away from palm)
            const wrist = landmarks[HandLandmarks.WRIST];
            extended = Math.abs(tip.x - wrist.x) > Math.abs(mcp.x - wrist.x);
        } else {
            // Other fingers extend vertically (upward)
            // Extended if tip is higher (lower y value) than joints
            extended = tip.y < pip.y && pip.y < mcp.y;
        }

        return {
            extended,
            tip: {
                x: tip.x,
                y: tip.y,
                z: tip.z || 0
            },
            velocity
        };
    }

    public destroy() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.hands) {
            this.hands.close();
        }
        this.isInitialized = false;
        console.log('🛑 MediaPipe Hands stopped');
    }

    public isReady(): boolean {
        return this.isInitialized;
    }
}
