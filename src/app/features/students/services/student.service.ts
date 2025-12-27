import { Injectable, inject } from '@angular/core';
import { StudentRepository } from '../../../data/repositories/student.repository';
import { Student, CreateStudentDto, UpdateStudentDto, DocumentType } from '../../../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private studentRepository = inject(StudentRepository);


  /**
   * Obtener todos los estudiantes
   */
  async getAll(): Promise<Student[]> {
    return await this.studentRepository.getAll();
  }

  /**
   * Obtener estudiante por ID
   */
  async getById(id: string): Promise<Student | null> {
    return await this.studentRepository.getById(id);
  }

  /**
   * Obtener estudiante por código
   */
  async getByCode(code: string): Promise<Student | null> {
    const students = await this.studentRepository.getAll();
    return students.find(s => s.code === code) || null;
  }

  /**
   * Obtener estudiante por número de documento
   */
  async getByDocumentNumber(documentNumber: string): Promise<Student | null> {
    const students = await this.studentRepository.getAll();
    return students.find(s => s.documentNumber === documentNumber) || null;
  }

  /**
   * Crear estudiante
   */
  async create(dto: CreateStudentDto): Promise<Student> {
    // Validar código único
    const existingByCode = await this.getByCode(dto.code);
    if (existingByCode) {
      throw new Error(`Ya existe un estudiante con el código ${dto.code}`);
    }

    // Validar documento único
    const existingByDoc = await this.getByDocumentNumber(dto.documentNumber);
    if (existingByDoc) {
      throw new Error(`Ya existe un estudiante con el documento ${dto.documentNumber}`);
    }

    const now = new Date();
    const student: Omit<Student, 'id'> = {
      ...dto,
      createdAt: now,
      updatedAt: now
    };

    const id = await this.studentRepository.create(student);
    return { id, ...student };
  }

  /**
   * Actualizar estudiante
   */
  async update(dto: UpdateStudentDto): Promise<void> {
    const existing = await this.getById(dto.id);
    if (!existing) {
      throw new Error('Estudiante no encontrado');
    }

    // Validar código único si cambió
    if (dto.code && dto.code !== existing.code) {
      const existingByCode = await this.getByCode(dto.code);
      if (existingByCode && existingByCode.id !== dto.id) {
        throw new Error(`Ya existe un estudiante con el código ${dto.code}`);
      }
    }

    // Validar documento único si cambió
    if (dto.documentNumber && dto.documentNumber !== existing.documentNumber) {
      const existingByDoc = await this.getByDocumentNumber(dto.documentNumber);
      if (existingByDoc && existingByDoc.id !== dto.id) {
        throw new Error(`Ya existe un estudiante con el documento ${dto.documentNumber}`);
      }
    }

    const { id, ...updateData } = dto;
    await this.studentRepository.update(id, {
      ...updateData,
      updatedAt: new Date()
    });
  }

  /**
   * Eliminar estudiante
   */
  async delete(id: string): Promise<void> {
    await this.studentRepository.delete(id);
  }

  /**
   * Buscar estudiantes por texto
   */
  async search(searchText: string): Promise<Student[]> {
    const allStudents = await this.getAll();
    const lowerSearch = searchText.toLowerCase().trim();

    if (!lowerSearch) return allStudents;

    return allStudents.filter(student =>
      student.code.toLowerCase().includes(lowerSearch) ||
      student.firstName.toLowerCase().includes(lowerSearch) ||
      student.lastName.toLowerCase().includes(lowerSearch) ||
      student.documentNumber.toLowerCase().includes(lowerSearch) ||
      student.email?.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Crear múltiples estudiantes (para importación CSV)
   */
  async createBulk(students: CreateStudentDto[]): Promise<{ success: number; errors: Array<{ student: CreateStudentDto; error: string }> }> {
    let success = 0;
    const errors: Array<{ student: CreateStudentDto; error: string }> = [];

    for (const studentDto of students) {
      try {
        await this.create(studentDto);
        success++;
      } catch (error: any) {
        errors.push({
          student: studentDto,
          error: error.message || 'Error desconocido'
        });
      }
    }

    return { success, errors };
  }
}
