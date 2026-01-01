import { Injectable, inject, computed } from '@angular/core';
import { AgendaStore } from '../state/agenda.store';
import {
    AgendaConfig,
    AreaConfig,
    ContextoConfig,
    TipoConfig
} from '../../models/agenda.model';
import { Registro, RegistroStatus, RegistroPrioridad } from '../../models/registro.model';
import { ConflictEngineService } from './conflict-engine.service';
import { ConflictDetectionResult } from '../../models/conflict.model';
import { ReminderService } from './reminder.service';
import { SyncQueueService } from './sync-queue.service';

@Injectable({
    providedIn: 'root'
})
@Injectable({
    providedIn: 'root'
})
export class AgendaService {
    private readonly store = inject(AgendaStore);
    private readonly conflictEngine = inject(ConflictEngineService);
    private readonly reminderService = inject(ReminderService);
    private readonly syncQueue = inject(SyncQueueService);

    // Selectors Delegated to Store
    readonly config = this.store.config;
    readonly registros = this.store.registros;
    readonly areas = this.store.areas;
    readonly contextos = this.store.contextos;
    readonly tipos = this.store.tipos;
    readonly canUndo = this.store.canUndo;
    readonly canRedo = this.store.canRedo;

    // History Actions
    undo() { this.store.undo(); }
    redo() { this.store.redo(); }

    // Computed Selectors based on Store state
    readonly activeAreas = computed(() => this.store.areas().filter(a => a.isActive));

    // --- Áreas ---
    addArea(area: Omit<AreaConfig, 'id'>) {
        const newArea: AreaConfig = {
            ...area,
            id: crypto.randomUUID()
        };
        this.store.updateConfig(c => ({
            ...c,
            areas: [...c.areas, newArea]
        }));
    }

    updateArea(id: string, updates: Partial<AreaConfig>) {
        this.store.updateConfig(c => ({
            ...c,
            areas: c.areas.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    }

    deleteArea(id: string) {
        this.store.updateConfig(c => ({
            ...c,
            areas: c.areas.filter(a => a.id !== id),
            contextos: c.contextos
                .map(ctx => ({
                    ...ctx,
                    areaIds: ctx.areaIds.filter(aid => aid !== id)
                }))
                .filter(ctx => ctx.areaIds.length > 0)
        }));
    }

    // --- Contextos ---
    addContexto(contexto: Omit<ContextoConfig, 'id'>) {
        const newContexto: ContextoConfig = {
            ...contexto,
            id: crypto.randomUUID()
        };
        this.store.updateConfig(c => ({
            ...c,
            contextos: [...c.contextos, newContexto]
        }));
    }

    updateContexto(id: string, updates: Partial<ContextoConfig>) {
        this.store.updateConfig(c => ({
            ...c,
            contextos: c.contextos.map(ctx => ctx.id === id ? { ...ctx, ...updates } : ctx)
        }));
    }

    deleteContexto(id: string) {
        this.store.updateConfig(c => ({
            ...c,
            contextos: c.contextos.filter(ctx => ctx.id !== id)
        }));
    }

    // --- Tipos ---
    addTipo(tipo: Omit<TipoConfig, 'id'>) {
        const newTipo: TipoConfig = {
            ...tipo,
            id: crypto.randomUUID()
        };
        this.store.updateConfig(c => ({
            ...c,
            tipos: [...c.tipos, newTipo]
        }));
    }

    updateTipo(id: string, updates: Partial<TipoConfig>) {
        this.store.updateConfig(c => ({
            ...c,
            tipos: c.tipos.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    }

    deleteTipo(id: string) {
        this.store.updateConfig(c => ({
            ...c,
            tipos: c.tipos.filter(t => t.id !== id)
        }));
    }

    // --- Registros ---

    /**
     * Agrega un registro después de validar conflictos.
     */
    addRegistro(registro: Registro): ConflictDetectionResult {
        const existing = this.store.registros();
        const conflictResult = this.conflictEngine.detectConflicts(registro, existing);

        let finalRegistro = registro;

        if (conflictResult.hasConflicts && !conflictResult.canProceed) {
            // Si hay conflictos bloqueantes, forzar estado ESTUDIO
            finalRegistro = {
                ...registro,
                status: RegistroStatus.ESTUDIO
            };
        }

        // Agregar al Store
        this.store.addRegistro(finalRegistro);

        // Queue for Sync
        this.syncQueue.addOperation('CREATE', 'REGISTRO', finalRegistro);

        // Si no fue bloqueado, intentar agendar notificacion
        // (Nota: Si cambiamos a "En Estudio", tal vez no deberíamos notificar? 
        //  Por ahora mantenemos la lógica original de notificar si se agregó, 
        //  pero "En Estudio" quizás no debería tener alarma. 
        //  Asumamos que si reminderEnabled=true, el usuario quiere alarma igual.)
        if (finalRegistro.reminderEnabled) {
            this.handleNotificationSetup(finalRegistro);
        }

        return conflictResult;
    }

    updateRegistro(id: string, updates: Partial<Registro>) {
        const current = this.store.registros().find(r => r.id === id);
        if (current) {
            const updated = { ...current, ...updates };

            // Side effect: Notifications
            this.handleNotificationUpdate(current, updated);

            // State update
            this.store.updateRegistro(id, updates);

            // Queue for Sync
            this.syncQueue.addOperation('UPDATE', 'REGISTRO', updated);
        }
    }

    deleteRegistro(id: string) {
        const registro = this.store.registros().find(r => r.id === id);

        // Side effect: Cancel notification
        if (registro?.notificationId) {
            this.reminderService.cancelFor(registro.notificationId);
        }

        // State update
        this.store.deleteRegistro(id);

        // Queue for Sync
        this.syncQueue.addOperation('DELETE', 'REGISTRO', { id });
    }

    saveBorrador(data: {
        nombre: string;
        areaIds: string[];
        contextoIds: string[];
        profileId: string;
    }): Registro {
        const borrador: Registro = {
            id: crypto.randomUUID(),
            profileId: data.profileId,
            name: data.nombre,
            status: RegistroStatus.BORRADOR,
            priority: RegistroPrioridad.SOFT,
            isAllDay: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            areaId: data.areaIds[0],
            contextoId: data.contextoIds[0]
        };

        this.store.addRegistro(borrador);
        return borrador;
    }

    // --- Private Notification Handlers ---

    private async handleNotificationSetup(registro: Registro) {
        if (registro.reminderEnabled && registro.reminderTime) {
            const notifId = await this.reminderService.scheduleFor(registro);
            if (notifId) {
                // Update the store with the new notification ID
                this.store.updateRegistro(registro.id, { notificationId: notifId });
            }
        }
    }

    private async handleNotificationUpdate(oldReg: Registro, newReg: Registro) {
        const timeChanged = oldReg.startTime?.getTime() !== newReg.startTime?.getTime();
        const settingsChanged = oldReg.reminderEnabled !== newReg.reminderEnabled || oldReg.reminderTime !== newReg.reminderTime;

        if (timeChanged || settingsChanged) {
            if (oldReg.notificationId) {
                await this.reminderService.cancelFor(oldReg.notificationId);
            }

            if (newReg.reminderEnabled && newReg.reminderTime) {
                const notifId = await this.reminderService.scheduleFor(newReg);
                if (notifId) {
                    this.store.updateRegistro(newReg.id, { notificationId: notifId });
                }
            }
        }
    }
}
