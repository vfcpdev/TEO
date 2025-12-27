import { Injectable, inject } from '@angular/core';
import { SQLiteService } from './sqlite.service';
import { Preferences } from '@capacitor/preferences';
// import { AgendaService } from '../../features/agenda/services/agenda.service'; // DELETED

@Injectable({
    providedIn: 'root'
})
export class DatabaseResetService {
    private readonly sqliteService = inject(SQLiteService);
    // private readonly agendaService = inject(AgendaService); // DELETED

    /**
     * Resetea completamente la base de datos y todas las preferencias
     * ADVERTENCIA: Esta acción elimina TODOS los datos de la aplicación
     */
    async resetAllData(): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Limpiar todas las Preferences (Agenda, configuraciones, etc.)
            await this.clearAllPreferences();

            // 2. Eliminar y recrear la base de datos SQLite
            await this.resetSQLiteDatabase();

            // 3. Recargar datos vacíos en los servicios
            await this.reloadServices();

            return { success: true };
        } catch (error) {
            console.error('[DatabaseReset] Error resetting database:', error);
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Limpia todas las Preferences almacenadas
     */
    private async clearAllPreferences(): Promise<void> {
        // Obtener todas las keys conocidas
        const knownKeys = [
            'agenda_events',
            'agenda_areas',
            'agenda_config_events',
            'agenda_tasks',
            'agenda_reminders',
            // Agregar aquí otras keys de Preferences que uses en la app
        ];

        // Eliminar cada key
        for (const key of knownKeys) {
            await Preferences.remove({ key });
        }

        // Opcionalmente, limpiar TODAS las preferences
        // await Preferences.clear();
    }

    /**
     * Resetea la base de datos SQLite
     */
    private async resetSQLiteDatabase(): Promise<void> {
        // Eliminar la base de datos actual
        await this.sqliteService.deleteDatabase();

        // Reinicializar la base de datos con esquema limpio
        await this.sqliteService.initializeDatabase();
    }

    /**
     * Recarga los servicios para reflejar el estado vacío
     */
    private async reloadServices(): Promise<void> {
        // TODO: Reload services when redesigned
        console.log('[DatabaseReset] Service reload skipped - services being redesigned');
    }

    /**
     * Obtiene estadísticas antes del reset (útil para mostrar al usuario)
     */
    async getDataStats(): Promise<DataStats> {
        const sqliteStats = await this.sqliteService.getDatabaseStats();

        return {
            totalSQLiteRecords: sqliteStats.totalRecords,
            tables: sqliteStats.tables,
            agendaAreas: 0, // Service deleted
            agendaEvents: 0, // Service deleted
            agendaTasks: 0, // Service deleted
            agendaReminders: 0 // Service deleted
        };
    }
}

export interface DataStats {
    totalSQLiteRecords: number;
    tables: Record<string, number>;
    agendaAreas: number;
    agendaEvents: number;
    agendaTasks: number;
    agendaReminders: number;
}
