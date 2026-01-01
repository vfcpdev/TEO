import { Injectable, inject, computed, signal } from '@angular/core';
import { AgendaService } from './agenda.service';
import { Registro, RegistroStatus } from '../../models/registro.model';

export interface AreaMetric {
    areaId: string;
    areaName: string; // resolved later or passed in
    totalMinutes: number;
    percentage: number;
    color?: string;
}

export interface ProductivitySummary {
    completedCount: number;
    totalCount: number;
    completionRate: number;
    totalHours: number;
    mostActiveAreaId: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private agendaService = inject(AgendaService);

    /**
     * Calculates time distribution by area for a given set of records.
     * Useful for charts.
     */
    getAreaDistribution(registros: Registro[]): Record<string, number> {
        const distribution: Record<string, number> = {};

        registros.forEach(r => {
            if (!r.areaId) return; // Ignore records without area

            let duration = 0;
            if (r.startTime && r.endTime) {
                duration = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
            } else if (r.duration) {
                duration = r.duration;
            }

            if (duration > 0) {
                distribution[r.areaId] = (distribution[r.areaId] || 0) + duration;
            }
        });

        return distribution;
    }

    /**
     * Get summary statistics for a specific period
     */
    getSummary(registros: Registro[]): ProductivitySummary {
        const totalCount = registros.length;
        const completedCount = registros.filter(r => r.status === RegistroStatus.CONFIRMADO).length;

        let totalMinutes = 0;
        const areaCounts: Record<string, number> = {};

        registros.forEach(r => {
            let duration = 0;
            if (r.startTime && r.endTime) {
                duration = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
            }
            totalMinutes += duration;

            if (r.areaId) {
                areaCounts[r.areaId] = (areaCounts[r.areaId] || 0) + 1;
            }
        });

        // Find most active area
        let mostActiveAreaId = null;
        let maxCount = 0;
        for (const [areaId, count] of Object.entries(areaCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostActiveAreaId = areaId;
            }
        }

        return {
            completedCount,
            totalCount,
            completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
            totalHours: Math.round(totalMinutes / 60 * 10) / 10,
            mostActiveAreaId
        };
    }

    /**
     * Helper to filter records by date range
     */
    filterByRange(registros: Registro[], start: Date, end: Date): Registro[] {
        return registros.filter(r => {
            if (!r.startTime) return false;
            const date = new Date(r.startTime);
            return date >= start && date <= end;
        });
    }

    /**
     * Calculate productivity trend over time
     */
    getTrend(registros: Registro[], start: Date, end: Date, granularity: 'day' | 'week' | 'month'): { date: string, value: number }[] {
        const trendMap = new Map<string, number>();
        const filtered = this.filterByRange(registros, start, end);

        // Initialize map with all intervals (optional, but good for zero-filling)
        // For now, simpler implementation: just group existing data

        filtered.forEach(r => {
            if (r.status !== RegistroStatus.CONFIRMADO || !r.startTime) return;

            const date = new Date(r.startTime);
            let key = '';

            if (granularity === 'day') {
                key = date.toISOString().split('T')[0];
            } else if (granularity === 'month') {
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            } else {
                // Week: rough approximation or ISO week
                const d = new Date(date.getTime());
                d.setHours(0, 0, 0, 0);
                d.setDate(d.getDate() + 4 - (d.getDay() || 7));
                const yearStart = new Date(d.getFullYear(), 0, 1);
                const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
                key = `${d.getFullYear()}-W${weekNo}`;
            }

            const duration = r.duration || (r.endTime ? (new Date(r.endTime).getTime() - r.startTime.getTime()) / 60000 : 0);
            trendMap.set(key, (trendMap.get(key) || 0) + duration);
        });

        // Convert to array and sort
        return Array.from(trendMap.entries())
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}
