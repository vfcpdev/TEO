import { Injectable } from '@angular/core';
import { Firestore, where, orderBy } from '@angular/fire/firestore';
import { BaseRepository } from './base.repository';
import { Topic } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class TopicRepository extends BaseRepository<Topic> {
  protected collectionName = 'topics';

  constructor(firestore: Firestore) {
    super(firestore);
  }

  async getTopicsByCourse(courseId: string): Promise<Topic[]> {
    return this.getAll([
      where('courseId', '==', courseId),
      orderBy('sessionDate', 'desc')
    ]);
  }

  async getTopicsByDateRange(
    courseId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Topic[]> {
    return this.getAll([
      where('courseId', '==', courseId),
      where('sessionDate', '>=', startDate),
      where('sessionDate', '<=', endDate),
      orderBy('sessionDate', 'asc')
    ]);
  }
}
