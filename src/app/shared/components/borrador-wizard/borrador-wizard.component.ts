import { Component, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButton, IonInput, IonItem, IonLabel, IonCheckbox, IonIcon, IonButtons } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService } from '../../../core/services/agenda.service';
import { AreaConfig, ContextoConfig } from '../../../models/agenda.model';
import { addIcons } from 'ionicons';
import { folderOutline, folderOpenOutline, documentOutline } from 'ionicons/icons';

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
  selector: 'app-borrador-wizard',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Nuevo Borrador</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
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
            <div class="tree-node" [class.has-children]="node.children && node.children.length > 0">
              <!-- Área -->
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

              <!-- Contextos (hijos) -->
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
      <ion-toolbar color="light">
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            Cancelar
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [disabled]="!nombreRegistro">
            Guardar
          </ion-button>
        </ion-buttons>
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

    .tree-container {
      border: 1px solid var(--ion-border-color);
      border-radius: 8px;
      padding: 8px;
      background: var(--ion-card-background);
      max-height: 400px;
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

    ion-footer ion-toolbar {
      padding: 12px;
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
    IonButtons
  ]
})
export class BorradorWizardComponent {
  private modalCtrl = inject(ModalController);
  private agendaService = inject(AgendaService);

  nombreRegistro = '';
  treeNodes = signal<TreeNode[]>([]);

  constructor() {
    addIcons({ folderOutline, folderOpenOutline, documentOutline });
    this.loadTreeData();
  }

  private loadTreeData() {
    // Obtener áreas y contextos del servicio
    const areas = this.agendaService.areas() || [];
    const contextos = this.agendaService.contextos() || [];

    // Construir árbol
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

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    this.treeNodes.set([...this.treeNodes()]);
  }

  onNodeSelect(node: TreeNode, event: any) {
    node.selected = event.detail.checked;

    // Si es un área, seleccionar/deseleccionar todos sus contextos
    if (node.type === 'area' && node.children) {
      node.children.forEach(child => {
        child.selected = node.selected;
      });
    }

    this.treeNodes.set([...this.treeNodes()]);
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
      areaIds: selectedAreas,
      contextoIds: selectedContextos
    };

    await this.modalCtrl.dismiss(result);
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
