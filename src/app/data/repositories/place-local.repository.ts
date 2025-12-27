import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { Place, PlaceType, CreatePlaceDto, generatePlaceId } from '../../models';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

const PLACES_STORAGE_KEY = 'teo_places';

// Tipo interno para almacenamiento (fechas como string)
interface StoredPlace {
  id: string;
  name: string;
  type: PlaceType;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Repositorio local para lugares usando Capacitor Preferences
 * Funciona offline sin necesidad de Firebase
 */
@Injectable({
  providedIn: 'root'
})
export class PlaceLocalRepository {
  private placesSubject = new BehaviorSubject<Place[]>([]);
  private storage = inject(LocalStorageService);

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Convierte StoredPlace a Place (strings a Date)
   */
  private storedToPlace(stored: StoredPlace): Place {
    return {
      ...stored,
      latitude: stored.latitude ?? undefined,
      longitude: stored.longitude ?? undefined,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt)
    };
  }

  /**
   * Convierte Place a StoredPlace (Date a strings)
   */
  private placeToStored(place: Place): StoredPlace {
    return {
      ...place,
      latitude: place.latitude ?? null,
      longitude: place.longitude ?? null,
      createdAt: place.createdAt instanceof Date ? place.createdAt.toISOString() : place.createdAt,
      updatedAt: place.updatedAt instanceof Date ? place.updatedAt.toISOString() : place.updatedAt
    };
  }

  /**
   * Carga los lugares del almacenamiento local
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const storedPlaces = await this.storage.get<StoredPlace[]>(PLACES_STORAGE_KEY);
      const places = storedPlaces ? storedPlaces.map(sp => this.storedToPlace(sp)) : [];
      this.placesSubject.next(places);
    } catch (error) {
      console.error('Error loading places from storage:', error);
      this.placesSubject.next([]);
    }
  }

  /**
   * Guarda los lugares en el almacenamiento local
   */
  private async saveToStorage(places: Place[]): Promise<void> {
    const storedPlaces = places.map(p => this.placeToStored(p));
    await this.storage.set(PLACES_STORAGE_KEY, storedPlaces);
    this.placesSubject.next(places);
  }

  /**
   * Crea un nuevo lugar con ID personalizado
   */
  async create(data: CreatePlaceDto): Promise<string> {
    const id = generatePlaceId(data.type);
    const now = new Date();

    const newPlace: Place = {
      id,
      name: data.name,
      type: data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: now,
      updatedAt: now
    };

    const places = [...this.placesSubject.value, newPlace];
    await this.saveToStorage(places);

    console.log('Place created locally:', newPlace);
    return id;
  }

  /**
   * Actualiza un lugar existente
   */
  async update(id: string, data: Partial<CreatePlaceDto>): Promise<void> {
    const places = [...this.placesSubject.value];
    const index = places.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error(`Place with id ${id} not found`);
    }

    const updatedPlace: Place = {
      ...places[index],
      ...data,
      updatedAt: new Date()
    };

    places[index] = updatedPlace;
    await this.saveToStorage(places);

    console.log('Place updated locally:', updatedPlace);
  }

  /**
   * Elimina un lugar
   */
  async delete(id: string): Promise<void> {
    const places = this.placesSubject.value.filter(p => p.id !== id);
    await this.saveToStorage(places);

    console.log('Place deleted locally:', id);
  }

  /**
   * Obtiene un lugar por su ID
   */
  async getById(id: string): Promise<Place | null> {
    const place = this.placesSubject.value.find(p => p.id === id);
    return place || null;
  }

  /**
   * Obtiene todos los lugares
   */
  async getAll(): Promise<Place[]> {
    // Asegurar que los datos estén cargados
    if (this.placesSubject.value.length === 0) {
      await this.loadFromStorage();
    }
    return this.placesSubject.value;
  }

  /**
   * Obtiene lugares por tipo
   */
  async getByType(type: PlaceType): Promise<Place[]> {
    const places = await this.getAll();
    return places.filter(p => p.type === type);
  }

  /**
   * Observable de todos los lugares
   */
  getAll$(): Observable<Place[]> {
    return this.placesSubject.asObservable();
  }

  /**
   * Observable de un lugar por ID
   */
  getById$(id: string): Observable<Place | null> {
    return this.placesSubject.pipe(
      map(places => places.find(p => p.id === id) || null)
    );
  }
}
