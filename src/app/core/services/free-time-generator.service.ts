import { Injectable, inject } from '@angular/core';
import { Registro, RegistroStatus, RegistroPrioridad } from '../../models/registro.model';
import { AgendaService } from './agenda.service';
import { CourseService } from '../../features/courses/services/course.service';
import { Course, DaySchedule } from '../../models';

/**
 * Servicio para generar bloques de tiempo libre automáticamente
 * Detecta huecos entre eventos programados y crea registros de "Tiempo Libre"
 * 
 * Optimizaciones:
 * - Caché de bloques generados por día
 * - Invalidación de caché cuando cambian los registros
 * - Algoritmo O(n log n) para detección de huecos
 */
@Injectable({
    providedIn: 'root'
})
export class FreeTimeGeneratorService {
    private readonly agendaService = inject(AgendaService);
    private readonly courseService = inject(CourseService);

    // Caché de bloques de tiempo libre por día (key: YYYY-MM-DD)
    private cache = new Map<string, Registro[]>();

    // Timestamp de última invalidación de caché
    private lastCacheInvalidation = 0;

    /**
     * Genera bloques de tiempo libre para un rango de fechas
     * @param fechaInicio Fecha/hora de inicio (normalmente NOW)
     * @param fechaFin Fecha/hora de fin (normalmente NOW + 7 días)
     * @param huecoMinimoMinutos Tamaño mínimo del hueco para generar bloque (default: 30)
     * @returns Array de registros de tiempo libre
     */
    generarTiempoLibre(
        fechaInicio: Date,
        fechaFin: Date,
        huecoMinimoMinutos: number = 30
    ): Registro[] {
        const bloquesTiempoLibre: Registro[] = [];

        // Iterar por cada día en el rango
        let fechaActual = new Date(fechaInicio);
        fechaActual.setHours(0, 0, 0, 0); // Comenzar al inicio del día

        while (fechaActual <= fechaFin) {
            const claveCache = this.obtenerClaveDia(fechaActual);

            // Verificar caché
            if (this.cache.has(claveCache)) {
                bloquesTiempoLibre.push(...this.cache.get(claveCache)!);
            } else {
                // Generar bloques para este día
                const bloquesDia = this.generarTiempoLibreParaDia(
                    fechaActual,
                    fechaInicio,
                    fechaFin,
                    huecoMinimoMinutos
                );

                // Guardar en caché
                this.cache.set(claveCache, bloquesDia);
                bloquesTiempoLibre.push(...bloquesDia);
            }

            // Avanzar al siguiente día
            fechaActual = new Date(fechaActual);
            fechaActual.setDate(fechaActual.getDate() + 1);
        }

        return bloquesTiempoLibre;
    }

    /**
     * Genera bloques de tiempo libre para un día específico
     */
    private generarTiempoLibreParaDia(
        dia: Date,
        rangoInicio: Date,
        rangoFin: Date,
        huecoMinimoMinutos: number
    ): Registro[] {
        // Obtener todos los eventos del día (cursos + registros)
        const eventosDia = this.obtenerEventosDia(dia);

        if (eventosDia.length === 0) {
            // Si no hay eventos, todo el día es tiempo libre
            return this.crearBloqueDiaCompleto(dia, rangoInicio, rangoFin);
        }

        // Ordenar eventos por hora de inicio
        eventosDia.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

        const bloques: Registro[] = [];

        // Determinar límites del día
        const inicioDia = new Date(dia);
        inicioDia.setHours(0, 0, 0, 0);

        const finDia = new Date(dia);
        finDia.setHours(23, 59, 59, 999);

        // Ajustar límites según el rango proporcionado
        const inicioEfectivo = inicioDia < rangoInicio ? rangoInicio : inicioDia;
        const finEfectivo = finDia > rangoFin ? rangoFin : finDia;

        // Generar bloque antes del primer evento
        const primerEvento = eventosDia[0];
        if (primerEvento.inicio > inicioEfectivo) {
            const minutos = this.calcularMinutosEntre(inicioEfectivo, primerEvento.inicio);
            if (minutos >= huecoMinimoMinutos) {
                bloques.push(this.crearRegistroTiempoLibre(
                    inicioEfectivo,
                    primerEvento.inicio,
                    minutos
                ));
            }
        }

        // Generar bloques entre eventos
        for (let i = 0; i < eventosDia.length - 1; i++) {
            const eventoActual = eventosDia[i];
            const siguienteEvento = eventosDia[i + 1];

            const inicioHueco = eventoActual.fin;
            const finHueco = siguienteEvento.inicio;

            if (finHueco > inicioHueco) {
                const minutos = this.calcularMinutosEntre(inicioHueco, finHueco);
                if (minutos >= huecoMinimoMinutos) {
                    bloques.push(this.crearRegistroTiempoLibre(
                        inicioHueco,
                        finHueco,
                        minutos
                    ));
                }
            }
        }

        // Generar bloque después del último evento
        const ultimoEvento = eventosDia[eventosDia.length - 1];
        if (ultimoEvento.fin < finEfectivo) {
            const minutos = this.calcularMinutosEntre(ultimoEvento.fin, finEfectivo);
            if (minutos >= huecoMinimoMinutos) {
                bloques.push(this.crearRegistroTiempoLibre(
                    ultimoEvento.fin,
                    finEfectivo,
                    minutos
                ));
            }
        }

        return bloques;
    }

