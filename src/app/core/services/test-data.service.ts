import { Injectable } from '@angular/core';
import { Registro, RegistroStatus, RegistroPrioridad } from '../../models/registro.model';

@Injectable({
    providedIn: 'root'
})
export class TestDataService {

    constructor() { }

    /**
     * Genera registros de prueba con diferentes áreas, fechas y estados
     */
    generateTestRegistros(): Registro[] {
        const registros: Registro[] = [];
        const now = new Date();

        // Área IDs (asumiendo que existen en el sistema)
        const areas = [
            { id: 'area_trabajo', name: 'Trabajo' },
            { id: 'area_familia', name: 'Familia' }
        ];

        // Contextos
        const contextos = ['registro', 'borrador'];

        // Nombres de eventos de ejemplo
        const eventNames = {
            trabajo: [
                'Reunión de equipo',
                'Presentación de proyecto',
                'Revisión de código',
                'Planificación sprint',
                'Entrevista técnica'
            ],
            familia: [
                'Cena familiar',
                'Cumpleaños',
                'Paseo al parque',
                'Visita al médico',
                'Compras del mes'
            ]
        };

        // Generar 15 registros distribuidos en diferentes días
        const testData = [
            // Hoy
            {
                name: 'Despertar',
                areaId: 'area_familia',
                startHour: 8,
                startMin: 0,
                duration: 60,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 0,
                contextoId: 'registro'
            },
            {
                name: 'Reunión de equipo',
                areaId: 'area_trabajo',
                startHour: 10,
                startMin: 0,
                duration: 90,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 0,
                contextoId: 'registro'
            },
            {
                name: 'Almuerzo',
                areaId: 'area_familia',
                startHour: 13,
                startMin: 0,
                duration: 60,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 0,
                contextoId: 'registro'
            },
            // Mañana
            {
                name: 'Presentación de proyecto',
                areaId: 'area_trabajo',
                startHour: 9,
                startMin: 30,
                duration: 120,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 1,
                contextoId: 'registro'
            },
            {
                name: 'Cena familiar',
                areaId: 'area_familia',
                startHour: 19,
                startMin: 0,
                duration: 90,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 1,
                contextoId: 'registro'
            },
            // Pasado mañana
            {
                name: 'Revisión de código',
                areaId: 'area_trabajo',
                startHour: 11,
                startMin: 0,
                duration: 60,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 2,
                contextoId: 'registro'
            },
            {
                name: 'Paseo al parque',
                areaId: 'area_familia',
                startHour: 16,
                startMin: 30,
                duration: 120,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 2,
                contextoId: 'registro'
            },
            // En 3 días
            {
                name: 'Planificación sprint',
                areaId: 'area_trabajo',
                startHour: 14,
                startMin: 0,
                duration: 90,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 3,
                contextoId: 'borrador'
            },
            // En 4 días
            {
                name: 'Entrevista técnica',
                areaId: 'area_trabajo',
                startHour: 10,
                startMin: 30,
                duration: 60,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 4,
                contextoId: 'registro'
            },
            {
                name: 'Cumpleaños',
                areaId: 'area_familia',
                startHour: 18,
                startMin: 0,
                duration: 180,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 4,
                contextoId: 'registro'
            },
            // En 5 días
            {
                name: 'Visita al médico',
                areaId: 'area_familia',
                startHour: 9,
                startMin: 0,
                duration: 45,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 5,
                contextoId: 'registro'
            },
            // En 7 días (próxima semana)
            {
                name: 'Compras del mes',
                areaId: 'area_familia',
                startHour: 11,
                startMin: 0,
                duration: 120,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 7,
                contextoId: 'borrador'
            },
            // En 10 días
            {
                name: 'Revisión trimestral',
                areaId: 'area_trabajo',
                startHour: 15,
                startMin: 0,
                duration: 90,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 10,
                contextoId: 'registro'
            },
            // En 14 días
            {
                name: 'Reunión con cliente',
                areaId: 'area_trabajo',
                startHour: 10,
                startMin: 0,
                duration: 120,
                status: RegistroStatus.CONFIRMADO,
                dayOffset: 14,
                contextoId: 'registro'
            },
            // En 20 días
            {
                name: 'Evento familiar',
                areaId: 'area_familia',
                startHour: 17,
                startMin: 0,
                duration: 240,
                status: 'pendiente' as RegistroStatus,
                dayOffset: 20,
                contextoId: 'borrador'
            }
        ];

        testData.forEach((data, index) => {
            const startDate = new Date(now);
            startDate.setDate(startDate.getDate() + data.dayOffset);
            startDate.setHours(data.startHour, data.startMin, 0, 0);

            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + data.duration);

            const registro: Registro = {
                id: `test-registro-${index + 1}`,
                profileId: 'default-profile',
                name: data.name,
                startTime: startDate,
                endTime: endDate,
                duration: data.duration,
                status: data.status,
                priority: 'medium' as RegistroPrioridad,
                isAllDay: false,
                areaId: data.areaId,
                contextoId: data.contextoId,
                notes: `Registro de prueba generado automáticamente para ${data.name}`,
                createdAt: now,
                updatedAt: now
            };

            registros.push(registro);
        });

        return registros;
    }

    /**
     * Limpia todos los registros de prueba
     */
    clearTestRegistros(allRegistros: Registro[]): Registro[] {
        return allRegistros.filter(r => !r.id.startsWith('test-registro-'));
    }
}
