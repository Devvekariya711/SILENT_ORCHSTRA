/**
 * Silent Orchestra - Room Manager
 * Handles room creation, joining, and safety codes (like beatsync)
 */

export interface RoomConfig {
    roomId: string;
    safetyCode?: string;  // Optional password
    maxPlayers: number;
    createdAt: number;
    hostId: string;
}

export interface RoomJoinResult {
    success: boolean;
    error?: string;
    room?: RoomConfig;
    playerId?: string;
}

export interface RoomPlayer {
    id: string;
    nickname?: string;
    instrument: string;
    joinedAt: number;
    isHost: boolean;
}

/**
 * Generate a random room code (4-6 alphanumeric characters)
 */
export function generateRoomCode(length: number = 4): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0,O,1,I)
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Generate a safety code (4-digit PIN)
 */
export function generateSafetyCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
    return /^[A-Z0-9]{4,6}$/i.test(code);
}

/**
 * Validate safety code format
 */
export function isValidSafetyCode(code: string): boolean {
    return /^\d{4}$/.test(code);
}

/**
 * RoomManager - Client-side room management
 */
export class RoomManager {
    private currentRoom: RoomConfig | null = null;
    private playerId: string;
    private socket: WebSocket | null = null;
    private players: Map<string, RoomPlayer> = new Map();
    private onPlayersUpdate?: (players: RoomPlayer[]) => void;
    private onRoomEvent?: (event: string, data: any) => void;

    constructor() {
        this.playerId = generatePlayerId();
    }