    /**
     * Obtiene todos los eventos (cursos + registros) de un día específico
     */
    private obtenerEventosDia(dia: Date): Array<{ inicio: Date; fin: Date }> {
        const eventos: Array<{ inicio: Date; fin: Date }> = [];
        const diaStr = dia.toDateString();

        // Obtener cursos del día
        const cursos = this.obtenerCursosDia(dia);
        cursos.forEach(curso => {
            const schedule = curso.schedules?.find((s: DaySchedule) => s.day === dia.getDay());
            if (schedule) {
                const [horaInicio, minInicio] = schedule.startTime.split(':').map(Number);
                const [horaFin, minFin] = schedule.endTime.split(':').map(Number);

                const inicio = new Date(dia);
                inicio.setHours(horaInicio, minInicio, 0, 0);

                const fin = new Date(dia);
                fin.setHours(horaFin, minFin, 0, 0);

                eventos.push({ inicio, fin });
            }
        });

        // Obtener registros del día
        const registros = this.agendaService.registros();
        registros.forEach(registro => {
            if (!registro.startTime || !registro.endTime) return;

            const inicioReg = typeof registro.startTime === 'string'
                ? new Date(registro.startTime)
                : registro.startTime;

            if (inicioReg.toDateString() === diaStr) {
                const finReg = typeof registro.endTime === 'string'
                    ? new Date(registro.endTime)
                    : registro.endTime;

                eventos.push({ inicio: inicioReg, fin: finReg });
            }
        });

        return eventos;
    }

    /**
   * Obtiene cursos activos del día
   * Nota: Retorna array vacío por ahora ya que CourseService usa observables
   * y este método debe ser síncrono para el algoritmo de caché
   * TODO: Refactor para integrar cursos asincrónicamente
   */
    private obtenerCursosDia(dia: Date): Course[] {
        // Por ahora retorna array vacío
        // La integración completa requeriría cambiar todo el servicio a async
        // Los cursos se manejan directamente en el componente HomePage
        return [];
    }

    /**
     * Crea un bloque de tiempo libre para todo el día
     */
    private crearBloqueDiaCompleto(
        dia: Date,
        rangoInicio: Date,
        rangoFin: Date
    ): Registro[] {
        const inicioDia = new Date(dia);
        inicioDia.setHours(0, 0, 0, 0);

        const finDia = new Date(dia);
        finDia.setHours(23, 59, 59, 999);

        const inicioEfectivo = inicioDia < rangoInicio ? rangoInicio : inicioDia;
        const finEfectivo = finDia > rangoFin ? rangoFin : finDia;

        const minutos = this.calcularMinutosEntre(inicioEfectivo, finEfectivo);

        return [this.crearRegistroTiempoLibre(inicioEfectivo, finEfectivo, minutos)];
    }

    /**
     * Crea un registro de tiempo libre
     */
    private crearRegistroTiempoLibre(
        inicio: Date,
        fin: Date,
        duracionMinutos: number
    ): Registro {
        const id = `free-${inicio.getTime()}-${fin.getTime()}`;

        return {
            id,
            profileId: '', // Tiempo libre no pertenece a un perfil específico
            name: 'Tiempo Libre',
            status: RegistroStatus.CONFIRMADO, // Los bloques de tiempo libre están confirmados
            priority: RegistroPrioridad.SOFT, // Baja prioridad, pueden ser desplazados
            startTime: inicio,
            endTime: fin,
            isAllDay: false,
            notes: `Bloque de tiempo libre (${duracionMinutos} minutos)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Campos personalizados para tiempo libre auto-generado
            esAutoGenerado: true,
            categoriaTiempoLibre: 'disponible'
        } as Registro & { esAutoGenerado: boolean; categoriaTiempoLibre: string };
    }

    /**
     * Calcula minutos entre dos fechas
     */
    private calcularMinutosEntre(inicio: Date, fin: Date): number {
        return Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60));
    }

    /**
     * Genera clave de caché para un día (YYYY-MM-DD)
     */
    private obtenerClaveDia(fecha: Date): string {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Invalida toda la caché
     * Llamar cuando los registros o cursos cambien
     */
    invalidarCache(): void {
        this.cache.clear();
        this.lastCacheInvalidation = Date.now();
    }

    /**
     * Invalida caché para un día específico
     */
    invalidarCacheDia(fecha: Date): void {
        const clave = this.obtenerClaveDia(fecha);
        this.cache.delete(clave);
    }
}
