# Plan de Implementación: Sistema de Registros con Ocurrencias

## 📋 Resumen

Sistema de calendario basado en **Registros** (eventos únicos) que pueden tener múltiples **Ocurrencias** (días/horas derivados). Cada elemento es referenceable de forma única.

---

## 🎯 Terminología

- **Registro**: Evento único con nombre y descripción (ej: "Reunión de Sprint")
- **OcurrenciaRegistro**: Cada día/hora específico donde ocurre el registro
- ~~Evento~~ → **Registro**
- ~~EventSchedule~~ → **OcurrenciaRegistro**

---

## 📊 Modelo de Datos

### Registro (Entidad Principal)

```typescript
export interface Registro {
  id: string;              // ID único del registro (ej: "reg-001")
  nombre: string;          // Campo principal (ej: "Reunión de Sprint")
  descripcion?: string;    // Descripción opcional
  createdAt: string;       // Fecha de creación ISO
  updatedAt: string;       // Última modificación ISO
}
```

### OcurrenciaRegistro (Derivaciones)

```typescript
export interface OcurrenciaRegistro {
  id: string;              // ID único de la ocurrencia (ej: "ocur-001")
  registroId: string;      // FK al Registro padre (ej: "reg-001")
  fecha: string;           // "YYYY-MM-DD" (ej: "2025-01-15")
  horaInicio: string;      // "HH:mm" (ej: "09:00")
  horaFin: string;         // "HH:mm" (ej: "11:00")
  createdAt: string;       // Cuándo se programó esta ocurrencia
}
```

### OcurrenciaConRegistro (Para UI)

```typescript
export interface OcurrenciaConRegistro extends OcurrenciaRegistro {
  nombre: string;          // Del registro padre
  descripcion?: string;    // Del registro padre
}
```

---

## 🔗 Referenciabilidad

### 1. Referencias al Registro Único

```typescript
// Obtener el registro por ID
const registro = registros.find(r => r.id === "reg-001");
// → { id: "reg-001", nombre: "Reunión de Sprint", ... }

// Obtener TODAS las ocurrencias de un registro
const todasLasOcurrencias = ocurrencias.filter(o => o.registroId === "reg-001");
// → [
//     { id: "ocur-001", fecha: "2025-01-15", horaInicio: "09:00", ... },
//     { id: "ocur-002", fecha: "2025-01-15", horaInicio: "14:00", ... },
//     { id: "ocur-003", fecha: "2025-01-20", horaInicio: "10:00", ... }
//   ]
```

### 2. Referencias a Ocurrencias Específicas

```typescript
// Obtener una ocurrencia específica por su ID
const ocurrencia = ocurrencias.find(o => o.id === "ocur-002");
// → { id: "ocur-002", registroId: "reg-001", fecha: "2025-01-15", horaInicio: "14:00", ... }

// Desde la ocurrencia, obtener el registro padre
const registroPadre = registros.find(r => r.id === ocurrencia.registroId);
// → { id: "reg-001", nombre: "Reunión de Sprint", ... }
```

### 3. Referencias por Fecha

```typescript
// Todas las ocurrencias de un día específico
const ocurrenciasDia = ocurrencias.filter(o => o.fecha === "2025-01-15");

// Con datos completos del registro
const ocurrenciasDiaCompletas = ocurrenciasDia.map(ocur => ({
  ...ocur,
  nombre: registros.find(r => r.id === ocur.registroId)?.nombre,
  descripcion: registros.find(r => r.id === ocur.registroId)?.descripcion
}));
```

### 4. Referencias Bidireccionales

```typescript
// Desde Registro → Ocurrencias
registro.id → ocurrencias.filter(o => o.registroId === registro.id)

// Desde Ocurrencia → Registro
ocurrencia.registroId → registros.find(r => r.id === ocurrencia.registroId)
```

---

## 💡 Casos de Uso Soportados

### Caso 1: Mismo registro, múltiples horarios en un día

