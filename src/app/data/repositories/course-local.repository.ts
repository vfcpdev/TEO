import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { Course, CreateCourseDto, generateCourseId, CourseModality, DaySchedule, migrateCourseToSchedules, CourseGroup } from '../../models';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

const COURSES_STORAGE_KEY = 'classapp_courses';

// Tipo interno para almacenamiento (fechas como string, soporta legacy y nuevo formato)
interface StoredCourse {
  id: string;
  code: string;
  group?: CourseGroup; // Opcional para compatibilidad con legacy (default: 1)
  name: string;
  placeId: string;
  // Legacy fields (deprecated)
  startTime?: string;
  endTime?: string;
  weekDays?: number[];
  // Nuevo formato: schedules por día
  schedules?: Array<{ day: number; startTime: string; endTime: string }>;
  classroom?: string;
  modality: CourseModality;
  virtualLink?: string;
  academicPeriod?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Repositorio local para cursos usando Capacitor Preferences
 * Funciona offline sin necesidad de Firebase
 */
@Injectable({
  providedIn: 'root'
})
export class CourseLocalRepository {
  private coursesSubject = new BehaviorSubject<Course[]>([]);

  constructor(private storage: LocalStorageService) {
    this.loadFromStorage();
  }

  /**
   * Convierte StoredCourse a Course (strings a Date) y migra formato legacy
   */
  private storedToCourse(stored: StoredCourse): Course {
    const course: Course = {
      id: stored.id,
      code: stored.code,
      group: stored.group, // Mantener undefined/null para cursos sin grupo
      name: stored.name,
      placeId: stored.placeId,
      schedules: stored.schedules || [],
      // Mantener campos legacy para compatibilidad
      startTime: stored.startTime,
      endTime: stored.endTime,
      weekDays: stored.weekDays,
      classroom: stored.classroom,
      modality: stored.modality,
      virtualLink: stored.virtualLink,
      academicPeriod: stored.academicPeriod,
      isActive: stored.isActive,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt)
    };

    // Migrar formato legacy a schedules si es necesario
    return migrateCourseToSchedules(course);
  }

  /**
   * Convierte Course a StoredCourse (Date a strings)
   */
  private courseToStored(course: Course): StoredCourse {
    return {
      id: course.id,
      code: course.code,
      group: course.group,
      name: course.name,
      placeId: course.placeId,
      schedules: course.schedules,
      // Ya no guardamos campos legacy, solo schedules
      classroom: course.classroom,
      modality: course.modality,
      virtualLink: course.virtualLink,
      academicPeriod: course.academicPeriod,
      isActive: course.isActive,
      createdAt: course.createdAt instanceof Date ? course.createdAt.toISOString() : course.createdAt as unknown as string,
      updatedAt: course.updatedAt instanceof Date ? course.updatedAt.toISOString() : course.updatedAt as unknown as string
    };
  }

  /**
   * Carga los cursos del almacenamiento local
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const storedCourses = await this.storage.get<StoredCourse[]>(COURSES_STORAGE_KEY);
      const courses = storedCourses ? storedCourses.map(sc => this.storedToCourse(sc)) : [];
      this.coursesSubject.next(courses);
    } catch (error) {
      console.error('Error loading courses from storage:', error);
      this.coursesSubject.next([]);
    }
  }

  /**
   * Guarda los cursos en el almacenamiento local
   */
  private async saveToStorage(courses: Course[]): Promise<void> {
    const storedCourses = courses.map(c => this.courseToStored(c));
    await this.storage.set(COURSES_STORAGE_KEY, storedCourses);
    this.coursesSubject.next(courses);
  }

  /**
   * Crea un nuevo curso con ID personalizado
   */
  async create(data: CreateCourseDto): Promise<string> {
    const id = generateCourseId();
    const now = new Date();

    const newCourse: Course = {
      id,
      code: data.code,
      group: data.group,
      name: data.name,
      placeId: data.placeId,
      schedules: data.schedules || [],
      classroom: data.classroom,
      modality: data.modality,
      virtualLink: data.virtualLink,
      academicPeriod: data.academicPeriod,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const courses = [...this.coursesSubject.value, newCourse];
    await this.saveToStorage(courses);

    console.log('Course created locally:', newCourse);
    return id;
  }

  /**
   * Actualiza un curso existente
   */
  async update(id: string, data: Partial<CreateCourseDto> & { isActive?: boolean }): Promise<void> {
    const courses = [...this.coursesSubject.value];
    const index = courses.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error(`Course with id ${id} not found`);
    }

    const updatedCourse: Course = {
      ...courses[index],
      ...data,
      updatedAt: new Date()
    };

    courses[index] = updatedCourse;
    await this.saveToStorage(courses);

    console.log('Course updated locally:', updatedCourse);
  }

  /**
   * Elimina un curso
   */
  async delete(id: string): Promise<void> {
    const courses = this.coursesSubject.value.filter(c => c.id !== id);
    await this.saveToStorage(courses);

    console.log('Course deleted locally:', id);
  }

  /**
   * Obtiene un curso por su ID
   */
  async getById(id: string): Promise<Course | null> {
    const course = this.coursesSubject.value.find(c => c.id === id);
    return course || null;
  }

  /**
   * Obtiene todos los cursos
   */
  async getAll(): Promise<Course[]> {
    // Asegurar que los datos estén cargados
    if (this.coursesSubject.value.length === 0) {
      await this.loadFromStorage();
    }
    return this.coursesSubject.value;
  }

  /**
   * Obtiene cursos por placeId
   */
  async getByPlaceId(placeId: string): Promise<Course[]> {
    const courses = await this.getAll();
    return courses.filter(c => c.placeId === placeId);
  }

  /**
   * Verifica si existe un curso con el mismo código y grupo en el mismo lugar
   * @param code Código del curso
   * @param group Número de grupo
   * @param placeId ID del lugar
   * @param excludeId ID del curso a excluir (para edición)
   */
  async existsByCodeAndGroup(code: string, group: CourseGroup | null | undefined, placeId: string, excludeId?: string): Promise<boolean> {
    const courses = await this.getAll();
    return courses.some(c => {
      // Normalizar grupos: null, undefined y ausente se tratan como "sin grupo"
      const courseGroup = c.group ?? null;
      const searchGroup = group ?? null;
      return c.code === code &&
        courseGroup === searchGroup &&
        c.placeId === placeId &&
        c.id !== excludeId;
    });
  }

  /**
   * Obtiene cursos activos
   */
  async getActiveCourses(): Promise<Course[]> {
    const courses = await this.getAll();
    return courses.filter(c => c.isActive);
  }

  /**
   * Observable de todos los cursos
   */
  getAll$(): Observable<Course[]> {
    return this.coursesSubject.asObservable();
  }

  /**
   * Observable de un curso por ID
   */
  getById$(id: string): Observable<Course | null> {
    return this.coursesSubject.pipe(
      map(courses => courses.find(c => c.id === id) || null)
    );
  }

  /**
   * Observable de cursos por placeId
   */
  getByPlaceId$(placeId: string): Observable<Course[]> {
    return this.coursesSubject.pipe(
      map(courses => courses.filter(c => c.placeId === placeId))
    );
  }
}
