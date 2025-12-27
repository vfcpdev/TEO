import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Registro, RegistroStatus } from '../../models/registro.model';
import { UserProfile } from '../../models/profile.model';

@Injectable({
    providedIn: 'root'
})
export class RegistroEstadoService {
    // Signal para el perfil actualmente seleccionado para gestión
    private _activeProfileId = signal<string | null>(null);

    // Almacén de registros por perfil (En fase real vendría de SQLite)
    private _registrosMap = signal<Map<string, Registro[]>>(new Map());

    readonly activeProfileId = computed(() => this._activeProfileId());

    readonly activeProfileRegistros = computed(() => {
        const id = this._activeProfileId();
        return id ? (this._registrosMap().get(id) || []) : [];
    });

    private readonly storage = inject(StorageService);

    // Signals para perfiles
    private _profiles = signal<UserProfile[]>([]);
    readonly profiles = computed(() => this._profiles());

    constructor() {
        this.initializeData();
    }

    private async initializeData() {
        // Inicializar Storage
        await this.storage.init();

        await this.loadProfiles();
        await this.seedDefaultProfilesIfEmpty();

        // Cargar registros para el perfil primario inicialmente
        const primary = this._profiles().find(p => p.isPrimary);
        if (primary) {
            await this.loadRegistrosForProfile(primary.id);
        }
    }

    private async loadProfiles() {
        try {
            const profiles = await this.storage.get<UserProfile[]>('profiles');

            if (profiles && profiles.length > 0) {
                // Convert date strings back to Date objects
                const mappedProfiles = profiles.map(p => ({
                    ...p,
                    createdAt: new Date(p.createdAt)
                }));

                this._profiles.set(mappedProfiles);
                console.log('[RegistroEstadoService] Loaded profiles:', mappedProfiles.length);

                if (!this._activeProfileId()) {
                    const active = mappedProfiles.find(p => p.isPrimary) || mappedProfiles[0];
                    this.setActiveProfile(active.id);
                }
            } else {
                this._profiles.set([]);
            }
        } catch (error) {
            console.error('[RegistroEstadoService] Error loading profiles:', error);
            this._profiles.set([]);
        }
    }

    private async seedDefaultProfilesIfEmpty() {
        if (this._profiles().length === 0) {
            console.log('[RegistroEstadoService] Seeding default profiles...');
            try {
                const defaultProfiles: UserProfile[] = [
                    { id: crypto.randomUUID(), name: 'Yo (Usuario)', alias: 'Yo', role: 'padre', color: '#3B82F6', isPrimary: true, isActive: true, createdAt: new Date(), config: {} as any },
                    { id: crypto.randomUUID(), name: 'Mamá', alias: 'Mamá', role: 'madre', color: '#EC4899', isPrimary: false, isActive: true, createdAt: new Date(), config: {} as any },
                    { id: crypto.randomUUID(), name: 'Hija Mayor', alias: 'Hija 1', role: 'hija', color: '#8B5CF6', isPrimary: false, isActive: true, createdAt: new Date(), config: {} as any },
                    { id: crypto.randomUUID(), name: 'Hija Menor', alias: 'Hija 2', role: 'hija', color: '#10B981', isPrimary: false, isActive: true, createdAt: new Date(), config: {} as any }
                ];

                await this.storage.set('profiles', defaultProfiles);
                this._profiles.set(defaultProfiles);
                console.log('[RegistroEstadoService] Default profiles seeded');
            } catch (error) {
                console.error('[RegistroEstadoService] Error seeding profiles:', error);
            }
        }
    }

    async addProfile(profile: UserProfile) {
        try {
            const currentProfiles = this._profiles();
            const updatedProfiles = [...currentProfiles, profile];
            await this.storage.set('profiles', updatedProfiles);
            this._profiles.set(updatedProfiles);
            console.log('[RegistroEstadoService] Profile added:', profile.id);
        } catch (error) {
            console.error('[RegistroEstadoService] Error adding profile:', error);
            throw error;
        }
    }

