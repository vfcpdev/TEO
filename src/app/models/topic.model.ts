export enum TopicStatus {
  COMPLETADO = 'completado',
  PENDIENTE = 'pendiente',
  PLANIFICADO = 'planificado'
}

export interface Topic {
  id: string;
  courseId: string;
  sessionDate: Date;
  title: string;
  description?: string;
  status: TopicStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTopicDto {
  courseId: string;
  sessionDate: Date;
  title: string;
  description?: string;
  status: TopicStatus;
  notes?: string;
}

export interface UpdateTopicDto {
  id: string;
  title?: string;
  description?: string;
  status?: TopicStatus;
  notes?: string;
  sessionDate?: Date;
}

export interface TopicWithCourseInfo extends Topic {
  courseName: string;
  courseCode: string;
}
