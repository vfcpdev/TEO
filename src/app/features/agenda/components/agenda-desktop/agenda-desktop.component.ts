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
  styleUrls: ['./agenda-desktop.component.scss']
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
