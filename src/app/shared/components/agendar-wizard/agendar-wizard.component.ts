import { Component, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonButton, IonInput, IonItem, IonLabel, IonCheckbox,
  IonIcon, IonDatetime, IonButtons, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../core/services/agenda.service';
import { addIcons } from 'ionicons';
import { folderOutline, folderOpenOutline, documentOutline, calendarOutline, timeOutline, checkmarkCircle } from 'ionicons/icons';
import { timePickerModal } from 'analogue-time-picker';

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
        
        <!-- Fecha y Hora en el Header -->
        <ion-buttons slot="end" class="datetime-buttons">
          <ion-button fill="clear" (click)="showDateTimePicker('inicio')">
            <ion-icon slot="start" name="calendar-outline"></ion-icon>
            <span class="datetime-label">
              {{ fechaInicio ? formatDateTime(fechaInicio) : 'Inicio' }}
            </span>
          </ion-button>
          
          <ion-button fill="clear" (click)="showDateTimePicker('fin')">
            <ion-icon slot="start" name="time-outline"></ion-icon>
            <span class="datetime-label">
              {{ fechaFin ? formatDateTime(fechaFin) : 'Fin' }}
            </span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Selector de Fecha/Hora con 5 Tabs Stepper -->
      @if (showingDateTimePicker) {
        <div class="datetime-modal-overlay" (click)="closeDateTimePicker()">
          <div class="datetime-modal-content stepper-modal" (click)="$event.stopPropagation()">
            <h3>{{ currentPickerType === 'inicio' ? 'Seleccionar Inicio' : 'Seleccionar Fin' }}</h3>
            
            <!-- Stepper Tabs -->
            <ion-segment [(ngModel)]="selectedTab" swipeGesture="true" (ionChange)="onTabChange()">
              <ion-segment-button value="fecha-inicio">
                <ion-label>Fecha Inicio</ion-label>
              </ion-segment-button>
              <ion-segment-button value="hora-inicio">
                <ion-label>Hora Inicio</ion-label>
              </ion-segment-button>
              <ion-segment-button value="fecha-fin">
                <ion-label>Fecha Fin</ion-label>
              </ion-segment-button>
              <ion-segment-button value="hora-fin">
                <ion-label>Hora Fin</ion-label>
              </ion-segment-button>
              <ion-segment-button value="resumen">
                <ion-label>Resumen</ion-label>
              </ion-segment-button>
            </ion-segment>

            <!-- Tab 1: Fecha Inicio -->
            @if (selectedTab === 'fecha-inicio') {
              <div class="tab-content">
                <h4>Selecciona la fecha de inicio</h4>
                <ion-datetime 
                  [(ngModel)]="fechaInicioTemp"
                  presentation="date"
                  [min]="minDate"
                  locale="es-ES"
                  [showDefaultButtons]="false">
                </ion-datetime>
                <div class="nav-buttons">
                  <ion-button fill="outline" (click)="closeDateTimePicker()">Cancelar</ion-button>
                  <ion-button (click)="nextTab()">Siguiente</ion-button>
                </div>
              </div>
            }

            <!-- Tab 2: Hora Inicio -->
            @if (selectedTab === 'hora-inicio') {
              <div class="tab-content">
                <h4>Selecciona la hora de inicio</h4>
                <div class="analog-clock-container">
                  <div id="analog-clock-inicio"></div>
                </div>
                <div class="nav-buttons">
                  <ion-button fill="outline" (click)="prevTab()">Atrás</ion-button>
                  <ion-button (click)="nextTab()">Siguiente</ion-button>
                </div>
              </div>
            }

            <!-- Tab 3: Fecha Fin -->
            @if (selectedTab === 'fecha-fin') {
              <div class="tab-content">
                <h4>Selecciona la fecha de fin</h4>
                <ion-datetime 
                  [(ngModel)]="fechaFinTemp"
                  presentation="date"
                  [min]="fechaInicioTemp || minDate"
                  locale="es-ES"
                  [showDefaultButtons]="false">
                </ion-datetime>
                <div class="nav-buttons">
                  <ion-button fill="outline" (click)="prevTab()">Atrás</ion-button>
                  <ion-button (click)="nextTab()">Siguiente</ion-button>
                </div>
              </div>
            }

            <!-- Tab 4: Hora Fin -->
            @if (selectedTab === 'hora-fin') {
              <div class="tab-content">
                <h4>Selecciona la hora de fin</h4>
                <div class="analog-clock-container">
                  <div id="analog-clock-fin"></div>
                </div>
                <div class="nav-buttons">
                  <ion-button fill="outline" (click)="prevTab()">Atrás</ion-button>
                  <ion-button (click)="nextTab()">Siguiente</ion-button>
                </div>
              </div>
            }

            <!-- Tab 5: Resumen -->
            @if (selectedTab === 'resumen') {
              <div class="tab-content resumen-content">
                <h4>Resumen de la selección</h4>
                <div class="resumen-item">
                  <strong>Inicio:</strong>
                  <span>{{ formatFullDateTime(fechaInicioTemp, horaInicio) }}</span>
                </div>
                <div class="resumen-item">
                  <strong>Fin:</strong>
                  <span>{{ formatFullDateTime(fechaFinTemp, horaFin) }}</span>
                </div>
                <div class="resumen-item">
                  <strong>Duración:</strong>
                  <span>{{ calculateDuration() }}</span>
                </div>
                <div class="nav-buttons">
                  <ion-button fill="outline" (click)="prevTab()">Atrás</ion-button>
                  <ion-button color="success" (click)="confirmDateTime()">
                    <ion-icon slot="start" name="checkmark-circle"></ion-icon>
                    Confirmar
                  </ion-button>
                </div>
              </div>
            }
          </div>
        </div>
      }

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
    /* Header DateTime Buttons */
    .datetime-buttons {
      display: flex;
      gap: 8px;
    }

    .datetime-buttons ion-button {
      --color: white;
      font-size: 13px;
      text-transform: none;
    }

    .datetime-label {
      margin-left: 4px;
      white-space: nowrap;
    }

    /* DateTime Modal Overlay */
    .datetime-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .datetime-modal-content {
      background: var(--ion-background-color);
      border-radius: 16px;
      padding: 24px;
      max-width: 90%;
      max-height: 80%;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .datetime-modal-content h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: var(--ion-text-color);
    }

    /* Tabs */
    ion-segment {
      margin-bottom: 20px;
    }

    .tab-content {
      min-height: 350px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Analog Clock Container */
    .analog-clock-container {
      padding: 20px;
    }

    .datetime-modal-content ion-datetime {
      margin-bottom: 16px;
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 24px;
    }

    .form-section h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--ion-text-color);
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

    /* Save Button Enhancement */
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

    /* Responsive */
    @media (max-width: 768px) {
      .datetime-buttons ion-button {
        font-size: 11px;
      }
      
      .datetime-label {
        display: none;
      }
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
    IonIcon,
    IonDatetime,
    IonButtons,
    IonSegment,
    IonSegmentButton
  ]
})
export class AgendarWizardComponent implements AfterViewInit, OnDestroy {
  private modalCtrl = inject(ModalController);
  private agendaService = inject(AgendaService);

