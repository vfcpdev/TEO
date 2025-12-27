import { Injectable, signal, computed, inject } from '@angular/core';
import { SQLiteService } from './sqlite.service';
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

    private readonly sqlite = inject(SQLiteService);

    // Signals para perfiles
    private _profiles = signal<UserProfile[]>([]);
    readonly profiles = computed(() => this._profiles());

    constructor() {
        this.initializeData();
    }

    private async initializeData() {
        // Esperar a que SQLite esté listo
        while (!this.sqlite.isReady()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
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
            const profiles = await this.sqlite.findAll<any>('profiles', 'created_at ASC');
            const mappedProfiles: UserProfile[] = profiles.map(p => ({
                id: p.id,
                name: p.name,
                alias: p.alias,
                role: p.role,
                avatar: p.avatar,
                isPrimary: p.is_primary === 1,
                isActive: p.is_active === 1,
                createdAt: new Date(p.created_at),
                config: {} as any
            }));
            this._profiles.set(mappedProfiles);

            if (mappedProfiles.length > 0 && !this._activeProfileId()) {
                const active = mappedProfiles.find(p => p.isPrimary) || mappedProfiles[0];
                this.setActiveProfile(active.id);
            }
        } catch (err) {
            console.error('Error loading profiles:', err);
        }
    }

    private async seedDefaultProfilesIfEmpty() {
        try {
            const count = await this.sqlite.count('profiles');
            if (count === 0) {
                const defaults: UserProfile[] = [
                    { id: crypto.randomUUID(), name: 'Yo (Usuario)', alias: 'Yo', role: 'padre', isPrimary: true, isActive: true, createdAt: new Date(), config: {} as any },
                    { id: crypto.randomUUID(), name: 'Mamá', alias: 'Mamá', role: 'madre', isPrimary: false, isActive: true, createdAt: new Date(), config: {} as any },
                    { id: crypto.randomUUID(), name: 'Hija Mayor', alias: 'Hija 1', role: 'hija', isPrimary: false, isActive: true, createdAt: new Date(), config: {} as any },
                    { id: crypto.randomUUID(), name: 'Hija Menor', alias: 'Hija 2', role: 'hija', isPrimary: false, isActive: true, createdAt: new Date(), config: {} as any },
                ];

                for (const p of defaults) {
                    await this.sqlite.insert('profiles', {
                        id: p.id,
                        name: p.name,
                        alias: p.alias,
                        role: p.role,
                        is_primary: p.isPrimary ? 1 : 0,
                        is_active: p.isActive ? 1 : 0,
                        created_at: p.createdAt.toISOString()
                    });
                }
                await this.loadProfiles();
            }
        } catch (err) {
            console.error('Error seeding profiles:', err);
        }
    }

    async addProfile(profile: UserProfile) {
        await this.sqlite.insert('profiles', {
            id: profile.id,
            name: profile.name,
            alias: profile.alias,
            role: profile.role,
            is_primary: profile.isPrimary ? 1 : 0,
            is_active: profile.isActive ? 1 : 0,
            created_at: profile.createdAt.toISOString()
        });
        await this.loadProfiles();
    }

    async loadRegistrosForProfile(profileId: string) {
        try {
            const registros = await this.sqlite.query<any>(
                'SELECT * FROM registros WHERE profile_id = ? ORDER BY start_time ASC',
                [profileId]
            );

            const mappedRegistros: Registro[] = registros.map(r => ({
                id: r.id,
                name: r.name,
                status: r.status as RegistroStatus,
                priority: r.priority as any,
                startTime: r.start_time ? new Date(r.start_time) : undefined,
                endTime: r.end_time ? new Date(r.end_time) : undefined,
                areaId: r.area_id,
                contextoId: r.contexto_id,
                tipoId: r.tipo_id,
                notes: r.notes,
                isAllDay: r.is_all_day === 1,
                createdAt: new Date(r.created_at),
                updatedAt: new Date(r.updated_at)
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
            await this.sqlite.update('registros',
                { status: newStatus, updated_at: new Date().toISOString() },
                'id = ?', [registroId]
            );
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
            await this.sqlite.insert('registros', {
                id: registro.id,
                profile_id: profileId,
                name: registro.name,
                area_id: registro.areaId,
                contexto_id: registro.contextoId,
                tipo_id: registro.tipoId,
                status: registro.status,
                priority: registro.priority,
                start_time: registro.startTime?.toISOString(),
                end_time: registro.endTime?.toISOString(),
                is_all_day: registro.isAllDay ? 1 : 0,
                notes: registro.notes,
                created_at: registro.createdAt.toISOString(),
                updated_at: registro.updatedAt.toISOString()
            });
            await this.loadRegistrosForProfile(profileId);
        } catch (err) {
            console.error('Error adding registro:', err);
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
