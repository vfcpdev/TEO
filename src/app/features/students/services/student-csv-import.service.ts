import { Injectable } from '@angular/core';
import { CsvStudentRow, CsvImportResult, CsvImportError, CreateStudentDto, DocumentType } from '../../../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentCsvImportService {

  constructor() { }

  /**
   * Parsear archivo CSV de estudiantes
   * Formato: tipoDocumento,numeroDocumento,codigo,apellidos,nombres,email,grupo,codigoCurso
   */
  async parseCsvFile(file: File): Promise<CsvImportResult> {
    try {
      const text = await file.text();
      return this.parseCSVText(text);
    } catch (error) {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        errors: [{
          row: 0,
          message: `Error al leer el archivo: ${error}`
        }],
        students: [],
        enrollments: []
      };
    }
  }

  /**
   * Parsear texto CSV
   */
  parseCSVText(csvText: string): CsvImportResult {
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        errors: [{ row: 0, message: 'Archivo CSV vacío' }],
        students: [],
        enrollments: []
      };
    }

    const errors: CsvImportError[] = [];
    const students: CreateStudentDto[] = [];
    const enrollments: { studentCode: string; courseCode: string; group?: string }[] = [];
    const seenCodes = new Set<string>();
    const seenDocuments = new Set<string>();

    // Saltar encabezado si existe
    const startIndex = lines[0].toLowerCase().includes('tipo') ? 1 : 0;
    const dataLines = lines.slice(startIndex);

    dataLines.forEach((line, index) => {
      const rowNumber = startIndex + index + 1;

      try {
        const row = this.parseRow(line);

        // Validaciones
        const rowErrors = this.validateRow(row, rowNumber, seenCodes, seenDocuments);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          return;
        }

        // Validar tipo documento
        const docType = this.parseDocumentType(row.tipoDocumento);
        if (!docType) {
          errors.push({
            row: rowNumber,
            field: 'tipoDocumento',
            message: `Tipo de documento inválido: ${row.tipoDocumento}. Valores permitidos: DNI, CE, PASSPORT, OTHER`
          });
          return;
        }

        // Crear DTO de estudiante
        const student: CreateStudentDto = {
          code: row.codigo.trim(),
          documentType: docType,
          documentNumber: row.numeroDocumento.trim(),
          firstName: row.nombres.trim(),
          lastName: row.apellidos.trim(),
          email: row.email?.trim() || undefined
        };

        students.push(student);
        seenCodes.add(row.codigo);
        seenDocuments.add(row.numeroDocumento);

        // Si hay código de curso, crear matrícula
        if (row.codigoCurso?.trim()) {
          enrollments.push({
            studentCode: row.codigo.trim(),
            courseCode: row.codigoCurso.trim(),
            group: row.grupo?.trim() || undefined
          });
        }

      } catch (error) {
        errors.push({
          row: rowNumber,
          message: `Error procesando línea: ${error}`
        });
      }
    });

    return {
      success: errors.length === 0,
      totalRows: dataLines.length,
      importedCount: students.length,
      errors,
      students,
      enrollments
    };
  }

  /**
   * Parsear una fila CSV
   */
  private parseRow(line: string): CsvStudentRow {
    const values = this.parseCSVLine(line);

    return {
      tipoDocumento: values[0] || '',
      numeroDocumento: values[1] || '',
      codigo: values[2] || '',
      apellidos: values[3] || '',
      nombres: values[4] || '',
      email: values[5] || '',
      grupo: values[6] || '',
      codigoCurso: values[7] || ''
    };
  }

  /**
   * Parsear línea CSV respetando comillas
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
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Validar fila
   */
  private validateRow(
    row: CsvStudentRow,
    rowNumber: number,
    seenCodes: Set<string>,
    seenDocuments: Set<string>
  ): CsvImportError[] {
    const errors: CsvImportError[] = [];

    // Campos requeridos
    if (!row.tipoDocumento) {
      errors.push({ row: rowNumber, field: 'tipoDocumento', message: 'Tipo de documento requerido' });
    }
    if (!row.numeroDocumento) {
      errors.push({ row: rowNumber, field: 'numeroDocumento', message: 'Número de documento requerido' });
    }
    if (!row.codigo) {
      errors.push({ row: rowNumber, field: 'codigo', message: 'Código requerido' });
    }
    if (!row.apellidos) {
      errors.push({ row: rowNumber, field: 'apellidos', message: 'Apellidos requeridos' });
    }
    if (!row.nombres) {
      errors.push({ row: rowNumber, field: 'nombres', message: 'Nombres requeridos' });
    }

    // Validar longitud de campos
    if (row.codigo && row.codigo.length < 2) {
      errors.push({ row: rowNumber, field: 'codigo', message: 'Código debe tener al menos 2 caracteres' });
    }
    if (row.numeroDocumento && row.numeroDocumento.length < 6) {
      errors.push({ row: rowNumber, field: 'numeroDocumento', message: 'Número de documento debe tener al menos 6 caracteres' });
    }

    // Validar email si existe
    if (row.email && !this.isValidEmail(row.email)) {
      errors.push({ row: rowNumber, field: 'email', message: 'Email inválido' });
    }

    // Validar duplicados
    if (row.codigo && seenCodes.has(row.codigo)) {
      errors.push({ row: rowNumber, field: 'codigo', message: `Código duplicado: ${row.codigo}` });
    }
    if (row.numeroDocumento && seenDocuments.has(row.numeroDocumento)) {
      errors.push({ row: rowNumber, field: 'numeroDocumento', message: `Documento duplicado: ${row.numeroDocumento}` });
    }

    return errors;
  }

  /**
   * Parsear tipo de documento
   */
  private parseDocumentType(value: string): DocumentType | null {
    const normalized = value.trim().toUpperCase();

    if (normalized === 'DNI') return DocumentType.DNI;
    if (normalized === 'CE' || normalized === 'CARNET') return DocumentType.CE;
    if (normalized === 'PASSPORT' || normalized === 'PASAPORTE') return DocumentType.PASSPORT;
    if (normalized === 'OTHER' || normalized === 'OTRO') return DocumentType.OTHER;

    return null;
  }

  /**
   * Validar email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generar CSV de ejemplo
   */
  generateSampleCSV(): string {
    const header = 'tipoDocumento,numeroDocumento,codigo,apellidos,nombres,email,grupo,codigoCurso';
    const rows = [
      'DNI,12345678,EST001,García Pérez,Juan Carlos,juan.garcia@email.com,A,MAT101',
      'CE,98765432,EST002,Rodríguez Silva,María,maria.rodriguez@email.com,B,MAT101',
      'PASSPORT,AB123456,EST003,López Torres,Pedro,,A,FIS201'
    ];

    return [header, ...rows].join('\n');
  }

  /**
   * Descargar CSV de ejemplo
   */
  downloadSampleCSV(): void {
    const csv = this.generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'ejemplo_estudiantes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
