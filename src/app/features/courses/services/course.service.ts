import { Injectable } from '@angular/core';
import { CourseLocalRepository } from '../../../data/repositories/course-local.repository';
import { Course, CreateCourseDto, UpdateCourseDto, CourseWithPlace, CourseGroup } from '../../../models';
import { PlaceService } from '../../places/services/place.service';
import { Observable, from, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(
    private repository: CourseLocalRepository,
    private placeService: PlaceService
  ) {}

  /**
   * Obtiene todos los cursos
   */
  getAll(): Observable<Course[]> {
    return from(this.repository.getAll());
  }

  /**
   * Obtiene todos los cursos con información del lugar
   */
  getAllWithPlace(): Observable<CourseWithPlace[]> {
    return combineLatest([
      this.repository.getAll$(),
      this.placeService.getAll()
    ]).pipe(
      map(([courses, places]) => {
        return courses.map(course => {
          const place = places.find(p => p.id === course.placeId);
          return {
            ...course,
            placeName: place?.name || 'Sin lugar asignado'
          };
        });
      })
    );
  }

  /**
   * Obtiene cursos filtrados por lugar
   */
  getByPlaceId(placeId: string): Observable<Course[]> {
    return from(this.repository.getByPlaceId(placeId));
  }

  /**
   * Obtiene cursos activos
   */
  getActiveCourses(): Observable<Course[]> {
    return from(this.repository.getActiveCourses());
  }

  /**
   * Obtiene un curso por su ID
   */
  getById(id: string): Observable<Course | null> {
    return this.repository.getById$(id);
  }

  /**
   * Crea un nuevo curso
   */
  async create(data: CreateCourseDto): Promise<string> {
    return this.repository.create(data);
  }

  /**
   * Actualiza un curso existente
   */
  async update(data: UpdateCourseDto): Promise<void> {
    const { id, ...updateData } = data;
    return this.repository.update(id, updateData);
  }

  /**
   * Elimina un curso
   */
  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  /**
   * Activa/Desactiva un curso
   */
  async toggleActive(id: string, isActive: boolean): Promise<void> {
    return this.repository.update(id, { isActive });
  }

  /**
   * Verifica si existe un curso con el mismo código y grupo en el mismo lugar
   * @param code Código del curso
   * @param group Número de grupo (1, 2, null o undefined para sin grupo)
   * @param placeId ID del lugar
   * @param excludeId ID del curso a excluir (para validación en edición)
   */
  async existsByCodeAndGroup(code: string, group: CourseGroup | null | undefined, placeId: string, excludeId?: string): Promise<boolean> {
    return this.repository.existsByCodeAndGroup(code, group, placeId, excludeId);
  }
}
