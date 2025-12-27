import { Injectable, signal, inject } from '@angular/core';
import { Firestore, enableNetwork, disableNetwork } from '@angular/fire/firestore';
import { Preferences } from '@capacitor/preferences';

export type FirestoreMode = 'online' | 'offline';

@Injectable({
  providedIn: 'root'
})
export class FirestoreControlService {
  private readonly STORAGE_KEY = 'firestoreMode';
  private firestore = inject(Firestore);

  // Estado reactivo del modo actual
  currentMode = signal<FirestoreMode>('online');
  isOnline = signal(true);
  isChangingMode = signal(false);

  constructor() {
    this.loadSavedMode();
  }

  /**
   * Carga el modo guardado desde las preferencias
   * NOTA: Siempre inicia en modo OFFLINE por defecto para APK instalada
   */
  private async loadSavedMode(): Promise<void> {
    try {
      // Siempre iniciar en modo offline al arrancar la app
      await this.setOffline();
      console.log('Firestore: Iniciando en modo OFFLINE por defecto');
    } catch (error) {
      console.error('Error loading Firestore mode:', error);
    }
  }

  /**
   * Activa el modo online de Firestore
   */
  async setOnline(): Promise<boolean> {
    try {
      this.isChangingMode.set(true);
      await enableNetwork(this.firestore);
      this.currentMode.set('online');
      this.isOnline.set(true);
      await Preferences.set({ key: this.STORAGE_KEY, value: 'online' });
      console.log('Firestore: Modo ONLINE activado');
      return true;
    } catch (error) {
      console.error('Error enabling Firestore network:', error);
      return false;
    } finally {
      this.isChangingMode.set(false);
    }
  }

  /**
   * Activa el modo offline de Firestore
   */
  async setOffline(): Promise<boolean> {
    try {
      this.isChangingMode.set(true);
      await disableNetwork(this.firestore);
      this.currentMode.set('offline');
      this.isOnline.set(false);
      await Preferences.set({ key: this.STORAGE_KEY, value: 'offline' });
      console.log('Firestore: Modo OFFLINE activado');
      return true;
    } catch (error) {
      console.error('Error disabling Firestore network:', error);
      return false;
    } finally {
      this.isChangingMode.set(false);
    }
  }

  /**
   * Alterna entre modo online y offline
   */
  async toggle(): Promise<boolean> {
    if (this.isOnline()) {
      return this.setOffline();
    } else {
      return this.setOnline();
    }
  }

  /**
   * Obtiene el modo actual
   */
  getMode(): FirestoreMode {
    return this.currentMode();
  }

  /**
   * Verifica si está en modo online
   */
  isNetworkEnabled(): boolean {
    return this.isOnline();
  }
}
