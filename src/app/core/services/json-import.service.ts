import { Injectable, inject } from '@angular/core';
import { AgendaService } from './agenda.service';
import { ToastService } from './toast.service';
import { JsonExportData } from './json-export.service';

export type ImportStrategy = 'replace' | 'merge';

export interface ImportResult {
    success: boolean;
    message: string;
    imported: {
        registros: number;
        areas: number;
        contextos: number;
        tipos: number;
    };
    errors: string[];
}

@Injectable({
    providedIn: 'root'
})
export class JsonImportService {
    private readonly agendaService = inject(AgendaService);
    private readonly toastService = inject(ToastService);

    /**
     * Import JSON file
     */
    async importFromJson(file: File, strategy: ImportStrategy = 'merge'): Promise<ImportResult> {
        try {
            const content = await this.readFile(file);
            const data: JsonExportData = JSON.parse(content);

            // Validate data
            const validationErrors = this.validateData(data);
            if (validationErrors.length > 0) {
                return {
                    success: false,
                    message: 'Errores de validación',
                    imported: { registros: 0, areas: 0, contextos: 0, tipos: 0 },
                    errors: validationErrors
                };
            }

            // Import based on strategy
            if (strategy === 'replace') {
                return await this.replaceImport(data);
            } else {
                return await this.mergeImport(data);
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error al leer el archivo',
                imported: { registros: 0, areas: 0, contextos: 0, tipos: 0 },
                errors: [error instanceof Error ? error.message : 'Error desconocido']
            };
        }
    }

    /**
     * Replace all data with imported data
     */
    private async replaceImport(data: JsonExportData): Promise<ImportResult> {
        try {
            // Clear existing data
            // Note: This would need implementation in AgendaService
            // For now, we'll just add the new data

            let registrosCount = 0;
            let areasCount = 0;
            let contextosCount = 0;
            let tiposCount = 0;

            // Import areas
            if (data.areas) {
                for (const area of data.areas) {
                    await this.agendaService.addArea(area);
                    areasCount++;
                }
            }

            // Import contextos
            if (data.contextos) {
                for (const contexto of data.contextos) {
                    await this.agendaService.addContexto(contexto);
                    contextosCount++;
                }
            }

            // Import tipos
            if (data.tipos) {
                for (const tipo of data.tipos) {
                    await this.agendaService.addTipo(tipo);
                    tiposCount++;
                }
            }

            // Import registros
            if (data.registros) {
                for (const registro of data.registros) {
                    await this.agendaService.addRegistro(registro);
                    registrosCount++;
                }
            }

            return {
                success: true,
                message: 'Datos importados correctamente',
                imported: {
                    registros: registrosCount,
                    areas: areasCount,
                    contextos: contextosCount,
                    tipos: tiposCount
                },
                errors: []
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error durante la importación',
                imported: { registros: 0, areas: 0, contextos: 0, tipos: 0 },
                errors: [error instanceof Error ? error.message : 'Error desconocido']
            };
        }
    }

    /**
     * Merge imported data with existing data
     */
    private async mergeImport(data: JsonExportData): Promise<ImportResult> {
        const errors: string[] = [];
        let registrosCount = 0;
        let areasCount = 0;
        let contextosCount = 0;
        let tiposCount = 0;

        try {
            // Merge areas (skip duplicates by ID)
            if (data.areas) {
                for (const area of data.areas) {
                    const exists = this.agendaService.areas().find(a => a.id === area.id);
                    if (!exists) {
                        await this.agendaService.addArea(area);
                        areasCount++;
                    }
                }
            }

            // Merge contextos
            if (data.contextos) {
                for (const contexto of data.contextos) {
                    const exists = this.agendaService.contextos().find(c => c.id === contexto.id);
                    if (!exists) {
                        await this.agendaService.addContexto(contexto);
                        contextosCount++;
                    }
                }
            }

            // Merge tipos
            if (data.tipos) {
                for (const tipo of data.tipos) {
                    const exists = this.agendaService.tipos().find(t => t.id === tipo.id);
                    if (!exists) {
                        await this.agendaService.addTipo(tipo);
                        tiposCount++;
                    }
                }
            }

            // Merge registros
            if (data.registros) {
                for (const registro of data.registros) {
                    const exists = this.agendaService.registros().find(r => r.id === registro.id);
                    if (!exists) {
                        await this.agendaService.addRegistro(registro);
                        registrosCount++;
                    } else {
                        errors.push(`Registro duplicado: ${registro.name} (${registro.id})`);
                    }
                }
            }

            return {
                success: true,
                message: `Importados: ${registrosCount} registros, ${areasCount} áreas, ${contextosCount} contextos, ${tiposCount} tipos`,
                imported: {
                    registros: registrosCount,
                    areas: areasCount,
                    contextos: contextosCount,
                    tipos: tiposCount
                },
                errors
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error durante la importación',
                imported: { registros: registrosCount, areas: areasCount, contextos: contextosCount, tipos: tiposCount },
                errors: [...errors, error instanceof Error ? error.message : 'Error desconocido']
            };
        }
    }

    /**
     * Validate imported data structure
     */
    private validateData(data: any): string[] {
        const errors: string[] = [];

        if (!data.version) {
            errors.push('Falta el campo version');
        }

        if (!data.exportDate) {
            errors.push('Falta el campo exportDate');
        }

        if (!Array.isArray(data.registros)) {
            errors.push('El campo registros debe ser un array');
        }

        // Validate registros structure
        if (data.registros) {
            data.registros.forEach((reg: any, index: number) => {
                if (!reg.id) errors.push(`Registro ${index}: falta ID`);
                if (!reg.name) errors.push(`Registro ${index}: falta nombre`);
                if (!reg.profileId) errors.push(`Registro ${index}: falta profileId`);
            });
        }

        return errors;
    }

    /**
     * Read file content
     */
    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }
}
