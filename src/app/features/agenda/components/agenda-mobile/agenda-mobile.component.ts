import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  briefcaseOutline,
  calendarOutline,
  checkboxOutline,
  notificationsOutline,
  trashOutline,
  addCircleOutline,
  checkmark,
  close,
  createOutline,
  peopleOutline,
  personOutline,
  chatbubblesOutline,
  leafOutline,
  colorPaletteOutline,
  addOutline,
  closeCircle
} from 'ionicons/icons';
import { AgendaService } from '../../../../core/services/agenda.service';
import { AreaConfig, TipoConfig, ContextoConfig } from '../../../../models/agenda.model';
import { RegistroTipoBase } from '../../../../models/registro.model';

@Component({
  selector: 'app-agenda-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonLabel,
    IonIcon,
    IonBadge,
    IonButton,
    IonInput,
    IonSegment,
    IonSegmentButton
  ],
  template: `
    <div class="agenda-mobile-container">
      <ion-segment [(ngModel)]="mainSegmentValue" (ionChange)="onMainSegmentChange($event)" class="main-segment" mode="ios">
        <ion-segment-button value="areas">
          <ion-label>Áreas</ion-label>
        </ion-segment-button>
        <ion-segment-button value="tipos">
          <ion-label>Tipos</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div class="segment-content">
        @if (mainSegmentValue === 'areas') {
          <div class="areas-management">
            <!-- Selector de Áreas como TABS -->
            <div class="area-tabs-container">
              <ion-segment [(ngModel)]="activeAreaIdValue" (ionChange)="onAreaSegmentChange($event)" scrollable class="area-tabs" mode="md">
                @for (area of agendaService.areas(); track area.id) {
                  <ion-segment-button [value]="area.id">
                    <ion-icon [name]="area.icon" [style.color]="area.color"></ion-icon>
                    <ion-label>{{ area.name }}</ion-label>
                  </ion-segment-button>
                }
              </ion-segment>
              
              <ion-button fill="clear" size="small" (click)="showAddAreaForm.set(true)" class="add-area-inline">
                <ion-icon name="add-circle-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>

            <!-- Contenido del Área Seleccionada -->
            @if (activeAreaId() && getActiveArea()) {
                <div class="active-area-panel">
                  <div class="panel-header">
                    <div class="area-info">
                       <div class="icon-badge" [style.background-color]="getActiveArea()?.color || 'grey'">
                         <ion-icon [name]="getActiveArea()?.icon || ''"></ion-icon>
                       </div>
                       <div class="text">
                         <h3>{{ getActiveArea()?.name }}</h3>
                         <p>Configuración y Contextos</p>
                       </div>
                    </div>
                    <div class="area-actions">
                       <ion-button fill="clear" size="small" (click)="editArea(getActiveArea()!)">
                         <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                       </ion-button>
                       <ion-button fill="clear" size="small" color="danger" (click)="deleteArea(getActiveArea()!)">
                         <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                       </ion-button>
                    </div>
                  </div>

                  <div class="contexts-section">
                    <div class="section-title">
                      <ion-icon name="leaf-outline" color="success"></ion-icon>
                      <span>Contextos Relacionados</span>
                      <ion-badge color="success" mode="ios">{{ getContextsForArea(activeAreaId()).length }}</ion-badge>
                    </div>

                    <div class="contexts-list">
                      @for (ctx of getContextsForArea(activeAreaId()); track ctx.id) {
                        <div class="context-pill" (click)="editContexto(ctx)">
                          <span>{{ ctx.name }}</span>
                          <ion-button fill="clear" size="small" (click)="$event.stopPropagation(); deleteContexto(ctx)">
                            <ion-icon slot="icon-only" name="close-circle"></ion-icon>
                          </ion-button>
                        </div>
                      } @empty {
                        <p class="empty-msg">No hay contextos en esta área.</p>
                      }
                    </div>

                    @if (showAddContextoForm()) {
                      <div class="add-ctx-inline">
                        <ion-input [(ngModel)]="newContextoName" placeholder="Nuevo contexto..." fill="outline"></ion-input>
                        <ion-button fill="solid" color="success" (click)="addContexto()">
                          <ion-icon slot="icon-only" name="checkmark"></ion-icon>
                        </ion-button>
                        <ion-button fill="clear" color="medium" (click)="showAddContextoForm.set(false)">
                          <ion-icon slot="icon-only" name="close"></ion-icon>
                        </ion-button>
                      </div>
                    } @else {
                      <ion-button fill="clear" size="small" (click)="showAddContextoForm.set(true)" class="add-ctx-btn">
                        <ion-icon name="add-outline" slot="start"></ion-icon>
                        Agregar Contexto
                      </ion-button>
                    }
                  </div>
                </div>
            } @else if (agendaService.areas().length === 0) {
              <div class="empty-state">
                <ion-icon name="briefcase-outline" color="medium"></ion-icon>
                <p>Crea tu primera área para comenzar</p>
                <ion-button (click)="showAddAreaForm.set(true)">Nueva Área</ion-button>
              </div>
            }
          </div>
        } @else if (mainSegmentValue === 'tipos') {
          <div class="tipos-management">
            <div class="section-header">
              <h3>Tipos de Registro</h3>
              <p>Clasifica tus actividades</p>
            </div>
            
            <div class="tipos-list">
              @for (tipo of agendaService.tipos(); track tipo.id) {
                <div class="tipo-card">
                  <div class="tipo-icon" [style.background-color]="tipo.color">
                    <ion-icon [name]="tipo.icon"></ion-icon>
                  </div>
                  <div class="tipo-info">
                    <span class="name">{{ tipo.name }}</span>
                    <span class="base">{{ tipo.baseType }}</span>
                  </div>
                  <div class="actions">
                    <ion-button fill="clear" size="small" (click)="editTipo(tipo)">
                      <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" color="danger" (click)="deleteTipo(tipo)">
                      <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                    </ion-button>
                  </div>
                </div>
              }
            </div>

            @if (showAddTipoForm()) {
              <div class="add-item-form-mobile">
                <ion-input [(ngModel)]="newTipoName" fill="outline" placeholder="Nombre del tipo"></ion-input>
                <ion-button fill="solid" color="success" size="small" (click)="addTipo()">
                  <ion-icon slot="icon-only" name="checkmark"></ion-icon>
                </ion-button>
                <ion-button fill="solid" color="warning" size="small" (click)="showAddTipoForm.set(false)">
                  <ion-icon slot="icon-only" name="close"></ion-icon>
                </ion-button>
              </div>
            } @else {
              <ion-button expand="block" fill="outline" (click)="showAddTipoForm.set(true)" class="add-tipo-btn">
                <ion-icon slot="start" name="add-circle-outline"></ion-icon>
                Nuevo Tipo
              </ion-button>
            }
          </div>
        }
      </div>

      <!-- Formulario Flotante/Modal para Nueva Área -->
      @if (showAddAreaForm()) {
        <div class="modal-backdrop" (click)="showAddAreaForm.set(false)">
          <div class="custom-modal" (click)="$event.stopPropagation()">
            <h3>Nueva Área</h3>
            <ion-input [(ngModel)]="newAreaName" label="Nombre" labelPlacement="stacked" fill="outline" placeholder="Ejem: Trabajo, Salud..."></ion-input>
            <div class="modal-footer">
              <ion-button fill="clear" color="medium" (click)="showAddAreaForm.set(false)">Cancelar</ion-button>
              <ion-button fill="solid" color="primary" (click)="addArea()">Crear</ion-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .agenda-mobile-container { padding: 12px; }
    .main-segment { margin-bottom: 16px; --background: var(--ion-color-step-100); }
    
    .area-tabs-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--ion-color-step-200);
      padding-bottom: 2px;
    }
    .area-tabs { 
      flex: 1; 
      --background: transparent;
      ion-segment-button {
        --indicator-color: var(--ion-color-primary);
        --color-checked: var(--ion-color-primary);
        min-width: 90px;
        ion-label { font-size: 0.8rem; font-weight: 600; }
        ion-icon { font-size: 1.2rem; margin-bottom: 2px; }
      }
    }
    
    .active-area-panel {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border: 1px solid var(--ion-color-step-100);
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      
      .area-info {
        display: flex;
        gap: 12px;
        align-items: center;
        .icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          ion-icon { font-size: 1.4rem; }
        }
        h3 { margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--ion-text-color); }
        p { margin: 0; font-size: 0.8rem; color: var(--ion-color-medium); }
      }
    }
    
    .contexts-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        span { font-size: 0.9rem; font-weight: 600; color: var(--ion-color-medium); }
        ion-badge { font-size: 0.7rem; border-radius: 6px; }
      }
      
      .contexts-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .context-pill {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--ion-color-step-100);
        padding: 4px 4px 4px 12px;
        border-radius: 20px;
        cursor: pointer;
        span { font-size: 0.85rem; font-weight: 500; }
        ion-button { --padding-start: 0; --padding-end: 0; margin: 0; height: 24px; ion-icon { font-size: 1.1rem; } }
      }
      
      .empty-msg { font-size: 0.8rem; color: var(--ion-color-medium); font-style: italic; }
      .add-ctx-btn { --padding-start: 0; font-size: 0.85rem; font-weight: 600; }
    }
    
    .add-ctx-inline {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      ion-input { --background: var(--ion-color-step-50); height: 36px; --padding-start: 12px; }
      ion-button { margin: 0; height: 36px; }
    }
    
    .tipos-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .tipo-card {
      display: flex;
      align-items: center;
      background: var(--ion-card-background);
      padding: 10px 16px;
      border-radius: 12px;
      border: 1px solid var(--ion-color-step-100);
      .tipo-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-right: 12px;
      }
      .tipo-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        .name { font-weight: 600; font-size: 0.95rem; }
        .base { font-size: 0.75rem; color: var(--ion-color-medium); text-transform: uppercase; }
      }
    }
    
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .custom-modal {
      background: var(--ion-background-color);
      width: 100%;
      max-width: 400px;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      h3 { margin-top: 0; margin-bottom: 20px; font-weight: 700; }
      .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      ion-icon { font-size: 4rem; margin-bottom: 16px; }
      p { color: var(--ion-color-medium); margin-bottom: 20px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgendaMobileComponent {
  readonly agendaService = inject(AgendaService);
  private readonly alertController = inject(AlertController);

  // UI State
  mainSegmentValue = 'areas';
  activeAreaIdValue = '';
  activeAreaId = signal<string>('');

  showAddAreaForm = signal(false);
  showAddTipoForm = signal(false);
  showAddContextoForm = signal(false);

  // Form Inputs
  newAreaName = '';
  newTipoName = '';
  newContextoName = '';

  constructor() {
    addIcons({
      briefcaseOutline,
      calendarOutline,
      checkboxOutline,
      notificationsOutline,
      trashOutline,
      addCircleOutline,
      checkmark,
      close,
      createOutline,
      peopleOutline,
      personOutline,
      chatbubblesOutline,
      leafOutline,
      colorPaletteOutline,
      addOutline,
      closeCircle
    });

    // Inicializar activeAreaId con la primera área si existe
    const areas = this.agendaService.areas();
    if (areas.length > 0) {
      this.activeAreaId.set(areas[0].id);
      this.activeAreaIdValue = areas[0].id;
    }
  }

  onMainSegmentChange(event: any) {
    this.mainSegmentValue = event.detail.value;
  }

  onAreaSegmentChange(event: any) {
    this.activeAreaId.set(event.detail.value);
  }

  // --- HELPERS ---
  getActiveArea(): AreaConfig | undefined {
    return this.agendaService.areas().find(a => a.id === this.activeAreaId());
  }

  getContextsForArea(areaId: string): ContextoConfig[] {
    return this.agendaService.contextos().filter(ctx => ctx.areaIds.includes(areaId));
  }

  // --- ÁREAS ---
  addArea() {
    if (!this.newAreaName.trim()) return;
    this.agendaService.addArea({
      name: this.newAreaName,
      icon: 'briefcase-outline',
      color: '#4f46e5',
      order: this.agendaService.areas().length + 1,
      isActive: true
    });
    this.newAreaName = '';
    this.showAddAreaForm.set(false);

    // Si era la primera área, seleccionarla
    const areas = this.agendaService.areas();
    if (areas.length === 1) {
      this.activeAreaId.set(areas[0].id);
      this.activeAreaIdValue = areas[0].id;
    }
  }

  deleteArea(area: AreaConfig) {
    this.confirmAction('Eliminar Área', `¿Deseas eliminar "${area.name}"?`, () => {
      this.agendaService.deleteArea(area.id);
      // Resetear área activa si se eliminó
      if (this.activeAreaId() === area.id) {
        const next = this.agendaService.areas()[0];
        const newId = next ? next.id : '';
        this.activeAreaId.set(newId);
        this.activeAreaIdValue = newId;
      }
    });
  }

  async editArea(area: AreaConfig) {
    const alert = await this.alertController.create({
      header: 'Editar Área',
      inputs: [
        { name: 'name', type: 'text', value: area.name, placeholder: 'Nombre' },
        { name: 'icon', type: 'text', value: area.icon, placeholder: 'Icono' },
        { name: 'color', type: 'text', value: area.color, placeholder: 'Color' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: (data) => this.agendaService.updateArea(area.id, data) }
      ]
    });
    await alert.present();
  }

  // --- TIPOS ---
  addTipo() {
    if (!this.newTipoName.trim()) return;
    this.agendaService.addTipo({
      baseType: RegistroTipoBase.EVENTO,
      name: this.newTipoName,
      icon: 'bookmark-outline',
      color: '#0891b2',
      isActive: true
    });
    this.newTipoName = '';
    this.showAddTipoForm.set(false);
  }

  deleteTipo(tipo: TipoConfig) {
    this.confirmAction('Eliminar Tipo', `¿Deseas eliminar "${tipo.name}"?`, () => {
      this.agendaService.deleteTipo(tipo.id);
    });
  }

  async editTipo(tipo: TipoConfig) {
    const alert = await this.alertController.create({
      header: 'Editar Tipo',
      inputs: [
        { name: 'name', type: 'text', value: tipo.name, placeholder: 'Nombre' },
        { name: 'icon', type: 'text', value: tipo.icon, placeholder: 'Icono' },
        { name: 'color', type: 'text', value: tipo.color, placeholder: 'Color' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: (data) => this.agendaService.updateTipo(tipo.id, data) }
      ]
    });
    await alert.present();
  }

  // --- CONTEXTOS ---
  addContexto() {
    const areaId = this.activeAreaId();
    if (!this.newContextoName.trim() || !areaId) return;

    this.agendaService.addContexto({
      areaIds: [areaId],
      name: this.newContextoName,
      isActive: true
    });
    this.newContextoName = '';
    this.showAddContextoForm.set(false);
  }

  async editContexto(ctx: ContextoConfig) {
    const areaOptions = this.agendaService.areas().map(a => ({
      name: 'areaIds',
      type: 'checkbox' as const,
      label: a.name,
      value: a.id,
      checked: ctx.areaIds.includes(a.id)
    }));

    const alert = await this.alertController.create({
      header: 'Asignar Áreas',
      message: `Selecciona las áreas para "${ctx.name}"`,
      inputs: areaOptions,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (selectedIds: string[]) => {
            if (selectedIds.length === 0) return false;
            this.agendaService.updateContexto(ctx.id, { areaIds: selectedIds });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  deleteContexto(ctx: ContextoConfig) {
    this.confirmAction('Eliminar Contexto', `¿Deseas eliminar "${ctx.name}"?`, () => {
      this.agendaService.deleteContexto(ctx.id);
    });
  }

  private async confirmAction(header: string, message: string, onConfirm: () => void) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Aceptar', handler: onConfirm }
      ]
    });
    await alert.present();
  }
}
