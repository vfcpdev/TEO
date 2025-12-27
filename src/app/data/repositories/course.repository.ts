import { Injectable } from '@angular/core';
import { Firestore, where } from '@angular/fire/firestore';
import { BaseRepository } from './base.repository';
import { Course } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class CourseRepository extends BaseRepository<Course> {
  protected collectionName = 'courses';

  constructor(firestore: Firestore) {
    super(firestore);
  }

  async getCoursesByPlace(placeId: string): Promise<Course[]> {
    return this.getAll([
      where('placeId', '==', placeId),
      where('isActive', '==', true)
    ]);
  }

  async getActiveCourses(): Promise<Course[]> {
    return this.getAll([where('isActive', '==', true)]);
  }
}
