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
import { ConflictEngineService } from '../../../../core/services/conflict-engine.service';
import { ConflictDetectionResult } from '../../../../models/conflict.model';
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

            <div class="buffer-controls" style="display: flex; gap: 10px; margin-top: 10px;">
                 <ion-item fill="outline" class="input-item small-input" style="flex: 1;">
                    <ion-label position="floating">Buffer Pre (min)</ion-label>
                    <ion-input type="number" [(ngModel)]="tempRegistro.bufferBefore!.duration"></ion-input>
                 </ion-item>
                 <ion-item fill="outline" class="input-item small-input" style="flex: 1;">
                    <ion-label position="floating">Buffer Post (min)</ion-label>
                    <ion-input type="number" [(ngModel)]="tempRegistro.bufferAfter!.duration"></ion-input>
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

             <!-- ARTEFACTOS -->
             <div class="checklist-header" style="margin-top: 20px;">
               <h3>Recursos / Artefactos</h3>
               <ion-button fill="clear" size="small" (click)="addArtifact()">
                 <ion-icon slot="icon-only" name="add-circle-outline"></ion-icon>
                 Agregar
               </ion-button>
             </div>
             
             <!-- Add Artifact Form -->
             <div class="artifact-form" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; padding: 10px; background: var(--ion-color-step-50); border-radius: 8px;">
                <div style="display: flex; gap: 10px;">
                    <ion-select [(ngModel)]="newArtifact.type" placeholder="Tipo" interface="popover" style="max-width: 100px;">
                    <ion-select-option value="digital">Digital</ion-select-option>
                    <ion-select-option value="fisico">Físico</ion-select-option>
                    </ion-select>
                    <ion-input [(ngModel)]="newArtifact.name" placeholder="Nombre (ej: Link Doc)"></ion-input>
                </div>
                <ion-input [(ngModel)]="newArtifact.value" placeholder="URL o Ubicación..."></ion-input>
             </div>

             <div class="checklist-items">
                @if (tempRegistro.artefactos) {
                    @for (art of tempRegistro.artefactos; track art.id; let i = $index) {
                    <div class="task-row">
                        <ion-icon [name]="art.tipo === 'digital' ? 'link-outline' : 'cube-outline'"></ion-icon>
                        <div class="task-info" style="flex: 1; margin-left: 10px;">
                            <span class="task-name" style="display: block; font-weight: 500;">{{ art.name }}</span>
                            <span class="task-val" style="display: block; font-size: 0.8em; color: var(--ion-color-medium);">{{ art.value }}</span>
                        </div>
                        <ion-button fill="clear" color="danger" (click)="removeArtifact(i)">
                            <ion-icon name="close-outline"></ion-icon>
                        </ion-button>
                    </div>
                    }
                }
             </div>
          </div>
        }

        <!-- PASO 4: CONFLICTOS -->
        @if (currentStep() === 4) {
          <div class="step-section conflicts-section">
             @if (conflictResult()?.hasConflicts) {
                  <div class="conflict-status error animated-section" style="background: rgba(var(--ion-color-danger-rgb), 0.1); padding: 16px; border-radius: 12px; text-align: center;">
                    <ion-icon name="alert-circle-outline" class="status-icon" style="font-size: 48px; color: var(--ion-color-danger);"></ion-icon>
                    <h3 style="color: var(--ion-color-danger);">¡Conflictos Detectados!</h3>
                    <p>Se encontraron {{ conflictResult()?.conflicts?.length }} conflictos.</p>
                    
                    <div class="conflict-list" style="text-align: left; margin-top: 10px;">
                      @for (conflict of conflictResult()?.conflicts; track conflict.id) {
                        <div class="conflict-item" style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                           <p style="margin: 0; font-weight: 600; font-size: 0.9em;">{{ conflict.message }}</p>
                           <ul style="padding-left: 20px; font-size: 0.85em; color: var(--ion-color-medium);">
                             @for (sug of conflict.suggestions; track sug.id) {
                               <li>{{ sug.label }}: {{ sug.description }}</li>
                             }
                           </ul>
                        </div>
                      }
                    </div>
                  </div>
              } @else {
                  <div class="conflict-status success">
                    <ion-icon name="checkmark-circle-outline" class="status-icon"></ion-icon>
                    <h3>¡Todo Despejado!</h3>
                    <p>No se han detectado conflictos con otros registros.</p>
                  </div>
              }
             
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
  styleUrls: ['./registro-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistroWizardComponent implements OnInit {
  readonly agendaService = inject(AgendaService);
  private readonly registroEstadoService = inject(RegistroEstadoService);
  private readonly conflictEngine = inject(ConflictEngineService);
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
      addCircleOutline, informationCircleOutline
    });
  }

  ngOnInit() {
    if (this.registroToEdit) {
      this.isEditing = true;
      this.tempRegistro = JSON.parse(JSON.stringify(this.registroToEdit));
      this.currentStep.set(1);

      if (this.tempRegistro.startTime) {
        const start = this.tempRegistro.startTime;
        this.selectedDateCheck = typeof start === 'string' ? start : (start as Date).toISOString();
      }

      // Load course artifact if exists
      const courseArt = this.tempRegistro.artefactos?.find(a => a.name === 'course_metadata');
      if (courseArt && courseArt.metadata) {
        this.courseMetadata = {
          name: (courseArt.metadata['name'] as string) || '',
          code: (courseArt.metadata['code'] as string) || ''
        };
      }

      // Initialize buffers if missing
      if (!this.tempRegistro.bufferBefore) this.tempRegistro.bufferBefore = { duration: 0 };
      if (!this.tempRegistro.bufferAfter) this.tempRegistro.bufferAfter = { duration: 0 };

    } else {
      this.tempRegistro.profileId = this.registroEstadoService.activeProfileId() || '';
      // Defaults
      this.tempRegistro.status = RegistroStatus.CONFIRMADO;
      this.tempRegistro.priority = RegistroPrioridad.SOFT;
      this.tempRegistro.isAllDay = false;
      this.tempRegistro.tareas = [];
      this.tempRegistro.artefactos = [];
      this.tempRegistro.bufferBefore = { duration: 0 };
      this.tempRegistro.bufferAfter = { duration: 0 };
    }
  }

  close() { this.modalCtrl.dismiss(); }

  nextStep() {
    if (this.currentStep() < 5) {
      if (this.currentStep() === 3) {
        this.checkConflicts();
      }
      this.currentStep.update(v => v + 1);
    }
  }

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
    return !!tipo && (tipo.metadata?.['isAcademic'] === true || tipo.name.toLowerCase().includes('clase'));
  }

  // --- ARTEFACTOS GENÉRICOS ---
  newArtifact = { name: '', value: '', type: 'digital' as const };

  addArtifact() {
    if (!this.newArtifact.name.trim()) return;

    if (!this.tempRegistro.artefactos) this.tempRegistro.artefactos = [];

    this.tempRegistro.artefactos.push({
      id: crypto.randomUUID(),
      tipo: this.newArtifact.type,
      name: this.newArtifact.name,
      value: this.newArtifact.value
    });

    // Reset form
    this.newArtifact = { name: '', value: '', type: 'digital' };
  }

  removeArtifact(index: number) {
    this.tempRegistro.artefactos?.splice(index, 1);
  }

  // --- CONFLICT ENGINE ---
  conflictResult = signal<ConflictDetectionResult | null>(null);

  private checkConflicts() {
    const start = new Date(this.selectedDateCheck);
    this.tempRegistro.startTime = start;

    // Default duration to 60 if not set, for conflict check
    const duration = this.tempRegistro.duration || 60;
    this.tempRegistro.duration = duration;
    this.tempRegistro.endTime = new Date(start.getTime() + duration * 60000);

    const result = this.conflictEngine.detectConflicts(
      this.tempRegistro as Registro,
      this.agendaService.registros()
    );
    this.conflictResult.set(result);
  }
}
