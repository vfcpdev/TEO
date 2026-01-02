import { Component, inject, signal, Input, effect } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonIcon, IonToggle
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../core/services/agenda.service';
import { addIcons } from 'ionicons';
import { folderOutline, folderOpenOutline, documentOutline, calendarOutline, timeOutline, checkmarkCircle, notificationsOutline, alarmOutline } from 'ionicons/icons';
import { DateTimePickerModalComponent } from '../date-time-picker-modal/date-time-picker-modal.component';
import { Registro } from '../../../models/registro.model';
import { trashOutline, addCircleOutline } from 'ionicons/icons';

interface TreeNode {
  id: string;
  name: string;
  type: 'area' | 'contexto';
  icon: string;
  color?: string;
  children?: TreeNode[];
  expanded?: boolean;
  selected?: boolean;
  parentId?: string;
}

@Component({
  selector: 'app-agendar-wizard',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Agendar Registro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Sección de Fecha y Hora (Simulando Moots Picker Flow) -->
      <div class="form-section">
        <h3>Fecha y Hora</h3>
        
        <ion-item (click)="openDateTimePicker('inicio')" button detail="false" class="datetime-item">
          <ion-icon slot="start" name="calendar-outline" color="primary"></ion-icon>
          <ion-label>
            <h3>Inicio</h3>
            <p>{{ fechaInicio ? formatDateTime(fechaInicio) : 'Seleccionar fecha y hora' }}</p>
          </ion-label>
          <ion-icon slot="end" name="time-outline" color="medium"></ion-icon>
        </ion-item>

        <div class="connector-line"></div>

        <ion-item (click)="openDateTimePicker('fin')" button detail="false" class="datetime-item">
          <ion-icon slot="start" name="calendar-outline" color="secondary"></ion-icon>
          <ion-label>
            <h3>Fin</h3>
            <p>{{ fechaFin ? formatDateTime(fechaFin) : 'Seleccionar fecha y hora' }}</p>
          </ion-label>
          <ion-icon slot="end" name="time-outline" color="medium"></ion-icon>
        </ion-item>

        <div class="duration-display" *ngIf="fechaInicio && fechaFin">
          <p>Duración: <strong>{{ calculateDuration() }}</strong></p>
        </div>
      </div>

      <!-- Recordatorios -->
      <div class="form-section">
        <h3>Recordatorios</h3>
        <ion-item lines="none">
          <ion-icon slot="start" name="notifications-outline" color="warning"></ion-icon>
          <ion-label>Configurar avisos</ion-label>
          <ion-button fill="clear" (click)="addReminder()">
            <ion-icon name="add-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-item>

        <div class="reminders-list">
          @for (reminder of reminders(); track reminder.id) {
            <div class="reminder-item-row">
                <ion-item lines="none" class="reminder-input-item">
                    <ion-label position="stacked">Minutos antes</ion-label>
                    <ion-input type="number" [(ngModel)]="reminder.time" placeholder="Ej: 15"></ion-input>
                </ion-item>
                <ion-button fill="clear" color="danger" (click)="removeReminder(reminder.id)">
                    <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-button>
            </div>
          }
          @if (reminders().length === 0) {
            <p class="no-reminders-text">Sin recordatorios configurados</p>
          }
        </div>
      </div>

      <!-- Nombre del Registro -->
      <div class="form-section">
        <h3>Nombre del Registro</h3>
        <ion-item>
          <ion-input 
            [(ngModel)]="nombreRegistro" 
            placeholder="Escribe el nombre..."
            type="text">
          </ion-input>
        </ion-item>
      </div>

      <!-- Árbol de Áreas y Contextos -->
      <div class="form-section">
        <h3>Áreas y Contextos</h3>
        <div class="tree-container">
          @for (node of treeNodes(); track node.id) {
            <div class="tree-node">
              <div class="node-item area-item" (click)="toggleNode(node)">
                <ion-checkbox 
                  [(ngModel)]="node.selected"
                  (ionChange)="onNodeSelect(node, $event)"
                  (click)="$event.stopPropagation()">
                </ion-checkbox>
                <ion-icon 
                  [name]="node.expanded ? 'folder-open-outline' : 'folder-outline'"
                  [style.color]="node.color">
                </ion-icon>
                <ion-label>{{ node.name }}</ion-label>
              </div>

              @if (node.expanded && node.children && node.children.length > 0) {
                <div class="children-container">
                  @for (child of node.children; track child.id) {
                    <div class="node-item contexto-item">
                      <ion-checkbox 
                        [(ngModel)]="child.selected"
                        (ionChange)="onNodeSelect(child, $event)">
                      </ion-checkbox>
                      <ion-icon name="document-outline"></ion-icon>
                      <ion-label>{{ child.name }}</ion-label>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button slot="start" fill="outline" (click)="dismiss()">
          Cancelar
        </ion-button>
        <ion-button 
          slot="end" 
          (click)="save()" 
          [disabled]="!isValid()"
          class="save-button"
          color="success">
          <ion-icon slot="start" name="checkmark-circle"></ion-icon>
          Agendar
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .form-section {
      margin-bottom: 24px;
    }

    .form-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--ion-text-color);
    }

    .datetime-item {
      --background: var(--ion-card-background);
      --border-radius: 8px;
      margin-bottom: 8px;
    }

    .connector-line {
      height: 16px;
      width: 2px;
      background: var(--ion-color-medium);
      opacity: 0.3;
      margin-left: 36px; /* Align with icon center approximately */
    }

    .duration-display {
      margin-top: 12px;
      text-align: right;
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    /* Tree Container */
    .tree-container {
      border: 1px solid var(--ion-border-color);
      border-radius: 8px;
      padding: 8px;
      background: var(--ion-card-background);
      max-height: 300px;
      overflow-y: auto;
    }

    .tree-node {
      margin-bottom: 8px;
    }

    .node-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
       transition: background 0.2s;
    }

    .node-item:hover {
      background: rgba(var(--ion-color-primary-rgb), 0.05);
    }

    .area-item {
      font-weight: 600;
    }

    .area-item ion-icon {
      font-size: 24px;
    }

    .children-container {
      margin-left: 32px;
      padding-left: 16px;
      border-left: 2px solid var(--ion-border-color);
      margin-top: 4px;
    }

    .contexto-item {
      font-size: 14px;
    }

    .contexto-item ion-icon {
      font-size: 20px;
      color: var(--ion-color-medium);
    }

    /* Footer */
    ion-footer ion-toolbar {
      padding: 12px;
    }

    .save-button {
      --padding-start: 24px;
      --padding-end: 24px;
      font-weight: 600;
      font-size: 16px;
      text-transform: none;
    }

    .save-button ion-icon {
      font-size: 20px;
    }

    .reminder-item-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding-left: 16px;
    }
    
    .reminder-input-item {
        flex: 1;
        --background: var(--ion-color-light);
        border-radius: 8px;
    }
    
    .no-reminders-text {
        padding-left: 16px;
        font-size: 0.9rem;
        color: var(--ion-color-medium);
        font-style: italic;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonIcon
  ]
})
export class AgendarWizardComponent {
  private modalCtrl = inject(ModalController);
  private agendaService = inject(AgendaService);
  @Input() registro?: Registro;