```typescript
Registro: { id: "reg-001", nombre: "Taller de Angular" }

Ocurrencias:
[
  { id: "ocur-1", registroId: "reg-001", fecha: "2025-01-15", horaInicio: "09:00", horaFin: "12:00" },
  { id: "ocur-2", registroId: "reg-001", fecha: "2025-01-15", horaInicio: "14:00", horaFin: "17:00" }
]
```

✅ Editar el nombre del registro una vez y se refleja en ambas ocurrencias  
✅ Eliminar solo "ocur-2" sin afectar "ocur-1"

### Caso 2: Mismo registro, diferentes días

```typescript
Registro: { id: "reg-002", nombre: "Clase de Matemáticas" }

Ocurrencias:
[
  { id: "ocur-3", registroId: "reg-002", fecha: "2025-01-15", horaInicio: "10:00", horaFin: "12:00" },
  { id: "ocur-4", registroId: "reg-002", fecha: "2025-01-17", horaInicio: "10:00", horaFin: "12:00" },
  { id: "ocur-5", registroId: "reg-002", fecha: "2025-01-20", horaInicio: "15:00", horaFin: "17:00" }
]
```

✅ Cada día+hora tiene su propio ID  
✅ Cambiar solo la hora del viernes sin afectar los otros días

### Caso 3: Editar el registro afecta todas sus ocurrencias

```typescript
// Usuario cambia el nombre
UPDATE Registro SET nombre = "Clase Avanzada de Matemáticas" WHERE id = "reg-002"

// TODAS las ocurrencias ahora mostrarán el nuevo nombre automáticamente
// porque referencian al registro por ID
```

### Caso 4: Eliminar ocurrencias sin afectar el registro

```typescript
// Cancelar solo la clase del miércoles
DELETE OcurrenciaRegistro WHERE id = "ocur-4"

// El registro sigue existiendo
// Las otras ocurrencias (martes y viernes) siguen activas
```

### Caso 5: Eliminar registro elimina todas sus ocurrencias

```typescript
// Cancelar todas las clases de matemáticas
DELETE FROM OcurrenciaRegistro WHERE registroId = "reg-002"
DELETE FROM Registro WHERE id = "reg-002"

// Cascada: todas las ocurrencias desaparecen
```

---

## 🏗️ Arquitectura del Servicio

### RegistroService (Un solo servicio)

