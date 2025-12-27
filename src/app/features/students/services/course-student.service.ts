import { Injectable, inject } from '@angular/core';
import { SQLiteService } from '../../../core/services/sqlite.service';
import { ToastService } from '../../../core/services/toast.service';
import { Student, CreateStudentDto, DocumentType } from '../../../models/student.model';
import { Course } from '../../../models/course.model';

export interface CourseStudentEnrollment {
  courseId: string;
  studentId: string;
  enrolledAt: string;
}

export interface StudentWithCourses extends Student {
  courses: Course[];
}

export interface CourseWithStudents extends Course {
  students: Student[];
  studentCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseStudentService {
  private sqliteService = inject(SQLiteService);
  private toastService = inject(ToastService);

  /**
   * Inscribir estudiante en un curso
   */
  async enrollStudent(courseId: string, studentId: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      // Verificar si ya está inscrito
      const existingQuery = `
        SELECT course_id FROM course_students
        WHERE course_id = ? AND student_id = ?
      `;
      const existing = await this.sqliteService.query<any>(existingQuery, [courseId, studentId]);

      if (existing && existing.length > 0) {
        console.log('Estudiante ya inscrito en este curso');
        return true; // Ya está inscrito, no es error
      }

      const insertQuery = `
        INSERT INTO course_students (course_id, student_id, enrolled_at)
        VALUES (?, ?, ?)
      `;
      await this.sqliteService.run(insertQuery, [courseId, studentId, now]);
      return true;
    } catch (error) {
      console.error('Error enrolling student:', error);
      return false;
    }
  }

  /**
   * Desinscribir estudiante de un curso
   */
  async unenrollStudent(courseId: string, studentId: string): Promise<boolean> {
    try {
      const deleteQuery = `
        DELETE FROM course_students
        WHERE course_id = ? AND student_id = ?
      `;
      await this.sqliteService.run(deleteQuery, [courseId, studentId]);
      return true;
    } catch (error) {
      console.error('Error unenrolling student:', error);
      return false;
    }
  }

  /**
   * Obtener estudiantes de un curso
   */
  async getStudentsByCourse(courseId: string): Promise<Student[]> {
    try {
      const query = `
        SELECT s.id, s.code, s.first_name as firstName, s.last_name as lastName,
               s.email, s.created_at as createdAt, s.updated_at as updatedAt
        FROM students s
        INNER JOIN course_students cs ON s.id = cs.student_id
        WHERE cs.course_id = ?
        ORDER BY s.last_name, s.first_name
      `;
      const result = await this.sqliteService.query<any>(query, [courseId]);

      return (result || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        documentType: DocumentType.DNI,
        documentNumber: '',
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    } catch (error) {
      console.error('Error getting students by course:', error);
      return [];
    }
  }

  /**
   * Obtener cursos de un estudiante
   */
  async getCoursesByStudent(studentId: string): Promise<Course[]> {
    try {
      const query = `
        SELECT c.id, c.code, c.name, c.group_number as groupNumber, c.semester,
               c.place_id as placeId, c.classroom, c.modality, c.virtual_link as virtualLink,
               c.academic_period as academicPeriod, c.is_active as isActive,
               c.created_at as createdAt, c.updated_at as updatedAt
        FROM courses c
        INNER JOIN course_students cs ON c.id = cs.course_id
        WHERE cs.student_id = ?
        ORDER BY c.name
      `;
      const result = await this.sqliteService.query<any>(query, [studentId]);

      return (result || []).map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        groupNumber: row.groupNumber,
        semester: row.semester,
        placeId: row.placeId,
        classroom: row.classroom,
        modality: row.modality,
        virtualLink: row.virtualLink,
        academicPeriod: row.academicPeriod,
        isActive: !!row.isActive,
        schedules: [],
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      }));
    } catch (error) {
      console.error('Error getting courses by student:', error);
      return [];
    }
  }

  /**
   * Contar estudiantes en un curso
   */
  async countStudentsInCourse(courseId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count FROM course_students
        WHERE course_id = ?
      `;
      const result = await this.sqliteService.query<any>(query, [courseId]);
      return result?.[0]?.count || 0;
    } catch (error) {
      console.error('Error counting students:', error);
      return 0;
    }
  }

  /**
   * Inscribir múltiples estudiantes en un curso
   */
  async enrollMultipleStudents(courseId: string, studentIds: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const studentId of studentIds) {
      const result = await this.enrollStudent(courseId, studentId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Verificar si un estudiante está inscrito en un curso
   */
  async isStudentEnrolled(courseId: string, studentId: string): Promise<boolean> {
    try {
      const query = `
        SELECT 1 FROM course_students
        WHERE course_id = ? AND student_id = ?
        LIMIT 1
      `;
      const result = await this.sqliteService.query<any>(query, [courseId, studentId]);
      return (result && result.length > 0);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }
}
