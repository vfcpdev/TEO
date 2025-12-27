# GitHub Copilot Instructions - ClassApp

## Descripción del Proyecto

ClassApp es una aplicación multiplataforma (Ionic + Angular) para gestión académica de docentes universitarios que trabajan en múltiples instituciones. Permite registro de asistencia, bonificaciones, seguimiento de temas y calendario de clases.

## Stack Tecnológico

- **Framework**: Ionic 7+ con Capacitor
- **Frontend**: Angular 17+ (standalone components preferidos)
- **UI**: Ionic Components + Angular Material
- **Estado**: Angular Signals (priorizar sobre NgRx para nueva funcionalidad)
- **Formularios**: Reactive Forms con validación custom
- **Storage Local**: Capacitor Preferences + @capacitor-community/sqlite
- **Backend**: Firebase (Firestore + Authentication + Cloud Functions)
- **Plataformas**: iOS, Android, Web

## Arquitectura y Estructura

### Organización de Módulos
```
src/app/
├── core/           # Singleton services (auth, storage, sync)
├── shared/         # Componentes reutilizables, pipes, directivas
├── features/       # Módulos de funcionalidad
│   ├── places/
│   ├── courses/
│   ├── students/
│   ├── attendance/
│   ├── bonus/
│   ├── topics/
│   └── calendar/
└── models/         # Interfaces y tipos TypeScript
```

### Patrones de Diseño Clave
- **Repository Pattern**: Toda interacción con datos debe pasar por repositorios (`src/app/data/repositories/`)
- **Facade Services**: Servicios complejos exponen API simplificada para componentes
- **Standalone Components**: Usar componentes standalone para nueva funcionalidad (Angular 17+)
- **Signals**: Preferir Signals sobre BehaviorSubject para reactive state

## Convenciones de Código

### Nomenclatura
- **Componentes**: `{feature}.{type}.ts` (ej: `attendance-list.component.ts`)
- **Servicios**: `{entity}.service.ts` (ej: `student.service.ts`)
- **Repositorios**: `{entity}.repository.ts` (ej: `course.repository.ts`)
- **Modelos**: PascalCase para interfaces (ej: `Student`, `Course`, `Attendance`)
- **Constantes**: UPPER_SNAKE_CASE en `src/app/shared/constants/`

### Estructura de Componentes
```typescript
@Component({
  selector: 'app-{feature}-{name}',
  standalone: true,
  imports: [CommonModule, IonicModule, ...],
  templateUrl: './{name}.component.html',
  styleUrls: ['./{name}.component.scss']
})
export class {Name}Component implements OnInit, OnDestroy {
  // 1. Signals y estado reactivo
  // 2. Inputs/Outputs
  // 3. ViewChild/ContentChild
  // 4. Constructor con DI
  // 5. Lifecycle hooks
  // 6. Public methods
  // 7. Private methods
}
```

### Servicios y Repositorios
- Todos los servicios deben ser `@Injectable({ providedIn: 'root' })` salvo excepciones justificadas
- Repositorios manejan CRUD y caching local
- Servicios implementan lógica de negocio
- Usar `async/await` sobre `.then()/.catch()`

## Modelos de Datos Principales

<!-- @see docs/SRS.md Sección 6 -->
Ver **docs/SRS.md - Sección 6** para schema completo de modelo de datos.

Entidades core:
- `Place`: Lugares de trabajo (universidades/instituciones) donde trabaja el docente
- `Course`: Cursos con horarios, modalidad (presencial/virtual), aula
- `Student`: Estudiantes con código único por curso
- `Attendance`: Registro de asistencia (presente/ausente/tardanza/justificado)
- `Bonus`: Bonificaciones con puntos, motivo y categoría
- `Topic`: Temas impartidos por sesión

### Relaciones Importantes
- `Course` → `Place` (many-to-one via `placeId`)
- `Course` ↔ `Student` (many-to-many via `CourseStudent`)
- `Attendance` → `Course` + `Student` + `sessionDate` (composite key lógico)

## Funcionalidades Críticas

### 1. Importación CSV de Estudiantes
- Formato esperado: `codigo,apellidos,nombres,email`
- Validación estricta antes de importar
- Preview obligatorio con confirmación
- Detectar y manejar duplicados por código
- Mostrar errores línea por línea
- Ver implementación en: `src/app/features/students/services/csv-import.service.ts`

