import { Registro } from './registro.model';

/**
 * Tipos de conflictos detectables en la agenda.
 */
export enum ConflictType {
    /** Solapamiento directo de tiempos */
    OVERLAP = 'overlap',
    /** Conflicto de buffers (sin overlap principal) */
    BUFFER = 'buffer',
    /** Inviabilidad geográfica (tránsito imposible) */
    GEOGRAPHIC = 'geographic',
    /** Dependencia rota (registro dependiente afectado) */
    DEPENDENCY = 'dependency'
}

/**
 * Severidad del conflicto.
 */
export enum ConflictSeverity {
    /** Advertencia - puede ser ignorada */
    WARNING = 'warning',
    /** Error - requiere resolución */
    ERROR = 'error'
}

/**
 * Opciones de resolución para un conflicto.
 */
export interface ResolutionOption {
    id: string;
    label: string;
    description: string;
    action: 'postpone_new' | 'move_existing' | 'mark_study' | 'compress_buffers' | 'auto_resolve';
    impact?: string; // Descripción del impacto de esta acción
}

/**
 * Representación de un conflicto detectado.
 */
export interface Conflict {
    id: string;
    type: ConflictType;
    severity: ConflictSeverity;
    /** Registros involucrados en el conflicto (mínimo 2) */
    registros: Registro[];
    /** Duración del solapamiento en minutos (si aplica) */
    overlapDuration?: number;
    /** Rango de tiempo del conflicto */
    timeRange?: {
        start: Date;
        end: Date;
    };
    /** Mensaje descriptivo del conflicto */
    message: string;
    /** Opciones sugeridas de resolución */
    suggestions: ResolutionOption[];
    /** Timestamp de detección */
    detectedAt: Date;
}

/**
 * Impacto en cascada de un cambio de registro.
 */
export interface CascadeImpact {
    /** Registro que origina el cambio */
    sourceRegistro: Registro;
    /** Registros afectados directamente */
    affectedRegistros: Registro[];
    /** Nuevos conflictos generados */
    newConflicts: Conflict[];
    /** Conflictos resueltos */
    resolvedConflicts: Conflict[];
    /** Descripción del impacto total */
    summary: string;
}

/**
 * Resultado de la detección de conflictos.
 */
export interface ConflictDetectionResult {
    hasConflicts: boolean;
    conflicts: Conflict[];
    canProceed: boolean; // true si son solo warnings
}
