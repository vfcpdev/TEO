import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { NetworkService } from './network.service';
import { Preferences } from '@capacitor/preferences';
import { GoogleCalendarService } from './integrations/google-calendar.service';
import { ToastService } from './toast.service';

export type SyncOperationType = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncOperation {
    id: string; // Unique ID for the operation
    type: SyncOperationType;
    entity: 'REGISTRO'; // Extendable for other entities
    payload: any;
    timestamp: number;
    retryCount: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

@Injectable({
    providedIn: 'root'
})
export class SyncQueueService {
    private networkService = inject(NetworkService);
    private googleCalendar = inject(GoogleCalendarService);
    private toastService = inject(ToastService);

    private readonly STORAGE_KEY = 'sync_queue';

    // Signals
    queue = signal<SyncOperation[]>([]);
    isSyncing = signal<boolean>(false);
    private lastError = signal<string | null>(null);

    // Computed Status
    readonly syncStatus = computed<SyncStatus>(() => {
        if (!this.networkService.isOnline()) return 'offline';
        if (this.isSyncing()) return 'syncing';
        if (this.lastError()) return 'error';
        return 'idle';
    });

    constructor() {
        this.loadQueue();

        // Auto-process when coming online
        effect(() => {
            const online = this.networkService.isOnline();
            if (online && this.queue().length > 0) {
                this.processQueue();
            }
        });
    }

    private async loadQueue() {
        const { value } = await Preferences.get({ key: this.STORAGE_KEY });
        if (value) {
            this.queue.set(JSON.parse(value));
        }
    }

    private async saveQueue(queue: SyncOperation[]) {
        this.queue.set(queue);
        await Preferences.set({
            key: this.STORAGE_KEY,
            value: JSON.stringify(queue)
        });
    }

    async addOperation(type: SyncOperationType, entity: 'REGISTRO', payload: any) {
        const op: SyncOperation = {
            id: crypto.randomUUID(),
            type,
            entity,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };

        const currentQueue = this.queue();
        await this.saveQueue([...currentQueue, op]);

        // Try to process immediately if online
        if (this.networkService.isOnline()) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isSyncing() || this.queue().length === 0 || !this.networkService.isOnline()) return;

        this.isSyncing.set(true);
        this.lastError.set(null);

        const queue = [...this.queue()];
        const remainingQueue: SyncOperation[] = [];
        let processedCount = 0;
        let hasError = false;

        for (const op of queue) {
            try {
                await this.executeOperation(op);
                processedCount++;
            } catch (error) {
                console.error('[SyncQueue] Operation failed', op, error);
                op.retryCount++;
                if (op.retryCount < 5) {
                    remainingQueue.push(op);
                }
                hasError = true;
            }
        }

        await this.saveQueue(remainingQueue);
        this.isSyncing.set(false);

        if (hasError) {
            this.lastError.set('Algunos elementos no se pudieron sincronizar.');
        }

        if (processedCount > 0) {
            this.toastService.success(`Sincronizados ${processedCount} cambios pendientes`);
        }
    }

    private async executeOperation(op: SyncOperation) {
        if (op.entity === 'REGISTRO') {
            switch (op.type) {
                case 'CREATE':
                case 'UPDATE':
                    await this.googleCalendar.upsertEvent(op.payload);
                    break;
                case 'DELETE':
                    await this.googleCalendar.deleteEvent(op.payload.id || op.payload);
                    break;
            }
        }
    }
}
