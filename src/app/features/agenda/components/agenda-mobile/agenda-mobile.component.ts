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
  AlertController,
  IonFab,
  IonFabButton
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
    IonSegmentButton,
    IonFab,
    IonFabButton
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
                      <span>Contextos</span>
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
                        <p class="empty-msg">Sin contextos.</p>
                      }
                    </div>

                    <!-- FAB for Adding Contexts -->
                    <div class="fab-container">
                       <ion-fab button vertical="bottom" horizontal="end" slot="fixed">
                         <ion-fab-button (click)="presentAddContextAlert()">
                           <ion-icon name="add"></ion-icon>
                         </ion-fab-button>
                       </ion-fab>
                    </div>
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
    .agenda-mobile-container { 
      padding: var(--spacing-md); 
    }
    
    .main-segment { 
      margin-bottom: var(--spacing-lg); 
      --background: var(--ion-color-step-100); 
    }
    
    .area-tabs-container {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-xl);
      border-bottom: var(--border-width-thin) solid var(--ion-color-step-200);
      padding-bottom: var(--spacing-xs);
    }
    
    .area-tabs { 
      flex: 1; 
      --background: transparent;
    }
    
    .area-tabs ion-segment-button {
        --indicator-color: var(--ion-color-primary);
        --color-checked: var(--ion-color-primary);
        min-width: 90px;
        transition: transform var(--transition-fast);
    }
    
    .area-tabs ion-segment-button:active {
      transform: scale(0.95);
    }
    
    .area-tabs ion-segment-button ion-label { 
      font-size: var(--font-size-small); 
      font-weight: var(--font-weight-semibold); 
    }
    
    .area-tabs ion-segment-button ion-icon { 
      font-size: 1.2rem; 
      margin-bottom: var(--spacing-xs); 
    }
    
    .active-area-panel {
      background: var(--ion-card-background);
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-md);
      border: var(--border-width-thin) solid var(--ion-color-step-100);
      animation: fadeIn var(--transition-base);
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: var(--border-width-thin) solid var(--ion-color-step-100);
    }
      
    .panel-header .area-info {
        display: flex;
        gap: var(--spacing-md);
        align-items: center;
    }
    
    .panel-header .area-info .icon-badge {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: var(--shadow-sm);
    }
    
    .panel-header .area-info .icon-badge ion-icon { 
      font-size: 1.1rem; 
    }
    
    .panel-header .area-info h3 { 
      margin: 0; 
      font-size: var(--font-size-h4); 
      font-weight: var(--font-weight-bold); 
      color: var(--ion-text-color); 
    }
    
    .contexts-section .section-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
    }
    
    .contexts-section .section-title span { 
      font-size: var(--font-size-body); 
      font-weight: var(--font-weight-semibold); 
      color: var(--ion-color-medium); 
    }
    
    .contexts-section .section-title ion-badge { 
      font-size: var(--font-size-xs); 
      border-radius: var(--radius-sm); 
    }
      
    .contexts-section .contexts-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--agenda-pill-gap);
        margin-bottom: var(--spacing-lg);
    }
      
    .contexts-section .context-pill {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        background: var(--ion-color-step-100);
        padding: var(--spacing-xs) var(--spacing-xs) var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-full);
        cursor: pointer;
        transition: all var(--transition-fast);
        border: var(--border-width-thin) solid transparent;
    }
    
    .contexts-section .context-pill:hover {
      background: var(--ion-color-step-150);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
    
    .contexts-section .context-pill:active {
      transform: translateY(0);
    }
    
    .contexts-section .context-pill span { 
      font-size: var(--font-size-small); 
      font-weight: var(--font-weight-medium); 
    }
    
    .contexts-section .context-pill ion-button { 
      --padding-start: 0; 
      --padding-end: 0; 
      margin: 0; 
      height: 24px;
      transition: transform var(--transition-fast);
    }
    
    .contexts-section .context-pill ion-button:hover {
      transform: scale(1.1);
    }
    
    .contexts-section .context-pill ion-button ion-icon { 
      font-size: 1.1rem; 
    }
      
    .contexts-section .empty-msg { 
      font-size: var(--font-size-small); 
      color: var(--ion-color-medium); 
      font-style: italic; 
    }
    
    .contexts-section .add-ctx-btn { 
      --padding-start: 0; 
      font-size: var(--font-size-small); 
      font-weight: var(--font-weight-semibold); 
    }
    
    .add-ctx-inline {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-sm);
    }
    
    .add-ctx-inline ion-input { 
      --background: var(--ion-color-step-50); 
      height: 36px; 
      --padding-start: var(--spacing-md); 
    }
    
    .add-ctx-inline ion-button { 
      margin: 0; 
      height: 36px; 
    }
    
    .tipos-list { 
      display: flex; 
      flex-direction: column; 
      gap: var(--spacing-md); 
      margin-top: var(--spacing-lg); 
    }
    
    .tipo-card {
      display: flex;
      align-items: center;
      background: var(--ion-card-background);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-lg);
      border: var(--border-width-thin) solid var(--ion-color-step-100);
      transition: all var(--transition-fast);
    }
    
    .tipo-card:active {
      transform: scale(0.98);
    }
    
    .tipo-card .tipo-icon {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-right: var(--spacing-md);
        box-shadow: var(--shadow-sm);
    }
    
    .tipo-card .tipo-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .tipo-card .tipo-info .name { 
      font-weight: var(--font-weight-semibold); 
      font-size: var(--font-size-body); 
    }
    
    .tipo-card .tipo-info .base { 
      font-size: var(--font-size-xs); 
      color: var(--ion-color-medium); 
      text-transform: uppercase; 
      letter-spacing: var(--letter-spacing-wide);
    }
    
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      animation: fadeIn var(--transition-base);
    }
    
    .custom-modal {
      background: var(--ion-background-color);
      width: 100%;
      max-width: 400px;
      border-radius: var(--radius-2xl);
      padding: var(--spacing-2xl);
      box-shadow: var(--shadow-2xl);
      animation: slideInUp var(--transition-base);
    }
    
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .custom-modal h3 { 
      margin-top: 0; 
      margin-bottom: var(--spacing-xl); 
      font-weight: var(--font-weight-bold); 
    }
    
    .custom-modal .modal-footer { 
      display: flex; 
      justify-content: flex-end; 
      gap: var(--spacing-sm); 
      margin-top: var(--spacing-2xl); 
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-3xl) var(--spacing-xl);
      text-align: center;
    }
    
    .empty-state ion-icon { 
      font-size: 4rem; 
      margin-bottom: var(--spacing-lg); 
      opacity: 0.5;
    }
    
    .empty-state p { 
      color: var(--ion-color-medium); 
      margin-bottom: var(--spacing-xl); 
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

  async presentAddContextAlert() {
    const alert = await this.alertController.create({
      header: 'Nuevo Contexto',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre del contexto (ej. Oficina)'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: (data) => {
            if (data.name?.trim()) {
              this.newContextoName = data.name;
              this.addContexto();
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
