import { RegistroTipoBase } from './registro.model';

/**
 * Configuración dinámica de Áreas (Dimensiones de vida).
 * El usuario puede crear, editar o desactivar estas áreas.
 */
export interface AreaConfig {
    id: string;
    name: string;
    icon: string;
    color: string;
    order: number;
    isActive: boolean;
}

/**
 * Contextos situacionales vinculados a una o varias áreas.
 */
export interface ContextoConfig {
    id: string;
    areaId: string; // Vínculo principal con un área macro
    name: string;
    isActive: boolean;
}

/**
 * Configuración personalizada de los Tipos de Registro.
 * Permite que el usuario defina "Clase", "Cita", "Gym" vinculados a comportamientos base.
 */
export interface TipoConfig {
    id: string;
    baseType: RegistroTipoBase; // Comportamiento técnico (Evento, Tarea, etc.)
    name: string;
    icon: string;
    color: string;
    isActive: boolean;
    defaultBufferBefore?: number;
    defaultBufferAfter?: number;
}

/**
 * Modelo global de configuración de la Agenda para un usuario.
 */
export interface AgendaConfig {
    areas: AreaConfig[];
    contextos: ContextoConfig[];
    tipos: TipoConfig[];
    settings: {
        showSplash: boolean;
        showQuickAccess: boolean;
        defaultAreaId?: string;
        pomodoroCycles?: {
            focus: number;
            shortBreak: number;
            longBreak: number;
        };
    };
}

/**
 * Mantengo esta interfaz antigua por retrocompatibilidad temporal 
 * mientras se migran los componentes de ajustes.
 */
export interface AgendaConfigItem {
    id: string;
    name: string;
    color?: string;
    createdAt: Date;
}
