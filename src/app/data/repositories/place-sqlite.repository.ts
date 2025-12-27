import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SQLiteService } from '../../core/services/sqlite.service';
import { Place, PlaceType, CreatePlaceDto, generatePlaceId } from '../../models';

/**
 * Tipo interno para filas de SQLite (snake_case)
 */
interface PlaceRow {
  id: string;
  code: string | null;
  name: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repositorio SQLite para Places
 * Proporciona almacenamiento local persistente con SQLite
 */
@Injectable({
  providedIn: 'root'
})
export class PlaceSQLiteRepository {
  private sqlite = inject(SQLiteService);
  private placesSubject = new BehaviorSubject<Place[]>([]);

  constructor() {
    this.waitForDbAndLoad();
  }

  /**
   * Espera a que la DB esté lista y carga los datos
   */
  private async waitForDbAndLoad(): Promise<void> {
    // Esperar hasta que SQLite esté listo
    const checkReady = () => {
      if (this.sqlite.isReady()) {
        this.loadFromDatabase();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  }

  /**
   * Convierte fila de SQLite a objeto Place
   */
  private rowToPlace(row: PlaceRow): Place {
    return {
      id: row.id,
      code: row.code ?? undefined,
      name: row.name,
      type: row.type as PlaceType,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Carga los lugares desde SQLite
   */
  private async loadFromDatabase(): Promise<void> {
    try {
      const rows = await this.sqlite.findAll<PlaceRow>('places', 'name ASC');
      const places = rows.map(row => this.rowToPlace(row));
      this.placesSubject.next(places);
      console.log(`[PlaceSQLite] Loaded ${places.length} places`);
    } catch (error) {
      console.error('[PlaceSQLite] Error loading places:', error);
      this.placesSubject.next([]);
    }
  }

  /**
   * Observable de todos los lugares
   */
  getAll(): Observable<Place[]> {
    return this.placesSubject.asObservable();
  }

  /**
   * Obtiene lugares por tipo
   */
  getByType(type: PlaceType): Observable<Place[]> {
    return this.placesSubject.pipe(
      map(places => places.filter(p => p.type === type))
    );
  }

  /**
   * Obtiene un lugar por ID
   */
  async getById(id: string): Promise<Place | null> {
    try {
      const row = await this.sqlite.findById<PlaceRow>('places', id);
      return row ? this.rowToPlace(row) : null;
    } catch (error) {
      console.error('[PlaceSQLite] Error getting place by id:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo lugar
   */
  async create(data: CreatePlaceDto): Promise<string> {
    const id = generatePlaceId(data.type);
    const now = new Date().toISOString();

    await this.sqlite.insert('places', {
      id,
      code: data.code || null,
      name: data.name,
      type: data.type,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      created_at: now,
      updated_at: now
    });

    // Encolar para sincronización
    await this.sqlite.queueForSync('place', id, 'create', data);

    // Recargar datos
    await this.loadFromDatabase();

    console.log('[PlaceSQLite] Created place:', id);
    return id;
  }

  /**
   * Actualiza un lugar existente
   */
  async update(id: string, data: Partial<CreatePlaceDto>): Promise<void> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (data.code !== undefined) updateData['code'] = data.code || null;
    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.type !== undefined) updateData['type'] = data.type;
    if (data.latitude !== undefined) updateData['latitude'] = data.latitude || null;
    if (data.longitude !== undefined) updateData['longitude'] = data.longitude || null;

    const changes = await this.sqlite.update('places', updateData, 'id = ?', [id]);

    if (changes === 0) {
      throw new Error(`Place with id ${id} not found`);
    }

    // Encolar para sincronización
    await this.sqlite.queueForSync('place', id, 'update', data);

    // Recargar datos
    await this.loadFromDatabase();

    console.log('[PlaceSQLite] Updated place:', id);
  }

  /**
   * Elimina un lugar
   */
  async delete(id: string): Promise<void> {
    const changes = await this.sqlite.delete('places', 'id = ?', [id]);

    if (changes === 0) {
      throw new Error(`Place with id ${id} not found`);
    }

    // Encolar para sincronización
    await this.sqlite.queueForSync('place', id, 'delete');

    // Recargar datos
    await this.loadFromDatabase();

    console.log('[PlaceSQLite] Deleted place:', id);
  }

  /**
   * Busca lugares por código
   */
  async findByCode(code: string): Promise<Place | null> {
    const rows = await this.sqlite.query<PlaceRow>(
      'SELECT * FROM places WHERE code = ?',
      [code]
    );
    return rows.length > 0 ? this.rowToPlace(rows[0]) : null;
  }

  /**
   * Busca lugares cuyo código es prefijo del código dado
   */
  async findByCodePrefix(courseCode: string): Promise<Place[]> {
    const rows = await this.sqlite.query<PlaceRow>(
      `SELECT * FROM places WHERE code IS NOT NULL AND ? LIKE code || '%' ORDER BY LENGTH(code) DESC`,
      [courseCode]
    );
    return rows.map(row => this.rowToPlace(row));
  }

  /**
   * Cuenta cursos asociados a un lugar
   */
  async countCoursesByPlace(placeId: string): Promise<number> {
    return this.sqlite.count('courses', 'place_id = ?', [placeId]);
  }

  /**
   * Fuerza recarga desde la base de datos
   */
  async refresh(): Promise<void> {
    await this.loadFromDatabase();
  }

  /**
   * Obtiene el valor actual de forma síncrona
   */
  getCurrentValue(): Place[] {
    return this.placesSubject.value;
  }
}
