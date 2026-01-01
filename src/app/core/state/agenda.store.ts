import { Injectable, signal, computed, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { AgendaConfig } from '../../models/agenda.model';
import { Registro, RegistroStatus, RegistroTipoBase } from '../../models/registro.model';

export interface AgendaState {
    config: AgendaConfig;
    registros: Registro[];
    loaded: boolean;
}

const CONFIG_STORAGE_KEY = 'agenda_config';
const REGISTROS_STORAGE_KEY = 'agenda_registros';

@Injectable({
    providedIn: 'root'
})
export class AgendaStore {
    // State Signals
    private _config = signal<AgendaConfig>(this.getDefaultConfig());
    private _registros = signal<Registro[]>([]);
    private _loaded = signal<boolean>(false);

    private _canUndo = signal(false);
    private _canRedo = signal(false);

    // Computed Selectors
    readonly config = computed(() => this._config());
    readonly registros = computed(() => this._registros());
    readonly loaded = computed(() => this._loaded());
    readonly canUndo = computed(() => this._canUndo());
    readonly canRedo = computed(() => this._canRedo());
    // Computed for stacks is expensive if deep, but checking length is cheap.
    // We can just expose computed logic on the stack but stacks are not signals.
    // Simpler: Just make new computed signals that we trigger updates on?
    // Or better: Use signals for the stacks too? 
    // Let's keep stacks as valid arrays and just update signals `_canUndo` upon mutation.

    // Specific Selectors provided for compatibility/ease
    readonly areas = computed(() => this._config().areas);
    readonly contextos = computed(() => this._config().contextos);
    readonly tipos = computed(() => this._config().tipos);

    constructor() {
        this.loadState();

        // Persist Config Effect
        effect(() => {
            if (this._loaded()) {
                this.saveConfig(this._config());
            }
        });

        // Persist Registros Effect
        effect(() => {
            if (this._loaded()) {
                this.saveRegistros(this._registros());
            }
        });
    }

    // --- Actions: State Mutations ---

    // Config Actions
    setConfig(config: AgendaConfig) {
        this._config.set(config);
    }

    updateConfig(updater: (config: AgendaConfig) => AgendaConfig) {
        this._config.update(updater);
    }

    // --- Undo/Redo History ---
    private undoStack: Registro[][] = [];
    private redoStack: Registro[][] = [];
    private readonly MAX_HISTORY = 20;

    // Actions wrapped with History
    private updateHistorySignals() {
        this._canUndo.set(this.undoStack.length > 0);
        this._canRedo.set(this.redoStack.length > 0);
    }

    private saveHistory() {
        if (this.undoStack.length >= this.MAX_HISTORY) {
            this.undoStack.shift(); // Remove oldest
        }
        // Snapshot current state (deep copy not strictly needed if we assume immutability of elements, 
        // but strictly safer to copy the array reference at least)
        this.undoStack.push(this._registros());
        this.redoStack = []; // Clear redo on new action
        this.updateHistorySignals();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const previous = this.undoStack.pop();
        const current = this._registros();

        if (previous) {
            this.redoStack.push(current);
            this._registros.set(previous);
            this.updateHistorySignals();
        }
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const next = this.redoStack.pop();
        const current = this._registros();

        if (next) {
            this.undoStack.push(current);
            this._registros.set(next);
            this.updateHistorySignals();
        }
    }

    // Registros Actions
    setRegistros(registros: Registro[]) {
        this.saveHistory();
        this._registros.set(registros);
    }

    addRegistro(registro: Registro) {
        this.saveHistory();
        this._registros.update(current => [...current, registro]);
    }

    updateRegistro(id: string, updates: Partial<Registro>) {
        this.saveHistory();
        this._registros.update(current =>
            current.map(r => r.id === id ? { ...r, ...updates } : r)
        );
    }

    deleteRegistro(id: string) {
        this.saveHistory();
        this._registros.update(current => current.filter(r => r.id !== id));
    }

    // --- Persistence Logic ---

    private async loadState() {
        try {
            const [configRes, registrosRes] = await Promise.all([
                Preferences.get({ key: CONFIG_STORAGE_KEY }),
                Preferences.get({ key: REGISTROS_STORAGE_KEY })
            ]);

            if (configRes.value) {
                this._config.set(JSON.parse(configRes.value));
            }

            if (registrosRes.value) {
                const rawRegistros = JSON.parse(registrosRes.value);
                // Revive Dates
                const revivedRegistros = rawRegistros.map((r: any) => ({
                    ...r,
                    createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
                    updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
                    startTime: r.startTime ? new Date(r.startTime) : undefined,
                    endTime: r.endTime ? new Date(r.endTime) : undefined,
                }));
                this._registros.set(revivedRegistros);
            }

            this._loaded.set(true);
            console.log('Agenda Store Loaded');

        } catch (e) {
            console.error('Error loading agenda state', e);
            // Even on error, mark as loaded so we don't block defaults
            this._loaded.set(true);
        }
    }

    private async saveConfig(config: AgendaConfig) {
        await Preferences.set({
            key: CONFIG_STORAGE_KEY,
            value: JSON.stringify(config)
        });
    }

    private async saveRegistros(registros: Registro[]) {
        await Preferences.set({
            key: REGISTROS_STORAGE_KEY,
            value: JSON.stringify(registros)
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
