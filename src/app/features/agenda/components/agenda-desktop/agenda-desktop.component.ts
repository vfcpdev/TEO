import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonIcon,
  IonBadge,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonItem,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  briefcaseOutline,
  calendarOutline,
  checkboxOutline,
  notificationsOutline,
  trashOutline,
  add,
  peopleOutline,
  personOutline,
  chatbubblesOutline,
  leafOutline,
  createOutline,
  colorPaletteOutline
} from 'ionicons/icons';
import { AgendaService } from '../../../../core/services/agenda.service';
import { AreaConfig, TipoConfig, ContextoConfig } from '../../../../models/agenda.model';
import { RegistroTipoBase } from '../../../../models/registro.model';

@Component({
  selector: 'app-agenda-desktop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonButton,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ],
  template: `
    <div class="agenda-desktop-wrapper">
      <div class="header-section">
        <div class="title-group">
          <h2>Configuración de Agenda</h2>
          <p>Gestiona áreas, contextos y tipos de registro para organizar tu tiempo.</p>
        </div>
        <ion-segment [(ngModel)]="mainSegment" mode="ios" class="main-nav">
          <ion-segment-button value="areas">
            <ion-label>Áreas y Contextos</ion-label>
          </ion-segment-button>
          <ion-segment-button value="tipos">
            <ion-label>Tipos de Registro</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>

      <div class="content-container">
        @if (mainSegment() === 'areas') {
          <div class="areas-layout">
            <!-- Sidebar: Lista de Áreas -->
            <div class="areas-sidebar">
              <div class="sidebar-header">
                <h3>Áreas</h3>
                <ion-button fill="clear" size="small" (click)="showAddAreaForm.set(true)">
                  <ion-icon name="add-circle-outline"></ion-icon>
                </ion-button>
              </div>
              
              <div class="area-list-nav">
                @for (area of agendaService.areas(); track area.id) {
                  <div class="area-nav-item" 
                       [class.active]="activeAreaId() === area.id"
                       (click)="activeAreaId.set(area.id)">
                    <div class="indicator" [style.background-color]="area.color"></div>
                    <ion-icon [name]="area.icon" [style.color]="area.color"></ion-icon>
                    <span class="name">{{ area.name }}</span>
                    <ion-badge color="medium" mode="ios">{{ getContextsForArea(area.id).length }}</ion-badge>
                  </div>
                }
              </div>
            </div>

            <!-- Detail: Configuración del Área y sus Contextos -->
            <div class="area-detail-panel">
              @if (activeAreaId(); as activeId) {
                @if (getActiveArea(); as area) {
                  <div class="panel-inner">
                    <div class="area-banner" [style.background-color]="area.color">
                      <div class="banner-content">
                        <div class="icon-circle">
                          <ion-icon [name]="area.icon"></ion-icon>
                        </div>
                        <div class="title-info">
                          <h1>{{ area.name }}</h1>
                          <p>Configuración general y contextos asociados</p>
                        </div>
                      </div>
                      <div class="banner-actions">
                         <ion-button fill="solid" size="small" (click)="editArea(area)">
                           <ion-icon slot="start" name="create-outline"></ion-icon>
                           Editar
                         </ion-button>
                         <ion-button fill="solid" color="danger" size="small" (click)="deleteArea(area)">
                           <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                         </ion-button>
                      </div>
                    </div>

                    <div class="detail-grid">
                      <!-- Card Contextos -->
                      <ion-card class="contexts-card glass-card">
                        <ion-card-header>
                          <div class="card-title-row">
                            <ion-icon name="leaf-outline" color="success"></ion-icon>
                            <ion-card-title>Contextos Relacionados</ion-card-title>
                          </div>
                          <p>Define dónde ocurren las actividades de esta área.</p>
                        </ion-card-header>
                        
                        <ion-card-content>
                          <div class="contexts-flex">
                            @for (ctx of getContextsForArea(area.id); track ctx.id) {
                              <div class="context-pill-desktop">
                                <span class="dot"></span>
                                <span class="name" (click)="editContexto(ctx)">{{ ctx.name }}</span>
                                <div class="pill-actions">
                                  <ion-button fill="clear" size="small" (click)="editContexto(ctx)">
                                    <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                                  </ion-button>
                                  <ion-button fill="clear" size="small" color="danger" (click)="deleteContexto(ctx)">
                                    <ion-icon slot="icon-only" name="close-circle-outline"></ion-icon>
                                  </ion-button>
                                </div>
                              </div>
                            } @empty {
                              <div class="empty-ctx">
                                <p>No hay contextos asignados a esta área.</p>
                              </div>
                            }
                          </div>

                          <div class="add-ctx-row">
                             <ion-input [(ngModel)]="newContextoName" placeholder="Ej: Oficina, Casa, Gym..." class="ctx-input"></ion-input>
                             <ion-button fill="solid" color="success" (click)="addContexto()">
                               <ion-icon slot="start" name="add"></ion-icon>
                               Agregar
                             </ion-button>
                          </div>
                        </ion-card-content>
                      </ion-card>

                      <!-- Card Quick Access (Future) -->
                      <ion-card class="stats-card glass-card">
                         <ion-card-header>
                           <ion-card-title>Resumen de Actividad</ion-card-title>
                         </ion-card-header>
                         <ion-card-content>
                           <p>Próximamente estadísticas por área aquí.</p>
                         </ion-card-content>
                      </ion-card>
                    </div>
                  </div>
                }
              } @else {
                <div class="no-selection">
                  <ion-icon name="briefcase-outline"></ion-icon>
                  <h2>Selecciona un área</h2>
                  <p>Elige un área del menú lateral para ver su configuración.</p>
                </div>
              }
            </div>
          </div>
        } @else {
          <!-- Tipos Management -->
          <div class="tipos-grid">
            @for (tipo of agendaService.tipos(); track tipo.id) {
              <ion-card class="tipo-card-desktop">
                <div class="tipo-header" [style.border-top-color]="tipo.color">
                   <div class="tipo-icon" [style.background-color]="tipo.color">
                     <ion-icon [name]="tipo.icon"></ion-icon>
                   </div>
                   <div class="tipo-actions">
                      <ion-button fill="clear" size="small" (click)="editTipo(tipo)">
                        <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                      </ion-button>
                      <ion-button fill="clear" size="small" color="danger" (click)="deleteTipo(tipo)">
                        <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                      </ion-button>
                   </div>
                </div>
                <ion-card-content>
                   <h3>{{ tipo.name }}</h3>
                   <span class="base-type">{{ tipo.baseType }}</span>
                </ion-card-content>
              </ion-card>
            }
            
            <div class="add-tipo-card" (click)="showAddTipoForm.set(true)">
              <ion-icon name="add-outline"></ion-icon>
              <span>Agregar Tipo</span>
            </div>
          </div>
        }
      </div>

      <!-- Modal Nueva Área -->
      @if (showAddAreaForm()) {
        <div class="desktop-modal-backdrop" (click)="showAddAreaForm.set(false)">
          <div class="desktop-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Nueva Área de Trabajo</h3>
              <ion-button fill="clear" (click)="showAddAreaForm.set(false)">
                <ion-icon name="close"></ion-icon>
              </ion-button>
            </div>
            <div class="modal-body">
              <ion-item fill="outline">
                <ion-label position="stacked">Nombre del Área</ion-label>
                <ion-input [(ngModel)]="newAreaName" placeholder="Ej: Entrenamiento, Estudio..."></ion-input>
              </ion-item>
            </div>
            <div class="modal-footer">
               <ion-button fill="clear" color="medium" (click)="showAddAreaForm.set(false)">Cancelar</ion-button>
               <ion-button fill="solid" (click)="addArea()">Crear Área</ion-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .agenda-desktop-wrapper {
      padding: 24px;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 1px solid var(--ion-color-step-100);
      padding-bottom: 20px;
      
      .title-group {
        h2 { margin: 0; font-size: 2rem; font-weight: 800; color: var(--ion-text-color); }
        p { margin: 4px 0 0; color: var(--ion-color-medium); }
      }
      
      .main-nav {
        width: 400px;
        --background: var(--ion-color-step-100);
      }
    }

    .content-container { flex: 1; overflow: hidden; }

    /* Layout de Áreas Side-by-Side */
    .areas-layout {
      display: flex;
      height: 100%;
      gap: 24px;
    }

    .areas-sidebar {
      width: 280px;
      background: var(--ion-color-step-50);
      border-radius: 20px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      
      .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 8px;
        h3 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; }
      }
      
      .area-list-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
      }
      
      .area-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: transparent;
        
        &:hover { background: var(--ion-color-step-100); }
        &.active { 
          background: white; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          .name { color: var(--ion-text-color); font-weight: 700; }
        }
        
        .indicator {
          position: absolute;
          left: 0; top: 12px; bottom: 12px;
          width: 4px; border-radius: 0 4px 4px 0;
          opacity: 0; transition: opacity 0.2s;
        }
        &.active .indicator { opacity: 1; }
        
        ion-icon { font-size: 1.4rem; }
        .name { flex: 1; font-size: 0.95rem; color: var(--ion-color-step-700); }
        ion-badge { font-size: 0.75rem; --padding-start: 6px; --padding-end: 6px; }
      }
    }

    .area-detail-panel {
      flex: 1;
      background: white;
      border-radius: 24px;
      overflow-y: auto;
      border: 1px solid var(--ion-color-step-100);
      display: flex;
      flex-direction: column;
    }

    .area-banner {
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      border-radius: 20px;
      margin-bottom: 24px;
      
      .banner-content {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .icon-circle {
          width: 48px; height: 48px;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          ion-icon { font-size: 1.5rem; }
        }
        
        .title-info {
          h1 { margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; }
          p { margin: 0; opacity: 0.9; font-size: 0.85rem; font-weight: 500; }
        }
      }
      
      .banner-actions { 
        display: flex; gap: 8px;
        ion-button { 
          --border-radius: 10px; 
          font-weight: 700;
          height: 34px;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.5px;
          --box-shadow: none;
        }
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .glass-card {
      border: 1px solid var(--ion-color-step-100);
      box-shadow: 0 8px 32px rgba(0,0,0,0.03);
      border-radius: 20px;
      margin: 0;
      
      ion-card-header {
        .card-title-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
          ion-icon { font-size: 1.5rem; }
          ion-card-title { font-weight: 700; font-size: 1.25rem; }
        }
        p { margin: 0; color: var(--ion-color-medium); font-size: 0.9rem; }
      }
    }

    .contexts-flex {
      display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 24px;
    }

    .context-pill-desktop {
      display: flex; align-items: center; gap: 8px;
      background: var(--ion-color-step-50);
      padding: 6px 6px 6px 14px;
      border-radius: 12px;
      border: 1px solid var(--ion-color-step-100);
      
      .dot { width: 6px; height: 6px; background: var(--ion-color-success); border-radius: 50%; }
      .name { font-weight: 600; font-size: 0.9rem; color: var(--ion-text-color); flex: 1; cursor: pointer; }
      .pill-actions { display: flex; align-items: center; opacity: 0; transition: opacity 0.2s; }
      &:hover .pill-actions { opacity: 1; }
      ion-button { height: 28px; width: 28px; margin: 0; --padding-start: 0; --padding-end: 0; }
    }

    .add-ctx-row {
      display: flex; gap: 12px; margin-top: 20px; padding-top: 20px;
      border-top: 1px solid var(--ion-color-step-100);
      
      .ctx-input { --background: var(--ion-color-step-50); --padding-start: 16px; border-radius: 12px; flex: 1; }
    }

    .tipos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      padding: 4px;
    }

    .tipo-card-desktop {
      border-radius: 20px; overflow: hidden; margin: 0;
      transition: transform 0.2s;
      &:hover { transform: translateY(-4px); }
      
      .tipo-header {
        height: 80px; border-top: 6px solid;
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 20px; background: var(--ion-color-step-50);
        
        .tipo-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; ion-icon { font-size: 1.5rem; }
        }
      }
      
      ion-card-content {
        h3 { margin: 12px 0 4px; font-weight: 700; font-size: 1.1rem; }
        .base-type { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--ion-color-medium); }
      }
    }

    .add-tipo-card {
      border: 2px dashed var(--ion-color-step-300);
      border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; color: var(--ion-color-medium); cursor: pointer;
      min-height: 180px; transition: all 0.2s;
      
      &:hover { background: var(--ion-color-step-50); color: var(--ion-color-primary); border-color: var(--ion-color-primary); }
      ion-icon { font-size: 2.5rem; }
      span { font-weight: 600; }
    }

    .no-selection {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: var(--ion-color-medium); opacity: 0.6;
      ion-icon { font-size: 5rem; margin-bottom: 20px; }
      h2 { margin: 0; font-weight: 800; }
    }

    /* Modales Desktop */
    .desktop-modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      z-index: 2000; display: flex; align-items: center; justify-content: center;
    }
    .desktop-modal {
      background: white; width: 450px; border-radius: 24px; padding: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
      
      .modal-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
        h3 { margin: 0; font-weight: 800; font-size: 1.5rem; }
        ion-button { --padding-start: 0; --padding-end: 0; }
      }
      
      .modal-body { margin-bottom: 32px; }
      .modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
    }
  `]
})
export class AgendaDesktopComponent {
  readonly agendaService = inject(AgendaService);
  private readonly alertController = inject(AlertController);

