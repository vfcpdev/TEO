export enum AttendanceStatus {
  PRESENTE = 'presente',
  AUSENTE = 'ausente',
  TARDANZA = 'tardanza',
  JUSTIFICADO = 'justificado'
}

export interface Attendance {
  id: string;
  courseId: string;
  studentId: string;
  sessionDate: Date;
  status: AttendanceStatus;
  notes?: string;
  recordedAt: Date;
  recordedBy: string; // userId
}

export interface CreateAttendanceDto {
  courseId: string;
  studentId: string;
  sessionDate: Date;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceDto {
  id: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceWithStudentInfo extends Attendance {
  studentCode: string;
  studentFirstName: string;
  studentLastName: string;
  studentPhoto?: string;
}

export interface AttendanceSessionData {
  courseId: string;
  sessionDate: Date;
  attendances: AttendanceWithStudentInfo[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  justifiedCount: number;
}

export interface StudentAttendanceStats {
  studentId: string;
  studentCode: string;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  justifiedCount: number;
  attendancePercentage: number;
}
