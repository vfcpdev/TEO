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
  colorPaletteOutline
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
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption
  ],
  template: `
    <div class="agenda-mobile-container">
      <ion-accordion-group>
        <!-- Accordion: Áreas -->
        <ion-accordion value="areas">
          <ion-item slot="header" class="agenda-accordion-header">
            <ion-icon name="briefcase-outline" slot="start" color="primary"></ion-icon>
            <ion-label>Áreas</ion-label>
            <ion-badge slot="end" color="primary">{{ agendaService.areas().length }}</ion-badge>
          </ion-item>
          <div slot="content" class="accordion-content-mobile">
            @for (area of agendaService.areas(); track area.id) {
            <div class="config-item-mobile" [class.inactive]="!area.isActive">
              <div class="item-icon-circle-mobile" [style.background-color]="area.color">
                <ion-icon [name]="area.icon"></ion-icon>
              </div>
              <span class="item-name">{{ area.name }}</span>
              <div class="actions-mobile">
                <ion-button fill="clear" size="small" (click)="editArea(area)">
                  <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                </ion-button>
                <ion-button fill="clear" size="small" color="danger" (click)="deleteArea(area)">
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-button>
              </div>
            </div>
            }
            
            @if (showAddAreaForm()) {
            <div class="add-item-form-mobile">
              <ion-input [(ngModel)]="newAreaName" fill="outline" placeholder="Nombre del área"></ion-input>
              <ion-button fill="solid" color="success" size="small" (click)="addArea()">
                <ion-icon slot="icon-only" name="checkmark"></ion-icon>
              </ion-button>
              <ion-button fill="solid" color="warning" size="small" (click)="showAddAreaForm.set(false)">
                <ion-icon slot="icon-only" name="close"></ion-icon>
              </ion-button>
            </div>
            } @else {
            <ion-button fill="clear" expand="block" color="primary" (click)="showAddAreaForm.set(true)" class="add-btn-mobile">
              <ion-icon slot="start" name="add-circle-outline"></ion-icon>
              Nueva Área
            </ion-button>
            }
          </div>
        </ion-accordion>

        <!-- Accordion: Tipos -->
        <ion-accordion value="tipos">
          <ion-item slot="header" class="agenda-accordion-header">
            <ion-icon name="color-palette-outline" slot="start" color="tertiary"></ion-icon>
            <ion-label>Tipos</ion-label>
            <ion-badge slot="end" color="tertiary">{{ agendaService.tipos().length }}</ion-badge>
          </ion-item>
          <div slot="content" class="accordion-content-mobile">
            @for (tipo of agendaService.tipos(); track tipo.id) {
            <div class="config-item-mobile">
              <div class="item-icon-circle-mobile" [style.background-color]="tipo.color">
                <ion-icon [name]="tipo.icon"></ion-icon>
              </div>
              <div class="item-info-mobile">
                <span class="item-name">{{ tipo.name }}</span>
                <span class="item-sub">{{ tipo.baseType }}</span>
              </div>
              <div class="actions-mobile">
                <ion-button fill="clear" size="small" (click)="editTipo(tipo)">
                  <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                </ion-button>
                <ion-button fill="clear" size="small" color="danger" (click)="deleteTipo(tipo)">
                  <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                </ion-button>
              </div>
            </div>
            }

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
            <ion-button fill="clear" expand="block" color="tertiary" (click)="showAddTipoForm.set(true)" class="add-btn-mobile">
              <ion-icon slot="start" name="add-circle-outline"></ion-icon>
              Nuevo Tipo
            </ion-button>
            }
          </div>
        </ion-accordion>

        <!-- Accordion: Contextos -->
        <ion-accordion value="contextos">
          <ion-item slot="header" class="agenda-accordion-header">
            <ion-icon name="leaf-outline" slot="start" color="success"></ion-icon>
            <ion-label>Contextos</ion-label>
            <ion-badge slot="end" color="success">{{ agendaService.contextos().length }}</ion-badge>
          </ion-item>
          <div slot="content" class="accordion-content-mobile">
            @for (ctx of agendaService.contextos(); track ctx.id) {
            <div class="config-item-mobile">
              <div class="ctx-dot-mobile" [style.background-color]="getAreaColor(ctx.areaId)"></div>
              <div class="item-info-mobile">
                <span class="item-name">{{ ctx.name }}</span>
                <span class="item-sub">{{ getAreaName(ctx.areaId) }}</span>
              </div>
              <ion-button fill="clear" size="small" color="danger" (click)="deleteContexto(ctx)">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-button>
            </div>
            }

            @if (showAddContextoForm()) {
            <div class="add-item-form-mobile ctx-form">
              <ion-select [(ngModel)]="selectedAreaId" placeholder="Área" interface="action-sheet">
                @for (area of agendaService.areas(); track area.id) {
                  <ion-select-option [value]="area.id">{{ area.name }}</ion-select-option>
                }
              </ion-select>
              <ion-input [(ngModel)]="newContextoName" fill="outline" placeholder="Nombre"></ion-input>
              <ion-button fill="solid" color="success" size="small" (click)="addContexto()">
                <ion-icon slot="icon-only" name="checkmark"></ion-icon>
              </ion-button>
            </div>
            } @else {
            <ion-button fill="clear" expand="block" color="success" (click)="showAddContextoForm.set(true)" class="add-btn-mobile">
              <ion-icon slot="start" name="add-circle-outline"></ion-icon>
              Nuevo Contexto
            </ion-button>
            }
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </div>
  `,
  styles: [`
    .agenda-mobile-container { padding: 0; }
    .agenda-accordion-header {
      --background: var(--ion-background-color);
      --min-height: 52px;
      ion-icon { font-size: 20px; margin-right: 12px; }
      ion-label { font-weight: 700; font-size: 0.9375rem; }
      ion-badge { border-radius: 8px; font-size: 0.75rem; }
    }
    .accordion-content-mobile { padding: 8px 12px; background: var(--ion-background-color); }
    .config-item-mobile {
      display: flex;
      align-items: center;
      background: var(--ion-color-step-50);
      margin-bottom: 6px;
      border-radius: 10px;
      padding: 8px 12px;
      
      &.inactive { opacity: 0.5; }
      
      .item-icon-circle-mobile {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        ion-icon { font-size: 16px; }
      }
      
      .ctx-dot-mobile { width: 8px; height: 8px; border-radius: 50%; margin-right: 12px; }
      
      .item-info-mobile {
        flex: 1;
        display: flex;
        flex-direction: column;
        .item-name { font-weight: 600; font-size: 0.875rem; }
        .item-sub { font-size: 0.75rem; color: var(--ion-color-medium); text-transform: uppercase; }
      }
      
      .item-name { flex: 1; font-weight: 500; font-size: 0.875rem; }
      .actions-mobile { display: flex; gap: 4px; }
    }
    .add-item-form-mobile {
      background: var(--ion-color-step-100);
      padding: 12px;
      border-radius: 12px;
      margin-top: 8px;
      display: flex;
      gap: 8px;
      align-items: center;
      
      &.ctx-form { flex-direction: column; align-items: stretch; }
      ion-input { --background: var(--ion-background-color); border-radius: 8px; font-size: 0.875rem; }
    }
    .add-btn-mobile { margin-top: 12px; --border-style: dashed; --border-width: 1px; font-size: 0.875rem; }
  `]
})
export class AgendaMobileComponent {
  readonly agendaService = inject(AgendaService);
  private readonly alertController = inject(AlertController);

  // UI State
  showAddAreaForm = signal(false);
  showAddTipoForm = signal(false);
  showAddContextoForm = signal(false);

  // Form Inputs
  newAreaName = '';
  newTipoName = '';
  newContextoName = '';
  selectedAreaId = '';

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
      colorPaletteOutline
    });
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
    if (!this.newContextoName.trim() || !this.selectedAreaId) return;
    this.agendaService.addContexto({
      areaId: this.selectedAreaId,
      name: this.newContextoName,
      isActive: true
    });
    this.newContextoName = '';
    this.showAddContextoForm.set(false);
  }

  deleteContexto(ctx: ContextoConfig) {
    this.confirmAction('Eliminar Contexto', `¿Deseas eliminar "${ctx.name}"?`, () => {
      this.agendaService.deleteContexto(ctx.id);
    });
  }

  // --- HELPERS ---
  getAreaName(id: string) {
    return this.agendaService.areas().find(a => a.id === id)?.name || 'N/A';
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