  nombreRegistro = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  // Propiedades temporales para el picker
  fechaInicioTemp: string = '';
  fechaFinTemp: string = '';

  // Hora seleccionada del reloj analógico
  horaInicio = { hour: 9, minute: 0 };
  horaFin = { hour: 10, minute: 0 };

  minDate = new Date().toISOString();
  treeNodes = signal<TreeNode[]>([]);

  showingDateTimePicker = false;
  currentPickerType: 'inicio' | 'fin' = 'inicio';
  selectedTab: 'fecha-inicio' | 'hora-inicio' | 'fecha-fin' | 'hora-fin' | 'resumen' = 'fecha-inicio';

  // Instancias del reloj analógico
  private analogClockInicio: any = null;
  private analogClockFin: any = null;

  constructor() {
    addIcons({ folderOutline, folderOpenOutline, documentOutline, calendarOutline, timeOutline, checkmarkCircle });
    this.loadTreeData();
  }

  ngAfterViewInit() {
    // Inicialización después de que la vista esté lista
  }

  ngOnDestroy() {
    // Limpiar relojes analógicos
    if (this.analogClockInicio) {
      this.analogClockInicio.dispose();
    }
    if (this.analogClockFin) {
      this.analogClockFin.dispose();
    }
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

  showDateTimePicker(type: 'inicio' | 'fin') {
    this.currentPickerType = type;
    this.selectedTab = 'fecha-inicio'; // Siempre empezar en el primer tab

    // Inicializar valores temporales
    if (type === 'inicio') {
      this.fechaInicioTemp = this.fechaInicio || new Date().toISOString();
    } else {
      this.fechaFinTemp = this.fechaFin || this.fechaInicio || new Date().toISOString();
    }

    this.showingDateTimePicker = true;

    // Inicializar reloj analógico después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => this.initAnalogClock(), 100);
  }

  onTabChange() {
    // Inicializar reloj analógico cuando se cambia a tabs de hora
    if (this.selectedTab === 'hora-inicio' || this.selectedTab === 'hora-fin') {
      setTimeout(() => this.initAnalogClock(), 100);
    }
  }

  private initAnalogClock() {
    // Determinar qué reloj inicializar según el tab actual
    const clockType = this.selectedTab === 'hora-inicio' ? 'inicio' :
      this.selectedTab === 'hora-fin' ? 'fin' : null;

    if (!clockType) return;

    const containerId = `analog-clock-${clockType}`;
    const container = document.getElementById(containerId);

    if (!container) return;

    // Limpiar reloj anterior si existe
    if (this.currentPickerType === 'inicio' && this.analogClockInicio) {
      this.analogClockInicio.dispose();
    } else if (this.currentPickerType === 'fin' && this.analogClockFin) {
      this.analogClockFin.dispose();
    }

    // Crear nuevo reloj analógico
    const time = this.currentPickerType === 'inicio' ? this.horaInicio : this.horaFin;

    const clock = timePickerModal({
      mode: 24,
      width: '280px',
      time: time
    });

    // Renderizar el reloj en el contenedor
    container.innerHTML = ''; // Limpiar contenedor
    container.appendChild(clock.element);

    // Guardar instancia
    if (this.currentPickerType === 'inicio') {
      this.analogClockInicio = clock;
    } else {
      this.analogClockFin = clock;
    }

    // Actualizar hora cuando cambie
    clock.onOk = (time: any) => {
      if (this.currentPickerType === 'inicio') {
        this.horaInicio = time;
      } else {
        this.horaFin = time;
      }
    };
  }

  confirmDateTime() {
    if (this.currentPickerType === 'inicio') {
      // Combinar fecha y hora
      const fecha = new Date(this.fechaInicioTemp);
      fecha.setHours(this.horaInicio.hour, this.horaInicio.minute, 0, 0);
      this.fechaInicio = fecha.toISOString();
    } else {
      const fecha = new Date(this.fechaFinTemp);
      fecha.setHours(this.horaFin.hour, this.horaFin.minute, 0, 0);
      this.fechaFin = fecha.toISOString();
    }

    this.closeDateTimePicker();
  }

  closeDateTimePicker() {
    this.showingDateTimePicker = false;
    this.selectedTab = 'fecha-inicio'; // Reset al primer tab
  }

  formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
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
      contextoIds: selectedContextos
    };

