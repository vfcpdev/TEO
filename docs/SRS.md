# Software Requirements Specification (SRS)
## ClassApp - Sistema de Gestión Académica para Docentes

**Versión:** 1.0  
**Fecha:** 13 de diciembre de 2025  
**Estado:** Propuesta Inicial

---

## 1. Introducción

### 1.1 Propósito
ClassApp es una aplicación multiplataforma diseñada para facilitar la gestión académica diaria de docentes universitarios que trabajan en múltiples instituciones educativas. El sistema permite llevar un registro completo de actividades académicas, gestión de asistencia, bonificaciones, seguimiento de contenidos y organización de horarios.

### 1.2 Alcance
El sistema permitirá a los docentes:
- Gestionar múltiples instituciones educativas
- Organizar cursos con horarios y modalidades (presencial/virtual)
- Registrar y gestionar estudiantes mediante importación CSV
- Controlar asistencia de estudiantes
- Asignar bonificaciones y calificaciones
- Realizar seguimiento de temas impartidos
- Visualizar y gestionar calendarios académicos

### 1.3 Definiciones y Acrónimos
- **SRS**: Software Requirements Specification
- **CSV**: Comma-Separated Values
- **Modalidad**: Forma de impartir la clase (presencial o virtual)
- **Bonificación**: Puntos adicionales otorgados a estudiantes por desempeño destacado
- **Institución**: Universidad o centro educativo donde el docente imparte clases

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
ClassApp es una aplicación móvil y web independiente construida con:
- **Framework**: Ionic 7+ con Angular 17+
- **Plataformas objetivo**: iOS, Android, Web
- **Arquitectura**: Cliente-servidor con almacenamiento local y sincronización en la nube

### 2.2 Funciones Principales del Producto

#### 2.2.1 Gestión de Instituciones
- Crear, editar y eliminar instituciones educativas
- Configurar datos: nombre, logo, dirección, contacto
- Asociar cursos a instituciones específicas

#### 2.2.2 Gestión de Cursos
- Crear cursos con información completa:
  - Código del curso
  - Nombre
  - Institución asociada
  - Horarios (hora inicio, hora fin)
  - Días de la semana
  - Aula/Salón
  - Modalidad (presencial/virtual)
  - Enlace de sesión virtual (si aplica)
  - Periodo académico (semestre/ciclo)

#### 2.2.3 Gestión de Estudiantes
- Importar listados mediante archivos CSV
- Agregar estudiantes manualmente
- Editar información de estudiantes
- Vincular estudiantes a cursos específicos
- Campos: código, nombres, apellidos, email, foto (opcional)

#### 2.2.4 Control de Asistencia
- Registrar asistencia por sesión de clase
- Estados: Presente, Ausente, Tardanza, Justificado
- Visualizar estadísticas de asistencia por estudiante
- Generar reportes de asistencia por curso
- Historial completo de asistencias

#### 2.2.5 Sistema de Bonificaciones
- Asignar bonificaciones individuales o grupales
- Categorías de bonificación: participación, tareas, proyectos, otros
- Registro de motivo y fecha
- Visualizar resumen de bonificaciones por estudiante
- Exportar bonificaciones a CSV/Excel

#### 2.2.6 Seguimiento de Contenidos
- Registrar temas impartidos por sesión
- Asociar temas a fechas específicas
- Planificar contenido futuro (syllabus)
- Marcar temas como completados/pendientes
- Notas y observaciones por sesión

#### 2.2.7 Calendario Académico
- Vista de calendario mensual/semanal
- Visualizar todas las clases programadas
- Filtrar por institución o curso
- Indicadores visuales de modalidad
- Navegación entre fechas
- Recordatorios de clases próximas

---

## 3. Requisitos Funcionales

### RF-01: Autenticación de Usuario
**Prioridad**: Alta  
**Descripción**: El sistema debe permitir al docente autenticarse de manera segura.
- Login con email y contraseña
- Recuperación de contraseña
- Opción de "Recordar sesión"
- Cierre de sesión

