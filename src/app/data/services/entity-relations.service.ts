import { Injectable, inject } from '@angular/core';
import { PlaceLocalRepository } from '../repositories/place-local.repository';
import { CourseLocalRepository } from '../repositories/course-local.repository';
import { Place, Course } from '../../models';

/**
 * Tipos de acción al eliminar una entidad con dependencias
 */
export enum DeleteAction {
  CASCADE = 'cascade',     // Eliminar también las entidades relacionadas
  SET_NULL = 'set_null',   // Establecer la referencia a null (si es posible)
  RESTRICT = 'restrict',   // No permitir eliminación si hay dependencias
  REASSIGN = 'reassign'    // Reasignar a otra entidad
}

/**
 * Resultado de verificación de dependencias
 */
export interface DependencyCheckResult {
  hasDependencies: boolean;
  dependentCourses: Course[];
  message: string;
}

/**
 * Servicio para manejar relaciones entre entidades de forma relacional
 * Implementa integridad referencial para el almacenamiento local
 */
@Injectable({
  providedIn: 'root'
})
export class EntityRelationsService {
  private placeRepo = inject(PlaceLocalRepository);
  private courseRepo = inject(CourseLocalRepository);

  /**
   * Verifica si un lugar tiene cursos asociados
   */
  async checkPlaceDependencies(placeId: string): Promise<DependencyCheckResult> {
    const courses = await this.courseRepo.getByPlaceId(placeId);
    
    return {
      hasDependencies: courses.length > 0,
      dependentCourses: courses,
      message: courses.length > 0 
        ? `Este lugar tiene ${courses.length} curso(s) asociado(s)`
        : 'No hay cursos asociados a este lugar'
    };
  }

  /**
   * Obtiene cursos que coinciden con el código de un lugar (por prefijo)
   */
  async getCoursesMatchingPlaceCode(placeCode: string): Promise<Course[]> {
    if (!placeCode) return [];
    
    const allCourses = await this.courseRepo.getAll();
    return allCourses.filter(course => course.code.startsWith(placeCode));
  }

  /**
   * Asocia cursos a un lugar basándose en el código del lugar
   * Útil para importación masiva o reorganización
   */
  async associateCoursesByPlaceCode(placeId: string, placeCode: string): Promise<number> {
    if (!placeCode) return 0;

    const courses = await this.getCoursesMatchingPlaceCode(placeCode);
    let updated = 0;

    for (const course of courses) {
      if (course.placeId !== placeId) {
        await this.courseRepo.update(course.id, { placeId });
        updated++;
      }
    }

    return updated;
  }

  /**
   * Reasigna todos los cursos de un lugar a otro lugar
   */
  async reassignCourses(fromPlaceId: string, toPlaceId: string): Promise<number> {
    const courses = await this.courseRepo.getByPlaceId(fromPlaceId);
    
    for (const course of courses) {
      await this.courseRepo.update(course.id, { placeId: toPlaceId });
    }

    return courses.length;
  }

  /**
   * Elimina un lugar con la acción especificada para sus dependencias
   */
  async deletePlaceWithAction(
    placeId: string, 
    action: DeleteAction,
    targetPlaceId?: string
  ): Promise<{ success: boolean; message: string; affected: number }> {
    const dependencies = await this.checkPlaceDependencies(placeId);

    if (!dependencies.hasDependencies) {
      await this.placeRepo.delete(placeId);
      return { success: true, message: 'Lugar eliminado', affected: 0 };
    }

    switch (action) {
      case DeleteAction.RESTRICT:
        return {
          success: false,
          message: `No se puede eliminar: ${dependencies.message}`,
          affected: dependencies.dependentCourses.length
        };

      case DeleteAction.CASCADE:
        // Eliminar todos los cursos asociados
        for (const course of dependencies.dependentCourses) {
          await this.courseRepo.delete(course.id);
        }
        await this.placeRepo.delete(placeId);
        return {
          success: true,
          message: `Lugar y ${dependencies.dependentCourses.length} curso(s) eliminados`,
          affected: dependencies.dependentCourses.length
        };

      case DeleteAction.REASSIGN:
        if (!targetPlaceId) {
          return {
            success: false,
            message: 'Se requiere un lugar de destino para reasignar cursos',
            affected: 0
          };
        }
        const reassigned = await this.reassignCourses(placeId, targetPlaceId);
        await this.placeRepo.delete(placeId);
        return {
          success: true,
          message: `${reassigned} curso(s) reasignados y lugar eliminado`,
          affected: reassigned
        };

      default:
        return {
          success: false,
          message: 'Acción no soportada',
          affected: 0
        };
    }
  }

  /**
   * Valida que un placeId existe antes de crear/actualizar un curso
   */
  async validatePlaceExists(placeId: string): Promise<boolean> {
    const place = await this.placeRepo.getById(placeId);
    return place !== null;
  }

  /**
   * Obtiene el lugar asociado a un curso
   */
  async getPlaceForCourse(courseId: string): Promise<Place | null> {
    const course = await this.courseRepo.getById(courseId);
    if (!course) return null;
    
    return this.placeRepo.getById(course.placeId);
  }

  /**
   * Obtiene estadísticas de relaciones para un lugar
   */
  async getPlaceStats(placeId: string): Promise<{
    totalCourses: number;
    activeCourses: number;
    inactiveCourses: number;
  }> {
    const courses = await this.courseRepo.getByPlaceId(placeId);
    
    return {
      totalCourses: courses.length,
      activeCourses: courses.filter(c => c.isActive).length,
      inactiveCourses: courses.filter(c => !c.isActive).length
    };
  }

  /**
   * Busca lugares que podrían coincidir con un código de curso
   * Útil para sugerir asociaciones automáticas
   */
  async findMatchingPlacesForCourseCode(courseCode: string): Promise<Place[]> {
    const places = await this.placeRepo.getAll();
    
    return places.filter(place => 
      place.code && courseCode.startsWith(place.code)
    );
  }

  /**
   * Sincroniza las asociaciones de cursos basándose en códigos de lugares
   * Retorna el número de cursos actualizados
   */
  async syncCourseAssociationsByCode(): Promise<{
    updated: number;
    unmatched: number;
    details: Array<{ courseCode: string; placeName: string }>
  }> {
    const places = await this.placeRepo.getAll();
    const courses = await this.courseRepo.getAll();
    
    // Crear mapa de código de lugar -> lugar (solo los que tienen código)
    const placesByCode = new Map<string, Place>();
    for (const place of places) {
      if (place.code) {
        placesByCode.set(place.code, place);
      }
    }

    let updated = 0;
    let unmatched = 0;
    const details: Array<{ courseCode: string; placeName: string }> = [];

    for (const course of courses) {
      // Buscar el lugar cuyo código es prefijo del código del curso
      let matchedPlace: Place | null = null;
      
      for (const [code, place] of placesByCode) {
        if (course.code.startsWith(code)) {
          // Preferir el código más largo si hay múltiples coincidencias
          if (!matchedPlace || code.length > (matchedPlace.code?.length || 0)) {
            matchedPlace = place;
          }
        }
      }

      if (matchedPlace && course.placeId !== matchedPlace.id) {
        await this.courseRepo.update(course.id, { placeId: matchedPlace.id });
        updated++;
        details.push({ courseCode: course.code, placeName: matchedPlace.name });
      } else if (!matchedPlace) {
        unmatched++;
      }
    }

    return { updated, unmatched, details };
  }
}
