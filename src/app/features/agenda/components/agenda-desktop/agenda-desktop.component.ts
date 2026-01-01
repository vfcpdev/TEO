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
      <div class="header-section compact">
        <ion-segment [(ngModel)]="mainSegment" mode="ios" class="main-nav">
          <ion-segment-button value="areas">
            <ion-label>Áreas</ion-label>
          </ion-segment-button>
          <ion-segment-button value="tipos">
            <ion-label>Tipos</ion-label>
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
                <div class="header-actions">
                  @if (selectedAreaIds().length > 0) {
                    <ion-button fill="clear" size="small" (click)="editSelectedArea()">
                      <ion-icon name="create-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" color="danger" (click)="deleteSelectedAreas()">
                      <ion-icon name="trash-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" color="medium" (click)="clearSelection()">
                      <ion-icon name="close"></ion-icon>
                    </ion-button>
                  }
                </div>
              </div>
              
              <div class="area-list-nav">
                @for (area of agendaService.areas(); track area.id) {
                  <div class="area-nav-item" 
                       [class.active]="activeAreaId() === area.id"
                       [class.selected]="selectedAreaIds().includes(area.id)">
                    <input type="checkbox" 
                           class="area-checkbox"
                           [checked]="selectedAreaIds().includes(area.id)"
                           (change)="toggleAreaSelection(area.id)"
                           (click)="$event.stopPropagation()">
                    <div class="area-content" (click)="activeAreaId.set(area.id)">
                      <div class="indicator" [style.background-color]="area.color"></div>
                      <ion-icon [name]="area.icon" [style.color]="area.color"></ion-icon>
                      <span class="name">{{ area.name }}</span>
                      <ion-badge color="medium" mode="ios">{{ getContextsForArea(area.id).length }}</ion-badge>
                    </div>
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
                        </div>
                      </div>
                    </div>

                    <div class="detail-single-col">
                      <!-- Card Contextos -->
                      <ion-card class="contexts-card glass-card">
                        
                        <!-- Single Bar Toolbar -->
                        <div class="contexts-toolbar">
                           <div class="left-tools">
                              <ion-icon name="leaf-outline" color="success" class="title-icon"></ion-icon>
                              <span class="toolbar-title">Contextos</span>
                              <ion-badge color="success" mode="ios">{{ getContextsForArea(area.id).length }}</ion-badge>
                           </div>
                           
                           <div class="right-tools">
                              <div class="add-group">
                                <ion-input class="compact-input" placeholder="Nuevo..." [(ngModel)]="newContextoName" (keyup.enter)="addContexto()"></ion-input>
                                <ion-button size="small" fill="solid" color="success" (click)="addContexto()">
                                  <ion-icon name="add" slot="icon-only"></ion-icon>
                                </ion-button>
                              </div>

                              <div class="divider-v"></div>

                              <ion-button size="small" fill="clear" color="medium" 
                                          [disabled]="!selectedContextId()" 
                                          (click)="selectedContextId() && editContexto(getContextById(selectedContextId()!))">
                                <ion-icon name="create-outline" slot="icon-only"></ion-icon>
                              </ion-button>
                              <ion-button size="small" fill="clear" color="danger" 
                                          [disabled]="!selectedContextId()"
                                          (click)="selectedContextId() && deleteContexto(getContextById(selectedContextId()!))">
                                <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                              </ion-button>
                           </div>
                        </div>
                        
                        <ion-card-content>
                          <div class="contexts-flex">
                            @for (ctx of getContextsForArea(area.id); track ctx.id) {
                              <div class="context-pill-desktop" 
                                   [class.selected]="selectedContextId() === ctx.id"
                                   (click)="toggleContextSelection(ctx.id)">
                                <span class="dot"></span>
                                <span class="name">{{ ctx.name }}</span>
                              </div>
                            } @empty {
                              <div class="empty-ctx">
                                <p>Sin contextos asignados.</p>
                              </div>
                            }
                          </div>
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
      justify-content: flex-start;
      align-items: center;
      border-bottom: 1px solid var(--ion-color-step-100);
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    
    .header-section.compact {
        padding-bottom: 0px;
        border-bottom: none;
    }

    .header-section .main-nav {
         width: auto;
         min-width: 300px;
         --background: var(--ion-color-step-50);
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
    }
      
    .areas-sidebar .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 8px;
    }
    
    .areas-sidebar .sidebar-header h3 { 
        margin: 0; font-size: 1rem; font-weight: 700; color: var(--ion-color-medium); text-transform: uppercase; 
    }
    
    .areas-sidebar .sidebar-header .header-actions {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .areas-sidebar .sidebar-header .header-actions ion-button {
        --padding-start: 8px;
        --padding-end: 8px;
        margin: 0;
        height: 32px;
    }
    
    .areas-sidebar .sidebar-header .header-actions ion-icon {
        font-size: 1.2rem;
    }
      
    .areas-sidebar .area-list-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
    }
      
    .areas-sidebar .area-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        background: transparent;
    }
        
    .areas-sidebar .area-nav-item:hover { background: var(--ion-color-step-100); }
    
    .areas-sidebar .area-nav-item.active { 
          background: white; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .areas-sidebar .area-nav-item.active .name { color: var(--ion-text-color); font-weight: 700; }
    
    .areas-sidebar .area-nav-item.selected {
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        border: 2px solid var(--ion-color-primary);
    }
    
    .areas-sidebar .area-nav-item.selected .name {
        color: var(--ion-text-color);
        font-weight: 600;
    }
    
    .areas-sidebar .area-nav-item .area-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--ion-color-primary);
    }
    
    .areas-sidebar .area-nav-item .area-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        cursor: pointer;
    }
        
    .areas-sidebar .area-nav-item .indicator {
          position: absolute;
          left: 0; top: 12px; bottom: 12px;
          width: 4px; border-radius: 0 4px 4px 0;
          opacity: 0; transition: opacity 0.2s;
    }
    
    .areas-sidebar .area-nav-item.active .indicator { opacity: 1; }
        
    .areas-sidebar .area-nav-item ion-icon { font-size: 1.4rem; }
    .areas-sidebar .area-nav-item .name { flex: 1; font-size: 0.95rem; color: var(--ion-color-step-700); }
    .areas-sidebar .area-nav-item ion-badge { font-size: 0.75rem; --padding-start: 6px; --padding-end: 6px; }

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
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      border-radius: 16px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.15);
    }
      
    .area-banner .banner-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
        
    .area-banner .banner-content .icon-circle {
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(4px);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
    }
    
    .area-banner .banner-content .icon-circle ion-icon { font-size: 1.1rem; }
        
    .area-banner .banner-content .title-info h1 { margin: 0; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.3px; }
      
    .area-banner .banner-actions { 
        display: flex; gap: 6px;
    }
    
    .area-banner .banner-actions ion-button { 
          --border-radius: 8px; 
          font-weight: 600;
          height: 28px;
          text-transform: none;
          font-size: 0.75rem;
          letter-spacing: 0;
          --box-shadow: none;
    }

    .detail-single-col {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .glass-card {
      border: 1px solid var(--ion-color-step-100);
      box-shadow: 0 8px 32px rgba(0,0,0,0.03);
      border-radius: 20px;
      margin: 0;
    }
      
    .contexts-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid var(--ion-color-step-100);
      background: rgba(255,255,255,0.4);
    }
      
    .contexts-toolbar .left-tools {
         display: flex; align-items: center; gap: 8px;
    }
    
    .contexts-toolbar .left-tools .title-icon { font-size: 1.2rem; }
    .contexts-toolbar .left-tools .toolbar-title { font-weight: 700; font-size: 1rem; color: var(--ion-text-color); }
      
    .contexts-toolbar .right-tools {
         display: flex; align-items: center; gap: 8px;
    }
         
    .contexts-toolbar .right-tools .add-group {
            display: flex; align-items: center; gap: 4px;
            background: var(--ion-color-step-50);
            padding: 2px 2px 2px 8px;
            border-radius: 8px;
            border: 1px solid var(--ion-color-step-150);
    }
            
    .contexts-toolbar .right-tools .add-group .compact-input {
               width: 120px;
               --padding-start: 0;
               --padding-end: 0;
               --padding-top: 0; 
               --padding-bottom: 0;
               min-height: 0; height: 28px;
               font-size: 0.85rem;
               --background: transparent;
    }
    
    .contexts-toolbar .right-tools .add-group ion-button { height: 28px; width: 28px; --padding-start:0; --padding-end:0; margin:0; }
         
    .contexts-toolbar .right-tools .divider-v {
            width: 1px; height: 24px; background: var(--ion-color-step-200); margin: 0 4px;
    }

    .contexts-flex {
      display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 8px; padding: 0 16px;
    }

    .context-pill-desktop {
      display: flex; align-items: center; gap: 8px;
      background: var(--ion-color-step-50);
      padding: 6px 16px;
      border-radius: 12px;
      border: 1px solid var(--ion-color-step-100);
      cursor: pointer;
      transition: all 0.2s;
    }
      
    .context-pill-desktop .dot { width: 6px; height: 6px; background: var(--ion-color-medium); border-radius: 50%; opacity: 0.5; }
    .context-pill-desktop .name { font-weight: 600; font-size: 0.9rem; color: var(--ion-text-color); }
      
    .context-pill-desktop:hover { background: var(--ion-color-step-100); }
      
    .context-pill-desktop.selected {
         background: var(--ion-color-primary-tint);
         border-color: var(--ion-color-primary);
    }
    
    .context-pill-desktop.selected .dot { background: var(--ion-color-primary); opacity: 1; }
    .context-pill-desktop.selected .name { color: var(--ion-color-primary-shade); }
    
    .add-ctx-row { display: none; }

    .tipos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      padding: 4px;
    }

    .tipo-card-desktop {
      border-radius: 20px; overflow: hidden; margin: 0;
      transition: transform 0.2s;
    }
    
    .tipo-card-desktop:hover { transform: translateY(-4px); }
      
    .tipo-card-desktop .tipo-header {
        height: 80px; border-top: 6px solid;
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 20px; background: var(--ion-color-step-50);
    }
        
    .tipo-card-desktop .tipo-header .tipo-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; 
    }
    
    .tipo-card-desktop .tipo-header .tipo-icon ion-icon { font-size: 1.5rem; }
      
    .tipo-card-desktop ion-card-content h3 { margin: 12px 0 4px; font-weight: 700; font-size: 1.1rem; }
    .tipo-card-desktop ion-card-content .base-type { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--ion-color-medium); }

    .add-tipo-card {
      border: 2px dashed var(--ion-color-step-300);
      border-radius: 20px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; color: var(--ion-color-medium); cursor: pointer;
      min-height: 180px; transition: all 0.2s;
    }
      
    .add-tipo-card:hover { background: var(--ion-color-step-50); color: var(--ion-color-primary); border-color: var(--ion-color-primary); }
    .add-tipo-card ion-icon { font-size: 2.5rem; }
    .add-tipo-card span { font-weight: 600; }

    .no-selection {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: var(--ion-color-medium); opacity: 0.6;
    }
    
    .no-selection ion-icon { font-size: 5rem; margin-bottom: 20px; }
    .no-selection h2 { margin: 0; font-weight: 800; }

    /* Modales Desktop */
    .desktop-modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      z-index: 2000; display: flex; align-items: center; justify-content: center;
    }
    .desktop-modal {
      background: white; width: 450px; border-radius: 24px; padding: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
    }
      
    .desktop-modal .modal-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
    }
    
    .desktop-modal .modal-header h3 { margin: 0; font-weight: 800; font-size: 1.5rem; }
    .desktop-modal .modal-header ion-button { --padding-start: 0; --padding-end: 0; }
      
    .desktop-modal .modal-body { margin-bottom: 32px; }
    .desktop-modal .modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
  `]
})
export class AgendaDesktopComponent {
  readonly agendaService = inject(AgendaService);
  private readonly alertController = inject(AlertController);

  // UI State
  mainSegment = signal('areas');
  activeAreaId = signal<string | null>(null);
  selectedContextId = signal<string | null>(null);
  selectedAreaIds = signal<string[]>([]);
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

  toggleAreaSelection(areaId: string) {
    const current = this.selectedAreaIds();
    if (current.includes(areaId)) {
      this.selectedAreaIds.set(current.filter(id => id !== areaId));
    } else {
      this.selectedAreaIds.set([...current, areaId]);
    }
  }

  clearSelection() {
    this.selectedAreaIds.set([]);
  }

  editSelectedArea() {
    const selectedIds = this.selectedAreaIds();
    if (selectedIds.length === 1) {
      const area = this.agendaService.areas().find(a => a.id === selectedIds[0]);
      if (area) {
        this.editArea(area);
      }
    }
  }

  deleteSelectedAreas() {
    const selectedIds = this.selectedAreaIds();
    if (selectedIds.length === 0) return;

    const message = selectedIds.length === 1
      ? `¿Deseas eliminar esta área?`
      : `¿Deseas eliminar ${selectedIds.length} áreas?`;

    this.confirmAction('Eliminar Áreas', message, () => {
      selectedIds.forEach(id => {
        this.agendaService.deleteArea(id);
        if (this.activeAreaId() === id) {
          this.activeAreaId.set(this.agendaService.areas()[0]?.id || null);
        }
      });
      this.clearSelection();
    });
  }

  toggleContextSelection(id: string) {
    if (this.selectedContextId() === id) {
      this.selectedContextId.set(null);
    } else {
      this.selectedContextId.set(id);
    }
  }

  getContextById(id: string) {
    return this.agendaService.contextos().find(c => c.id === id)!;
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
