/**
 * Performance Monitor - Measure and log latency metrics
 * Helps identify bottlenecks and verify improvements
 */

interface LatencyMetrics {
    gestureDetection: number;
    audioTrigger: number;
    totalLatency: number;
    framerate: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: LatencyMetrics[] = [];
    private maxSamples = 100;
    private gestureStartTime: number = 0;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;

    markGestureStart(): void {
        this.gestureStartTime = performance.now();
    }

    markGestureDetected(): number {
        if (!this.gestureStartTime) return 0;
        return performance.now() - this.gestureStartTime;
    }

    recordLatency(gestureTime: number, audioTime: number): void {
        const totalLatency = audioTime - this.gestureStartTime;
        const metric: LatencyMetrics = {
            gestureDetection: gestureTime,
            audioTrigger: audioTime - (this.gestureStartTime + gestureTime),
            totalLatency,
            framerate: this.getFramerate(),
            timestamp: Date.now()
        };
        this.metrics.push(metric);
        if (this.metrics.length > this.maxSamples) {
            this.metrics.shift();
        }
        if (totalLatency > 100) {
            console.warn(`⚠️ High latency: ${totalLatency.toFixed(0)}ms`);
        }
    }

    updateFrame(): void {
        const now = performance.now();
        if (this.lastFrameTime) this.frameCount++;
        this.lastFrameTime = now;
    }

    getFramerate(): number {
        const recentMetrics = this.metrics.slice(-30);
        if (recentMetrics.length === 0) return 0;
        const avgFrameTime = recentMetrics.reduce((sum, m) => sum + m.gestureDetection, 0) / recentMetrics.length;
        return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }

    getAverageLatency(): { gesture: number; audio: number; total: number; fps: number } {
        if (this.metrics.length === 0) return { gesture: 0, audio: 0, total: 0, fps: 0 };
        const sum = this.metrics.reduce((acc, m) => ({
            gesture: acc.gesture + m.gestureDetection,
            audio: acc.audio + m.audioTrigger,
            total: acc.total + m.totalLatency,
            fps: acc.fps + m.framerate
        }), { gesture: 0, audio: 0, total: 0, fps: 0 });
        const count = this.metrics.length;
        return {
            gesture: sum.gesture / count,
            audio: sum.audio / count,
            total: sum.total / count,
            fps: sum.fps / count
        };
    }

    getReport(): string {
        const avg = this.getAverageLatency();
        return `📊 Latency: ${avg.total.toFixed(0)}ms | FPS: ${avg.fps.toFixed(0)} | ${avg.total < 50 ? '✅' : '⚠️'}`;
    }

    clear(): void {
        this.metrics = [];
        this.frameCount = 0;
    }

    exportMetrics(): LatencyMetrics[] {
        return [...this.metrics];
    }
}

export const performanceMonitor = new PerformanceMonitor();