  // UI State
  mainSegment = signal('areas');
  activeAreaId = signal<string | null>(null);
  showAddAreaForm = signal(false);
  showAddTipoForm = signal(false);

  // Inputs para nuevos items
  newAreaName = '';
  newTipoName = '';
  newContextoName = '';
  selectedAreaId = '';

  constructor() {
    addIcons({
      briefcaseOutline, calendarOutline, checkboxOutline, notificationsOutline,
      trashOutline, add, peopleOutline, personOutline, chatbubblesOutline,
      leafOutline, createOutline, colorPaletteOutline
    });

    // Auto-seleccionar primera área
    const firstArea = this.agendaService.areas()[0];
    if (firstArea) {
      this.activeAreaId.set(firstArea.id);
    }
  }

  getActiveArea() {
    return this.agendaService.areas().find(a => a.id === this.activeAreaId());
  }

  getContextsForArea(areaId: string) {
    return this.agendaService.contextos().filter(c => c.areaIds.includes(areaId));
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
  }

  deleteArea(area: AreaConfig) {
    this.confirmAction('Eliminar Área', `¿Deseas eliminar "${area.name}"?`, () => {
      this.agendaService.deleteArea(area.id);
      if (this.activeAreaId() === area.id) {
        this.activeAreaId.set(this.agendaService.areas()[0]?.id || null);
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
  }

  async editContexto(ctx: ContextoConfig) {
    const alert = await this.alertController.create({
      header: 'Editar Contexto',
      inputs: [
        { name: 'name', type: 'text', value: ctx.name, placeholder: 'Nombre' },
        {
          name: 'areaIds',
          type: 'checkbox',
          label: 'Áreas',
          placeholder: 'Áreas',
          value: ctx.areaIds, // This is actually for the result, not the options
        }
      ],
      // Since checkbox alert doesn't support text + checkboxes in one go easily with standard alert, 
      // I'll use a more custom approach or two alerts if needed.
      // Actually, Ionic Alert with checkboxes IS possible but it's one or the other (inputs OR checkboxes/radios).
      // Let's use a standard select-like alert for Area selection.
    });

    // Correction: Let's do a multi-select for areas.
    const areaOptions = this.agendaService.areas().map(a => ({
      name: a.name,
      type: 'checkbox' as const,
      label: a.name,
      value: a.id,
      checked: ctx.areaIds.includes(a.id)
    }));

    const areaAlert = await this.alertController.create({
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
    await areaAlert.present();
  }

  deleteContexto(ctx: ContextoConfig) {
    this.confirmAction('Eliminar Contexto', `¿Deseas eliminar "${ctx.name}"?`, () => {
      this.agendaService.deleteContexto(ctx.id);
    });
  }

  // --- HELPERS ---
  getAreaNames(ids: string[]) {
    return ids.map(id => this.agendaService.areas().find(a => a.id === id)?.name || 'N/A').join(', ');
  }

  getAreaColor(id: string) {
    return this.agendaService.areas().find(a => a.id === id)?.color || 'grey';
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
