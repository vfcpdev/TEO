import { Injectable, inject, signal } from '@angular/core';
import { SQLiteService } from '../../../core/services/sqlite.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Attendance,
  AttendanceStatus,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceWithStudentInfo,
  AttendanceSessionData
} from '../../../models/attendance.model';
import { Student } from '../../../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private sqliteService = inject(SQLiteService);
  private toastService = inject(ToastService);

  /**
   * Obtener asistencias de una sesión (curso + fecha)
   */
  async getSessionAttendance(courseId: string, sessionDate: string): Promise<AttendanceWithStudentInfo[]> {
    try {
      const query = `
        SELECT
          a.id, a.course_id as courseId, a.student_id as studentId, a.session_date as sessionDate,
          a.status, a.notes, a.created_at as createdAt, a.updated_at as updatedAt,
          s.code as studentCode, s.first_name as studentFirstName, s.last_name as studentLastName
        FROM attendance a
        LEFT JOIN students s ON a.student_id = s.id
        WHERE a.course_id = ? AND a.session_date = ?
        ORDER BY s.last_name, s.first_name
      `;
      const result = await this.sqliteService.query<any>(query, [courseId, sessionDate]);

      return (result || []).map((row: any) => ({
        id: row.id,
        courseId: row.courseId,
        studentId: row.studentId,
        sessionDate: new Date(row.sessionDate),
        status: row.status as AttendanceStatus,
        notes: row.notes,
        recordedAt: new Date(row.createdAt),
        recordedBy: '',
        studentCode: row.studentCode,
        studentFirstName: row.studentFirstName,
        studentLastName: row.studentLastName
      }));
    } catch (error) {
      console.error('Error getting session attendance:', error);
      return [];
    }
  }

  /**
   * Obtener estudiantes de un curso con su estado de asistencia para una fecha
   */
  async getStudentsWithAttendance(courseId: string, sessionDate: string): Promise<AttendanceWithStudentInfo[]> {
    try {
      // Obtener estudiantes del curso
      const studentsQuery = `
        SELECT s.id, s.code, s.first_name as firstName, s.last_name as lastName
        FROM students s
        INNER JOIN course_students cs ON s.id = cs.student_id
        WHERE cs.course_id = ?
        ORDER BY s.last_name, s.first_name
      `;
      const students = await this.sqliteService.query<any>(studentsQuery, [courseId]);

      // Obtener asistencias existentes para la fecha
      const attendanceQuery = `
        SELECT student_id as studentId, id, status, notes
        FROM attendance
        WHERE course_id = ? AND session_date = ?
      `;
      const attendanceRecords = await this.sqliteService.query<any>(attendanceQuery, [courseId, sessionDate]);
      const attendanceMap = new Map<string, any>();
      (attendanceRecords || []).forEach((a: any) => {
        attendanceMap.set(a.studentId, a);
      });

      // Combinar estudiantes con asistencias
      return (students || []).map((s: any) => {
        const attendance = attendanceMap.get(s.id);
        return {
          id: attendance?.id || '',
          courseId,
          studentId: s.id,
          sessionDate: new Date(sessionDate),
          status: attendance?.status || AttendanceStatus.AUSENTE,
          notes: attendance?.notes || '',
          recordedAt: new Date(),
          recordedBy: '',
          studentCode: s.code,
          studentFirstName: s.firstName,
          studentLastName: s.lastName,
          hasRecord: !!attendance
        };
      });
    } catch (error) {
      console.error('Error getting students with attendance:', error);
      return [];
    }
  }

  /**
   * Crear o actualizar asistencia
   */
  async saveAttendance(data: CreateAttendanceDto): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const sessionDateStr = data.sessionDate instanceof Date
        ? data.sessionDate.toISOString().split('T')[0]
        : data.sessionDate;

      // Verificar si ya existe
      const existingQuery = `
        SELECT id FROM attendance
        WHERE course_id = ? AND student_id = ? AND session_date = ?
      `;
      const existingResult = await this.sqliteService.query<any>(existingQuery, [data.courseId, data.studentId, sessionDateStr]);

      if (existingResult && existingResult.length > 0) {
        // Actualizar
        const updateQuery = `
          UPDATE attendance SET status = ?, notes = ?, updated_at = ?
          WHERE id = ?
        `;
        await this.sqliteService.run(updateQuery, [data.status, data.notes || '', now, existingResult[0].id]);
      } else {
        // Crear
        const id = this.generateId();
        const insertQuery = `
          INSERT INTO attendance (id, course_id, student_id, session_date, status, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await this.sqliteService.run(insertQuery, [id, data.courseId, data.studentId, sessionDateStr, data.status, data.notes || '', now, now]);
      }

      return true;
    } catch (error) {
      console.error('Error saving attendance:', error);
      return false;
    }
  }

  /**
   * Guardar asistencias en lote
   */
  async saveBatchAttendance(attendances: CreateAttendanceDto[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const attendance of attendances) {
      const result = await this.saveAttendance(attendance);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Marcar todos como presente
   */
  async markAllPresent(courseId: string, sessionDate: string, studentIds: string[]): Promise<boolean> {
    try {
      const attendances: CreateAttendanceDto[] = studentIds.map(studentId => ({
        courseId,
        studentId,
        sessionDate: new Date(sessionDate),
        status: AttendanceStatus.PRESENTE
      }));

      const result = await this.saveBatchAttendance(attendances);
      return result.success === studentIds.length;
    } catch (error) {
      console.error('Error marking all present:', error);
      return false;
    }
  }

  /**
   * Obtener historial de asistencia de un estudiante en un curso
   */
  async getStudentAttendanceHistory(studentId: string, courseId: string): Promise<Attendance[]> {
    try {
      const query = `
        SELECT id, course_id as courseId, student_id as studentId, session_date as sessionDate,
               status, notes, created_at as createdAt, updated_at as updatedAt
        FROM attendance
        WHERE student_id = ? AND course_id = ?
        ORDER BY session_date DESC
      `;
      const result = await this.sqliteService.query<any>(query, [studentId, courseId]);

      return (result || []).map((row: any) => ({
        id: row.id,
        courseId: row.courseId,
        studentId: row.studentId,
        sessionDate: new Date(row.sessionDate),
        status: row.status as AttendanceStatus,
        notes: row.notes,
        recordedAt: new Date(row.createdAt),
        recordedBy: ''
      }));
    } catch (error) {
      console.error('Error getting student attendance history:', error);
      return [];
    }
  }

  /**
   * Obtener fechas de sesiones de un curso
   */
  async getCourseSessions(courseId: string): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT session_date FROM attendance
        WHERE course_id = ?
        ORDER BY session_date DESC
      `;
      const result = await this.sqliteService.query<any>(query, [courseId]);
      return (result || []).map((row: any) => row.session_date);
    } catch (error) {
      console.error('Error getting course sessions:', error);
      return [];
    }
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
