import { Injectable } from '@angular/core';
import { CsvCourseRow, CsvCourseImportResult, CsvCourseImportError } from '../../../models/course.model';

export interface CsvCourseData {
  code: string;
  name: string;
  semester?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseCsvImportService {

  /**
   * Parsea un archivo CSV y valida el formato
   * Formato esperado: codigo,nombre,semestre (semestre opcional)
   */
  async parseCsvFile(file: File): Promise<CsvCourseImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const text = e.target?.result as string;
          const result = this.parseCSVText(text);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parsea el texto CSV y valida cada fila
   * Formato: codigo curso,nombrecurso,semestre
   */
  parseCSVText(text: string): CsvCourseImportResult {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const errors: CsvCourseImportError[] = [];
    const courses: CsvCourseData[] = [];

    if (lines.length === 0) {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        errors: [{ row: 0, message: 'El archivo está vacío' }],
        courses: []
      };
    }

    // Validar header (flexible para diferentes formatos)
    const header = lines[0].toLowerCase().trim();
    const hasCode = header.includes('codigo') || header.includes('código') || header.includes('code');
    const hasName = header.includes('nombre') || header.includes('name') || header.includes('curso');

    if (!hasCode && !hasName) {
      errors.push({
        row: 1,
        message: 'El encabezado debe contener: codigo,nombre o código curso,nombrecurso'
      });
    }

    // Procesar cada fila (saltando el header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const rowNumber = i + 1;
      const rowResult = this.parseRow(line, rowNumber);

      if (rowResult.errors.length > 0) {
        errors.push(...rowResult.errors);
      } else if (rowResult.course) {
        // Verificar duplicados en el mismo CSV
        const duplicate = courses.find(c => c.code === rowResult.course!.code);
        if (duplicate) {
          errors.push({
            row: rowNumber,
            field: 'codigo',
            message: `Código duplicado: ${rowResult.course.code}`,
            data: rowResult.course
          });
        } else {
          courses.push(rowResult.course);
        }
      }
    }

    return {
      success: errors.length === 0,
      totalRows: lines.length - 1, // Sin contar header
      importedCount: courses.length,
      errors,
      courses
    };
  }

  /**
   * Parsea una fila individual del CSV
   * Formato: codigo,nombre,semestre (semestre opcional)
   */
  private parseRow(line: string, rowNumber: number): {
    course: CsvCourseData | null;
    errors: CsvCourseImportError[];
  } {
    const errors: CsvCourseImportError[] = [];

    // Parsear CSV respetando comillas
    const values = this.parseCSVLine(line);

    if (values.length < 2) {
      errors.push({
        row: rowNumber,
        message: 'Formato inválido. Se esperan al menos 2 columnas: codigo,nombre'
      });
      return { course: null, errors };
    }

    const [codigo, nombre, semestre] = values.map(v => v.trim());

    // Validar código
    if (!codigo) {
      errors.push({
        row: rowNumber,
        field: 'codigo',
        message: 'El código es requerido'
      });
    } else if (codigo.length > 20) {
      errors.push({
        row: rowNumber,
        field: 'codigo',
        message: 'El código no puede exceder 20 caracteres'
      });
    }

    // Validar nombre
    if (!nombre) {
      errors.push({
        row: rowNumber,
        field: 'nombre',
        message: 'El nombre es requerido'
      });
    } else if (nombre.length > 100) {
      errors.push({
        row: rowNumber,
        field: 'nombre',
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }

    if (errors.length > 0) {
      return { course: null, errors };
    }

    return {
      course: {
        code: codigo,
        name: nombre,
        semester: semestre || undefined
      },
      errors: []
    };
  }

  /**
   * Parsea una línea CSV respetando comillas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map(v => v.replace(/^"|"$/g, '').trim());
  }

  /**
   * Genera un archivo CSV de ejemplo
   */
  generateSampleCSV(): string {
    return `código curso,nombrecurso,semestre
203400,Matemáticas y Lógica,Semestre I
203401,Epistemología de la Tecnología,Semestre I
203406,Razonamiento Cuantitativo,Semestre II
203413,Fundamentos de Algoritmia,Semestre III`;
  }

  /**
   * Descarga un archivo CSV de ejemplo
   */
  downloadSampleCSV(): void {
    const csv = this.generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'cursos_ejemplo.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
