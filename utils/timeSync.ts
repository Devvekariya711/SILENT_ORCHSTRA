/**
 * Silent Orchestra - Time Synchronization Module
 * NTP-inspired clock synchronization for multi-device playback
 * Inspired by beatsync's millisecond-accurate synchronization
 */

export interface TimeSyncResult {
    offset: number;        // Local clock offset from server (ms)
    roundTrip: number;     // Network round-trip time (ms)
    syncTime: number;      // Synchronized global timestamp
    quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SyncMessage {
    type: 'SYNC_REQUEST' | 'SYNC_RESPONSE';
    clientTime?: number;
    serverTime?: number;
    requestId?: string;
}

/**
 * TimeSync - Maintains clock synchronization with the server
 * Uses NTP-like algorithm to calculate network offset
 */
export class TimeSync {
    private serverOffset: number = 0;
    private lastRoundTrip: number = 0;
    private syncHistory: { offset: number; rtt: number }[] = [];
    private readonly HISTORY_SIZE = 10;
    private syncInProgress: boolean = false;
    private socket: WebSocket | null = null;
    private onSyncUpdate?: (result: TimeSyncResult) => void;

    constructor() {
        // Initialize with local time
        this.serverOffset = 0;
    }

    /**
     * Connect to WebSocket and begin sync
     */
    connect(wsUrl: string, onUpdate?: (result: TimeSyncResult) => void): Promise<void> {
        this.onSyncUpdate = onUpdate;

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = () => {
                    console.log('[TimeSync] Connected to server');
                    this.performSync();
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === 'SYNC_RESPONSE') {
                            this.handleSyncResponse(msg);
                        }
                    } catch (e) {
                        // Non-sync message, ignore
                    }
                };

                this.socket.onerror = () => {
                    console.warn('[TimeSync] Connection error, using local time');
                    reject(new Error('WebSocket connection failed'));
                };

                this.socket.onclose = () => {
                    console.log('[TimeSync] Disconnected');
                    this.socket = null;
                };

            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Perform a sync measurement
     */
    performSync(): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;
        const requestId = Math.random().toString(36).substring(7);
        const clientTime = Date.now();

        const msg: SyncMessage = {
            type: 'SYNC_REQUEST',
            clientTime,
            requestId
        };

        // Store request time for RTT calculation
        (this as any)[`_sync_${requestId}`] = clientTime;

        this.socket.send(JSON.stringify(msg));

        // Timeout if no response
        setTimeout(() => {
            this.syncInProgress = false;
            delete (this as any)[`_sync_${requestId}`];
        }, 5000);
    }

    /**
     * Handle sync response from server
     */
    private handleSyncResponse(msg: SyncMessage): void {
        if (!msg.serverTime || !msg.requestId) return;

        const requestKey = `_sync_${msg.requestId}`;
        const requestTime = (this as any)[requestKey];
        if (!requestTime) return;

        const now = Date.now();
        const roundTrip = now - requestTime;

        // NTP-style offset calculation
        // Assume symmetric network delay
        const oneWay = roundTrip / 2;
        const offset = msg.serverTime - (requestTime + oneWay);

        // Cleanup
        delete (this as any)[requestKey];
        this.syncInProgress = false;

        // Store in history for averaging
        this.syncHistory.push({ offset, rtt: roundTrip });
        if (this.syncHistory.length > this.HISTORY_SIZE) {
            this.syncHistory.shift();
        }

        // Calculate average offset (weighted by RTT - lower RTT = better measurement)
        this.calculateWeightedOffset();
        this.lastRoundTrip = roundTrip;

        // Notify listeners
        if (this.onSyncUpdate) {
            this.onSyncUpdate(this.getSyncResult());
        }

        // Schedule next sync
        setTimeout(() => this.performSync(), 10000); // Sync every 10 seconds
    }

    /**
     * Calculate weighted average offset (lower RTT = higher weight)
     */
    private calculateWeightedOffset(): void {
        if (this.syncHistory.length === 0) return;

        let totalWeight = 0;
        let weightedSum = 0;

        for (const sample of this.syncHistory) {
            // Weight inversely proportional to RTT
            const weight = 1 / (sample.rtt + 1);
            weightedSum += sample.offset * weight;
            totalWeight += weight;
        }

        this.serverOffset = weightedSum / totalWeight;
    }

    /**
     * Get current sync status
     */
    getSyncResult(): TimeSyncResult {
        const quality = this.getSyncQuality();
        return {
            offset: this.serverOffset,
            roundTrip: this.lastRoundTrip,
            syncTime: this.now(),
            quality
        };
    }

    /**
     * Get sync quality based on RTT and offset stability
     */
    private getSyncQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
        if (this.syncHistory.length < 3) return 'poor';

        const avgRtt = this.syncHistory.reduce((sum, s) => sum + s.rtt, 0) / this.syncHistory.length;

        if (avgRtt < 50) return 'excellent';
        if (avgRtt < 100) return 'good';
        if (avgRtt < 200) return 'fair';
        return 'poor';
    }

    /**
     * Get synchronized time (server time)
     */
    now(): number {
        return Date.now() + this.serverOffset;
    }

    /**
     * Schedule an action to happen at a specific global time
     */
    scheduleAt(globalTime: number, callback: () => void): number {
        const localTime = globalTime - this.serverOffset;
        const delay = localTime - Date.now();

        if (delay <= 0) {
            callback();
            return 0;
        }

        return window.setTimeout(callback, delay) as unknown as number;
    }

    /**
     * Get time until a global timestamp
     */
    timeUntil(globalTime: number): number {
        return globalTime - this.now();
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.syncHistory = [];
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}

// Singleton instance
export const timeSync = new TimeSync();
