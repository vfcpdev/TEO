import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {
    XlsImportResult,
    XlsStudentRow,
    CourseInfo,
    CreateStudentDto,
    CsvImportError,
    DocumentType
} from '../../../models/student.model';

@Injectable({
    providedIn: 'root'
})
export class StudentXlsImportService {

    constructor() { }

    /**
     * Parsear archivo XLS de estudiantes
     * Estructura esperada:
     * - A3:B3 (combinada): Código del curso + nombre del curso
     * - C3: Grupo
     * - D3: Cantidad de estudiantes
     * - A5:F(5+cantidad): Matriz de datos de estudiantes
     */
    async parseXlsFile(file: File): Promise<XlsImportResult> {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // Obtener la primera hoja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Validar estructura del archivo
            const structureError = this.validateXlsStructure(worksheet);
            if (structureError) {
                return {
                    success: false,
                    totalRows: 0,
                    importedCount: 0,
                    errors: [{ row: 0, message: structureError }],
                    students: [],
                    enrollments: []
                };
            }

            // Extraer información del curso
            const courseInfo = this.extractCourseInfo(worksheet);

            // Extraer datos de estudiantes
            const studentData = this.extractStudentData(worksheet, courseInfo.studentCount);

            return {
                success: studentData.errors.length === 0,
                courseInfo,
                totalRows: courseInfo.studentCount,
                importedCount: studentData.students.length,
                errors: studentData.errors,
                students: studentData.students,
                enrollments: studentData.enrollments
            };

        } catch (error) {
            console.error('Error parsing XLS file:', error);
            console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            return {
                success: false,
                totalRows: 0,
                importedCount: 0,
                errors: [{
                    row: 0,
                    message: `Error al leer el archivo XLS: ${error instanceof Error ? error.message : String(error)}`
                }],
                students: [],
                enrollments: []
            };
        }
    }

    /**
     * Validar estructura del archivo XLS
     */
    private validateXlsStructure(worksheet: XLSX.WorkSheet): string | null {
        // Log worksheet range for debugging
        console.log('Worksheet range:', worksheet['!ref']);
        console.log('Available cells:', Object.keys(worksheet).filter(k => !k.startsWith('!')));

        // Verificar que existan las celdas requeridas
        if (!worksheet['A3'] && !worksheet['B3']) {
            console.error('Missing course info in A3/B3');
            return 'Estructura inválida: No se encontró información del curso en A3:B3';
        }
        if (!worksheet['C3']) {
            console.warn('Missing group in C3, will use empty string');
            // No es crítico, podemos continuar sin grupo
        }
        if (!worksheet['D3']) {
            console.error('Missing student count in D3');
            return 'Estructura inválida: No se encontró la cantidad de estudiantes en D3';
        }

        return null;
    }

    /**
     * Extraer información del curso desde las celdas A3:D3
     */
    private extractCourseInfo(worksheet: XLSX.WorkSheet): CourseInfo {
        // A3:B3 combinada contiene: "código nombre del curso"
        const courseCell = worksheet['A3'] || worksheet['B3'];
        const courseCellValue = courseCell ? courseCell.v : '';

        console.log('Course cell value:', courseCellValue);

        const { courseCode, courseName } = this.parseCourseName(String(courseCellValue));

        // C3 contiene el grupo
        const groupCell = worksheet['C3'];
        const group = groupCell ? String(groupCell.v).trim() : '';

        console.log('Group:', group);

        // D3 contiene la cantidad de estudiantes
        const countCell = worksheet['D3'];
        const studentCount = countCell ? Number(countCell.v) : 0;

        console.log('Student count:', studentCount);

        return {
            courseCode,
            courseName,
            group,
            studentCount
        };
    }

    /**
     * Parsear el nombre del curso desde la celda combinada
     * Formato: "código nombre del curso"
     * Ejemplo: "12345 Matemáticas Avanzadas"
     */
    private parseCourseName(cellValue: string): { courseCode: string; courseName: string } {
        const trimmed = cellValue.trim();

        // Buscar el primer espacio para separar código y nombre
        const firstSpaceIndex = trimmed.indexOf(' ');

        if (firstSpaceIndex === -1) {
            // Si no hay espacio, todo es el código
            return {
                courseCode: trimmed,
                courseName: ''
            };
        }

        const courseCode = trimmed.substring(0, firstSpaceIndex).trim();
        const courseName = trimmed.substring(firstSpaceIndex + 1).trim();

        return { courseCode, courseName };
    }

    /**
     * Extraer datos de estudiantes desde la matriz A5:F(5+cantidad)
     */
    private extractStudentData(
        worksheet: XLSX.WorkSheet,
        studentCount: number
    ): {
        students: CreateStudentDto[];
        enrollments: { studentCode: string; courseCode: string; group?: string }[];
        errors: CsvImportError[];
    } {
        const students: CreateStudentDto[] = [];
        const enrollments: { studentCode: string; courseCode: string; group?: string }[] = [];
        const errors: CsvImportError[] = [];
        const seenDocuments = new Set<string>();

        // Extraer información del curso para las matrículas
        const courseInfo = this.extractCourseInfo(worksheet);

        // Iterar desde la fila 5 hasta 5 + studentCount
        for (let i = 0; i < studentCount; i++) {
            const rowNumber = 5 + i;
            const excelRow = rowNumber; // Fila en Excel (1-indexed)

            try {
                // Leer celdas de la fila: A=Tipo Doc, B=Num Doc, C=Apellidos/Nombres, D=Teléfono, E=Email
                const tipoDocCell = worksheet[`A${excelRow}`];
                const numDocCell = worksheet[`B${excelRow}`];
                const nombresCell = worksheet[`C${excelRow}`];
                const telefonoCell = worksheet[`D${excelRow}`];
                const emailCell = worksheet[`E${excelRow}`];

                const row: XlsStudentRow = {
                    tipoDocumento: tipoDocCell ? String(tipoDocCell.v).trim() : '',
                    numeroDocumento: numDocCell ? String(numDocCell.v).trim() : '',
                    apellidosNombres: nombresCell ? String(nombresCell.v).trim() : '',
                    telefono: telefonoCell ? String(telefonoCell.v).trim() : '',
                    email: emailCell ? String(emailCell.v).trim() : ''
                };

                // Validar campos requeridos
                const rowErrors = this.validateXlsRow(row, excelRow, seenDocuments);
                if (rowErrors.length > 0) {
                    errors.push(...rowErrors);
                    continue;
                }

                // Parsear tipo de documento
                const docType = this.parseDocumentType(row.tipoDocumento);
                if (!docType) {
                    errors.push({
                        row: excelRow,
                        field: 'tipoDocumento',
                        message: `Tipo de documento inválido: ${row.tipoDocumento}. Valores permitidos: TI, CC, RC, CE, DNI, PASSPORT, OTHER`
                    });
                    continue;
                }

                // Separar apellidos y nombres
                const { lastName, firstName } = this.parseFullName(row.apellidosNombres);

                // Generar código de estudiante basado en el número de documento
                const studentCode = `EST-${row.numeroDocumento}`;

                // Crear DTO de estudiante
                const student: CreateStudentDto = {
                    code: studentCode,
                    documentType: docType,
                    documentNumber: row.numeroDocumento,
                    firstName,
                    lastName,
                    phone: row.telefono || undefined,
                    email: row.email || undefined
                };

                students.push(student);
                seenDocuments.add(row.numeroDocumento);

                // Crear matrícula si hay información del curso
                if (courseInfo.courseCode) {
                    enrollments.push({
                        studentCode,
                        courseCode: courseInfo.courseCode,
                        group: courseInfo.group || undefined
                    });
                }

            } catch (error) {
                console.error(`Error processing row ${excelRow}:`, error);
                errors.push({
                    row: excelRow,
                    message: `Error procesando fila: ${error instanceof Error ? error.message : String(error)}`
                });
            }
        }

        console.log(`Processed ${students.length} students with ${errors.length} errors`);

        return { students, enrollments, errors };
    }

    /**
     * Validar fila XLS
     */
    private validateXlsRow(
        row: XlsStudentRow,
        rowNumber: number,
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

        // Validar longitud de campos
        if (row.numeroDocumento && row.numeroDocumento.length < 6) {
            errors.push({
                row: rowNumber,
                field: 'numeroDocumento',
                message: 'Número de documento debe tener al menos 6 caracteres'
            });
        }

        // Validar duplicados
        if (row.numeroDocumento && seenDocuments.has(row.numeroDocumento)) {
            errors.push({
                row: rowNumber,
                field: 'numeroDocumento',
                message: `Documento duplicado: ${row.numeroDocumento}`
            });
        }

        return errors;
    }

    /**
     * Parsear tipo de documento
     * Soporta tipos colombianos: TI, CC, RC, CE
     * Soporta tipos internacionales: DNI, PASSPORT
     */
    private parseDocumentType(value: string): DocumentType | null {
        const normalized = value.trim().toUpperCase();

        // Tipos colombianos
        if (normalized === 'TI' || normalized === 'TARJETA' || normalized === 'TARJETA DE IDENTIDAD') return DocumentType.TI;
        if (normalized === 'CC' || normalized === 'CEDULA' || normalized === 'CÉDULA' || normalized === 'CEDULA DE CIUDADANIA') return DocumentType.CC;
        if (normalized === 'RC' || normalized === 'REGISTRO' || normalized === 'REGISTRO CIVIL') return DocumentType.RC;
        if (normalized === 'CE' || normalized === 'CARNET' || normalized === 'CARNET DE EXTRANJERIA') return DocumentType.CE;

        // Tipos internacionales
        if (normalized === 'DNI' || normalized === 'DOCUMENTO NACIONAL') return DocumentType.DNI;
        if (normalized === 'PASSPORT' || normalized === 'PASAPORTE') return DocumentType.PASSPORT;
        if (normalized === 'OTHER' || normalized === 'OTRO' || normalized === 'OTROS') return DocumentType.OTHER;

        return null;
    }

    /**
     * Separar apellidos y nombres
     * Asume formato: "Apellidos Nombres" o "Apellido1 Apellido2 Nombre1 Nombre2"
     * Estrategia: Dividir por coma si existe, sino tomar primera mitad como apellidos
     */
    private parseFullName(fullName: string): { lastName: string; firstName: string } {
        const trimmed = fullName.trim();

        // Si hay coma, formato es "Apellidos, Nombres"
        if (trimmed.includes(',')) {
            const parts = trimmed.split(',');
            return {
                lastName: parts[0].trim(),
                firstName: parts[1]?.trim() || ''
            };
        }

        // Si no hay coma, dividir por espacios y tomar mitad/mitad
        const words = trimmed.split(/\s+/);

        if (words.length === 1) {
            return {
                lastName: words[0],
                firstName: ''
            };
        }

        if (words.length === 2) {
            return {
                lastName: words[0],
                firstName: words[1]
            };
        }

        // Para 3 o más palabras, tomar primeras 2 como apellidos, resto como nombres
        const midPoint = Math.ceil(words.length / 2);
        const lastName = words.slice(0, midPoint).join(' ');
        const firstName = words.slice(midPoint).join(' ');

        return { lastName, firstName };
    }

    /**
     * Generar archivo XLS de ejemplo
     */
    generateSampleXLS(): void {
        // Crear un nuevo workbook
        const wb = XLSX.utils.book_new();

        // Crear datos de ejemplo
        const data = [
            [], // Fila 1 vacía
            [], // Fila 2 vacía
            ['12345 Matemáticas Avanzadas', '', 'A', 3], // Fila 3: Curso, vacío, Grupo, Cantidad
            [], // Fila 4 vacía (encabezados opcionales)
            ['DNI', '12345678', 'García Pérez Juan Carlos', '3001234567', 'juan.garcia@ejemplo.com'], // TipoDoc, NumDoc, Apellidos/Nombres, Tel, Email
            ['CE', '98765432', 'Rodríguez Silva María Fernanda', '3129876543', 'maria.rodriguez@ejemplo.com'],
            ['DNI', '11223344', 'López Torres Pedro Antonio', '', 'pedro.lopez@ejemplo.com'] // Teléfono vacío es válido
        ];

        // Crear worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Combinar celdas A3:B3
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } });

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Lista de Estudiantes');

        // Generar archivo y descargar
        XLSX.writeFile(wb, 'ejemplo_lista_estudiantes.xls');
    }
}
