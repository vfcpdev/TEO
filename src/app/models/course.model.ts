export enum CourseModality {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual'
}

export const CourseModalityLabels: Record<CourseModality, string> = {
  [CourseModality.PRESENCIAL]: 'Presencial',
  [CourseModality.VIRTUAL]: 'Virtual'
};

export const CourseModalityIcons: Record<CourseModality, string> = {
  [CourseModality.PRESENCIAL]: 'business-outline',
  [CourseModality.VIRTUAL]: 'laptop-outline'
};

export const CourseModalityColors: Record<CourseModality, string> = {
  [CourseModality.PRESENCIAL]: 'primary',
  [CourseModality.VIRTUAL]: 'tertiary'
};

export const WeekDayLabels: Record<number, string> = {
  0: 'DO',
  1: 'LU',
  2: 'MA',
  3: 'MI',
  4: 'JU',
  5: 'VI',
  6: 'SÁ'
};

// Etiquetas ultra-cortas para UI compacta (1 letra)
export const WeekDayLabelsShort: Record<number, string> = {
  0: 'D',
  1: 'L',
  2: 'M',
  3: 'X',
  4: 'J',
  5: 'V',
  6: 'S'
};

export const WeekDayFullLabels: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
};

/**
 * Grupos disponibles para un curso (máximo 2)
 */
export const CourseGroups = [1, 2] as const;
export type CourseGroup = typeof CourseGroups[number];

export const CourseGroupLabels: Record<CourseGroup, string> = {
  1: 'Grupo 1',
  2: 'Grupo 2'
};

/**
 * Horario de un día específico
 * Permite configurar múltiples horarios por día
 */
export interface DaySchedule {
  day: number;        // 0-6 (Domingo-Sábado)
  startTime: string;  // HH:mm format
  endTime: string;    // HH:mm format
}

export interface Course {
  id: string;
  code: string;
  /**
   * Número de grupo del curso (1 o 2) - OPCIONAL
   * Si no se especifica, el curso no tiene grupos
   * Clave única: code + group (ej: PROG101, PROG101-G1, PROG101-G2)
   */
  group?: CourseGroup;
  /**
   * Semestre o periodo académico del curso
   * Ejemplo: "Semestre I", "2024-1", etc.
   */
  semester?: string;
  name: string;
  placeId: string;
  /**
   * @deprecated Usar schedules[] para horarios por día
   * Mantenido para compatibilidad con datos existentes
   */
  startTime?: string;
  /**
   * @deprecated Usar schedules[] para horarios por día
   * Mantenido para compatibilidad con datos existentes
   */
  endTime?: string;
  /**
   * @deprecated Usar schedules[] para días de la semana
   * Mantenido para compatibilidad con datos existentes
   */
  weekDays?: number[];
  /**
   * Horarios configurados por día de la semana
   * Cada elemento define un día y su horario específico
   * Ejemplo: [{day: 1, startTime: '08:00', endTime: '10:00'}, {day: 4, startTime: '18:00', endTime: '22:00'}]
   */
  schedules: DaySchedule[];
  classroom?: string;
  modality: CourseModality;
  virtualLink?: string;
  academicPeriod?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseDto {
  code: string;
  group?: CourseGroup;
  semester?: string;
  name: string;
  placeId: string;
  schedules: DaySchedule[];
  classroom?: string;
  modality: CourseModality;
  virtualLink?: string;
  academicPeriod?: string;
  isActive?: boolean;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
  id: string;
  isActive?: boolean;
}

export interface CourseWithPlace extends Course {
  placeName: string;
  placeLogo?: string;
}

/**
 * Genera el código completo del curso incluyendo el grupo (si existe)
 * Formato: {code} o {code}-G{group}
 * Ejemplo: PROG101, MAT201-G1, MAT201-G2
 */
export function getCourseFullCode(code: string, group?: CourseGroup): string {
  return group ? `${code}-G${group}` : code;
}

/**
 * Extrae el código base y grupo de un fullCode
 * Ejemplo: 'PROG101-G1' -> { code: 'PROG101', group: 1 }
 */
export function parseCourseFullCode(fullCode: string): { code: string; group: CourseGroup } | null {
  const match = fullCode.match(/^(.+)-G([12])$/);
  if (!match) return null;
  return { code: match[1], group: parseInt(match[2]) as CourseGroup };
}

/**
 * Migrar curso legacy (con weekDays/startTime/endTime) al nuevo formato schedules
 * También asigna grupo 1 por defecto si no tiene grupo
 */
export function migrateCourseToSchedules(course: Course): Course {
  // Asignar grupo 1 por defecto si no tiene
  const group = course.group || 1;

  // Si ya tiene schedules, solo asegurar que tenga grupo
  if (course.schedules && course.schedules.length > 0) {
    return { ...course, group };
  }

  // Migrar desde formato legacy
  const schedules: DaySchedule[] = [];
  if (course.weekDays && course.startTime && course.endTime) {
    for (const day of course.weekDays) {
      schedules.push({
        day,
        startTime: course.startTime,
        endTime: course.endTime
      });
    }
  }

  return {
    ...course,
    group,
    schedules
  };
}

/**
 * Obtener días de la semana únicos de los schedules
 */
export function getScheduleWeekDays(schedules: DaySchedule[]): number[] {
  return [...new Set(schedules.map(s => s.day))].sort((a, b) => a - b);
}

/**
 * Formatear horario para mostrar
 */
export function formatScheduleDisplay(schedules: DaySchedule[]): string {
  if (!schedules || schedules.length === 0) return 'Sin horario';

  const grouped = schedules.reduce((acc, s) => {
    const key = `${s.startTime}-${s.endTime}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(WeekDayLabels[s.day]);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped)
    .map(([time, days]) => `${days.join(', ')} ${time.replace('-', ' - ')}`)
    .join(' | ');
}

// CSV Import interfaces
export interface CsvCourseRow {
  codigo: string;
  nombre: string;
}

export interface CsvCourseImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errors: CsvCourseImportError[];
  courses: { code: string; name: string }[];
}

export interface CsvCourseImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

/**
 * Genera un ID único para un curso
 * Formato: CRS-{YYYYMMDD}-{RANDOM}
 * Ejemplo: CRS-20251214-K7M
 */
export function generateCourseId(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `CRS-${dateStr}-${random}`;
}
