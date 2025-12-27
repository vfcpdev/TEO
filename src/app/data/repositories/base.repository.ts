import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  CollectionReference
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class BaseRepository<T> {
  protected abstract collectionName: string;

  constructor(protected firestore: Firestore) {}

  protected getCollection(): CollectionReference<DocumentData> {
    return collection(this.firestore, this.collectionName);
  }

  async create(data: Partial<T>): Promise<string> {
    const docRef = await addDoc(this.getCollection(), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.getCollection(), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as T));
  }

  getById$(id: string): Observable<T | null> {
    return from(this.getById(id));
  }

  getAll$(constraints: QueryConstraint[] = []): Observable<T[]> {
    return from(this.getAll(constraints));
  }
}
