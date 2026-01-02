import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AgendaService } from '../../../../core/services/agenda.service';

export interface FilterState {
  areaIds: string[];
  contextoIds: string[];
  tipoIds: string[];
  statusFilter: string[];
  showFreeTime?: boolean;
}

@Component({
  selector: 'app-agenda-filters',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="filters-container">
      <div class="filters-header">
        <h3>Filtros</h3>
        <ion-button fill="clear" size="small" (click)="clearFilters()">
          <ion-icon name="close-circle-outline" slot="start"></ion-icon>
          Limpiar
        </ion-button>
      </div>
      
      <div class="filter-section">
        <h4>
          <ion-icon name="grid-outline"></ion-icon>
          Áreas
        </h4>
        <div class="chips-container">
          @for (area of agendaService.areas(); track area.id) {
            <ion-chip 
              [class.selected]="isAreaSelected(area.id)"
              [style.--chip-color]="area.color"
              (click)="toggleArea(area.id)">
              <ion-icon [name]="area.icon"></ion-icon>
              <ion-label>{{ area.name }}</ion-label>
              @if (isAreaSelected(area.id)) {
                <ion-icon name="checkmark-circle" class="check-icon"></ion-icon>
              }
            </ion-chip>
          }
        </div>
      </div>
      
      @if (agendaService.contextos().length > 0) {
        <div class="filter-section">
          <h4>
            <ion-icon name="location-outline"></ion-icon>
            Contextos
          </h4>
          <div class="chips-container">
            @for (ctx of agendaService.contextos(); track ctx.id) {
              <ion-chip 
                [class.selected]="isContextoSelected(ctx.id)"
                (click)="toggleContexto(ctx.id)">
                <ion-label>{{ ctx.name }}</ion-label>
                @if (isContextoSelected(ctx.id)) {
                  <ion-icon name="checkmark-circle" class="check-icon"></ion-icon>
                }
              </ion-chip>
            }
          </div>
        </div>
      }
      
      <div class="filter-section">
        <h4>
          <ion-icon name="pricetags-outline"></ion-icon>
          Tipos
        </h4>
        <div class="chips-container">
          @for (tipo of agendaService.tipos(); track tipo.id) {
            <ion-chip 
              [class.selected]="isTipoSelected(tipo.id)"
              [style.--chip-color]="tipo.color"
              (click)="toggleTipo(tipo.id)">
              <ion-icon [name]="tipo.icon"></ion-icon>
              <ion-label>{{ tipo.name }}</ion-label>
              @if (isTipoSelected(tipo.id)) {
                <ion-icon name="checkmark-circle" class="check-icon"></ion-icon>
              }
            </ion-chip>
          }
        </div>
      </div>
      
      <!-- Display Options -->
      <div class="filter-section display-options">
        <h4>
          <ion-icon name="eye-outline"></ion-icon>
          Opciones de Vista
        </h4>
        <div class="option-toggle">
          <ion-item lines="none" class="toggle-item">
            <ion-icon slot="start" name="time-outline" class="free-time-icon"></ion-icon>
            <ion-label>Mostrar tiempo disponible</ion-label>
            <ion-toggle 
              [checked]="showFreeTime()" 
              (ionChange)="toggleFreeTime($event)"
              color="success">
            </ion-toggle>
          </ion-item>
        </div>
      </div>
      
      <div class="filter-actions">
        <ion-button expand="block" (click)="applyFilters()" [disabled]="!hasActiveFilters()">
          <ion-icon name="funnel" slot="start"></ion-icon>
          Aplicar Filtros
        </ion-button>
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      padding: var(--spacing-md);
      background: var(--ion-background-color);
      max-height: 70vh;
      overflow-y: auto;
      
      /* Mobile: Bottom sheet style */
      @media (max-width: 767px) {
        border-radius: 16px 16px 0 0;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        padding: var(--spacing-lg) var(--spacing-md);
      }
      
      /* Desktop: Sidebar/dropdown style */
      @media (min-width: 992px) {
        max-width: 400px;
        border-radius: var(--radius-lg);
      }
    }
    
    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 2px solid var(--ion-color-primary);
      
      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--ion-text-color);
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        
        &::before {
          content: '';
          width: 4px;
          height: 20px;
          background: var(--ion-color-primary);
          border-radius: 2px;
        }
      }
      
      ion-button {
        --padding-start: var(--spacing-md);
        --padding-end: var(--spacing-md);
        min-height: 44px;
        font-weight: 600;
      }
    }
    
    .filter-section {
      margin-bottom: var(--spacing-lg);
      
      h4 {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        
        ion-icon {
          font-size: 1.1rem;
          color: var(--ion-color-primary);
        }
      }
    }
    
    /* Grid layout for chips - 2 columns on mobile, auto-fill on desktop */
    .chips-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-sm);
      
      @media (min-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
      }
      
      @media (min-width: 992px) {
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      }
    }
    
    /* Improved chips with better touch targets */
    ion-chip {
      --background: var(--ion-color-step-50);
      --color: var(--ion-text-color);
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid var(--ion-color-step-200);
      margin: 0;
      min-height: 44px;
      height: auto;
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: 0.9rem;
      border-radius: var(--radius-md);
      justify-content: center;
      width: 100%;
      
      &:hover {
        transform: scale(1.02);
        box-shadow: var(--shadow-sm);
        border-color: var(--ion-color-primary-tint);
        --background: var(--ion-color-step-100);
      }
      
      &:active {
        transform: scale(0.98);
      }
      
      &.selected {
        --background: var(--chip-color, var(--ion-color-primary));
        --color: white;
        border-color: transparent;
        box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
        font-weight: 600;
      }
      
      ion-icon {
        font-size: 1.2rem;
        margin-right: var(--spacing-xs);
        
        &.check-icon {
          margin-left: var(--spacing-xs);
          margin-right: 0;
          font-size: 1rem;
        }
      }
      
      ion-label {
        font-size: inherit;
        font-weight: inherit;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .filter-actions {
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--ion-border-color);
      position: sticky;
      bottom: 0;
      background: var(--ion-background-color);
      
      ion-button {
        min-height: 48px;
        font-weight: 600;
        font-size: 1rem;
        
        &::part(native) {
          transition: all 0.2s ease;
          border-radius: var(--radius-lg);
        }
        
        &:not([disabled]):hover::part(native) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        
        &[disabled] {
          opacity: 0.5;
        }
      }
    }
  `]
})
export class AgendaFiltersComponent {
  readonly agendaService = inject(AgendaService);

  @Output() filtersChanged = new EventEmitter<FilterState>();

  private selectedAreas = signal<string[]>([]);
  private selectedContextos = signal<string[]>([]);
  private selectedTipos = signal<string[]>([]);

  isAreaSelected(id: string): boolean {
    return this.selectedAreas().includes(id);
  }

  isContextoSelected(id: string): boolean {
    return this.selectedContextos().includes(id);
  }

  isTipoSelected(id: string): boolean {
    return this.selectedTipos().includes(id);
  }

  toggleArea(id: string): void {
    this.selectedAreas.update(areas =>
      areas.includes(id) ? areas.filter(a => a !== id) : [...areas, id]
    );
  }

  toggleContexto(id: string): void {
    this.selectedContextos.update(contextos =>
      contextos.includes(id) ? contextos.filter(c => c !== id) : [...contextos, id]
    );
  }

  toggleTipo(id: string): void {
    this.selectedTipos.update(tipos =>
      tipos.includes(id) ? tipos.filter(t => t !== id) : [...tipos, id]
    );
  }

  hasActiveFilters(): boolean {
    return this.selectedAreas().length > 0 ||
      this.selectedContextos().length > 0 ||
      this.selectedTipos().length > 0;
  }

  clearFilters(): void {
    this.selectedAreas.set([]);
    this.selectedContextos.set([]);
    this.selectedTipos.set([]);
    this.applyFilters();
  }

  applyFilters(): void {
    this.filtersChanged.emit({
      areaIds: this.selectedAreas(),
      contextoIds: this.selectedContextos(),
      tipoIds: this.selectedTipos(),
      statusFilter: []
    });
  }
}
