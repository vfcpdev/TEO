import { Injectable, inject } from '@angular/core';
import { PlaceLocalRepository } from '../../../data/repositories/place-local.repository';
import { Place, CreatePlaceDto, UpdatePlaceDto, PlaceType } from '../../../models';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlaceService {
  private repository = inject(PlaceLocalRepository);


  /**
   * Obtiene todos los lugares (una vez)
   */
  getAll(): Observable<Place[]> {
    return from(this.repository.getAll());
  }

  /**
   * Obtiene todos los lugares (reactivo - se actualiza automáticamente)
   */
  getAll$(): Observable<Place[]> {
    return this.repository.getAll$();
  }

  /**
   * Obtiene lugares filtrados por tipo
   */
  getByType(type: PlaceType): Observable<Place[]> {
    return from(this.repository.getByType(type));
  }

  /**
   * Obtiene un lugar por su ID
   */
  getById(id: string): Observable<Place | null> {
    return this.repository.getById$(id);
  }

  /**
   * Crea un nuevo lugar con ID personalizado
   */
  async create(data: CreatePlaceDto): Promise<string> {
    return this.repository.create(data);
  }

  /**
   * Actualiza un lugar existente
   */
  async update(data: UpdatePlaceDto): Promise<void> {
    const { id, ...updateData } = data;
    return this.repository.update(id, updateData);
  }

  /**
   * Elimina un lugar
   */
  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
