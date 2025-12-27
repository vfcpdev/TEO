import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SQLiteService } from '../../core/services/sqlite.service';
import {
  Course,
  CreateCourseDto,
  CourseModality,
  DaySchedule,
  CourseGroup,
  generateCourseId
} from '../../models';

/**
 * Tipo interno para filas de cursos en SQLite
 */
interface CourseRow {
  id: string;
  code: string;
  group_number: number | null;
  semester: string | null;
  name: string;
  place_id: string;
  classroom: string | null;
  modality: string;
  virtual_link: string | null;
  academic_period: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

/**
 * Tipo para filas de horarios
 */
interface ScheduleRow {
  id: number;
  course_id: string;
  day: number;
  start_time: string;
  end_time: string;
}

/**
 * Repositorio SQLite para Courses
 * Proporciona almacenamiento local persistente con SQLite
 */
@Injectable({
  providedIn: 'root'
})
export class CourseSQLiteRepository {
  private sqlite = inject(SQLiteService);
  private coursesSubject = new BehaviorSubject<Course[]>([]);

  constructor() {
    this.waitForDbAndLoad();
  }

  /**
   * Espera a que la DB esté lista y carga los datos
   */
  private async waitForDbAndLoad(): Promise<void> {
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
   * Convierte fila de SQLite a objeto Course
   */
  private rowToCourse(row: CourseRow, schedules: DaySchedule[]): Course {
    return {
      id: row.id,
      code: row.code,
      group: row.group_number as CourseGroup | undefined,
      semester: row.semester ?? undefined,
      name: row.name,
      placeId: row.place_id,
      schedules,
      classroom: row.classroom ?? undefined,
      modality: row.modality as CourseModality,
      virtualLink: row.virtual_link ?? undefined,
      academicPeriod: row.academic_period ?? undefined,
      isActive: row.is_active === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Carga los cursos desde SQLite
   */
  private async loadFromDatabase(): Promise<void> {
    try {
      // Cargar todos los cursos
      const courseRows = await this.sqlite.findAll<CourseRow>('courses', 'name ASC');

      // Cargar todos los horarios
      const scheduleRows = await this.sqlite.findAll<ScheduleRow>('course_schedules');

      // Agrupar horarios por curso
      const schedulesByCourse = new Map<string, DaySchedule[]>();
      for (const row of scheduleRows) {
        const schedules = schedulesByCourse.get(row.course_id) || [];
        schedules.push({
          day: row.day,
          startTime: row.start_time,
          endTime: row.end_time
        });
        schedulesByCourse.set(row.course_id, schedules);
      }

      // Convertir a objetos Course
      const courses = courseRows.map(row =>
        this.rowToCourse(row, schedulesByCourse.get(row.id) || [])
      );

      this.coursesSubject.next(courses);
      console.log(`[CourseSQLite] Loaded ${courses.length} courses`);
    } catch (error) {
      console.error('[CourseSQLite] Error loading courses:', error);
      this.coursesSubject.next([]);
    }
  }

  /**
   * Observable de todos los cursos
   */
  getAll(): Observable<Course[]> {
    return this.coursesSubject.asObservable();
  }

  /**
   * Observable de cursos activos
   */
  getActive(): Observable<Course[]> {
    return this.coursesSubject.pipe(
      map(courses => courses.filter(c => c.isActive))
    );
  }

  /**
   * Observable de cursos por lugar
   */
  getByPlace(placeId: string): Observable<Course[]> {
    return this.coursesSubject.pipe(
      map(courses => courses.filter(c => c.placeId === placeId))
    );
  }

  /**
   * Obtiene un curso por ID
   */
  async getById(id: string): Promise<Course | null> {
    try {
      const row = await this.sqlite.findById<CourseRow>('courses', id);
      if (!row) return null;

      const scheduleRows = await this.sqlite.query<ScheduleRow>(
        'SELECT * FROM course_schedules WHERE course_id = ?',
        [id]
      );

      const schedules: DaySchedule[] = scheduleRows.map(s => ({
        day: s.day,
        startTime: s.start_time,
        endTime: s.end_time
      }));

      return this.rowToCourse(row, schedules);
    } catch (error) {
      console.error('[CourseSQLite] Error getting course by id:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo curso
   */
  async create(data: CreateCourseDto): Promise<string> {
    const id = generateCourseId();
    const now = new Date().toISOString();

    // Usar transacción para insertar curso y horarios
    const statements: Array<{ sql: string; values?: any[] }> = [];

    // Insertar curso
    statements.push({
      sql: `INSERT INTO courses (id, code, group_number, semester, name, place_id, classroom, modality, virtual_link, academic_period, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        id,
        data.code,
        data.group || null,
        data.semester || null,
        data.name,
        data.placeId,
        data.classroom || null,
        data.modality,
        data.virtualLink || null,
        data.academicPeriod || null,
        data.isActive !== false ? 1 : 0,
        now,
        now
      ]
    });

    // Insertar horarios
    for (const schedule of data.schedules || []) {
      statements.push({
        sql: 'INSERT INTO course_schedules (course_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
        values: [id, schedule.day, schedule.startTime, schedule.endTime]
      });
    }

    await this.sqlite.executeTransaction(statements);

    // Encolar para sincronización
    await this.sqlite.queueForSync('course', id, 'create', data);

    // Recargar datos
    await this.loadFromDatabase();

    console.log('[CourseSQLite] Created course:', id);
    return id;
  }

  /**
   * Actualiza un curso existente
   */
  async update(id: string, data: Partial<CreateCourseDto>): Promise<void> {
    const now = new Date().toISOString();
    const statements: Array<{ sql: string; values?: any[] }> = [];

    // Construir SET clause dinámicamente
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (data.code !== undefined) { updates.push('code = ?'); values.push(data.code); }
    if (data.group !== undefined) { updates.push('group_number = ?'); values.push(data.group); }
    if (data.semester !== undefined) { updates.push('semester = ?'); values.push(data.semester || null); }
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.placeId !== undefined) { updates.push('place_id = ?'); values.push(data.placeId); }
    if (data.classroom !== undefined) { updates.push('classroom = ?'); values.push(data.classroom || null); }
    if (data.modality !== undefined) { updates.push('modality = ?'); values.push(data.modality); }
    if (data.virtualLink !== undefined) { updates.push('virtual_link = ?'); values.push(data.virtualLink || null); }
    if (data.academicPeriod !== undefined) { updates.push('academic_period = ?'); values.push(data.academicPeriod || null); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }

    values.push(id);

    statements.push({
      sql: `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
      values
    });

    // Si hay horarios, eliminar los existentes e insertar los nuevos
    if (data.schedules !== undefined) {
      statements.push({
        sql: 'DELETE FROM course_schedules WHERE course_id = ?',
        values: [id]
      });

      for (const schedule of data.schedules) {
        statements.push({
          sql: 'INSERT INTO course_schedules (course_id, day, start_time, end_time) VALUES (?, ?, ?, ?)',
          values: [id, schedule.day, schedule.startTime, schedule.endTime]
        });
      }
    }

    await this.sqlite.executeTransaction(statements);

    // Encolar para sincronización
    await this.sqlite.queueForSync('course', id, 'update', data);

    // Recargar datos
    await this.loadFromDatabase();

    console.log('[CourseSQLite] Updated course:', id);
  }

  /**
   * Elimina un curso
   */
  async delete(id: string): Promise<void> {
    // Los horarios se eliminan automáticamente por CASCADE
    const changes = await this.sqlite.delete('courses', 'id = ?', [id]);

    if (changes === 0) {
      throw new Error(`Course with id ${id} not found`);
    }

    // Encolar para sincronización
    await this.sqlite.queueForSync('course', id, 'delete');

    // Recargar datos
    await this.loadFromDatabase();

    console.log('[CourseSQLite] Deleted course:', id);
  }

  /**
   * Reasigna cursos de un lugar a otro
   */
  async reassignToPlace(fromPlaceId: string, toPlaceId: string): Promise<number> {
    const now = new Date().toISOString();

    const result = await this.sqlite.update(
      'courses',
      { place_id: toPlaceId, updated_at: now },
      'place_id = ?',
      [fromPlaceId]
    );

    await this.loadFromDatabase();

    console.log(`[CourseSQLite] Reassigned ${result} courses from ${fromPlaceId} to ${toPlaceId}`);
    return result;
  }

  /**
   * Elimina todos los cursos de un lugar
   */
  async deleteByPlace(placeId: string): Promise<number> {
    // Primero obtener los IDs para encolar
    const courses = await this.sqlite.query<{ id: string }>(
      'SELECT id FROM courses WHERE place_id = ?',
      [placeId]
    );

    for (const course of courses) {
      await this.sqlite.queueForSync('course', course.id, 'delete');
    }

    const changes = await this.sqlite.delete('courses', 'place_id = ?', [placeId]);

    await this.loadFromDatabase();

    console.log(`[CourseSQLite] Deleted ${changes} courses from place ${placeId}`);
    return changes;
  }

  /**
   * Busca cursos por código (parcial)
   */
  async findByCode(code: string): Promise<Course[]> {
    const courseRows = await this.sqlite.query<CourseRow>(
      'SELECT * FROM courses WHERE code LIKE ?',
      [`%${code}%`]
    );

    const scheduleRows = await this.sqlite.findAll<ScheduleRow>('course_schedules');
    const schedulesByCourse = new Map<string, DaySchedule[]>();

    for (const row of scheduleRows) {
      const schedules = schedulesByCourse.get(row.course_id) || [];
      schedules.push({
        day: row.day,
        startTime: row.start_time,
        endTime: row.end_time
      });
      schedulesByCourse.set(row.course_id, schedules);
    }

    return courseRows.map(row => this.rowToCourse(row, schedulesByCourse.get(row.id) || []));
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
  getCurrentValue(): Course[] {
    return this.coursesSubject.value;
  }
}