    /**
     * Create a new room
     */
    async createRoom(options: {
        useSafetyCode?: boolean;
        maxPlayers?: number;
        wsUrl?: string;
    } = {}): Promise<RoomJoinResult> {
        const { useSafetyCode = false, maxPlayers = 8, wsUrl = 'ws://localhost:8080' } = options;

        const roomConfig: RoomConfig = {
            roomId: generateRoomCode(),
            safetyCode: useSafetyCode ? generateSafetyCode() : undefined,
            maxPlayers,
            createdAt: Date.now(),
            hostId: this.playerId
        };

        try {
            // Connect to server and create room
            await this.connect(wsUrl);

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                const msg = {
                    type: 'CREATE_ROOM',
                    roomId: roomConfig.roomId,
                    safetyCode: roomConfig.safetyCode,
                    maxPlayers: roomConfig.maxPlayers,
                    hostId: this.playerId
                };
                this.socket.send(JSON.stringify(msg));
            }

            this.currentRoom = roomConfig;

            // Add self as host
            this.players.set(this.playerId, {
                id: this.playerId,
                instrument: 'NONE',
                joinedAt: Date.now(),
                isHost: true
            });

            return {
                success: true,
                room: roomConfig,
                playerId: this.playerId
            };
        } catch (error) {
            // Offline mode - still create room locally
            console.log('[RoomManager] Offline mode - room created locally');
            this.currentRoom = roomConfig;

            return {
                success: true,
                room: roomConfig,
                playerId: this.playerId
            };
        }
    }

    /**
     * Join an existing room
     */
    async joinRoom(
        roomId: string,
        safetyCode?: string,
        wsUrl: string = 'ws://localhost:8080'
    ): Promise<RoomJoinResult> {
        if (!isValidRoomCode(roomId)) {
            return { success: false, error: 'Invalid room code format' };
        }

        if (safetyCode && !isValidSafetyCode(safetyCode)) {
            return { success: false, error: 'Invalid safety code format' };
        }

        try {
            await this.connect(wsUrl);

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                const msg = {
                    type: 'JOIN_ROOM',
                    roomId: roomId.toUpperCase(),
                    safetyCode,
                    playerId: this.playerId
                };
                this.socket.send(JSON.stringify(msg));
            }

            this.currentRoom = {
                roomId: roomId.toUpperCase(),
                safetyCode,
                maxPlayers: 8,
                createdAt: Date.now(),
                hostId: ''
            };

            return {
                success: true,
                room: this.currentRoom,
                playerId: this.playerId
            };
        } catch (error) {
            // Offline mode - simulate join
            console.log('[RoomManager] Offline mode - joining room locally');
            this.currentRoom = {
                roomId: roomId.toUpperCase(),
                safetyCode,
                maxPlayers: 8,
                createdAt: Date.now(),
                hostId: ''
            };

            return {
                success: true,
                room: this.currentRoom,
                playerId: this.playerId
            };
        }
    }

    /**
     * Connect to WebSocket server
     */
    private connect(wsUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = () => {
                    console.log('[RoomManager] Connected to server');
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.socket.onerror = () => {
                    reject(new Error('Connection failed'));
                };

                this.socket.onclose = () => {
                    console.log('[RoomManager] Disconnected');
                    this.socket = null;
                };

                // Timeout after 3 seconds
                setTimeout(() => {
                    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
                        this.socket.close();
                        reject(new Error('Connection timeout'));
                    }
                }, 3000);

            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(data: string): void {
        try {
            const msg = JSON.parse(data);

            switch (msg.type) {
                case 'PLAYER_JOINED':
                    this.players.set(msg.playerId, {
                        id: msg.playerId,
                        nickname: msg.nickname,
                        instrument: msg.instrument || 'NONE',
                        joinedAt: Date.now(),
                        isHost: false
                    });
                    this.notifyPlayersUpdate();
                    break;

                case 'PLAYER_LEFT':
                    this.players.delete(msg.playerId);
                    this.notifyPlayersUpdate();
                    break;

                case 'ROOM_STATE':
                    // Full room state sync
                    this.players.clear();
                    for (const player of msg.players) {
                        this.players.set(player.id, player);
                    }
                    this.notifyPlayersUpdate();
                    break;

                case 'INSTRUMENT_CHANGE':
                    const player = this.players.get(msg.playerId);
                    if (player) {
                        player.instrument = msg.instrument;
                        this.notifyPlayersUpdate();
                    }
                    break;

                default:
                    if (this.onRoomEvent) {
                        this.onRoomEvent(msg.type, msg);
                    }
            }
        } catch (e) {
            // Non-JSON message, ignore
        }
    }

    /**
     * Notify players update
     */
    private notifyPlayersUpdate(): void {
        if (this.onPlayersUpdate) {
            this.onPlayersUpdate(Array.from(this.players.values()));
        }
    }

    /**
     * Update own instrument
     */
    updateInstrument(instrument: string): void {
        const player = this.players.get(this.playerId);
        if (player) {
            player.instrument = instrument;
        }

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const msg = {
                type: 'INSTRUMENT_CHANGE',
                playerId: this.playerId,
                instrument
            };
            this.socket.send(JSON.stringify(msg));
        }
    }

    /**
     * Leave current room
     */
    leaveRoom(): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const msg = {
                type: 'LEAVE_ROOM',
                playerId: this.playerId
            };
            this.socket.send(JSON.stringify(msg));
            this.socket.close();
        }

        this.currentRoom = null;
        this.players.clear();
        this.socket = null;
    }

    /**
     * Set callbacks
     */
    onPlayers(callback: (players: RoomPlayer[]) => void): void {
        this.onPlayersUpdate = callback;
    }

    onEvent(callback: (event: string, data: any) => void): void {
        this.onRoomEvent = callback;
    }

    /**
     * Get current room info
     */
    getRoom(): RoomConfig | null {
        return this.currentRoom;
    }

    /**
     * Get all players
     */
    getPlayers(): RoomPlayer[] {
        return Array.from(this.players.values());
    }

    /**
     * Get own player ID
     */
    getPlayerId(): string {
        return this.playerId;
    }

    /**
     * Check if host
     */
    isHost(): boolean {
        return this.currentRoom?.hostId === this.playerId;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const roomManager = new RoomManager();
