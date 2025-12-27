import { Injectable } from '@angular/core';
import { Firestore, where, doc, setDoc } from '@angular/fire/firestore';
import { BaseRepository } from './base.repository';
import { Place, PlaceType, CreatePlaceDto, generatePlaceId } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class PlaceRepository extends BaseRepository<Place> {
  protected collectionName = 'places';



  /**
   * Crea un lugar con ID personalizado basado en el tipo
   * @param data Datos del lugar a crear
   * @returns El ID generado del lugar
   */
  async createWithCustomId(data: CreatePlaceDto): Promise<string> {
    const id = generatePlaceId(data.type);
    const docRef = doc(this.firestore, this.collectionName, id);

    await setDoc(docRef, {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return id;
  }

  /**
   * Obtiene todos los lugares activos
   */
  async getActivePlaces(): Promise<Place[]> {
    return this.getAll();
  }

  /**
   * Obtiene lugares filtrados por tipo
   * @param type Tipo de lugar (WORK o PERSONAL)
   */
  async getPlacesByType(type: PlaceType): Promise<Place[]> {
    return this.getAll([where('type', '==', type)]);
  }
}