    async updateProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
        try {
            const current = this._profiles();
            const updated = current.map(p => p.id === id ? { ...p, ...updates } : p);

            await this.storage.set('profiles', updated);
            this._profiles.set(updated);
            console.log('[RegistroEstadoService] Profile updated:', id);
        } catch (error) {
            console.error('[RegistroEstadoService] Error updating profile:', error);
            throw error;
        }
    }

    async deleteProfile(id: string): Promise<void> {
        // Prevent deleting primary profile
        const profile = this._profiles().find(p => p.id === id);
        if (profile?.isPrimary) {
            throw new Error('Cannot delete primary profile');
        }

        try {
            const current = this._profiles();
            const updated = current.filter(p => p.id !== id);

            await this.storage.set('profiles', updated);
            this._profiles.set(updated);
            console.log('[RegistroEstadoService] Profile deleted:', id);
        } catch (error) {
            console.error('[RegistroEstadoService] Error deleting profile:', error);
            throw error;
        }
    }

    async loadRegistrosForProfile(profileId: string) {
        try {
            const allRegistros = await this.storage.get<Registro[]>('registros') || [];
            const profileRegistros = allRegistros.filter(r => r.profileId === profileId);

            const mappedRegistros: Registro[] = profileRegistros.map(r => ({
                ...r,
                startTime: r.startTime ? new Date(r.startTime) : undefined,
                endTime: r.endTime ? new Date(r.endTime) : undefined,
                createdAt: new Date(r.createdAt),
                updatedAt: new Date(r.updatedAt)
            }));

            this._registrosMap.update(map => {
                map.set(profileId, mappedRegistros);
                return new Map(map);
            });
        } catch (err) {
            console.error('Error loading registros:', err);
        }
    }

    /**
     * Establece el perfil activo.
     */
    async setActiveProfile(profileId: string) {
        this._activeProfileId.set(profileId);
        await this.loadRegistrosForProfile(profileId);
    }

    /**
     * Cambia el estado de un registro.
     */
    async updateStatus(registroId: string, newStatus: RegistroStatus) {
        const profileId = this._activeProfileId();
        if (!profileId) return;

        try {
            const allRegistros = await this.storage.get<Registro[]>('registros') || [];
            const updatedRegistros = allRegistros.map(r =>
                r.id === registroId ? { ...r, status: newStatus, updatedAt: new Date() } : r
            );
            await this.storage.set('registros', updatedRegistros);
            await this.loadRegistrosForProfile(profileId);
        } catch (err) {
            console.error('Error updating status:', err);
        }
    }

    /**
     * Agrega un nuevo registro vinculado al perfil activo.
     */
    async addRegistro(registro: Registro) {
        const profileId = this._activeProfileId();
        if (!profileId) return;

        try {
            // Ensure profileId is set
            const newRegistro = { ...registro, profileId };

            // Get all registros and add the new one
            const allRegistros = await this.storage.get<Registro[]>('registros') || [];
            const updatedRegistros = [...allRegistros, newRegistro];

            await this.storage.set('registros', updatedRegistros);
            await this.loadRegistrosForProfile(profileId);
            console.log('[RegistroEstadoService] Registro added:', newRegistro.id);
        } catch (error) {
            console.error('[RegistroEstadoService] Error adding registro:', error);
            throw error;
        }
    }

    /**
     * Lógica para confirmar un registro.
     */
    async confirmarRegistro(registroId: string) {
        await this.updateStatus(registroId, RegistroStatus.CONFIRMADO);
    }

    /**
     * Mueve un registro a estado Borrador.
     */
    async mandarABorrador(registroId: string) {
        await this.updateStatus(registroId, RegistroStatus.BORRADOR);
    }

    /**
     * Marca un registro En Estudio (por conflictos).
     */
    async marcarEnEstudio(registroId: string) {
        await this.updateStatus(registroId, RegistroStatus.ESTUDIO);
    }

    /**
     * Obtiene registros filtrados por estado para el perfil activo.
     */
    getRegistrosByStatus(status: RegistroStatus) {
        return computed(() =>
            this.activeProfileRegistros().filter((r: Registro) => r.status === status)
        );
    }
}
