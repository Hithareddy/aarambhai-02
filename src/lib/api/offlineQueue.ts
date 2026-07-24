import { apiRequest } from './http';

export interface QueuedActivitySession {
    id: string; // Local unique id for the queue
    activity_id: string;
    payload: Record<string, any>;
    timestamp: string;
}

const QUEUE_KEY = 'aarambh_offline_activity_queue';

export class OfflineQueueService {
    /**
     * Enqueue a session payload.
     * If online, tries to flush immediately. 
     * If offline or fails, saves to localStorage.
     */
    static async submitSession(activity_id: string, payload: Record<string, any>) {
        if (navigator.onLine) {
            try {
                await apiRequest(`/learning/activities/${activity_id}/session`, "POST", payload);
                return { status: "success", queued: false };
            } catch (err) {
                console.warn("Failed to sync activity session. Queueing locally.", err);
            }
        }

        // Queue locally
        const queue = this.getQueue();
        queue.push({
            id: crypto.randomUUID(),
            activity_id,
            payload,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        return { status: "queued", queued: true };
    }

    /**
     * Run the queue flush procedure. 
     * Recursively attempts to send buffered requests.
     */
    static async flush() {
        if (!navigator.onLine) return;

        const queue = this.getQueue();
        if (queue.length === 0) return;

        console.log(`[Offline Sync] Flushing ${queue.length} activities...`);
        const remaining = [];

        for (const item of queue) {
            try {
                await apiRequest(`/learning/activities/${item.activity_id}/session`, "POST", item.payload);
            } catch (e) {
                console.error(`[Offline Sync] Failed to sync item ${item.id}`, e);
                remaining.push(item);
            }
        }

        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    }

    static getQueue(): QueuedActivitySession[] {
        try {
            const data = localStorage.getItem(QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }
}

// Automatically bind window events to trigger flushing
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        OfflineQueueService.flush();
    });
}