### RF-02: Gestión de Instituciones
**Prioridad**: Alta  
**Descripción**: El docente puede gestionar las instituciones donde trabaja.
- CRUD completo de instituciones
- Campos requeridos: nombre
- Campos opcionales: logo, dirección, teléfono, email
- Validación de datos

### RF-03: Gestión de Cursos
**Prioridad**: Alta  
**Descripción**: El docente puede crear y gestionar sus cursos.
- CRUD completo de cursos
- Campos requeridos: código, nombre, institución, horarios
- Campos opcionales: aula, enlace virtual
- Validación de conflictos de horarios
- Asociación a institución

### RF-04: Importación de Estudiantes por CSV
**Prioridad**: Alta  
**Descripción**: Permitir importación masiva de estudiantes.
- Cargar archivo CSV
- Validar formato y datos
- Preview de datos antes de importar
- Formato esperado: codigo,apellidos,nombres,email
- Manejo de errores y duplicados
- Confirmación de importación exitosa

### RF-05: Gestión Manual de Estudiantes
**Prioridad**: Media  
**Descripción**: Agregar/editar estudiantes individualmente.
- Formulario de creación/edición
- Campos: código, nombres, apellidos, email, foto
- Validación de código único por curso
- Eliminación con confirmación

### RF-06: Registro de Asistencia
**Prioridad**: Alta  
**Descripción**: Tomar asistencia en cada sesión de clase.
- Seleccionar curso y fecha
- Lista de estudiantes del curso
- Marcar estado: Presente/Ausente/Tardanza/Justificado
- Guardar asistencia por sesión
- Editar asistencias pasadas
- Botones rápidos: "Marcar todos presentes"

### RF-07: Visualización de Estadísticas de Asistencia
**Prioridad**: Media  
**Descripción**: Ver métricas de asistencia.
- Porcentaje de asistencia por estudiante
- Resumen por curso
- Gráficos visuales
- Filtros por rango de fechas

### RF-08: Sistema de Bonificaciones
**Prioridad**: Media  
**Descripción**: Asignar puntos extras a estudiantes.
- Seleccionar estudiante(s)
- Ingresar puntos y motivo
- Categorizar bonificación
- Registro de fecha automática
- Historial de bonificaciones

### RF-09: Registro de Temas Impartidos
**Prioridad**: Media  
**Descripción**: Documentar contenido de cada clase.
- Asociar tema a sesión (fecha + curso)
- Descripción del tema
- Estado: Completado/Pendiente
- Notas adicionales
- Historial de temas por curso

### RF-10: Calendario Académico
**Prioridad**: Alta  
**Descripción**: Visualizar horario de clases.
- Vista mensual y semanal
- Mostrar todas las sesiones programadas
- Código de colores por institución/curso
- Iconos para modalidad (presencial/virtual)
- Click en sesión para ver detalles
- Navegación fluida entre fechas

### RF-11: Exportación de Datos
**Prioridad**: Baja  
**Descripción**: Exportar información a formatos estándar.
- Exportar asistencias a CSV/Excel
- Exportar bonificaciones
- Exportar listados de estudiantes
- Selección de rango de fechas

### RF-12: Sincronización de Datos
**Prioridad**: Media  
**Descripción**: Sincronizar datos entre dispositivos.
- Almacenamiento local para uso offline
- Sincronización automática con conexión
- Indicador de estado de sincronización
- Resolución de conflictos

---

## 4. Requisitos No Funcionales

### RNF-01: Rendimiento
- Tiempo de carga inicial < 3 segundos
- Respuesta de UI < 100ms para acciones locales
- Soporte para al menos 500 estudiantes por curso
- Funcionamiento fluido en dispositivos de gama media

### RNF-02: Usabilidad
- Interfaz intuitiva siguiendo Material Design
- Adaptación a diferentes tamaños de pantalla
- Modo oscuro/claro
- Soporte para gestos táctiles
- Mensajes de error claros y accionables

