import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IcsExportService } from '../../../../core/services/ics-export.service';
import { IcsImportService } from '../../../../core/services/ics-import.service';
import { JsonExportService } from '../../../../core/services/json-export.service';
import { JsonImportService, ImportStrategy } from '../../../../core/services/json-import.service';
import { AgendaService } from '../../../../core/services/agenda.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AlertController } from '@ionic/angular/standalone';
import { TestDataService } from '../../../../core/services/test-data.service';

@Component({
  selector: 'app-export-import',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <div class="export-import-container">
      <h3>Exportar / Importar Datos</h3>
      
      <div class="flex-layout">
        <!-- Export Section -->
        <div class="section flex-item">
            <h4>
            <ion-icon name="download-outline"></ion-icon>
            Exportar
            </h4>
            
            <div class="export-options">
            <ion-button expand="block" fill="outline" (click)="exportToIcs()">
                <ion-icon name="calendar-outline" slot="start"></ion-icon>
                Exportar a ICS
            </ion-button>
            
            <ion-button expand="block" fill="outline" (click)="exportToJson()">
                <ion-icon name="document-text-outline" slot="start"></ion-icon>
                Exportar a JSON
            </ion-button>
            </div>
            
            <p class="section-description">
            <strong>ICS:</strong> Calendarios externos (Google, Outlook).<br>
            <strong>JSON:</strong> Backup completo del sistema.
            </p>
        </div>
        
        <!-- Import Section -->
        <div class="section flex-item">
            <h4>
            <ion-icon name="cloud-upload-outline"></ion-icon>
            Importar
            </h4>
            
            <div class="import-options">
            <input 
                type="file" 
                #fileInput 
                accept=".json" 
                (change)="onFileSelected($event)"
                style="display: none">
            
            <input 
                type="file" 
                #icsInput 
                accept=".ics,.ifb,.ical" 
                (change)="onIcsSelected($event)"
                style="display: none">

            <ion-button expand="block" fill="outline" (click)="fileInput.click()">
                <ion-icon name="folder-open-outline" slot="start"></ion-icon>
                Importar JSON (Backup)
            </ion-button>
            
            <ion-button expand="block" fill="outline" (click)="icsInput.click()">
                <ion-icon name="calendar-number-outline" slot="start"></ion-icon>
                Importar ICS (Calendario)
            </ion-button>
            
            @if (selectedFile()) {
                <div class="file-info">
                <ion-icon name="document"></ion-icon>
                <span class="text-truncate">{{ selectedFile()?.name }}</span>
                <ion-button fill="clear" size="small" (click)="clearFile()">
                    <ion-icon name="close" slot="icon-only"></ion-icon>
                </ion-button>
                </div>
                
                <div class="import-strategy">
                <ion-segment [(ngModel)]="importStrategy" mode="ios">
                    <ion-segment-button value="merge">
                    <ion-label>Combinar</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="replace">
                    <ion-label>Reemplazar</ion-label>
                    </ion-segment-button>
                </ion-segment>
                </div>
                
                <ion-button 
                expand="block" 
                color="primary" 
                (click)="importData()"
                [disabled]="importing()">
                @if (importing()) {
                    <ion-spinner name="crescent" slot="start"></ion-spinner>
                    Importando...
                } @else {
                    <ion-icon name="cloud-upload" slot="start"></ion-icon>
                    Importar Datos
                }
                </ion-button>
            } @else {
                <div class="empty-file-placeholder">
                    <ion-icon name="document-outline"></ion-icon>
                    <p>Selecciona un archivo .json de respaldo para restaurar tus datos.</p>
                </div>
            }
            </div>
        </div>

        <!-- Test Data Section -->
        <div class="section flex-item">
            <h4>
            <ion-icon name="flask-outline"></ion-icon>
            Datos de Prueba
            </h4>
            
            <div class="test-data-options">
            <ion-button expand="block" fill="outline" color="tertiary" (click)="generateTestData()">
                <ion-icon name="add-circle-outline" slot="start"></ion-icon>
                Generar Datos de Prueba
            </ion-button>
            
            <ion-button expand="block" fill="outline" color="danger" (click)="clearTestData()">
                <ion-icon name="trash-outline" slot="start"></ion-icon>
                Limpiar Datos de Prueba
            </ion-button>
            </div>
            
            <p class="section-description">
            <strong>Generar:</strong> Crea 15 registros de ejemplo en diferentes fechas y áreas.<br>
            <strong>Limpiar:</strong> Identifica registros de prueba en el sistema.
            </p>
        </div>
      </div>
      
      <!-- Stats Section -->
      <div class="section stats-section">
        <h4>
          <ion-icon name="stats-chart-outline"></ion-icon>
          Estadísticas
        </h4>
        
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ agendaService.registros().length }}</span>
            <span class="stat-label">Registros</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agendaService.areas().length }}</span>
            <span class="stat-label">Áreas</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agendaService.contextos().length }}</span>
            <span class="stat-label">Contextos</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agendaService.tipos().length }}</span>
            <span class="stat-label">Tipos</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .export-import-container {
      padding: var(--spacing-lg);
      padding: var(--spacing-lg);
      max-width: 1000px;
      margin: 0 auto;
      
      h3 {
        margin: 0 0 var(--spacing-xl) 0;
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-bold);
        color: var(--ion-text-color);
      }
    }

    .flex-layout {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-2xl);
    }
    
    .section {
      margin-bottom: 0;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-lg);
      background: var(--ion-background-color);
      border-radius: var(--radius-lg);
      border: 1px solid var(--ion-border-color);
      
      &.flex-item {
          flex: 1;
          min-width: 300px;
      }
      
      h4 {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin: 0 0 var(--spacing-lg) 0;
        font-size: var(--font-size-h4);
        font-weight: var(--font-weight-semibold);
        color: var(--ion-text-color);
        
        ion-icon {
          font-size: 1.5rem;
          color: var(--ion-color-primary);
        }
      }
    }
    
    .section-description {
      margin-top: var(--spacing-md);
      font-size: var(--font-size-small);
      color: var(--ion-color-medium);
      line-height: 1.6;
      
      strong {
        color: var(--ion-text-color);
        font-weight: var(--font-weight-semibold);
      }
    }
    
    .export-options,
    .import-options {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }
    
    .file-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--ion-color-step-50);
      border-radius: var(--radius-md);
      border: 1px solid var(--ion-border-color);
      
      ion-icon {
        font-size: 1.5rem;
        color: var(--ion-color-primary);
      }
      
      span {
        flex: 1;
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-medium);
      }
      
      .text-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
      }
    }
    
    .empty-file-placeholder {
        text-align: center;
        padding: var(--spacing-lg);
        background: var(--ion-color-step-50);
        border-radius: var(--radius-md);
        border: 1px dashed var(--ion-color-medium);
        
        ion-icon {
            font-size: 2rem;
            color: var(--ion-color-medium);
            margin-bottom: var(--spacing-xs);
        }
        
        p {
            margin: 0;
            font-size: var(--font-size-small);
            color: var(--ion-color-medium);
        }
    }
    
    .import-strategy {
      margin-top: var(--spacing-md);
      
      ion-label {
        display: block;
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-semibold);
        color: var(--ion-text-color);
      }
      
      ion-segment {
        margin-bottom: var(--spacing-sm);
      }
    }
    
    .strategy-description {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin: var(--spacing-sm) 0 0 0;
      padding: var(--spacing-sm);
      font-size: var(--font-size-xs);
      color: var(--ion-color-medium);
      background: var(--ion-color-step-50);
      border-radius: var(--radius-sm);
      
      ion-icon {
        font-size: 1rem;
        flex-shrink: 0;
      }
    }
    
    .stats-section {
      background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-secondary-tint));
      border: none;
      
      h4 {
        color: white;
        
        ion-icon {
          color: white;
        }
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--spacing-md);
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md);
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-md);
      backdrop-filter: blur(10px);
      
      .stat-value {
        font-size: var(--font-size-h2);
        font-weight: var(--font-weight-bold);
        color: white;
      }
      
      .stat-label {
        font-size: var(--font-size-small);
        color: rgba(255, 255, 255, 0.9);
        margin-top: var(--spacing-xs);
      }
    }
  `]
})
export class ExportImportComponent {
  readonly agendaService = inject(AgendaService);
  private readonly icsExportService = inject(IcsExportService);
  private readonly icsImportService = inject(IcsImportService);
  private readonly jsonExportService = inject(JsonExportService);
  private readonly jsonImportService = inject(JsonImportService);
  private readonly toastService = inject(ToastService);
  private readonly alertController = inject(AlertController);
  private readonly testDataService = inject(TestDataService);

  selectedFile = signal<File | null>(null);
  importing = signal(false);
  importStrategy: ImportStrategy = 'merge';

  exportToIcs(): void {
    const registros = this.agendaService.registros();
    if (registros.length === 0) {
      this.toastService.warning('No hay registros para exportar');
      return;
    }

    const filename = `agenda-${this.getDateString()}.ics`;
    this.icsExportService.exportToIcs(registros, filename);
    this.toastService.success(`Exportados ${registros.length} eventos a ICS`);
  }

  exportToJson(): void {
    const filename = `agenda-backup-${this.getDateString()}.json`;
    this.jsonExportService.exportToJson(filename);

    const total = this.agendaService.registros().length +
      this.agendaService.areas().length +
      this.agendaService.contextos().length +
      this.agendaService.tipos().length;

    this.toastService.success(`Backup completo exportado (${total} elementos)`);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  async onIcsSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      try {
        this.importing.set(true);
        const events = await this.icsImportService.parseIcsFile(file);

        let count = 0;
        events.forEach(ev => {
          this.agendaService.addRegistro({
            id: crypto.randomUUID(),
            profileId: 'default', // TODO: User ID
            name: ev.summary || 'Evento Importado',
            status: 'pendiente',
            priority: 'medium',
            startTime: ev.dtStart,
            endTime: ev.dtEnd || new Date(ev.dtStart.getTime() + 60 * 60 * 1000), // Default 1h if no end
            isAllDay: ev.allDay,
            notes: ev.description,
            createdAt: new Date(),
            updatedAt: new Date(),
            contextoId: 'import_ics',
            areaId: 'default_area' // Need a fallback area
          } as any);
          count++;
        });

        this.toastService.success(`Importados ${count} eventos de ${file.name}`);
      } catch (e) {
        console.error(e);
        this.toastService.error('Error al importar archivo ICS');
      } finally {
        this.importing.set(false);
        input.value = ''; // Reset
      }
    }
  }

  clearFile(): void {
    this.selectedFile.set(null);
  }

  async importData(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    // Confirm if replace strategy
    if (this.importStrategy === 'replace') {
      const confirmed = await this.confirmReplace();
      if (!confirmed) return;
    }

    this.importing.set(true);

    try {
      const result = await this.jsonImportService.importFromJson(file, this.importStrategy);

      if (result.success) {
        this.toastService.success(result.message);
        this.selectedFile.set(null);

        // Show detailed results
        await this.showImportResults(result);
      } else {
        this.toastService.error(result.message);
        if (result.errors.length > 0) {
          await this.showErrors(result.errors);
        }
      }
    } catch (error) {
      this.toastService.error('Error durante la importación');
    } finally {
      this.importing.set(false);
    }
  }

  private async confirmReplace(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: '⚠️ Confirmar Reemplazo',
      message: 'Esta acción eliminará TODOS los datos actuales y los reemplazará con los datos importados. ¿Estás seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, reemplazar',
          role: 'destructive'
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'destructive';
  }

  private async showImportResults(result: any): Promise<void> {
    const alert = await this.alertController.create({
      header: '✅ Importación Exitosa',
      message: `
        <strong>Datos importados:</strong><br>
        • ${result.imported.registros} registros<br>
        • ${result.imported.areas} áreas<br>
        • ${result.imported.contextos} contextos<br>
        • ${result.imported.tipos} tipos
      `,
      buttons: ['OK']
    });

    await alert.present();
  }

  private async showErrors(errors: string[]): Promise<void> {
    const alert = await this.alertController.create({
      header: '❌ Errores de Importación',
      message: errors.slice(0, 5).join('<br>'),
      buttons: ['OK']
    });

    await alert.present();
  }

  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  async generateTestData() {
    try {
      const testRegistros = this.testDataService.generateTestRegistros();
      testRegistros.forEach(registro => {
        this.agendaService.addRegistro(registro);
      });
      await this.toastService.success(
        `✅ ${testRegistros.length} registros de prueba generados exitosamente`
      );
    } catch (error) {
      await this.toastService.error('Error al generar datos de prueba');
    }
  }

  async clearTestData() {
    try {
      const current = this.agendaService.registros();
      const testCount = current.filter(r => r.id.startsWith('test-registro-')).length;

      if (testCount === 0) {
        await this.toastService.warning('No hay datos de prueba para eliminar');
        return;
      }

      await this.toastService.warning(
        `🗑️ ${testCount} registros de prueba identificados`
      );
    } catch (error) {
      await this.toastService.error('Error al limpiar datos de prueba');
    }
  }
}
