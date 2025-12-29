import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import {
    AgendaConfig,
    AreaConfig,
    ContextoConfig,
    TipoConfig
} from '../../models/agenda.model';
import { Registro, RegistroTipoBase, RegistroStatus } from '../../models/registro.model';
import { ConflictEngineService } from './conflict-engine.service';
import { ConflictDetectionResult } from '../../models/conflict.model';

@Injectable({
    providedIn: 'root'
})
export class AgendaService {
    private readonly STORAGE_KEY = 'agenda_config';
    private readonly conflictEngine = inject(ConflictEngineService);

    // Signals para el estado global de la configuración
    private _config = signal<AgendaConfig>(this.getDefaultConfig());
    private _registros = signal<Registro[]>([]); // Almacén de registros

    // Selectores computados para fácil acceso
    readonly config = computed(() => this._config());
    readonly areas = computed(() => this._config().areas);
    readonly contextos = computed(() => this._config().contextos);
    readonly tipos = computed(() => this._config().tipos);
    readonly activeAreas = computed(() => this._config().areas.filter(a => a.isActive));
    readonly registros = computed(() => this._registros());

    constructor() {
        this.loadConfig();

        // Efecto para persistir cambios automáticamente
        effect(() => {
            this.saveConfig(this._config());
        });
    }

    // --- Áreas ---
    addArea(area: Omit<AreaConfig, 'id'>) {
        const newArea: AreaConfig = {
            ...area,
            id: crypto.randomUUID()
        };
        this._config.update(c => ({
            ...c,
            areas: [...c.areas, newArea]
        }));
    }

    updateArea(id: string, updates: Partial<AreaConfig>) {
        this._config.update(c => ({
            ...c,
            areas: c.areas.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    }

    deleteArea(id: string) {
        this._config.update(c => ({
            ...c,
            areas: c.areas.filter(a => a.id !== id),
            contextos: c.contextos
                .map(ctx => ({
                    ...ctx,
                    areaIds: ctx.areaIds.filter(aid => aid !== id)
                }))
                .filter(ctx => ctx.areaIds.length > 0) // Limpieza de redundantes sin área
        }));
    }

    // --- Contextos ---
    addContexto(contexto: Omit<ContextoConfig, 'id'>) {
        const newContexto: ContextoConfig = {
            ...contexto,
            id: crypto.randomUUID()
        };
        this._config.update(c => ({
            ...c,
            contextos: [...c.contextos, newContexto]
        }));
    }

    updateContexto(id: string, updates: Partial<ContextoConfig>) {
        this._config.update(c => ({
            ...c,
            contextos: c.contextos.map(ctx => ctx.id === id ? { ...ctx, ...updates } : ctx)
        }));
    }

    deleteContexto(id: string) {
        this._config.update(c => ({
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
        this._config.update(c => ({
            ...c,
            tipos: [...c.tipos, newTipo]
        }));
    }

    updateTipo(id: string, updates: Partial<TipoConfig>) {
        this._config.update(c => ({
            ...c,
            tipos: c.tipos.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    }

    deleteTipo(id: string) {
        this._config.update(c => ({
            ...c,
            tipos: c.tipos.filter(t => t.id !== id)
        }));
    }

    // --- Registros (Fase 1.1: Con detección de conflictos) ---
    /**
     * Agrega un registro después de validar conflictos.
     * FASE 1.1: Detecta conflictos y marca registro como "En Estudio" si aplica.
     * 
     * @returns ConflictDetectionResult con información de conflictos
     */
    addRegistro(registro: Registro): ConflictDetectionResult {
        const existing = this._registros();
        const conflictResult = this.conflictEngine.detectConflicts(registro, existing);

        if (conflictResult.hasConflicts && !conflictResult.canProceed) {
            // Si hay conflictos ERROR, marcar automáticamente como "En Estudio"
            const updatedRegistro = {
                ...registro,
                status: RegistroStatus.ESTUDIO
            };
            this._registros.update(r => [...r, updatedRegistro]);
        } else {
            // Sin conflictos o solo warnings, agregar normalmente
            this._registros.update(r => [...r, registro]);
        }

        return conflictResult;
    }

    updateRegistro(id: string, updates: Partial<Registro>) {
        this._registros.update(r => r.map(item => item.id === id ? { ...item, ...updates } : item));
    }

    deleteRegistro(id: string) {
        this._registros.update(r => r.filter(item => item.id !== id));
    }

    // --- Persistencia ---
    private async loadConfig() {
        const { value } = await Preferences.get({ key: this.STORAGE_KEY });
        if (value) {
            try {
                this._config.set(JSON.parse(value));
            } catch (e) {
                console.error('Error loading agenda config', e);
            }
        }
    }

    private async saveConfig(config: AgendaConfig) {
        await Preferences.set({
            key: this.STORAGE_KEY,
            value: JSON.stringify(config)
        });
    }

    private getDefaultConfig(): AgendaConfig {
        return {
            areas: [
                { id: 'area_trabajo', name: 'Trabajo', icon: 'briefcase-outline', color: '#1e88e5', order: 1, isActive: true },
                { id: 'area_familiar', name: 'Familiar', icon: 'people-outline', color: '#e53935', order: 2, isActive: true },
                { id: 'area_personal', name: 'Personal', icon: 'person-outline', color: '#43a047', order: 3, isActive: true },
                { id: 'area_social', name: 'Social', icon: 'chatbubbles-outline', color: '#fb8c00', order: 4, isActive: true }
            ],
            contextos: [],
            tipos: [
                { id: 'tipo_evento', baseType: RegistroTipoBase.EVENTO, name: 'Evento', icon: 'calendar-outline', color: '#3949ab', isActive: true },
                { id: 'tipo_tarea', baseType: RegistroTipoBase.TAREA, name: 'Tarea', icon: 'checkbox-outline', color: '#00897b', isActive: true },
                { id: 'tipo_recordatorio', baseType: RegistroTipoBase.RECORDATORIO, name: 'Recordatorio', icon: 'notifications-outline', color: '#fdd835', isActive: true },
                { id: 'tipo_tlibre', baseType: RegistroTipoBase.TIEMPO_LIBRE, name: 'Tiempo Libre', icon: 'leaf-outline', color: '#7cb342', isActive: true }
            ],
            settings: {
                showSplash: true,
                showQuickAccess: true,
                pomodoroCycles: {
                    focus: 25,
                    shortBreak: 5,
                    longBreak: 15
                }
            }
        };
    }

}