### RNF-03: Compatibilidad
- iOS 13+
- Android 8.0+
- Navegadores modernos (Chrome, Safari, Firefox últimas 2 versiones)
- Responsive design para tablets

### RNF-04: Seguridad
- Autenticación segura (JWT/OAuth2)
- Encriptación de datos sensibles
- Protección contra inyección SQL
- Validación de datos en cliente y servidor
- Sesiones con timeout automático

### RNF-05: Disponibilidad
- Funcionamiento offline para operaciones básicas
- Sincronización automática al recuperar conexión
- Almacenamiento local persistente (SQLite/IndexedDB)
- Backup automático de datos

### RNF-06: Mantenibilidad
- Código modular y bien documentado
- Arquitectura escalable
- Cobertura de pruebas > 70%
- Logging de errores para debugging

### RNF-07: Accesibilidad
- Soporte para lectores de pantalla
- Contraste de colores adecuado
- Tamaños de texto ajustables
- Navegación por teclado (versión web)

---

## 5. Casos de Uso Principales

### CU-01: Registrar Asistencia de Clase
**Actor**: Docente  
**Precondiciones**: Sesión iniciada, curso creado con estudiantes  
**Flujo Principal**:
1. Docente selecciona curso del día
2. Sistema muestra lista de estudiantes
3. Docente marca asistencia de cada estudiante
4. Sistema guarda registro con fecha y hora
5. Sistema muestra confirmación

### CU-02: Importar Estudiantes desde CSV
**Actor**: Docente  
**Precondiciones**: Sesión iniciada, curso creado, archivo CSV preparado  
**Flujo Principal**:
1. Docente navega a gestión de estudiantes del curso
2. Docente selecciona "Importar CSV"
3. Sistema solicita archivo
4. Docente carga archivo
5. Sistema valida formato y muestra preview
6. Docente confirma importación
7. Sistema importa estudiantes y muestra resumen

### CU-03: Consultar Calendario Semanal
**Actor**: Docente  
**Precondiciones**: Sesión iniciada, cursos configurados  
**Flujo Principal**:
1. Docente accede al módulo Calendario
2. Sistema muestra vista semanal con todas las clases
3. Docente puede filtrar por institución
4. Docente hace click en una sesión
5. Sistema muestra detalles (curso, aula, modalidad, etc.)

### CU-04: Asignar Bonificaciones
**Actor**: Docente  
**Precondiciones**: Sesión iniciada, curso con estudiantes  
**Flujo Principal**:
1. Docente accede a lista de estudiantes del curso
2. Docente selecciona estudiante(s)
3. Docente ingresa puntos y motivo
4. Sistema registra bonificación con fecha
5. Sistema actualiza total de bonificaciones
6. Sistema muestra confirmación

---

## 6. Modelo de Datos Preliminar

### Entidades Principales

#### Place (Lugar)

```yaml
- id: UUID
- name: string (required)
- logo: string (URL/path)
- address: string
- phone: string
- email: string
- createdAt: timestamp
- updatedAt: timestamp
```

#### Course (Curso)

```yaml
- id: UUID
- code: string (required)
- name: string (required)
- placeId: UUID (FK)
- startTime: time
- endTime: time
- weekDays: array<number> [1-7]
- classroom: string
- modality: enum ['presencial', 'virtual']
- virtualLink: string
- academicPeriod: string
- isActive: boolean
- createdAt: timestamp
- updatedAt: timestamp
```

#### Student (Estudiante)

```yaml
- id: UUID
- code: string (required, unique per course)
- firstName: string (required)
- lastName: string (required)
- email: string
- photo: string (URL/path)
- createdAt: timestamp
- updatedAt: timestamp
```

#### CourseStudent (Relación Curso-Estudiante)

```yaml
- id: UUID
- courseId: UUID (FK)
- studentId: UUID (FK)
- enrollmentDate: timestamp
- isActive: boolean
```

