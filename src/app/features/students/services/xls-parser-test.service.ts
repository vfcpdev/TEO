import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {
    XlsImportResult,
    CourseInfo,
    CreateStudentDto,
    DocumentType
} from '../../../models/student.model';

/**
 * Servicio de prueba para validar el parser XLS
 */
@Injectable({
    providedIn: 'root'
})
export class XlsParserTestService {

    /**
     * Crear archivo XLS de prueba y descargarlo
     */
    createTestFile(): void {
        const wb = XLSX.utils.book_new();

        // Datos de prueba según la estructura especificada
        const data = [
            [], // Fila 1 vacía
            [], // Fila 2 vacía
            // Fila 3: Curso (A3:B3 combinada), Grupo (C3), Cantidad (D3)
            ['203400 MATEMÁTICAS Y LÓGICA', '', 'A', 5],
            [], // Fila 4 vacía o encabezados
            // Filas 5+: Estudiantes (Tipo Doc, Num Doc, Apellidos y Nombres)
            ['CC', '1234567890', 'GARCÍA PÉREZ JUAN CARLOS'],
            ['CC', '9876543210', 'RODRÍGUEZ SILVA MARÍA FERNANDA'],
            ['CE', '1122334455', 'LÓPEZ TORRES PEDRO ANTONIO'],
            ['CC', '5566778899', 'MARTÍNEZ GONZÁLEZ ANA LUCÍA'],
            ['CC', '9988776655', 'HERNÁNDEZ RAMÍREZ CARLOS ALBERTO']
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Combinar celdas A3:B3 para el nombre del curso
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } });

        XLSX.utils.book_append_sheet(wb, ws, 'Lista de Estudiantes');

        // Descargar archivo
        XLSX.writeFile(wb, 'prueba_estudiantes.xlsx');

        console.log('✅ Archivo de prueba creado: prueba_estudiantes.xlsx');
        console.log('Estructura:');
        console.log('- A3:B3 (combinada): "203400 MATEMÁTICAS Y LÓGICA"');
        console.log('- C3: "A"');
        console.log('- D3: 5');
        console.log('- Filas 5-9: 5 estudiantes');
    }

    /**
     * Probar el parser con datos simulados
     */
    async testParser(): Promise<void> {
        console.log('🧪 Iniciando prueba del parser XLS...\n');

        // Crear workbook de prueba
        const wb = XLSX.utils.book_new();
        const data = [
            [],
            [],
            ['203400 MATEMÁTICAS Y LÓGICA', '', 'A', 5],
            [],
            ['CC', '1234567890', 'GARCÍA PÉREZ JUAN CARLOS'],
            ['CC', '9876543210', 'RODRÍGUEZ SILVA MARÍA FERNANDA'],
            ['CE', '1122334455', 'LÓPEZ TORRES PEDRO ANTONIO'],
            ['CC', '5566778899', 'MARTÍNEZ GONZÁLEZ ANA LUCÍA'],
            ['CC', '9988776655', 'HERNÁNDEZ RAMÍREZ CARLOS ALBERTO']
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } });
        XLSX.utils.book_append_sheet(wb, ws, 'Lista');

        // Convertir a buffer y luego a File
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const file = new File([blob], 'test.xlsx', { type: blob.type });

        console.log('📄 Archivo de prueba creado en memoria');
        console.log('Tamaño:', (file.size / 1024).toFixed(2), 'KB\n');

        // Importar el servicio y probar
        const { StudentXlsImportService } = await import('./student-xls-import.service');
        const service = new StudentXlsImportService();

        console.log('🔍 Parseando archivo...\n');
        const result = await service.parseXlsFile(file);

        // Mostrar resultados
        console.log('📊 RESULTADOS:');
        console.log('='.repeat(50));
        console.log('✓ Éxito:', result.success);
        console.log('✓ Total filas:', result.totalRows);
        console.log('✓ Importados:', result.importedCount);
        console.log('✓ Errores:', result.errors.length);

        if (result.courseInfo) {
            console.log('\n📚 INFORMACIÓN DEL CURSO:');
            console.log('  - Código:', result.courseInfo.courseCode);
            console.log('  - Nombre:', result.courseInfo.courseName);
            console.log('  - Grupo:', result.courseInfo.group);
            console.log('  - Cantidad esperada:', result.courseInfo.studentCount);
        }

        if (result.students.length > 0) {
            console.log('\n👥 ESTUDIANTES PARSEADOS:');
            result.students.forEach((student, index) => {
                console.log(`  ${index + 1}. ${student.lastName}, ${student.firstName}`);
                console.log(`     Código: ${student.code}`);
                console.log(`     Documento: ${student.documentType} ${student.documentNumber}`);
            });
        }

        if (result.errors.length > 0) {
            console.log('\n⚠️ ERRORES:');
            result.errors.forEach(error => {
                console.log(`  - Fila ${error.row}: ${error.message}`);
                if (error.field) console.log(`    Campo: ${error.field}`);
            });
        }

        console.log('\n' + '='.repeat(50));
        console.log(result.success ? '✅ Prueba EXITOSA' : '❌ Prueba FALLIDA');
    }
}
