import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Servicio para almacenamiento local usando Capacitor Preferences
 * Funciona tanto en web como en dispositivos nativos
 */
@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() {}

  /**
   * Guarda un valor en el almacenamiento local
   */
  async set<T>(key: string, value: T): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
  }

  /**
   * Obtiene un valor del almacenamiento local
   */
  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Elimina un valor del almacenamiento local
   */
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  /**
   * Limpia todo el almacenamiento local
   */
  async clear(): Promise<void> {
    await Preferences.clear();
  }

  /**
   * Obtiene todas las keys almacenadas
   */
  async keys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }
}