```typescript
@Injectable({ providedIn: 'root' })
export class RegistroService {
  private storage = inject(Storage);
  
  // Signals reactivos
  private registrosSignal = signal<Registro[]>([]);
  private ocurrenciasSignal = signal<OcurrenciaRegistro[]>([]);
  
  // Exposición pública (readonly)
  registros = this.registrosSignal.asReadonly();
  ocurrencias = this.ocurrenciasSignal.asReadonly();
  
  // Computed: ocurrencias con datos completos del registro
  ocurrenciasConDatos = computed(() => {
    const registros = this.registrosSignal();
    const ocurrencias = this.ocurrenciasSignal();
    
    return ocurrencias.map(ocur => ({
      ...ocur,
      nombre: registros.find(r => r.id === ocur.registroId)?.nombre || '',
      descripcion: registros.find(r => r.id === ocur.registroId)?.descripcion
    }));
  });
  
  constructor() {
    this.loadData();
  }
  
  private async loadData() {
    const registros = await this.storage.get('registros') || [];
    const ocurrencias = await this.storage.get('ocurrencias_registro') || [];
    this.registrosSignal.set(registros);
    this.ocurrenciasSignal.set(ocurrencias);
  }
  
  // ===== MÉTODOS DE REGISTROS =====
  
  async createRegistro(registro: Omit<Registro, 'id' | 'createdAt' | 'updatedAt'>): Promise<Registro>
  
  async updateRegistro(id: string, changes: Partial<Registro>): Promise<void>
  
  async deleteRegistro(id: string): Promise<void>
  // → Elimina el registro Y todas sus ocurrencias (cascada)
  
  // ===== MÉTODOS DE OCURRENCIAS =====
  
  async addOcurrencia(ocurrencia: Omit<OcurrenciaRegistro, 'id' | 'createdAt'>): Promise<OcurrenciaRegistro>
  
  async updateOcurrencia(id: string, changes: Partial<OcurrenciaRegistro>): Promise<void>
  
  async deleteOcurrencia(id: string): Promise<void>
  
  // ===== MÉTODOS DE CONSULTA (SIGNALS) =====
  
  // Obtener un registro por ID
  getRegistro(id: string): Signal<Registro | undefined>
  
  // Todas las ocurrencias de un registro
  getOcurrenciasDeRegistro(registroId: string): Signal<OcurrenciaRegistro[]>
  
  // Ocurrencias de una fecha específica (con datos del registro)
  getOcurrenciasDeFecha(fecha: string): Signal<OcurrenciaConRegistro[]>
  
  // Una ocurrencia específica por ID
  getOcurrencia(id: string): Signal<OcurrenciaRegistro | undefined>
  
  // Desde una ocurrencia, obtener su registro padre
  getRegistroDeOcurrencia(ocurrenciaId: string): Signal<Registro | undefined>
  
  // ===== OPERACIONES COMBINADAS =====
  
  // Crear registro con ocurrencias en una sola operación
  async createRegistroConOcurrencias(
    registroData: Omit<Registro, 'id' | 'createdAt' | 'updatedAt'>,
    ocurrencias: Array<Omit<OcurrenciaRegistro, 'id' | 'registroId' | 'createdAt'>>
  ): Promise<Registro>
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 💾 Almacenamiento (Ionic Storage)

### Storage Keys

- `registros`: Array de objetos `Registro`
- `ocurrencias_registro`: Array de objetos `OcurrenciaRegistro`

### Estrategia

- **Normalización**: Datos separados en dos colecciones
- **Sin duplicación**: Nombre y descripción solo en `Registro`
- **Joins en memoria**: Computed signals hacen el join automáticamente
- **Reactivo**: Cambios en registros se propagan a ocurrencias vía signals

---

## ✅ Ventajas del Modelo

| Ventaja | Descripción |
|---------|-------------|
| **Referenciabilidad Total** | Cada registro y ocurrencia tiene ID único + FK bidireccional |
| **Sin Duplicación** | Nombre/descripción solo se guardan una vez |
| **Flexibilidad** | Agregar/quitar ocurrencias sin afectar el registro |
| **Escalabilidad** | Fácil agregar campos sin romper estructura |
| **Integridad** | Eliminar registro puede hacer cascada a ocurrencias |
| **Performance** | Computed signals optimizan consultas |
| **Un solo servicio** | No requiere múltiples servicios/repositorios |

---

## 📁 Estructura de Archivos

```
src/
├── models/
│   └── registro.model.ts           # Interfaces: Registro, OcurrenciaRegistro, OcurrenciaConRegistro
├── services/
│   └── registro.service.ts         # Servicio único con signals
└── features/
    └── calendario/
        ├── calendario.page.ts      # Página principal del calendario
        ├── calendario.page.html
        └── components/
            ├── registro-form/      # Formulario crear/editar registro
            ├── ocurrencia-form/    # Formulario agregar ocurrencia
            └── timeline/           # Vista de timeline con ocurrencias
```

---

## 🚀 Próximos Pasos (No implementar todavía)

1. Crear modelos TypeScript en `src/models/registro.model.ts`
2. Crear servicio `RegistroService` en `src/services/registro.service.ts`
3. Implementar UI para crear registros
4. Implementar UI para agregar ocurrencias a un registro
5. Implementar vista de calendario/timeline
6. Agregar funcionalidad de edición/eliminación

---

## 📝 Notas Importantes

- **Terminología**: Usar "Registro" y "Ocurrencia" en toda la UI
- **Cascada**: Al eliminar un registro, eliminar todas sus ocurrencias
- **Validación**: No permitir ocurrencias sin registro padre
- **Fechas**: Usar formato ISO 8601 para fechas y horas
- **IDs**: Generar IDs únicos con timestamp + random

---

**Fecha de creación**: 2025-12-24  
**Versión**: 3.6  
**Estado**: Análisis completo - Pendiente implementación
