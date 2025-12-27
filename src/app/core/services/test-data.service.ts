import { Injectable, inject } from '@angular/core';
import { AgendaService } from './agenda.service';
import { RegistroStatus } from '../../models/registro.model';

@Injectable({
    providedIn: 'root'
})
export class TestDataService {
    private readonly agendaService = inject(AgendaService);

    generateTestRegistros(): void {
        const now = new Date();

        const testData = [
            // Borradores (5)
            {
                name: 'Preparar presentación trimestral',
                status: RegistroStatus.BORRADOR,
                startTime: this.addDays(now, 5),
                endTime: this.addDays(now, 7),
                notes: 'Revisar datos de ventas y crear slides'
            },
            {
                name: 'Reunión con equipo de diseño',
                status: RegistroStatus.BORRADOR,
                startTime: this.addDays(now, 3),
                endTime: this.addDays(now, 3, 2),
                notes: 'Discutir nuevas propuestas de UI'
            },
            {
                name: 'Investigar nuevas tecnologías',
                status: RegistroStatus.BORRADOR,
                startTime: this.addDays(now, 10),
                endTime: this.addDays(now, 12),
                notes: 'Angular 18, Signals avanzados'
            },
            {
                name: 'Planificar vacaciones',
                status: RegistroStatus.BORRADOR,
                startTime: this.addDays(now, 30),
                endTime: this.addDays(now, 45),
                notes: 'Buscar destinos y presupuesto'
            },
            {
                name: 'Actualizar documentación',
                status: RegistroStatus.BORRADOR,
                startTime: this.addDays(now, 1),
                endTime: this.addDays(now, 2),
                notes: 'API docs y user guides'
            },

            // Confirmados (7)
            {
                name: 'Sprint Planning - Proyecto Alpha',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 1, 9),
                endTime: this.addDays(now, 1, 11),
                notes: 'Definir tasks para próximo sprint'
            },
            {
                name: 'Dentista - Revisión semestral',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 2, 14),
                endTime: this.addDays(now, 2, 15),
                notes: 'Dr. Martínez - Clínica Central'
            },
            {
                name: 'Curso Online: TypeScript Avanzado',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 0, 19),
                endTime: this.addDays(now, 0, 21),
                notes: 'Módulo 3: Generics y Decoradores'
            },
            {
                name: 'Gimnasio - Entrenamiento personal',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 1, 18),
                endTime: this.addDays(now, 1, 19),
                notes: 'Rutina de piernas'
            },
            {
                name: 'Cena familiar - Cumpleaños mamá',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 6, 20),
                endTime: this.addDays(now, 6, '23:30' as any),
                notes: 'Restaurante La Terraza'
            },
            {
                name: 'Code Review - PR #453',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 0, 15),
                endTime: this.addDays(now, 0, 16),
                notes: 'Revisar cambios en authentication module'
            },
            {
                name: 'Workshop: Metodologías Ágiles',
                status: RegistroStatus.CONFIRMADO,
                startTime: this.addDays(now, 4, 10),
                endTime: this.addDays(now, 4, 17),
                notes: 'Scrum y Kanban - Hotel Marriott'
            },

            // En Estudio (3)
            {
                name: 'Viaje a Cartagena',
                status: RegistroStatus.ESTUDIO,
                startTime: this.addDays(now, 20),
                endTime: this.addDays(now, 25),
                notes: 'Verificar conflicto con conferencia'
            },
            {
                name: 'Conferencia Tech Summit 2025',
                status: RegistroStatus.ESTUDIO,
                startTime: this.addDays(now, 22),
                endTime: this.addDays(now, 24),
                notes: 'Posible overlap con viaje'
            },
            {
                name: 'Mantenimiento servidor',
                status: RegistroStatus.ESTUDIO,
                startTime: this.addDays(now, 2, 2),
                endTime: this.addDays(now, 2, 6),
                notes: 'Coordinarse con DevOps'
            }
        ];

        testData.forEach(data => {
            const registro = {
                id: crypto.randomUUID(),
                name: data.name,
                status: data.status,
                startTime: data.startTime,
                endTime: data.endTime,
                notes: data.notes,
                createdAt: now,
                updatedAt: now
            };

            this.agendaService.addRegistro(registro);
        });

        console.log(`✅ Generated ${testData.length} test registros`);
    }

    private addDays(date: Date, days: number, hour = 9): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);

        if (typeof hour === 'number') {
            result.setHours(hour, 0, 0, 0);
        }

        return result;
    }

    clearAllRegistros(): void {
        const registros = this.agendaService.registros();
        registros.forEach(r => this.agendaService.deleteRegistro(r.id));
        console.log('🗑️ Cleared all registros');
    }
}
