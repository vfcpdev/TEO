import { Injectable } from '@angular/core';
import { Firestore, where, orderBy } from '@angular/fire/firestore';
import { BaseRepository } from './base.repository';
import { Bonus } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class BonusRepository extends BaseRepository<Bonus> {
  protected collectionName = 'bonuses';



  async getBonusesByCourse(courseId: string): Promise<Bonus[]> {
    return this.getAll([
      where('courseId', '==', courseId),
      orderBy('date', 'desc')
    ]);
  }

  async getBonusesByStudent(
    studentId: string,
    courseId?: string
  ): Promise<Bonus[]> {
    const constraints = [
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    ];

    if (courseId) {
      constraints.push(where('courseId', '==', courseId));
    }

    return this.getAll(constraints);
  }
}
