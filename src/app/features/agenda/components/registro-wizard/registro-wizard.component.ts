import { Component, ChangeDetectionStrategy, inject, signal, computed, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonBadge,
  IonProgressBar,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonChip,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForwardOutline,
  arrowBackOutline,
  saveOutline,
  closeOutline,
  timeOutline,
  calendarOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  addCircleOutline
} from 'ionicons/icons';
import { AgendaService } from '../../../../core/services/agenda.service';
import { RegistroEstadoService } from '../../../../core/services/registro-estado.service';
import { Registro, RegistroStatus, RegistroPrioridad, RegistroArtefacto } from '../../../../models/registro.model';
import { AreaConfig, TipoConfig, ContextoConfig } from '../../../../models/agenda.model';

@Component({
  selector: 'app-registro-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonCheckbox,
    IonItem,
    IonLabel,
    IonBadge,
    IonProgressBar,
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonChip
  ],
  template: `
    <div class="wizard-container">
      <!-- HEADER -->
      <div class="wizard-header">
        <div class="header-top">
             <div class="step-indicator">
                <span class="step-count">Paso {{ currentStep() }} de 5</span>
                <h2 class="step-title">{{ getStepTitle() }}</h2>
             </div>
             <ion-button fill="clear" (click)="close()">
                <ion-icon slot="icon-only" name="close-outline"></ion-icon>
             </ion-button>
        </div>
        <ion-progress-bar [value]="currentStep() / 5" color="primary"></ion-progress-bar>
      </div>

      <!-- CONTENT -->
      <div class="wizard-content">
        
        <!-- PASO 1: IDENTIDAD -->
        @if (currentStep() === 1) {
          <div class="step-section">
            <div class="status-selector">
              <label class="status-label">¿Qué tipo de registro es?</label>
              <ion-segment [(ngModel)]="tempRegistro.status" mode="ios">
                <ion-segment-button value="borrador">
                  <ion-label>Borrador</ion-label>
                </ion-segment-button>
                <ion-segment-button value="confirmado">
                  <ion-label>Confirmado</ion-label>
                </ion-segment-button>
                <ion-segment-button value="estudio">
                  <ion-label>En Estudio</ion-label>
                </ion-segment-button>
              </ion-segment>
            </div>

            <ion-item fill="outline" class="input-item">
              <ion-input [(ngModel)]="tempRegistro.name" placeholder="Nombre del registro..."></ion-input>
            </ion-item>

            <div class="optional-fields">
              <label class="section-label">Clasificación</label>
              <div class="chips-row">
                @for (area of agendaService.activeAreas(); track area.id) {
                  <ion-chip 
                    [outline]="tempRegistro.areaId !== area.id"
                    [color]="tempRegistro.areaId === area.id ? 'primary' : 'medium'"
                    (click)="selectArea(area.id)">
                    <ion-icon [name]="area.icon"></ion-icon>
                    {{ area.name }}
                  </ion-chip>
                }
              </div>

              @if (tempRegistro.areaId) {
                <div class="progressive-step animated-section">
                  <!-- Contextos vinculados -->
                  @if (availableContextos().length > 0) {
                    <label class="section-label">¿En qué lugar? (Contexto)</label>
                    <div class="chips-row">
                      @for (context of availableContextos(); track context.id) {
                        <ion-chip 
                          [outline]="tempRegistro.contextoId !== context.id"
                          [color]="tempRegistro.contextoId === context.id ? 'success' : 'medium'"
                          (click)="tempRegistro.contextoId = context.id">
                          {{ context.name }}
                        </ion-chip>
                      }
                    </div>
                  }

                  <label class="section-label">¿Qué tipo de actividad es?</label>
                  <div class="chips-row">
                    @for (tipo of agendaService.tipos(); track tipo.id) {
                      <ion-chip 
                        [outline]="tempRegistro.tipoId !== tipo.id"
                        [color]="tempRegistro.tipoId === tipo.id ? 'secondary' : 'medium'"
                        (click)="tempRegistro.tipoId = tipo.id">
                        {{ tipo.name }}
                      </ion-chip>
                    }
                  </div>

                  <!-- Metadata Específica (Ej: Clases) -->
                  @if (isClaseTypeSelected()) {
                    <div class="metadata-fields animated-section">
                       <label class="section-label">Detalles de la Clase (Artefacto Lógico)</label>
                       <div class="grid-2-col">
                          <ion-item fill="outline" class="input-item small-input">
                            <ion-label position="floating">Nombre del Curso</ion-label>
                            <ion-input [(ngModel)]="courseMetadata.name" placeholder="Ej: Cálculo I"></ion-input>
                          </ion-item>
                          <ion-item fill="outline" class="input-item small-input">
                            <ion-label position="floating">Código</ion-label>
                            <ion-input [(ngModel)]="courseMetadata.code" placeholder="Ej: MAT101"></ion-input>
                          </ion-item>
                       </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- PASO 2: TIEMPO -->
        @if (currentStep() === 2) {
          <div class="step-section time-section">
            <div class="datetime-container">
              <ion-datetime
                presentation="date-time"
                [(ngModel)]="selectedDateCheck"
                [preferWheel]="true"
                size="cover"
              ></ion-datetime>
            </div>
            
            <div class="duration-controls">
               <ion-item lines="none">
                 <ion-checkbox slot="start" [(ngModel)]="tempRegistro.isAllDay">Todo el día</ion-checkbox>
               </ion-item>
            </div>
          </div>
        }

        <!-- PASO 3: RECURSOS -->
        @if (currentStep() === 3) {
          <div class="step-section">
             <div class="checklist-header">
               <h3>Tareas / Checklist</h3>
               <ion-button fill="clear" size="small" (click)="addTarea()">
                 <ion-icon slot="icon-only" name="add-circle-outline"></ion-icon>
                 Agregar
               </ion-button>
             </div>
             
             <div class="checklist-items">
               @if (!tempRegistro.tareas || tempRegistro.tareas.length === 0) {
                 <p class="empty-msg">No hay tareas asociadas.</p>
               } @else {
                 @for (tarea of tempRegistro.tareas; track tarea.id; let i = $index) {
                   <div class="task-row">
                     <ion-checkbox [(ngModel)]="tarea.completed"></ion-checkbox>
                     <ion-input [(ngModel)]="tarea.name" placeholder="Nueva tarea..."></ion-input>
                     <ion-button fill="clear" color="danger" (click)="removeTarea(i)">
                       <ion-icon name="close-outline"></ion-icon>
                     </ion-button>
                   </div>
                 }
               }
             </div>
             
             <ion-item fill="outline" class="notes-item">
               <ion-label position="floating">Notas Adicionales</ion-label>
               <ion-textarea [(ngModel)]="tempRegistro.notes" rows="3"></ion-textarea>
             </ion-item>
          </div>
        }

        <!-- PASO 4: CONFLICTOS -->
        @if (currentStep() === 4) {
          <div class="step-section conflicts-section">
             <div class="conflict-status success">
               <ion-icon name="checkmark-circle-outline" class="status-icon"></ion-icon>
               <h3>¡Todo Despejado!</h3>
               <p>No se han detectado conflictos con otros registros.</p>
             </div>
             
             <div class="priority-selector">
                <ion-label>Prioridad del Registro:</ion-label>
                <ion-select [(ngModel)]="tempRegistro.priority" interface="popover">
                   <ion-select-option value="soft">Flexible (Soft)</ion-select-option>
                   <ion-select-option value="hard">Inamovible (Hard)</ion-select-option>
                </ion-select>
             </div>
          </div>
        }

        <!-- PASO 5: RESUMEN -->
        @if (currentStep() === 5) {
          <div class="step-section summary-section">
             <h3>Resumen del Registro</h3>
             <div class="summary-card">
                <div class="summary-row">
                  <strong>Nombre:</strong> <span>{{ tempRegistro.name }}</span>
                </div>
                <div class="summary-row">
                  <strong>Área:</strong> <span>{{ getAreaName(tempRegistro.areaId) }}</span>
                </div>
                <div class="summary-row">
                  <strong>Tipo:</strong> <span>{{ getTipoName(tempRegistro.tipoId) }}</span>
                </div>
                <div class="summary-row">
                  <strong>Estado:</strong> 
                  <ion-badge [color]="getStatusColor(tempRegistro.status)">
                    {{ tempRegistro.status | titlecase }}
                  </ion-badge>
                </div>
                <div class="summary-row">
                  <strong>Prioridad:</strong> <ion-badge [color]="tempRegistro.priority === 'hard' ? 'danger' : 'success'">{{ tempRegistro.priority }}</ion-badge>
                </div>
             </div>
          </div>
        }

      </div>

      <!-- FOOTER -->
      <div class="wizard-footer">
        @if (tempRegistro.status === 'borrador') {
          <div class="spacer"></div>
          <ion-button fill="solid" color="primary" expand="block" (click)="quickSaveBorrador()" [disabled]="!tempRegistro.name?.trim()">
            <ion-icon slot="start" name="save-outline"></ion-icon>
            Guardar
          </ion-button>
        } @else {
          <ion-button fill="clear" color="medium" (click)="prevStep()" [disabled]="currentStep() === 1">
            <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
            Atrás
          </ion-button>
          <div class="spacer"></div>
          @if (currentStep() < 5) {
            <ion-button fill="solid" color="primary" (click)="nextStep()" [disabled]="!canProceed()">
              Siguiente
              <ion-icon slot="end" name="arrow-forward-outline"></ion-icon>
            </ion-button>
          } @else {
            <ion-button fill="solid" color="success" (click)="saveRegistro()">
              {{ isEditing ? 'Actualizar' : 'Guardar' }}
              <ion-icon slot="end" name="save-outline"></ion-icon>
            </ion-button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .wizard-container {
      display: flex; flex-direction: column; height: 100%;
      background: var(--ion-background-color);
    }
    .wizard-header {
      padding: 16px; border-bottom: 1px solid var(--ion-color-step-100);
      .header-top { display: flex; justify-content: space-between; align-items: center; }
      .step-indicator {
        display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 8px;
        .step-count { font-size: 12px; color: var(--ion-color-medium); text-transform: uppercase; margin-bottom: 4px; }
        .step-title { font-size: 18px; margin: 0; font-weight: 700; }
      }
    }
    .wizard-content { flex: 1; overflow-y: auto; padding: 16px; }
    .step-section { display: flex; flex-direction: column; gap: 16px; }
    .input-item { --background: var(--ion-color-step-50); --border-radius: 8px; }
    .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .checklist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .task-row {
      display: flex; align-items: center; gap: 8px; background: var(--ion-color-step-50);
      padding: 8px; border-radius: 8px; margin-bottom: 8px;
      ion-input { --padding-start: 8px; }
    }
    .empty-msg { text-align: center; color: var(--ion-color-medium); font-style: italic; }
    .conflict-status {
      text-align: center; padding: 32px; border-radius: 16px;
      background: var(--ion-color-success-contrast); border: 2px dashed var(--ion-color-success);
      &.success { color: var(--ion-color-success); .status-icon { font-size: 48px; } }
    }
    .summary-card {
      background: var(--ion-color-step-50); padding: 16px; border-radius: 12px;
      .summary-row {
        display: flex; justify-content: space-between; padding: 8px 0;
        border-bottom: 1px solid var(--ion-color-step-100);
        &:last-child { border-bottom: none; }
      }
    }
    .status-selector {
      .status-label { display: block; font-size: 12px; color: var(--ion-color-medium); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      ion-segment { --background: var(--ion-color-step-50); border-radius: 8px; }
      ion-segment-button { font-size: 13px; min-height: 36px; }
    }
    .optional-fields {
      padding: 12px; background: var(--ion-color-step-50); border-radius: 12px;
      .section-label { display: block; font-size: 12px; color: var(--ion-color-medium); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    }
    .chips-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
      ion-chip { margin: 0; cursor: pointer; }
    }
    .animated-section { animation: fadeIn 0.3s ease-out; margin-top: 8px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .small-input { --padding-top: 4px; --padding-bottom: 4px; margin-bottom: 0px !important; }
    .wizard-footer {
      padding: 16px; border-top: 1px solid var(--ion-color-step-100);
      display: flex; align-items: center;
      .spacer { flex: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroWizardComponent implements OnInit {
  readonly agendaService = inject(AgendaService);
  private readonly registroEstadoService = inject(RegistroEstadoService);
  private readonly modalCtrl = inject(ModalController);

  @Input() registroToEdit?: Registro;

  currentStep = signal(1);
  selectedDateCheck = new Date().toISOString();
  isEditing = false;

  tempRegistro: Partial<Registro> = {
    id: crypto.randomUUID(),
    profileId: '',
    name: '',
    status: RegistroStatus.BORRADOR,
    priority: RegistroPrioridad.SOFT,
    isAllDay: false,
    tareas: [],
    artefactos: []
  };

  courseMetadata = { name: '', code: '' };

  availableContextos = computed(() => {
    const areaId = this.tempRegistro.areaId;
    if (!areaId) return [];
    return this.agendaService.contextos().filter(c => c.areaIds.includes(areaId));
  });

  constructor() {
    addIcons({
      arrowForwardOutline, arrowBackOutline, saveOutline, closeOutline,
      timeOutline, calendarOutline, checkmarkCircleOutline, alertCircleOutline,
      addCircleOutline
    });
  }

  ngOnInit() {
    if (this.registroToEdit) {
      this.isEditing = true;
      this.tempRegistro = JSON.parse(JSON.stringify(this.registroToEdit));
      if (this.tempRegistro.startTime) {
        const start = this.tempRegistro.startTime;
        this.selectedDateCheck = typeof start === 'string' ? start : (start as Date).toISOString();
      }

      // Load course artifact if exists
      const courseArt = this.tempRegistro.artefactos?.find(a => a.name === 'course_metadata');
      if (courseArt && courseArt.metadata) {
        this.courseMetadata = { ...courseArt.metadata };
      }
    } else {
      this.tempRegistro.profileId = this.registroEstadoService.activeProfileId() || '';
    }
  }

  close() { this.modalCtrl.dismiss(); }

  nextStep() { if (this.currentStep() < 5) this.currentStep.update(s => s + 1); }
  prevStep() { if (this.currentStep() > 1) this.currentStep.update(s => s - 1); }

  canProceed(): boolean {
    if (this.currentStep() === 1) return !!this.tempRegistro.name?.trim();
    return true;
  }

  getStepTitle(): string {
    switch (this.currentStep()) {
      case 1: return 'Identidad';
      case 2: return 'Tiempo';
      case 3: return 'Recursos';
      case 4: return 'Conflictos';
      case 5: return 'Confirmación';
      default: return 'Registro';
    }
  }

  selectArea(areaId: string) {
    this.tempRegistro.areaId = areaId;
    this.tempRegistro.contextoId = '';
  }

  addTarea() {
    if (!this.tempRegistro.tareas) this.tempRegistro.tareas = [];
    this.tempRegistro.tareas.push({ id: crypto.randomUUID(), name: '', completed: false });
  }

  removeTarea(index: number) { this.tempRegistro.tareas?.splice(index, 1); }

  private syncArtefactos() {
    if (this.isClaseTypeSelected()) {
      if (!this.tempRegistro.artefactos) this.tempRegistro.artefactos = [];
      const index = this.tempRegistro.artefactos.findIndex(a => a.name === 'course_metadata');
      const artifact: RegistroArtefacto = {
        id: index >= 0 ? this.tempRegistro.artefactos[index].id : crypto.randomUUID(),
        tipo: 'logico',
        name: 'course_metadata',
        value: `${this.courseMetadata.name} (${this.courseMetadata.code})`,
        metadata: { ...this.courseMetadata }
      };
      if (index >= 0) this.tempRegistro.artefactos[index] = artifact;
      else this.tempRegistro.artefactos.push(artifact);
    }
  }

  quickSaveBorrador() {
    this.syncArtefactos();
    const finalRegistro = {
      ...this.tempRegistro,
      profileId: this.tempRegistro.profileId || this.registroEstadoService.activeProfileId() || '',
      priority: this.tempRegistro.priority || RegistroPrioridad.SOFT,
      isAllDay: this.tempRegistro.isAllDay || false,
      status: RegistroStatus.BORRADOR,
      createdAt: this.tempRegistro.createdAt || new Date(),
      updatedAt: new Date()
    } as Registro;

    this.agendaService.addRegistro(finalRegistro);
    this.modalCtrl.dismiss({ saved: true, quickSave: true });
  }

  saveRegistro() {
    this.tempRegistro.startTime = new Date(this.selectedDateCheck);
    this.syncArtefactos();

    const finalRegistro = {
      ...this.tempRegistro,
      profileId: this.tempRegistro.profileId || this.registroEstadoService.activeProfileId() || '',
      priority: this.tempRegistro.priority || RegistroPrioridad.SOFT,
      isAllDay: this.tempRegistro.isAllDay || false,
      createdAt: this.tempRegistro.createdAt || new Date(),
      updatedAt: new Date()
    } as Registro;

    if (this.isEditing) this.agendaService.updateRegistro(finalRegistro.id, finalRegistro);
    else this.agendaService.addRegistro(finalRegistro);

    this.modalCtrl.dismiss({ saved: true });
  }

  getAreaName(id?: string) { return this.agendaService.areas().find(a => a.id === id)?.name || 'Sin Área'; }
  getTipoName(id?: string) { return this.agendaService.tipos().find(t => t.id === id)?.name || 'Sin Tipo'; }

  getStatusColor(status?: RegistroStatus): string {
    switch (status) {
      case RegistroStatus.CONFIRMADO: return 'primary';
      case RegistroStatus.ESTUDIO: return 'warning';
      default: return 'medium';
    }
  }

  isClaseTypeSelected(): boolean {
    const tipo = this.agendaService.tipos().find(t => t.id === this.tempRegistro.tipoId);
    return !!tipo && tipo.name.toLowerCase().includes('clase');
  }
}
