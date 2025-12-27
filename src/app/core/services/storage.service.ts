import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * StorageService - Wrapper around Ionic Storage
 * Provides simple key-value storage that works on web (IndexedDB) and mobile (SQLite)
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private storage: Storage | null = null;
    private initPromise: Promise<void> | null = null;
    private readonly storageInstance = inject(Storage);

    /**
     * Initialize storage - must be called before any operations
     */
    async init(): Promise<void> {
        // If already initializing, return existing promise
        if (this.initPromise) {
            return this.initPromise;
        }

        // Create initialization promise
        this.initPromise = (async () => {
            if (!this.storage) {
                this.storage = await this.storageInstance.create();
                console.log('[StorageService] Ionic Storage initialized');
            }
        })();

        return this.initPromise;
    }

    /**
     * Get value by key
     */
    async get<T>(key: string): Promise<T | null> {
        await this.ensureInitialized();
        return await this.storage!.get(key);
    }

    /**
     * Set value by key
     */
    async set(key: string, value: any): Promise<void> {
        await this.ensureInitialized();
        await this.storage!.set(key, value);
    }

    /**
     * Remove value by key
     */
    async remove(key: string): Promise<void> {
        await this.ensureInitialized();
        await this.storage!.remove(key);
    }

    /**
     * Clear all storage
     */
    async clear(): Promise<void> {
        await this.ensureInitialized();
        await this.storage!.clear();
    }

    /**
     * Get all keys
     */
    async keys(): Promise<string[]> {
        await this.ensureInitialized();
        return await this.storage!.keys();
    }

    /**
     * Check if storage is ready
     */
    isReady(): boolean {
        return this.storage !== null;
    }

    /**
     * Ensure storage is initialized before operations
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.storage) {
            await this.init();
        }
    }
}
