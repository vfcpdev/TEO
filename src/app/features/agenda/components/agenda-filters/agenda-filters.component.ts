import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AgendaService } from '../../../../core/services/agenda.service';

export interface FilterState {
  areaIds: string[];
  contextoIds: string[];
  tipoIds: string[];
  statusFilter: string[];
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
    .filters-container {
      padding: var(--spacing-sm);
      background: var(--ion-background-color);
    }
      background: var(--ion-background-color);
    }
    
    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
      padding-bottom: var(--spacing-xs);
      border-bottom: var(--border-width-thin) solid var(--ion-border-color);
      
      h3 {
        margin: 0;
      h3 {
        margin: 0;
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-bold);
        color: var(--ion-text-color);
      }
      
      ion-button {
        --padding-start: var(--spacing-sm);
        --padding-end: var(--spacing-sm);
      }
    }
    
    .filter-section {
      margin-bottom: var(--spacing-lg);
      
      h4 {
      h4 {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        margin: 0 0 var(--spacing-xs) 0;
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-semibold);
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
        
        ion-icon {
          font-size: 1rem;
        }
      }
    }
    
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }
    
    ion-chip {
      --background: var(--ion-color-step-100);
      --color: var(--ion-text-color);
      cursor: pointer;
      transition: all var(--transition-fast);
      border: 2px solid transparent;
      margin: 0;
      height: 24px;
      font-size: var(--font-size-xs);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-sm);
        --background: var(--ion-color-step-150);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      &.selected {
        --background: var(--chip-color, var(--ion-color-primary));
        --color: white;
        border-color: transparent;
        box-shadow: var(--shadow-md);
        font-weight: var(--font-weight-semibold);
      }
      
      ion-icon {
        font-size: 1.2rem;
        
        &.check-icon {
          margin-left: var(--spacing-xs);
        }
      }
      
      ion-label {
        font-size: var(--font-size-small);
        font-weight: inherit;
      }
    }
    
    .filter-actions {
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-md);
      border-top: var(--border-width-thin) solid var(--ion-border-color);
      
      ion-button {
        --padding-top: var(--spacing-md);
        --padding-bottom: var(--spacing-md);
        font-weight: var(--font-weight-semibold);
        
        &::part(native) {
          transition: all var(--transition-fast);
        }
        
        &:not([disabled]):hover::part(native) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
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
