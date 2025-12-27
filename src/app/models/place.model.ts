/**
 * Tipos de lugar disponibles
 * W = Trabajo (Work)
 * P = Personal
 */
export enum PlaceType {
  WORK = 'W',
  PERSONAL = 'P'
}

/**
 * Etiquetas para mostrar en UI
 */
export const PlaceTypeLabels: Record<PlaceType, string> = {
  [PlaceType.WORK]: 'Trabajo',
  [PlaceType.PERSONAL]: 'Personal'
};

/**
 * Iconos para cada tipo de lugar
 */
export const PlaceTypeIcons: Record<PlaceType, string> = {
  [PlaceType.WORK]: 'briefcase-outline',
  [PlaceType.PERSONAL]: 'home-outline'
};

/**
 * Colores para cada tipo de lugar
 */
export const PlaceTypeColors: Record<PlaceType, string> = {
  [PlaceType.WORK]: 'primary',
  [PlaceType.PERSONAL]: 'tertiary'
};

/**
 * Interface base para Place (Lugar)
 * Representa un lugar donde se desarrollan eventos o tareas
 */
export interface Place {
  id: string;           // Formato: {TIPO}-{YYYYMMDD}-{RANDOM} ej: "W-20251213-A3X"
  code?: string;        // Código del lugar (para asociar cursos) ej: "203", "301"
  name: string;         // Nombre del lugar
  type: PlaceType;      // Tipo: Trabajo o Personal
  latitude?: number;    // Coordenada de latitud (opcional)
  longitude?: number;   // Coordenada de longitud (opcional)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para crear un nuevo lugar
 */
export interface CreatePlaceDto {
  code?: string;
  name: string;
  type: PlaceType;
  latitude?: number;
  longitude?: number;
}

/**
 * DTO para actualizar un lugar existente
 */
export interface UpdatePlaceDto extends Partial<CreatePlaceDto> {
  id: string;
}

/**
 * Genera un ID único para un lugar
 * Formato: {TIPO}-{YYYYMMDD}-{RANDOM}
 * Ejemplo: W-20251213-K7M
 */
export function generatePlaceId(type: PlaceType): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${type}-${dateStr}-${random}`;
}
