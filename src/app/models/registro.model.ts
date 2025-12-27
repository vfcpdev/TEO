/**
 * Enum para los estados de planificación de un Registro.
 * Permite gestionar el ciclo de vida de una entrada en la agenda.
 */
export enum RegistroStatus {
    CONFIRMADO = 'confirmado', // Certeza de que va a ocurrir
    BORRADOR = 'borrador',     // Idea guardada sin planificación completa
    ESTUDIO = 'estudio',       // Creado pero presenta conflicto de cruce
    DESCARTADO = 'descartado', // Registro cancelado
    APLAZADO = 'aplazado'      // Postergado para el futuro
}

/**
 * Prioridad del registro para la gestión de conflictos.
 */
export enum RegistroPrioridad {
    HARD = 'hard', // Inamovible (Vuelo, Examen). Fuerza a mover otros.
    SOFT = 'soft'  // Flexible (Lectura, Gym). Puede ser desplazado o comprimido.
}

/**
 * Comportamiento técnico base de un registro.
 */
export enum RegistroTipoBase {
    EVENTO = 'evento',           // Bloque con duración (Inicio/Fin)
    TAREA = 'tarea',             // Ítem con estado de cumplimiento
    RECORDATORIO = 'recordatorio', // Alerta puntual
    TIEMPO_LIBRE = 'tiempo_libre' // Bloque de disponibilidad proactiva
}

/**
 * Interfaz para tiempos de tránsito, preparación o descanso.
 */
export interface RegistroBuffer {
    duration: number; // en minutos
    description?: string; // ej: "Tránsito", "Preparación", "Almuerzo"
}

/**
 * Ítem de checklist dentro de un Registro.
 * Soporta transversalidad de áreas y contextos.
 */
export interface RegistroTarea {
    id: string;
    name: string;
    completed: boolean;
    areaId?: string;     // Área transversal (ej: Tarea personal en evento laboral)
    contextoId?: string; // Contexto transversal
}

/**
 * Recurso vinculado a un registro (PDF, Link, Referencia Física, etc.)
 */
export interface RegistroArtefacto {
    id: string;
    tipo: 'logico' | 'digital' | 'fisico';
    name: string;
    value: string; // URL, Path, ID de curso, etc.
    metadata?: any;
}

/**
 * Interfaz Universal de Registro.
 * Único requisito obligatorio: Nombre.
 * Diseñada para ser evolutiva y progresiva.
 */
export interface Registro {
    id: string;
    name: string; // Único requisito obligatorio inicial

    // Clasificación (vínculo con AgendaConfig)
    areaId?: string;
    contextoId?: string;
    tipoId?: string; // Vínculo con TipoConfig (que define el nombre e icono)

    // Planificación
    status?: RegistroStatus;
    priority?: RegistroPrioridad;

    // Tiempos
    startTime?: Date;
    endTime?: Date;
    duration?: number; // en minutos (calculado o manual)
    isAllDay?: boolean;

    // Buffers (Tiempos muertos asociados)
    bufferBefore?: RegistroBuffer;
    bufferAfter?: RegistroBuffer;

    // Contenido
    notes?: string;
    checklist?: RegistroTarea[];
    artefactos?: RegistroArtefacto[];

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}