#### Attendance (Asistencia)

```yaml
- id: UUID
- courseId: UUID (FK)
- studentId: UUID (FK)
- sessionDate: date
- status: enum ['presente', 'ausente', 'tardanza', 'justificado']
- notes: string
- recordedAt: timestamp
- recordedBy: UUID (userId)
```

#### Bonus (Bonificación)

```yaml
- id: UUID
- courseId: UUID (FK)
- studentId: UUID (FK)
- points: number
- reason: string
- category: enum ['participacion', 'tarea', 'proyecto', 'otro']
- date: date
- createdAt: timestamp
- createdBy: UUID (userId)
```

#### Topic (Tema/Contenido)

```yaml
- id: UUID
- courseId: UUID (FK)
- sessionDate: date
- title: string (required)
- description: text
- status: enum ['completado', 'pendiente', 'planificado']
- notes: text
- createdAt: timestamp
- updatedAt: timestamp
```

#### User (Usuario/Docente)

```yaml
- id: UUID
- email: string (required, unique)
- passwordHash: string
- firstName: string
- lastName: string
- photo: string
- lastLogin: timestamp
- createdAt: timestamp
- updatedAt: timestamp
```

---

## 7. Arquitectura Técnica Propuesta

### 7.1 Stack Tecnológico

#### Frontend
- **Framework**: Ionic 7+ (Capacitor)
- **Framework Web**: Angular 17+
- **UI Components**: Ionic Components + Angular Material
- **Estado**: NgRx o Signals (Angular 17)
- **Formularios**: Reactive Forms
- **HTTP**: HttpClient con interceptors
- **Storage Local**: Capacitor Preferences + SQLite

#### Backend (Propuesta)
- **Opción 1**: Firebase (Firestore + Authentication + Cloud Functions)
- **Opción 2**: Node.js + Express + PostgreSQL
- **API**: RESTful o GraphQL

#### Almacenamiento
- **Local**: SQLite (dispositivos móviles), IndexedDB (web)
- **Nube**: Firebase Firestore o PostgreSQL

### 7.2 Arquitectura de Capas

```text
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Ionic Pages + Components)         │
├─────────────────────────────────────┤
│         Business Logic Layer        │
│  (Services + State Management)      │
├─────────────────────────────────────┤
│         Data Access Layer           │
│  (Repositories + API Services)      │
├─────────────────────────────────────┤
│         Storage Layer               │
│  (SQLite Local + Cloud Sync)        │
└─────────────────────────────────────┘
```

### 7.3 Módulos Principales

1. **CoreModule**: Servicios singleton (Auth, Storage, Sync)
2. **SharedModule**: Componentes reutilizables, pipes, directivas
3. **PlacesModule**: Gestión de lugares (universidades/instituciones)
4. **CoursesModule**: Gestión de cursos
5. **StudentsModule**: Gestión de estudiantes
6. **AttendanceModule**: Control de asistencia
7. **BonusModule**: Sistema de bonificaciones
8. **TopicsModule**: Seguimiento de contenidos
9. **CalendarModule**: Calendario académico

### 7.4 Patrones de Diseño

- **Repository Pattern**: Para acceso a datos
- **Facade Pattern**: Para servicios complejos
- **Observer Pattern**: Para sincronización de datos
- **Factory Pattern**: Para creación de entidades
- **Singleton**: Para servicios core

---

## 8. Flujos de Trabajo del Docente

### 8.1 Flujo de Configuración Inicial
1. Crear cuenta / Iniciar sesión
2. Configurar instituciones donde trabaja
3. Crear cursos con horarios
4. Importar estudiantes por CSV
5. Configurar calendario académico

### 8.2 Flujo Diario Típico
1. Abrir app y ver calendario del día
2. Ingresar a clase programada
3. Tomar asistencia
4. Registrar tema impartido
5. Asignar bonificaciones (si aplica)
6. Consultar estadísticas