  nombreRegistro = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  reminders = signal<{ id: string, time: number }[]>([]);

  treeNodes = signal<TreeNode[]>([]);

  constructor() {
    addIcons({ folderOutline, folderOpenOutline, documentOutline, calendarOutline, timeOutline, checkmarkCircle, notificationsOutline, alarmOutline, trashOutline, addCircleOutline });
    this.loadTreeData();

    // Initialize with input date or registro values
    effect(() => {
      if (this.registro) {
        this.nombreRegistro = this.registro.name;
        this.fechaInicio = this.registro.startTime ? new Date(this.registro.startTime).toISOString() : '';
        this.fechaFin = this.registro.endTime ? new Date(this.registro.endTime).toISOString() : '';

        // Load existing reminders (legacy + multiple)
        const initialReminders = [];
        if (this.registro.reminders && this.registro.reminders.length > 0) {
          initialReminders.push(...this.registro.reminders.map(r => ({ id: r.id, time: r.time })));
        } else if (this.registro.reminderEnabled && this.registro.reminderTime) {
          // Convert legacy to new format
          initialReminders.push({ id: crypto.randomUUID(), time: this.registro.reminderTime });
        }
        this.reminders.set(initialReminders);

        // Match tree nodes selection
        this.treeNodes.update(nodes => {
          return nodes.map(node => {
            if (this.registro?.areaId === node.id) {
              node.selected = true;
              node.expanded = true;
            }
            if (node.children) {
              node.children.forEach(child => {
                if (this.registro?.contextoId === child.id) {
                  child.selected = true;
                  node.expanded = true;
                }
              });
            }
            return node;
          });
        });
      } else {
        // Initialize defaults for new record
        const now = new Date();
        now.setMinutes(0, 0, 0);
        this.fechaInicio = now.toISOString();

        const end = new Date(now);
        end.setHours(end.getHours() + 1);
        this.fechaFin = end.toISOString();
      }
    });
  }

