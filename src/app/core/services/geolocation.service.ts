import { Injectable } from '@angular/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  private defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // Aumentado para web
    maximumAge: 0
  };

  constructor() {}

  /**
   * Detecta si estamos ejecutando en navegador web
   */
  private isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  /**
   * Verifica si el usuario ha otorgado permisos de ubicación
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> {
    try {
      // En web, checkPermissions puede fallar o dar resultados inconsistentes
      // Es mejor intentar obtener la ubicación directamente
      if (this.isWeb()) {
        // Verificar si la API de geolocation está disponible
        if (!navigator.geolocation) {
          return 'denied';
        }
        // En web, los permisos se solicitan automáticamente al llamar getCurrentPosition
        return 'prompt';
      }

      const status = await Geolocation.checkPermissions();
      return status.location;
    } catch (error) {
      console.error('Error checking geolocation permissions:', error);
      // En web, si falla checkPermissions, asumimos que podemos intentar
      if (this.isWeb()) {
        return 'prompt';
      }
      return 'denied';
    }
  }

  /**
   * Solicita permisos de ubicación al usuario
   * Nota: En web esto no hace nada - los permisos se piden al llamar getCurrentPosition
   */
  async requestPermissions(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> {
    try {
      // En web, requestPermissions no está disponible
      // Los permisos se solicitan automáticamente al llamar getCurrentPosition
      if (this.isWeb()) {
        console.log('Web platform: permissions will be requested on getCurrentPosition');
        return 'prompt';
      }

      const status = await Geolocation.requestPermissions();
      return status.location;
    } catch (error) {
      console.error('Error requesting geolocation permissions:', error);
      return 'denied';
    }
  }

  /**
   * Obtiene la ubicación actual del dispositivo
   * Funciona tanto en navegador web como en apps nativas
   */
  async getCurrentPosition(options?: PositionOptions): Promise<LocationData | null> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      // En web, saltamos la verificación de permisos y vamos directo a obtener la ubicación
      // El navegador pedirá permisos automáticamente
      if (this.isWeb()) {
        console.log('Web platform: getting position directly (browser will prompt for permissions)');

        // Usar directamente navigator.geolocation para mejor compatibilidad en web
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            console.error('Geolocation API not available');
            resolve(null);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: position.timestamp
              };
              console.log('Web geolocation success:', locationData);
              resolve(locationData);
            },
            (error) => {
              console.error('Web geolocation error:', error.message);
              // Dar mensajes más claros según el error
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  console.error('Usuario denegó permisos de ubicación');
                  break;
                case error.POSITION_UNAVAILABLE:
                  console.error('Información de ubicación no disponible');
                  break;
                case error.TIMEOUT:
                  console.error('Tiempo de espera agotado');
                  break;
              }
              resolve(null);
            },
            {
              enableHighAccuracy: mergedOptions.enableHighAccuracy,
              timeout: mergedOptions.timeout,
              maximumAge: mergedOptions.maximumAge
            }
          );
        });
      }

      // En plataformas nativas, usar el flujo normal de Capacitor
      const permission = await this.checkPermissions();

      if (permission === 'denied') {
        const requested = await this.requestPermissions();
        if (requested === 'denied') {
          throw new Error('Permisos de ubicación denegados');
        }
      }

      const position: Position = await Geolocation.getCurrentPosition(mergedOptions);

      return this.mapPositionToLocationData(position);
    } catch (error) {
      console.error('Error getting current position:', error);
      return null;
    }
  }

  /**
   * Observa cambios en la ubicación del dispositivo
   * @returns callbackId para usar con clearWatch
   */
  async watchPosition(
    callback: (location: LocationData | null, error?: string) => void,
    options?: PositionOptions
  ): Promise<string> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };

      // En web, usar navigator.geolocation.watchPosition directamente
      if (this.isWeb()) {
        if (!navigator.geolocation) {
          callback(null, 'Geolocation API not available');
          return '';
        }

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            };
            callback(locationData);
          },
          (error) => {
            callback(null, error.message);
          },
          {
            enableHighAccuracy: mergedOptions.enableHighAccuracy,
            timeout: mergedOptions.timeout,
            maximumAge: mergedOptions.maximumAge
          }
        );

        return watchId.toString();
      }

      // En plataformas nativas, usar Capacitor
      const permission = await this.checkPermissions();

      if (permission === 'denied') {
        const requested = await this.requestPermissions();
        if (requested === 'denied') {
          callback(null, 'Permisos de ubicación denegados');
          return '';
        }
      }

      const watchId = await Geolocation.watchPosition(
        options || this.defaultOptions,
        (position, err) => {
          if (err) {
            callback(null, err.message);
          } else if (position) {
            callback(this.mapPositionToLocationData(position));
          }
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error watching position:', error);
      callback(null, 'Error al observar ubicación');
      return '';
    }
  }

  /**
   * Detiene la observación de ubicación
   */
  async clearWatch(watchId: string): Promise<void> {
    if (watchId) {
      // En web, usar navigator.geolocation.clearWatch
      if (this.isWeb()) {
        navigator.geolocation.clearWatch(parseInt(watchId, 10));
        return;
      }
      // En nativo, usar Capacitor
      await Geolocation.clearWatch({ id: watchId });
    }
  }

  /**
   * Calcula la distancia entre dos coordenadas (en metros)
   * Fórmula de Haversine
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Genera un link de Google Maps para una ubicación
   */
  getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }

  /**
   * Genera un link de Google Maps para direcciones
   */
  getDirectionsUrl(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number
  ): string {
    return `https://www.google.com/maps/dir/${fromLat},${fromLon}/${toLat},${toLon}`;
  }

  private mapPositionToLocationData(position: Position): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? null,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
      heading: position.coords.heading ?? null,
      speed: position.coords.speed ?? null,
      timestamp: position.timestamp
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