### 8.3 Flujo de Fin de Periodo
1. Revisar estadísticas de asistencia
2. Exportar reportes
3. Generar resumen de bonificaciones
4. Archivar cursos finalizados

---

## 9. Consideraciones de Diseño UI/UX

### 9.1 Navegación Principal
- **Tab Bar** (navegación inferior):
  - Inicio/Dashboard
  - Calendario
  - Cursos
  - Perfil

### 9.2 Dashboard (Pantalla de Inicio)
- Resumen de clases del día
- Acceso rápido a tomar asistencia
- Recordatorios y notificaciones
- Estadísticas destacadas

### 9.3 Temas Visuales
- Tema claro (por defecto)
- Tema oscuro
- Colores por institución (personalizable)
- Paleta profesional y accesible

### 9.4 Gestos y Acciones Rápidas
- Swipe para acciones rápidas (editar, eliminar)
- Pull-to-refresh para sincronizar
- FAB para acciones principales
- Bottom sheets para opciones contextuales

---

## 10. Fases de Desarrollo Propuestas

### Fase 1 - MVP (4-6 semanas)
- Autenticación básica
- Gestión de instituciones
- Gestión de cursos
- Importación CSV de estudiantes
- Registro de asistencia
- Calendario básico

### Fase 2 - Funcionalidades Core (3-4 semanas)
- Sistema de bonificaciones
- Seguimiento de temas
- Estadísticas de asistencia
- Exportación de datos básica
- Sincronización en la nube

### Fase 3 - Mejoras y Optimización (2-3 semanas)
- Modo offline completo
- Notificaciones push
- Reportes avanzados
- Mejoras de UI/UX
- Testing y correcciones

### Fase 4 - Funcionalidades Avanzadas (Futuras)
- Gestión de calificaciones
- Comunicación con estudiantes
- Integración con sistemas LMS
- Analytics avanzados
- Generación de certificados

---

## 11. Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Conflictos de sincronización | Alto | Media | Implementar estrategia de resolución de conflictos clara |
| Pérdida de datos offline | Alto | Baja | Implementar backup automático y persistencia robusta |
| Formato CSV incorrecto | Medio | Alta | Validación exhaustiva y guías claras de formato |
| Complejidad del calendario | Medio | Media | UI/UX iterativo con feedback de usuarios |
| Rendimiento con muchos datos | Medio | Media | Paginación, lazy loading, optimización de queries |
| Compatibilidad entre plataformas | Bajo | Baja | Testing en múltiples dispositivos desde etapa temprana |

---

## 12. Métricas de Éxito

- Tiempo promedio para tomar asistencia < 2 minutos
- Tasa de adopción por docentes > 80%
- Satisfacción de usuario (NPS) > 8/10
- Errores críticos en producción < 1%
- Tiempo de sincronización < 5 segundos para datasets típicos
- Disponibilidad del sistema > 99%

---

## 13. Anexos

### 13.1 Formato CSV Esperado para Importación

```csv
codigo,apellidos,nombres,email
20210001,García López,Juan Carlos,juan.garcia@email.com
20210002,Martínez Ruiz,María Elena,maria.martinez@email.com
20210003,Sánchez Torres,Pedro José,pedro.sanchez@email.com
```

**Reglas**:
- Header obligatorio
- Código único por estudiante
- Email opcional pero recomendado
- Encoding: UTF-8
- Separador: coma (,)

### 13.2 Glosario de Términos

- **Sesión**: Instancia única de una clase en una fecha específica
- **Periodo Académico**: Ciclo o semestre en el que se imparte el curso
- **Modalidad Presencial**: Clase impartida en aula física
- **Modalidad Virtual**: Clase impartida por plataforma en línea
- **Bonificación**: Puntos adicionales otorgados por mérito
- **Tardanza**: Llegada después de la hora de inicio con límite de tolerancia
- **Justificado**: Ausencia con justificación válida presentada

---

## Fin del Documento SRS v1.0

*Este documento está sujeto a revisión y actualización conforme evolucione el proyecto.*
