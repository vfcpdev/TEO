import { Injectable, inject } from '@angular/core';
import { Registro } from '../../models/registro.model';
import { AgendaService } from './agenda.service';

@Injectable({
    providedIn: 'root'
})
export class IcsExportService {
    private readonly agendaService = inject(AgendaService);

    /**
     * Export registros to ICS (iCalendar) format
     */
    exportToIcs(registros: Registro[], filename: string = 'agenda.ics'): void {
        const icsContent = this.generateIcsContent(registros);
        this.downloadFile(icsContent, filename, 'text/calendar');
    }

    /**
     * Generate ICS file content
     */
    private generateIcsContent(registros: Registro[]): string {
        const lines: string[] = [];

        // Calendar header
        lines.push('BEGIN:VCALENDAR');
        lines.push('VERSION:2.0');
        lines.push('PRODID:-//TEO Agenda//ES');
        lines.push('CALSCALE:GREGORIAN');
        lines.push('METHOD:PUBLISH');
        lines.push('X-WR-CALNAME:TEO Agenda');
        lines.push('X-WR-TIMEZONE:America/Bogota');

        // Add events
        registros.forEach(registro => {
            if (registro.startTime) {
                lines.push(...this.generateEventLines(registro));
            }
        });

        // Calendar footer
        lines.push('END:VCALENDAR');

        return lines.join('\r\n');
    }

    /**
     * Generate ICS lines for a single event
     */
    private generateEventLines(registro: Registro): string[] {
        const lines: string[] = [];
        const area = this.agendaService.areas().find(a => a.id === registro.areaId);
        const tipo = this.agendaService.tipos().find(t => t.id === registro.tipoId);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${registro.id}@teo-agenda`);
        lines.push(`DTSTAMP:${this.formatIcsDate(new Date())}`);
        lines.push(`DTSTART:${this.formatIcsDate(registro.startTime!)}`);

        if (registro.endTime) {
            lines.push(`DTEND:${this.formatIcsDate(registro.endTime)}`);
        } else if (registro.duration) {
            const endTime = new Date(registro.startTime!);
            endTime.setMinutes(endTime.getMinutes() + registro.duration);
            lines.push(`DTEND:${this.formatIcsDate(endTime)}`);
        }

        lines.push(`SUMMARY:${this.escapeIcsText(registro.name)}`);

        if (registro.notes) {
            lines.push(`DESCRIPTION:${this.escapeIcsText(registro.notes)}`);
        }

        if (area) {
            lines.push(`CATEGORIES:${this.escapeIcsText(area.name)}`);
        }

        if (tipo) {
            lines.push(`X-TIPO:${this.escapeIcsText(tipo.name)}`);
        }

        // Status
        if (registro.status === 'confirmado') {
            lines.push('STATUS:CONFIRMED');
        } else if (registro.status === 'borrador') {
            lines.push('STATUS:TENTATIVE');
        }

        // Priority (1=high, 5=medium, 9=low in ICS)
        if (registro.priority === 'hard') {
            lines.push('PRIORITY:1');
        } else if (registro.priority === 'soft') {
            lines.push('PRIORITY:9');
        }

        lines.push('END:VEVENT');

        return lines;
    }

    /**
     * Format date to ICS format (YYYYMMDDTHHMMSSZ)
     */
    private formatIcsDate(date: Date): string {
        const pad = (n: number) => n.toString().padStart(2, '0');

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    }

    /**
     * Escape special characters for ICS format
     */
    private escapeIcsText(text: string): string {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }

    /**
     * Trigger file download
     */
    private downloadFile(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}
