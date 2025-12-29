import { TestBed } from '@angular/core/testing';
import { ConflictEngineService } from './conflict-engine.service';
import { Registro, RegistroStatus, RegistroPrioridad } from '../../models/registro.model';
import { ConflictType, ConflictSeverity } from '../../models/conflict.model';

describe('ConflictEngineService - Fase 1.1', () => {
    let service: ConflictEngineService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConflictEngineService]
        });
        service = TestBed.inject(ConflictEngineService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('detectConflicts - Overlap básico', () => {
        it('debe detectar solapamiento total', () => {
            const newRegistro: Registro = {
                id: 'new-1',
                profileId: 'profile-1',
                name: 'Reunión Nueva',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.HARD,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const existingRegistro: Registro = {
                id: 'existing-1',
                profileId: 'profile-1',
                name: 'Gimnasio',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.SOFT,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = service.detectConflicts(newRegistro, [existingRegistro]);

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts.length).toBe(1);
            expect(result.conflicts[0].type).toBe(ConflictType.OVERLAP);
            expect(result.conflicts[0].severity).toBe(ConflictSeverity.ERROR);
            expect(result.conflicts[0].overlapDuration).toBe(60);
        });

        it('debe detectar solapamiento parcial', () => {
            const newRegistro: Registro = {
                id: 'new-2',
                profileId: 'profile-1',
                name: 'Clase Virtual',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.HARD,
                startTime: new Date('2025-12-28T14:30:00'),
                endTime: new Date('2025-12-28T15:30:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const existingRegistro: Registro = {
                id: 'existing-2',
                profileId: 'profile-1',
                name: 'Reunión Trabajo',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.SOFT,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = service.detectConflicts(newRegistro, [existingRegistro]);

            expect(result.hasConflicts).toBe(true);
            expect(result.conflicts[0].overlapDuration).toBe(30); // 14:30-15:00
        });

        it('NO debe detectar conflicto si no hay solapamiento', () => {
            const newRegistro: Registro = {
                id: 'new-3',
                profileId: 'profile-1',
                name: 'Evento Mañana',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.SOFT,
                startTime: new Date('2025-12-28T08:00:00'),
                endTime: new Date('2025-12-28T09:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const existingRegistro: Registro = {
                id: 'existing-3',
                profileId: 'profile-1',
                name: 'Evento Tarde',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.SOFT,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = service.detectConflicts(newRegistro, [existingRegistro]);

            expect(result.hasConflicts).toBe(false);
            expect(result.conflicts.length).toBe(0);
        });

        it('NO debe detectar conflicto entre perfiles diferentes', () => {
            const newRegistro: Registro = {
                id: 'new-4',
                profileId: 'profile-papa',
                name: 'Trabajo Papá',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.HARD,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const existingRegistro: Registro = {
                id: 'existing-4',
                profileId: 'profile-hija',
                name: 'Colegio Hija',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.HARD,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = service.detectConflicts(newRegistro, [existingRegistro]);

            expect(result.hasConflicts).toBe(false);
        });

        it('debe generar opciones de resolución para conflicto con SOFT', () => {
            const newRegistro: Registro = {
                id: 'new-5',
                profileId: 'profile-1',
                name: 'Reunión Urgente',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.HARD,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const existingRegistro: Registro = {
                id: 'existing-5',
                profileId: 'profile-1',
                name: 'Gimnasio',
                status: RegistroStatus.CONFIRMADO,
                priority: RegistroPrioridad.SOFT,
                startTime: new Date('2025-12-28T14:00:00'),
                endTime: new Date('2025-12-28T15:00:00'),
                isAllDay: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = service.detectConflicts(newRegistro, [existingRegistro]);

            expect(result.conflicts[0].suggestions.length).toBeGreaterThan(0);
            expect(result.conflicts[0].suggestions.some(s => s.action === 'postpone_new')).toBe(true);
            expect(result.conflicts[0].suggestions.some(s => s.action === 'move_existing')).toBe(true);
        });
    });
});
