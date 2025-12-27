export enum DocumentType {
  TI = 'TI',           // Tarjeta de Identidad
  CC = 'CC',           // Cédula de Ciudadanía  
  DNI = 'DNI',         // Documento Nacional de Identidad
  CE = 'CE',           // Carnet de Extranjería
  RC = 'RC',           // Registro Civil
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER'
}

export const DocumentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.TI]: 'Tarjeta de Identidad',
  [DocumentType.CC]: 'Cédula de Ciudadanía',
  [DocumentType.DNI]: 'DNI',
  [DocumentType.CE]: 'Carnet de Extranjería',
  [DocumentType.RC]: 'Registro Civil',
  [DocumentType.PASSPORT]: 'Pasaporte',
  [DocumentType.OTHER]: 'Otro'
};

export interface Student {
  id: string;
  code: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentDto {
  code: string; // Auto-generado durante creación si no se proporciona
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  photo?: string;
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {
  id: string;
}

export interface CourseStudent {
  id: string;
  courseId: string;
  studentId: string;
  group?: string; // Grupo del estudiante en el curso
  enrollmentDate: Date;
  isActive: boolean;
}

export interface StudentWithCourseInfo extends Student {
  enrollmentDate: Date;
  isActive: boolean;
  group?: string;
  courseStudentId: string;
}

export interface CsvStudentRow {
  tipoDocumento: string;
  numeroDocumento: string;
  codigo: string;
  apellidos: string;
  nombres: string;
  email?: string;
  grupo?: string;
  codigoCurso?: string;
}

export interface CsvImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: CsvImportError[];
  students: CreateStudentDto[];
  enrollments?: { studentCode: string; courseCode: string; group?: string }[];
}

export interface CsvImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

// XLS Import Interfaces
export interface XlsStudentRow {
  tipoDocumento: string;
  numeroDocumento: string;
  apellidosNombres: string;
  telefono: string;
  email: string;
}

export interface CourseInfo {
  courseCode: string;
  courseName: string;
  group: string;
  studentCount: number;
}

export interface XlsImportResult {
  success: boolean;
  courseInfo?: CourseInfo;
  totalRows: number;
  importedCount: number;
  errors: CsvImportError[];
  students: CreateStudentDto[];
  enrollments?: { studentCode: string; courseCode: string; group?: string }[];
}
