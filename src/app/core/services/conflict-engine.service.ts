import { Injectable, inject } from '@angular/core';
import { Registro } from '../../models/registro.model';
import {
    Conflict,
    ConflictType,
    ConflictSeverity,
    ResolutionOption,
    ConflictDetectionResult,
    CascadeImpact
} from '../../models/conflict.model';
import { ErrorLoggerService } from './error-logger.service';

/**
 * Servicio para detectar y gestionar conflictos de agenda.
 * 
 * FASE 1.1 (Micro-fase): Implementación básica de detección de solapamientos.
 * TODO FASE 1.3: Agregar detección de buffers
 * TODO FASE 1.4: Agregar inviabilidad geográfica
 * TODO FASE 2: Agregar dependencias
 */
@Injectable({
    providedIn: 'root'
})
export class ConflictEngineService {
    private readonly errorLogger = inject(ErrorLoggerService);

    /**
     * Detecta conflictos de un nuevo registro contra registros existentes.
     * 
     * @param newRegistro - Registro a validar
     * @param existingRegistros - Registros ya guardados en la agenda
     * @returns Resultado con conflictos detectados
     */
    detectConflicts(
        newRegistro: Registro,
        existingRegistros: Registro[]
    ): ConflictDetectionResult {
        const conflicts: Conflict[] = [];

        // Filtrar registros del mismo perfil y que tengan tiempos definidos
        const relevantRegistros = existingRegistros.filter(r =>
            r.profileId === newRegistro.profileId &&
            r.startTime &&
            r.endTime &&
            r.id !== newRegistro.id // Excluir el mismo registro si está editando
        );

        // FASE 1.1: Solo detectar overlaps directos
        for (const existing of relevantRegistros) {
            const overlapConflict = this.detectOverlap(newRegistro, existing);
            if (overlapConflict) {
                conflicts.push(overlapConflict);
            }
        }

        return {
            hasConflicts: conflicts.length > 0,
            conflicts,
            canProceed: conflicts.every(c => c.severity === ConflictSeverity.WARNING)
        };
    }

    /**
     * Detecta solapamiento directo entre dos registros.
     * 
     * Lógica: Dos eventos se solapan si:
     * - start1 < end2 AND start2 < end1
     * 
     * @param r1 - Primer registro
     * @param r2 - Segundo registro
     * @returns Conflicto si hay solapamiento, null si no
     */
    private detectOverlap(r1: Registro, r2: Registro): Conflict | null {
        // Validar que ambos tengan tiempos
        if (!r1.startTime || !r1.endTime || !r2.startTime || !r2.endTime) {
            return null;
        }

        const start1 = this.toDate(r1.startTime);
        const end1 = this.toDate(r1.endTime);
        const start2 = this.toDate(r2.startTime);
        const end2 = this.toDate(r2.endTime);

        // Verificar solapamiento
        const hasOverlap = start1 < end2 && start2 < end1;

        if (!hasOverlap) {
            return null;
        }

        // Calcular duración del solapamiento
        const overlapStart = start1 > start2 ? start1 : start2;
        const overlapEnd = end1 < end2 ? end1 : end2;
        const overlapDuration = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

        // Generar opciones de resolución
        const suggestions = this.generateResolutionOptions(r1, r2, overlapDuration);

        // Determinar severidad (por ahora siempre ERROR)
        const severity = ConflictSeverity.ERROR;

        return {
            id: `conflict_${r1.id}_${r2.id}`,
            type: ConflictType.OVERLAP,
            severity,
            registros: [r1, r2],
            overlapDuration,
            timeRange: {
                start: overlapStart,
                end: overlapEnd
            },
            message: `"${r1.name}" se solapa con "${r2.name}" por ${overlapDuration} minutos`,
            suggestions,
            detectedAt: new Date()
        };
    }

    /**
     * Genera opciones de resolución para un conflicto de solapamiento.
     */
    private generateResolutionOptions(
        r1: Registro,
        r2: Registro,
        overlapMinutes: number
    ): ResolutionOption[] {
        const options: ResolutionOption[] = [];

        // Opción 1: Aplazar el nuevo (r1)
        options.push({
            id: 'postpone_new',
            label: 'Aplazar Nuevo',
            description: `Guardar "${r1.name}" en estado "En Estudio" para planificar después`,
            action: 'postpone_new',
            impact: 'El nuevo registro no ocupará el espacio hasta que se resuelva'
        });

        // Opción 2: Mover el existente (r2) - solo si es SOFT
        if (r2.priority === 'soft') {
            options.push({
                id: 'move_existing',
                label: 'Mover Existente',
                description: `Desplazar "${r2.name}" a otro horario`,
                action: 'move_existing',
                impact: `"${r2.name}" será re-programado automáticamente`
            });
        }

        // Opción 3: Marcar ambos en estudio
        options.push({
            id: 'mark_study',
            label: 'Marcar En Estudio',
            description: 'Dejar ambos registros en estado "En Estudio" para revisión manual',
            action: 'mark_study',
            impact: 'Ambos eventos quedarán pendientes de confirmación'
        });

        return options;
    }

    /**
     * Aplica cambios en cascada cuando se modifica un registro.
     * 
     * TODO FASE 2: Implementar lógica de dependencias y cascada completa
     * Por ahora retorna impacto vacío.
     */
    applyCascadeChanges(registro: Registro): CascadeImpact {
        this.errorLogger.logInfo('ConflictEngine', 'applyCascadeChanges not implemented yet');
        return {
            sourceRegistro: registro,
            affectedRegistros: [],
            newConflicts: [],
            resolvedConflicts: [],
            summary: 'No hay dependencias configuradas'
        };
    }

    /**
     * Convierte Date | string a Date
     */
    private toDate(value: Date | string): Date {
        return typeof value === 'string' ? new Date(value) : value;
    }
}
