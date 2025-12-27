import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SQLiteService } from './sqlite.service';
import { LocalStorageService } from './local-storage.service';

export type StorageBackend = 'sqlite' | 'preferences';

/**
 * Servicio adaptador de almacenamiento
 * Decide automáticamente el mejor backend (SQLite o Preferences)
 * y proporciona una interfaz unificada
 */
@Injectable({
  providedIn: 'root'
})
export class StorageAdapterService {
  private sqliteService = inject(SQLiteService);
  private preferencesService = inject(LocalStorageService);

  readonly isReady = signal(false);
  readonly currentBackend = signal<StorageBackend>('preferences');
  readonly platform = Capacitor.getPlatform();

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el servicio y determina qué backend usar
   */
  private async initialize(): Promise<void> {
    console.log(`[StorageAdapter] Initializing on platform: ${this.platform}`);

    try {
      // Intentar usar SQLite primero
      if (this.platform === 'android' || this.platform === 'ios') {
        // En dispositivos nativos, SQLite es preferido
        await this.waitForSQLite();
        this.currentBackend.set('sqlite');
        console.log('[StorageAdapter] Using SQLite backend (native)');
      } else if (this.platform === 'web') {
        // En web, intentar SQLite con jeep-sqlite
        try {
          await this.waitForSQLite(5000); // Timeout de 5 segundos
          this.currentBackend.set('sqlite');
          console.log('[StorageAdapter] Using SQLite backend (web via jeep-sqlite)');
        } catch {
          // Fallback a Preferences si SQLite no está disponible
          this.currentBackend.set('preferences');
          console.log('[StorageAdapter] SQLite not available, using Preferences backend');
        }
      }

      this.isReady.set(true);
    } catch (error) {
      console.error('[StorageAdapter] Error initializing:', error);
      // Fallback a Preferences
      this.currentBackend.set('preferences');
      this.isReady.set(true);
    }
  }

  /**
   * Espera a que SQLite esté listo
   */
  private waitForSQLite(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        if (this.sqliteService.isReady()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('SQLite initialization timeout'));
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }

  /**
   * Verifica si SQLite está siendo usado
   */
  usingSQLite(): boolean {
    return this.currentBackend() === 'sqlite';
  }

  /**
   * Verifica si Preferences está siendo usado
   */
  usingPreferences(): boolean {
    return this.currentBackend() === 'preferences';
  }

  /**
   * Obtiene el servicio SQLite (solo si está disponible)
   */
  getSQLite(): SQLiteService | null {
    return this.usingSQLite() ? this.sqliteService : null;
  }

  /**
   * Obtiene el servicio de Preferences
   */
  getPreferences(): LocalStorageService {
    return this.preferencesService;
  }

  /**
   * Información del estado actual del almacenamiento
   */
  getStorageInfo(): { backend: StorageBackend; platform: string; ready: boolean } {
    return {
      backend: this.currentBackend(),
      platform: this.platform,
      ready: this.isReady()
    };
  }
}