    await this.modalCtrl.dismiss(result);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  nextTab() {
    const tabs: Array<typeof this.selectedTab> = ['fecha-inicio', 'hora-inicio', 'fecha-fin', 'hora-fin', 'resumen'];
    const currentIndex = tabs.indexOf(this.selectedTab);
    if (currentIndex < tabs.length - 1) {
      this.selectedTab = tabs[currentIndex + 1];
    }
  }

  prevTab() {
    const tabs: Array<typeof this.selectedTab> = ['fecha-inicio', 'hora-inicio', 'fecha-fin', 'hora-fin', 'resumen'];
    const currentIndex = tabs.indexOf(this.selectedTab);
    if (currentIndex > 0) {
      this.selectedTab = tabs[currentIndex - 1];
    }
  }

  formatFullDateTime(dateISO: string, time: { hour: number, minute: number }): string {
    if (!dateISO) return 'No seleccionado';

    const date = new Date(dateISO);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = time.hour.toString().padStart(2, '0');
    const minutes = time.minute.toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  calculateDuration(): string {
    if (!this.fechaInicioTemp || !this.fechaFinTemp) return 'No calculado';

    const inicio = new Date(this.fechaInicioTemp);
    inicio.setHours(this.horaInicio.hour, this.horaInicio.minute, 0, 0);

    const fin = new Date(this.fechaFinTemp);
    fin.setHours(this.horaFin.hour, this.horaFin.minute, 0, 0);

    const diffMs = fin.getTime() - inicio.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }
}