  private loadTreeData() {
    const areas = this.agendaService.areas() || [];
    const contextos = this.agendaService.contextos() || [];

    const tree: TreeNode[] = areas
      .filter(area => area.isActive)
      .sort((a, b) => a.order - b.order)
      .map(area => ({
        id: area.id,
        name: area.name,
        type: 'area' as const,
        icon: area.icon,
        color: area.color,
        expanded: false,
        selected: false,
        children: contextos
          .filter(ctx => ctx.isActive && ctx.areaIds.includes(area.id))
          .map(ctx => ({
            id: ctx.id,
            name: ctx.name,
            type: 'contexto' as const,
            icon: 'document-outline',
            selected: false,
            parentId: area.id
          }))
      }));

    this.treeNodes.set(tree);
  }

  async openDateTimePicker(type: 'inicio' | 'fin') {
    const initialValue = type === 'inicio' ? this.fechaInicio : this.fechaFin;
    const minDate = type === 'fin' ? this.fechaInicio : undefined;

    const modal = await this.modalCtrl.create({
      component: DateTimePickerModalComponent,
      componentProps: {
        title: type === 'inicio' ? 'Seleccionar Inicio' : 'Seleccionar Fin',
        initialValue: initialValue || new Date().toISOString(),
        minDate: minDate
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      if (type === 'inicio') {
        this.fechaInicio = data;
        // Auto adjust end date if it's before start date
        if (this.fechaFin && new Date(this.fechaFin) <= new Date(this.fechaInicio)) {
          const newEnd = new Date(this.fechaInicio);
          newEnd.setHours(newEnd.getHours() + 1);
          this.fechaFin = newEnd.toISOString();
        }
      } else {
        this.fechaFin = data;
      }
    }
  }

  formatDateTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    this.treeNodes.set([...this.treeNodes()]);
  }

  onNodeSelect(node: TreeNode, event: any) {
    node.selected = event.detail.checked;

    if (node.type === 'area' && node.children) {
      node.children.forEach(child => {
        child.selected = node.selected;
      });
    }

    this.treeNodes.set([...this.treeNodes()]);
  }

  isValid(): boolean {
    return !!(this.nombreRegistro && this.fechaInicio && this.fechaFin);
  }

  async save() {
    const selectedAreas = this.treeNodes()
      .filter(node => node.selected)
      .map(node => node.id);

    const selectedContextos = this.treeNodes()
      .reduce((acc, node) => acc.concat(node.children || []), [] as TreeNode[])
      .filter(child => child.selected)
      .map(child => child.id);

    const result = {
      nombre: this.nombreRegistro,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      areaIds: selectedAreas,
      contextoIds: selectedContextos,
      reminders: this.reminders()
    };

    await this.modalCtrl.dismiss(result);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  calculateDuration(): string {
    if (!this.fechaInicio || !this.fechaFin) return 'No calculado';

    const inicio = new Date(this.fechaInicio);
    const fin = new Date(this.fechaFin);

    const diffMs = fin.getTime() - inicio.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  addReminder() {
    this.reminders.update(current => [
      ...current,
      { id: crypto.randomUUID(), time: 15 } // Default 15 min
    ]);
  }

  removeReminder(id: string) {
    this.reminders.update(current => current.filter(r => r.id !== id));
  }
}

