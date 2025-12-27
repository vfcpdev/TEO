import { AgendaConfig } from './agenda.model';

/**
 * Modelo para los perfiles de usuario (Familia).
 * Cada perfil tiene su propia configuración de agenda y registros.
 */
export interface UserProfile {
    id: string;
    name: string;
    alias: string;
    role: 'padre' | 'madre' | 'hijo' | 'hija' | 'otro';
    avatar?: string;
    config: AgendaConfig;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: Date;
}

export interface CreateProfileDto {
    name: string;
    alias: string;
    role: UserProfile['role'];
    avatar?: string;
}
