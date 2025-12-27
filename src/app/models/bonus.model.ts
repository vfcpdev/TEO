export enum BonusCategory {
  PARTICIPACION = 'participacion',
  TAREA = 'tarea',
  PROYECTO = 'proyecto',
  OTRO = 'otro'
}

export interface Bonus {
  id: string;
  courseId: string;
  studentId: string;
  points: number;
  reason: string;
  category: BonusCategory;
  date: Date;
  createdAt: Date;
  createdBy: string; // userId
}

export interface CreateBonusDto {
  courseId: string;
  studentId: string;
  points: number;
  reason: string;
  category: BonusCategory;
  date: Date;
}

export interface UpdateBonusDto {
  id: string;
  points?: number;
  reason?: string;
  category?: BonusCategory;
  date?: Date;
}

export interface BonusWithStudentInfo extends Bonus {
  studentCode: string;
  studentFirstName: string;
  studentLastName: string;
}

export interface StudentBonusSummary {
  studentId: string;
  studentCode: string;
  studentName: string;
  totalPoints: number;
  bonusCount: number;
  bonusesByCategory: {
    [key in BonusCategory]: number;
  };
}
