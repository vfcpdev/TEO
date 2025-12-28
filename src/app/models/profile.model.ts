import type { AgendaConfig } from './agenda.model';

/**
 * Modelo para los perfiles de usuario (Familia, Trabajo, etc.).
 * Cada perfil tiene su propia configuración de agenda y registros.
 */
export type UserProfile = {
    id: string;
    name: string;
    alias: string;
    role: string; // Configurable: Padre, Madre, Hijo, Jefe, Compañero, Tío, etc.
    avatar?: string | undefined;
    color?: string | undefined; // Hex color for visual identification (e.g., #3B82F6)
    areaIds?: string[]; // IDs de áreas asociadas a este perfil
    config: AgendaConfig;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
};

export type CreateProfileDto = {
    name: string;
    alias: string;
    role: string;
    avatar?: string | undefined;
    color?: string | undefined;
};
