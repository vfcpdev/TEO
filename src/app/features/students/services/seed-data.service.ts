import { Injectable, inject } from '@angular/core';
import { SQLiteService } from '../../../core/services/sqlite.service';
import { ToastService } from '../../../core/services/toast.service';
import { CourseStudentService } from './course-student.service';

interface FakeStudent {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface FakeCourse {
  id: string;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeedDataService {
  private sqliteService = inject(SQLiteService);
  private toastService = inject(ToastService);
  private courseStudentService = inject(CourseStudentService);

  // Datos ficticios de estudiantes peruanos
  private readonly fakeStudents: Omit<FakeStudent, 'id'>[] = [
    { code: 'EST001', firstName: 'Carlos', lastName: 'García Mendoza', email: 'carlos.garcia@email.com' },
    { code: 'EST002', firstName: 'María', lastName: 'López Sánchez', email: 'maria.lopez@email.com' },
    { code: 'EST003', firstName: 'José', lastName: 'Rodríguez Flores', email: 'jose.rodriguez@email.com' },
    { code: 'EST004', firstName: 'Ana', lastName: 'Martínez Quispe', email: 'ana.martinez@email.com' },
    { code: 'EST005', firstName: 'Luis', lastName: 'Hernández Vega', email: 'luis.hernandez@email.com' },
    { code: 'EST006', firstName: 'Carmen', lastName: 'Díaz Torres', email: 'carmen.diaz@email.com' },
    { code: 'EST007', firstName: 'Miguel', lastName: 'Fernández Ramos', email: 'miguel.fernandez@email.com' },
    { code: 'EST008', firstName: 'Rosa', lastName: 'Pérez Huamán', email: 'rosa.perez@email.com' },
    { code: 'EST009', firstName: 'Pedro', lastName: 'Sánchez Castillo', email: 'pedro.sanchez@email.com' },
    { code: 'EST010', firstName: 'Laura', lastName: 'Gómez Vargas', email: 'laura.gomez@email.com' },
    { code: 'EST011', firstName: 'Roberto', lastName: 'Ruiz Paredes', email: 'roberto.ruiz@email.com' },
    { code: 'EST012', firstName: 'Sofía', lastName: 'Torres Mendoza', email: 'sofia.torres@email.com' },
    { code: 'EST013', firstName: 'Diego', lastName: 'Ramírez Silva', email: 'diego.ramirez@email.com' },
    { code: 'EST014', firstName: 'Valentina', lastName: 'Flores Chávez', email: 'valentina.flores@email.com' },
    { code: 'EST015', firstName: 'Andrés', lastName: 'Morales Espinoza', email: 'andres.morales@email.com' },
    { code: 'EST016', firstName: 'Lucía', lastName: 'Vega Palacios', email: 'lucia.vega@email.com' },
    { code: 'EST017', firstName: 'Fernando', lastName: 'Castro Reyes', email: 'fernando.castro@email.com' },
    { code: 'EST018', firstName: 'Camila', lastName: 'Ortiz Mamani', email: 'camila.ortiz@email.com' },
    { code: 'EST019', firstName: 'Javier', lastName: 'Mendoza Arias', email: 'javier.mendoza@email.com' },
    { code: 'EST020', firstName: 'Isabella', lastName: 'Chávez Luna', email: 'isabella.chavez@email.com' },
    { code: 'EST021', firstName: 'Ricardo', lastName: 'Vargas Delgado', email: 'ricardo.vargas@email.com' },
    { code: 'EST022', firstName: 'Daniela', lastName: 'Quispe Rojas', email: 'daniela.quispe@email.com' },
    { code: 'EST023', firstName: 'Sebastián', lastName: 'Palacios Vera', email: 'sebastian.palacios@email.com' },
    { code: 'EST024', firstName: 'Mariana', lastName: 'Espinoza Cruz', email: 'mariana.espinoza@email.com' },
    { code: 'EST025', firstName: 'Alejandro', lastName: 'Huamán Paz', email: 'alejandro.huaman@email.com' },
    { code: 'EST026', firstName: 'Valeria', lastName: 'Reyes Campos', email: 'valeria.reyes@email.com' },
    { code: 'EST027', firstName: 'Gabriel', lastName: 'Silva Navarro', email: 'gabriel.silva@email.com' },
    { code: 'EST028', firstName: 'Paula', lastName: 'Delgado Romero', email: 'paula.delgado@email.com' },
    { code: 'EST029', firstName: 'Nicolás', lastName: 'Rojas Medina', email: 'nicolas.rojas@email.com' },
    { code: 'EST030', firstName: 'Antonella', lastName: 'Cruz Figueroa', email: 'antonella.cruz@email.com' },
  ];

  /**
   * Generar ID único para estudiante
   */
  private generateStudentId(): string {
    return 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Crear estudiantes ficticios en la base de datos
   */
  async seedStudents(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    const now = new Date().toISOString();

    for (const student of this.fakeStudents) {
      try {
        // Verificar si ya existe por código
        const existingQuery = `SELECT id FROM students WHERE code = ?`;
        const existing = await this.sqliteService.query<any>(existingQuery, [student.code]);

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        const id = this.generateStudentId();
        const insertQuery = `
          INSERT INTO students (id, code, first_name, last_name, email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await this.sqliteService.run(insertQuery, [
          id,
          student.code,
          student.firstName,
          student.lastName,
          student.email,
          now,
          now
        ]);
        created++;
      } catch (error) {
        console.error(`Error creating student ${student.code}:`, error);
        skipped++;
      }
    }

    return { created, skipped };
  }

  /**
   * Obtener todos los estudiantes
   */
  async getAllStudents(): Promise<FakeStudent[]> {
    try {
      const query = `
        SELECT id, code, first_name as firstName, last_name as lastName, email
        FROM students
        ORDER BY last_name, first_name
      `;
      const result = await this.sqliteService.query<any>(query, []);
      return result || [];
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  }

  /**
   * Obtener todos los cursos
   */
  async getAllCourses(): Promise<FakeCourse[]> {
    try {
      const query = `
        SELECT id, code, name
        FROM courses
        WHERE is_active = 1
        ORDER BY name
      `;
      const result = await this.sqliteService.query<any>(query, []);
      return result || [];
    } catch (error) {
      console.error('Error getting courses:', error);
      return [];
    }
  }

  /**
   * Asociar estudiantes a cursos de forma aleatoria
   * Cada estudiante se asigna a 1-3 cursos
   */
  async assignStudentsToCourses(): Promise<{ enrollments: number; errors: number }> {
    let enrollments = 0;
    let errors = 0;

    const students = await this.getAllStudents();
    const courses = await this.getAllCourses();

    if (courses.length === 0) {
      console.warn('No hay cursos disponibles para asignar estudiantes');
      return { enrollments: 0, errors: 0 };
    }

    for (const student of students) {
      // Cada estudiante se inscribe en 1-3 cursos aleatorios
      const numCourses = Math.floor(Math.random() * 3) + 1;
      const shuffledCourses = this.shuffleArray([...courses]);
      const selectedCourses = shuffledCourses.slice(0, Math.min(numCourses, courses.length));

      for (const course of selectedCourses) {
        const success = await this.courseStudentService.enrollStudent(course.id, student.id);
        if (success) {
          enrollments++;
        } else {
          errors++;
        }
      }
    }

    return { enrollments, errors };
  }

  /**
   * Asignar todos los estudiantes a un curso específico
   */
  async assignAllStudentsToCourse(courseId: string): Promise<{ success: number; failed: number }> {
    const students = await this.getAllStudents();
    const studentIds = students.map(s => s.id);
    return await this.courseStudentService.enrollMultipleStudents(courseId, studentIds);
  }

  /**
   * Ejecutar seed completo: crear estudiantes y asignarlos a cursos
   */
  async runFullSeed(): Promise<{
    students: { created: number; skipped: number };
    enrollments: { enrollments: number; errors: number };
  }> {
    // 1. Crear estudiantes
    const studentsResult = await this.seedStudents();

    // 2. Asignar a cursos
    const enrollmentsResult = await this.assignStudentsToCourses();

    return {
      students: studentsResult,
      enrollments: enrollmentsResult
    };
  }

  /**
   * Limpiar todos los datos de estudiantes y matriculas
   */
  async clearAllStudentData(): Promise<void> {
    try {
      await this.sqliteService.run('DELETE FROM course_students', []);
      await this.sqliteService.run('DELETE FROM attendance', []);
      await this.sqliteService.run('DELETE FROM students', []);
    } catch (error) {
      console.error('Error clearing student data:', error);
      throw error;
    }
  }

  /**
   * Mezclar array aleatoriamente (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
