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
    IonButton,
    IonIcon,
    IonBadge,
    IonInput,
    IonSelect,
    IonSelectOption
  ],
  template: `
    <div class="agenda-desktop-container">
      <div class="agenda-grid">
        <!-- Columna: Áreas -->
        <div class="agenda-column">
          <div class="column-header">
            <ion-icon name="briefcase-outline" color="primary"></ion-icon>
            <h3>Áreas</h3>
            <ion-badge color="primary">{{ agendaService.areas().length }}</ion-badge>
          </div>
          <p class="section-desc">Dimensiones principales de tu vida.</p>
          <div class="column-content">
            <div class="config-list">
              @for (area of agendaService.areas(); track area.id) {
              <div class="config-item" [class.inactive]="!area.isActive">
                <div class="item-icon-circle" [style.background-color]="area.color">
                  <ion-icon [name]="area.icon"></ion-icon>
                </div>
                <div class="item-info">
                  <span class="item-name">{{ area.name }}</span>
                  <span class="item-sub">Área</span>
                </div>
                <div class="item-actions">
                  <ion-button fill="clear" size="small" (click)="editArea(area)">
                    <ion-icon slot="icon-only" name="create-outline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" size="small" color="danger" (click)="deleteArea(area)">
                    <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>
              }
            </div>
            <div class="add-item-container">
              <ion-input [(ngModel)]="newAreaName" placeholder="Nueva área" class="custom-input"></ion-input>
              <ion-button fill="solid" size="small" (click)="addArea()">
                <ion-icon slot="icon-only" name="add"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Columna: Tipos -->
        <div class="agenda-column">
          <div class="column-header">
            <ion-icon name="color-palette-outline" color="tertiary"></ion-icon>
            <h3>Tipos</h3>
            <ion-badge color="tertiary">{{ agendaService.tipos().length }}</ion-badge>
          </div>
          <p class="section-desc">Categorías de actividades personalizadas.</p>
          <div class="column-content">
            <div class="config-list">
              @for (tipo of agendaService.tipos(); track tipo.id) {
              <div class="config-item">
                <div class="item-icon-circle" [style.background-color]="tipo.color">
                  <ion-icon [name]="tipo.icon"></ion-icon>
                </div>
                <div class="item-info">
                  <span class="item-name">{{ tipo.name }}</span>
                  <span class="item-sub">{{ tipo.baseType }}</span>
                </div>
                <div class="item-actions">
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
            <div class="add-item-container type-add">
              <ion-input [(ngModel)]="newTipoName" placeholder="Nuevo tipo" class="custom-input"></ion-input>
              <ion-button fill="solid" color="tertiary" size="small" (click)="addTipo()">
                <ion-icon slot="icon-only" name="add"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Columna: Contextos -->
        <div class="agenda-column">
          <div class="column-header">
            <ion-icon name="leaf-outline" color="success"></ion-icon>
            <h3>Contextos</h3>
            <ion-badge color="success">{{ agendaService.contextos().length }}</ion-badge>
          </div>
          <p class="section-desc">Ubicaciones o sub-categorías de áreas.</p>
          <div class="column-content">
            <div class="config-list">
              @for (ctx of agendaService.contextos(); track ctx.id) {
              <div class="config-item">
                <div class="ctx-dot" [style.background-color]="getAreaColor(ctx.areaId)"></div>
                <div class="item-info">
                  <span class="item-name">{{ ctx.name }}</span>
                  <span class="item-sub">{{ getAreaName(ctx.areaId) }}</span>
                </div>
                <div class="item-actions">
                  <ion-button fill="clear" size="small" color="danger" (click)="deleteContexto(ctx)">
                    <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>
              }
            </div>
            <div class="add-item-container ctx-add">
              <div class="ctx-form-row">
                <ion-select [(ngModel)]="selectedAreaId" placeholder="Área" interface="popover" class="mini-select">
                  @for (area of agendaService.areas(); track area.id) {
                    <ion-select-option [value]="area.id">{{ area.name }}</ion-select-option>
                  }
                </ion-select>
                <ion-input [(ngModel)]="newContextoName" placeholder="Nuevo contexto" class="custom-input"></ion-input>
                <ion-button fill="solid" color="success" size="small" (click)="addContexto()">
                  <ion-icon slot="icon-only" name="add"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .agenda-desktop-container {
      padding: 0 16px;
    }

    .section-desc {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: -8px 0 16px;
    }

    .agenda-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .agenda-column {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
      border: 1px solid var(--ion-color-step-100);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .column-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--ion-color-step-100);

      ion-icon {
        font-size: 20px;
      }

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        flex: 1;
      }
    }

    .column-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .config-list {
      flex: 1;
      overflow-y: auto;
      max-height: 450px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .config-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: var(--ion-color-step-50);
      border-radius: 10px;
      transition: all 0.2s;
      border: 1px solid transparent;

      &:hover {
        background-color: var(--ion-color-step-100);
        border-color: var(--ion-color-primary-light);
      }

      &.inactive {
        opacity: 0.5;
        filter: grayscale(0.8);
      }

      .item-icon-circle {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);

        ion-icon {
          font-size: 16px;
        }
      }

      .ctx-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 12px;
        margin-left: 4px;
      }

      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .item-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--ion-text-color);
        }

        .item-sub {
          font-size: 0.75rem;
          color: var(--ion-color-medium);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .item-actions {
        display: flex;
        gap: 2px;
      }
    }

    .add-item-container {
      display: flex;
      gap: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--ion-color-step-100);

      .custom-input {
        --padding-start: 12px;
        --padding-end: 12px;
        font-size: 0.875rem;
        background: var(--ion-color-step-50);
        border-radius: 10px;
        --placeholder-color: var(--ion-color-medium);
      }

      &.ctx-add {
        .ctx-form-row {
          width: 100%;
          display: flex;
          gap: 8px;
          align-items: center;

          .mini-select {
            --padding-start: 8px;
            --padding-end: 0;
            min-width: 100px;
            font-size: 0.8125rem;
            background: var(--ion-color-step-50);
            border-radius: 10px;
          }
        }
      }
    }
  `]
})
export class AgendaDesktopComponent {
  readonly agendaService = inject(AgendaService);
  private readonly alertController = inject(AlertController);

  // Inputs
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
      add,
      peopleOutline,
      personOutline,
      chatbubblesOutline,
      leafOutline,
      createOutline,
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
  }

  deleteArea(area: AreaConfig) {
    this.confirmAction('Eliminar Área', `¿Deseas eliminar "${area.name}"? Esto borrará también sus contextos asociados.`, () => {
      this.agendaService.deleteArea(area.id);
    });
  }

  async editArea(area: AreaConfig) {
    const alert = await this.alertController.create({
      header: 'Editar Área',
      inputs: [
        { name: 'name', type: 'text', value: area.name, placeholder: 'Nombre' },
        { name: 'icon', type: 'text', value: area.icon, placeholder: 'Icono (Ionic)' },
        { name: 'color', type: 'text', value: area.color, placeholder: 'Color (Hex)' }
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
        { name: 'baseType', type: 'text', value: tipo.baseType, placeholder: 'Base (evento/tarea/...)', disabled: true },
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
