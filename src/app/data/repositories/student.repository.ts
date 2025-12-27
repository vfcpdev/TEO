import { Injectable } from '@angular/core';
import { Firestore, where } from '@angular/fire/firestore';
import { BaseRepository } from './base.repository';
import { Student, CourseStudent } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class StudentRepository extends BaseRepository<Student> {
  protected collectionName = 'students';



  async getStudentsByIds(studentIds: string[]): Promise<Student[]> {
    if (studentIds.length === 0) return [];

    // Firestore 'in' queries have a limit of 10 items
    const chunks = this.chunkArray(studentIds, 10);
    const results: Student[] = [];

    for (const chunk of chunks) {
      const students = await this.getAll([where('id', 'in', chunk)]);
      results.push(...students);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
