import { Injectable } from '@angular/core';
import { Firestore, where, orderBy } from '@angular/fire/firestore';
import { BaseRepository } from './base.repository';
import { Attendance } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class AttendanceRepository extends BaseRepository<Attendance> {
  protected collectionName = 'attendances';

  constructor(firestore: Firestore) {
    super(firestore);
  }

  async getAttendancesBySession(
    courseId: string,
    sessionDate: Date
  ): Promise<Attendance[]> {
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getAll([
      where('courseId', '==', courseId),
      where('sessionDate', '>=', startOfDay),
      where('sessionDate', '<=', endOfDay)
    ]);
  }

  async getAttendancesByCourse(
    courseId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    const constraints = [
      where('courseId', '==', courseId),
      orderBy('sessionDate', 'desc')
    ];

    if (startDate) {
      constraints.push(where('sessionDate', '>=', startDate));
    }
    if (endDate) {
      constraints.push(where('sessionDate', '<=', endDate));
    }

    return this.getAll(constraints);
  }

  async getAttendancesByStudent(
    studentId: string,
    courseId?: string
  ): Promise<Attendance[]> {
    const constraints = [
      where('studentId', '==', studentId),
      orderBy('sessionDate', 'desc')
    ];

    if (courseId) {
      constraints.push(where('courseId', '==', courseId));
    }

    return this.getAll(constraints);
  }
}
