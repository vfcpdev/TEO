# Parser XLS para Listas de Estudiantes

## Descripción

Servicio para importar listas de estudiantes desde archivos Excel (.xls/.xlsx) con una estructura específica.

## Estructura del Archivo XLS

El archivo debe tener la siguiente estructura:

```
Fila 3:
  - A3:B3 (celdas combinadas): Código del curso + Nombre del curso
    Formato: "[código] [nombre del curso]"
    Ejemplo: "12345 Matemáticas Avanzadas"
  - C3: Grupo (ej: "A", "B", "01")
  - D3: Cantidad de estudiantes (número)

Filas 5 en adelante (matriz de estudiantes):
  - Columna A: Tipo de documento (DNI, CE, PASSPORT, OTHER)
  - Columna B: Número de documento
  - Columna C: Apellidos y Nombres
  
Total de filas de estudiantes: D3 (cantidad especificada)
```

## Uso del Servicio

### 1. Importar el servicio

```typescript
import { StudentXlsImportService } from './services/student-xls-import.service';
```

### 2. Parsear un archivo XLS

```typescript
constructor(private xlsImportService: StudentXlsImportService) {}

async importStudents(file: File) {
  const result = await this.xlsImportService.parseXlsFile(file);
  
  if (result.success) {
    console.log('Curso:', result.courseInfo);
    console.log('Estudiantes:', result.students);
    console.log('Matrículas:', result.enrollments);
  } else {
    console.error('Errores:', result.errors);
  }
}
```

### 3. Resultado de la importación

El método `parseXlsFile` retorna un objeto `XlsImportResult`:

```typescript
{
  success: boolean;                    // true si no hay errores
  courseInfo?: {                       // Información del curso
    courseCode: string;                // Código extraído de A3:B3
    courseName: string;                // Nombre extraído de A3:B3
    group: string;                     // Grupo de C3
    studentCount: number;              // Cantidad de D3
  };
  totalRows: number;                   // Total de filas procesadas
  importedCount: number;               // Estudiantes importados exitosamente
  errors: CsvImportError[];            // Lista de errores
  students: CreateStudentDto[];        // Estudiantes a crear
  enrollments?: {                      // Matrículas a crear
    studentCode: string;
    courseCode: string;
    group?: string;
  }[];
}
```

## Características

### Extracción de Información del Curso

- **Celda A3:B3**: Extrae código y nombre del curso
  - Separa el primer token (código) del resto (nombre)
  - Ejemplo: "12345 Matemáticas" → código: "12345", nombre: "Matemáticas"

- **Celda C3**: Extrae el grupo

- **Celda D3**: Extrae la cantidad de estudiantes esperados

### Procesamiento de Estudiantes

- Lee exactamente la cantidad de filas especificada en D3
- Genera códigos de estudiante automáticamente: `EST-{numeroDocumento}`
- Separa apellidos y nombres:
  - Si hay coma: "Apellidos, Nombres"
  - Si no hay coma: divide por espacios (primera mitad apellidos, segunda mitad nombres)

### Validaciones

- Campos requeridos: tipo documento, número documento, apellidos y nombres
- Número de documento mínimo 6 caracteres
- Detecta documentos duplicados
- Valida tipos de documento: DNI, CE, PASSPORT, OTHER
- Valida estructura del archivo (celdas requeridas)

### Tipos de Documento Soportados

| Valor en Excel | DocumentType |
|----------------|--------------|
| DNI, CC, CEDULA | DNI |
| CE, CARNET | CE |
| PASSPORT, PASAPORTE | PASSPORT |
| OTHER, OTRO | OTHER |

## Generar Archivo de Ejemplo

```typescript
// Descarga un archivo XLS de ejemplo
this.xlsImportService.generateSampleXLS();
```

El archivo de ejemplo incluye:
- Estructura correcta con curso, grupo y cantidad
- 3 estudiantes de ejemplo
- Celdas combinadas en A3:B3

## Manejo de Errores

Los errores incluyen:
- Número de fila donde ocurrió el error
- Campo afectado (opcional)
- Mensaje descriptivo del error

```typescript
{
  row: 5,
  field: 'numeroDocumento',
  message: 'Número de documento debe tener al menos 6 caracteres'
}
```

## Integración con Otros Servicios

El servicio retorna DTOs compatibles con:
- `StudentService.create(CreateStudentDto)`
- `CourseStudentService.enrollStudent()`

Ver `student-xls-import-example.component.ts` para un ejemplo completo de integración.

## Notas Técnicas

- Usa la librería `xlsx` para parsear archivos Excel
- Soporta formatos .xls y .xlsx
- Lee celdas específicas por referencia (A3, B3, C3, D3)
- Procesa filas dinámicamente según la cantidad especificada
- No requiere encabezados en la fila 4 (opcional)