### 2. Registro de Asistencia
- Interfaz rápida (objetivo: <2 minutos para tomar asistencia completa)
- Estados: `presente`, `ausente`, `tardanza`, `justificado`
- Botones de acción masiva: "Marcar todos presentes"
- Swipe gestures para cambio rápido de estado
- Persistencia local inmediata, sync posterior
- Edición de asistencias pasadas con audit trail

### 3. Calendario Académico
- Vista semanal/mensual con `@ionic/angular` components
- Código de colores por institución (configurable)
- Iconos distintivos para modalidad (presencial: 🏫, virtual: 💻)
- Filtros: por institución, por rango de fechas
- Click en sesión → detalles completos del curso

### 4. Modo Offline
- **Crítico**: App debe funcionar completamente offline
- SQLite como storage principal en móvil
- Queue de sincronización para operaciones pendientes
- Indicador visual de estado de sync
- Resolución de conflictos: last-write-wins con timestamp

## Directrices de Desarrollo

### Testing
- Unit tests para servicios y repositorios (cobertura >70%)
- E2E tests para flujos críticos (importación CSV, registro asistencia)
- Jasmine + Karma para unit, Cypress para E2E
- Archivos: `{name}.spec.ts` junto a archivo fuente

### Manejo de Errores
```typescript
// Pattern estándar para error handling
try {
  await this.repository.save(entity);
  this.toastService.success('Operación exitosa');
} catch (error) {
  this.loggerService.error('Context', error);
  this.toastService.error('Mensaje amigable para el usuario');
  // Re-throw si es necesario para propagación
}
```

### Performance
- Lazy loading para todos los feature modules
- Virtual scrolling para listas >50 items (`<ion-virtual-scroll>`)
- Paginación en queries (límite: 50 registros por página)
- Debounce en búsquedas (300ms)
- Optimistic UI updates para mejor UX

### UI/UX
- Seguir Ionic Design Guidelines
- Tema claro/oscuro (usar CSS variables)
- Accesibilidad: ARIA labels en componentes interactivos
- Loading skeletons en lugar de spinners genéricos
- Toast notifications: 3 segundos duración por defecto
- Confirmaciones para acciones destructivas (modal)

## Comandos de Desarrollo

```bash
# Iniciar dev server
ionic serve

# Build para producción
ionic build --prod

# Ejecutar en Android
ionic cap run android

# Ejecutar en iOS
ionic cap run ios

# Tests
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:coverage      # Coverage report

# Linting y formato
npm run lint
npm run format
```

## Flujos de Trabajo Importantes

### Nuevo Feature Module
1. Generar con CLI: `ionic g module features/{name} --routing`
2. Crear carpetas: `components/`, `services/`, `pages/`
3. Configurar lazy loading en app-routing
4. Agregar a documentación

### Agregar Nueva Entidad
1. Definir interface en `src/app/models/{entity}.model.ts`
2. Crear repository en `src/app/data/repositories/{entity}.repository.ts`
3. Crear service en feature module correspondiente
4. Implementar CRUD completo con validaciones
5. Agregar tests unitarios

## Recursos y Referencias

<!-- @see docs/SRS.md -->
- **SRS Completo**: **docs/SRS.md** - Requisitos funcionales y no funcionales detallados
- **Ionic Docs**: https://ionicframework.com/docs
- **Angular Docs**: https://angular.dev
- **Capacitor Plugins**: https://capacitorjs.com/docs/plugins

## Notas Importantes

⚠️ **Sincronización**: Toda operación de escritura debe implementar pattern de "local-first, sync-later"

⚠️ **Validación**: Validar datos en cliente Y en Cloud Functions (defensa en profundidad)

⚠️ **CSV Import**: NO confiar en formato de usuario - siempre validar y sanitizar

⚠️ **Calendario**: Validar conflictos de horarios al crear/editar cursos

⚠️ **Código Estudiante**: Debe ser único dentro de un curso, pero puede repetirse entre cursos

---

**Última actualización**: 13 de diciembre de 2025  
**Versión SRS**: 1.0
