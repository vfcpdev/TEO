import { Injectable, inject } from '@angular/core';
import { Registro } from '../../models/registro.model';
import { AgendaService } from './agenda.service';

export interface JsonExportData {
    version: string;
    exportDate: string;
    registros: Registro[];
    areas: any[];
    contextos: any[];
    tipos: any[];
}

@Injectable({
    providedIn: 'root'
})
export class JsonExportService {
    private readonly agendaService = inject(AgendaService);
    private readonly VERSION = '1.0.0';

    /**
     * Export all agenda data to JSON
     */
    exportToJson(filename: string = 'agenda-backup.json'): void {
        const data: JsonExportData = {
            version: this.VERSION,
            exportDate: new Date().toISOString(),
            registros: this.agendaService.registros(),
            areas: this.agendaService.areas(),
            contextos: this.agendaService.contextos(),
            tipos: this.agendaService.tipos()
        };

        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    /**
     * Export only registros to JSON
     */
    exportRegistrosToJson(registros: Registro[], filename: string = 'registros.json'): void {
        const data = {
            version: this.VERSION,
            exportDate: new Date().toISOString(),
            registros
        };

        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
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
