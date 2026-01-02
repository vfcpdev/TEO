import { Component, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AgendaService } from '../../../../core/services/agenda.service';
import { Registro } from '../../../../models/registro.model';

interface SearchResult {
  type: 'registro' | 'area' | 'contexto';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  data: any;
}

@Component({
  selector: 'app-agenda-search',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="search-container">
      <ion-searchbar 
        [(ngModel)]="searchQuery"
        (ionInput)="onSearch()"
        [debounce]="300"
        placeholder="Buscar eventos, áreas, contextos..."
        animated
        mode="ios"
        class="custom-searchbar">
      </ion-searchbar>
      
      @if (searchResults().length > 0 && searchQuery()) {
        <div class="search-results">
          <div class="results-header">
            <span>{{ searchResults().length }} resultado{{ searchResults().length > 1 ? 's' : '' }}</span>
            <ion-button fill="clear" size="small" (click)="clearSearch()">
              <ion-icon name="close" slot="icon-only"></ion-icon>
            </ion-button>
          </div>
          
          @for (result of searchResults(); track result.id) {
            <ion-item button (click)="selectResult(result)" lines="none" class="result-item">
              <ion-icon 
                [name]="result.icon" 
                [style.color]="result.color" 
                slot="start">
              </ion-icon>
              <ion-label>
                <h3>{{ result.title }}</h3>
                <p>{{ result.subtitle }}</p>
              </ion-label>
              <ion-badge slot="end" [color]="getTypeBadgeColor(result.type)">
                {{ getTypeLabel(result.type) }}
              </ion-badge>
            </ion-item>
          }
        </div>
      }
      
      @if (searchQuery() && searchResults().length === 0) {
        <div class="no-results">
          <ion-icon name="search-outline"></ion-icon>
          <p>No se encontraron resultados para "{{ searchQuery() }}"</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
    }
    
    .custom-searchbar {
      --background: var(--ion-color-step-50);
      --border-radius: var(--radius-lg);
      --box-shadow: var(--shadow-sm);
      --icon-color: var(--ion-color-medium);
      --placeholder-color: var(--ion-color-medium);
      --placeholder-font-weight: var(--font-weight-medium);
      padding: 0;
      height: 36px;
      min-height: 36px !important;
    }
    
    .search-results {
      position: absolute;
      top: calc(100% + var(--spacing-xs));
      left: 0;
      right: 0;
      background: var(--ion-background-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      border: var(--border-width-thin) solid var(--ion-border-color);
      animation: slideDown var(--transition-base);
    }
    
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-bottom: var(--border-width-thin) solid var(--ion-border-color);
      background: var(--ion-color-step-50);
      position: sticky;
      top: 0;
      z-index: 1;
      
      span {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
      }
      
      ion-button {
        --padding-start: 0;
        --padding-end: 0;
        margin: 0;
        height: 20px;
        min-height: 20px;
      }
      
      ion-icon {
        font-size: 1.2rem;
      }
    }
    
    .result-item {
      --background: transparent;
      --padding-start: var(--spacing-sm);
      --padding-end: var(--spacing-sm);
      --min-height: 36px;
      --inner-padding-end: 0;
      transition: background var(--transition-fast);
      cursor: pointer;
      
      &:hover {
        --background: var(--ion-color-step-50);
      }
      
      &:active {
        --background: var(--ion-color-step-100);
      }
      
      ion-icon[slot="start"] {
        font-size: 1rem;
        margin-right: var(--spacing-sm);
      }
      
      ion-label {
        margin: var(--spacing-xs) 0;
        
        h3 {
          font-size: var(--font-size-small);
          font-weight: var(--font-weight-semibold);
          margin: 0;
          color: var(--ion-text-color);
          line-height: normal;
        }
        
        p {
          margin: 0;
          font-size: var(--font-size-xxs);
          line-height: normal;
          color: var(--ion-color-medium);
        }
      }
      
      ion-badge {
        font-size: 10px;
        font-weight: var(--font-weight-bold);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }
    }
    
    .no-results {
      padding: var(--spacing-lg);
      text-align: center;
      color: var(--ion-color-medium);
      animation: fadeIn var(--transition-base);
      
      ion-icon {
        font-size: 2rem;
        opacity: 0.5;
        margin-bottom: var(--spacing-sm);
      }
      
      p {
        margin: 0;
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-medium);
      }
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class AgendaSearchComponent {
  readonly agendaService = inject(AgendaService);

  @Output() resultSelected = new EventEmitter<SearchResult>();

  searchQuery = signal('');

  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];

    const results: SearchResult[] = [];

    // Search in registros
    this.agendaService.registros().forEach(reg => {
      if (reg.name.toLowerCase().includes(query) ||
        reg.notes?.toLowerCase().includes(query)) {
        const area = this.agendaService.areas().find(a => a.id === reg.areaId);
        results.push({
          type: 'registro',
          id: reg.id,
          title: reg.name,
          subtitle: this.formatDate(reg.startTime),
          icon: 'calendar-outline',
          color: area?.color,
          data: reg
        });
      }
    });

    // Search in areas
    this.agendaService.areas().forEach(area => {
      if (area.name.toLowerCase().includes(query)) {
        results.push({
          type: 'area',
          id: area.id,
          title: area.name,
          subtitle: 'Área de vida',
          icon: area.icon,
          color: area.color,
          data: area
        });
      }
    });

    // Search in contextos
    this.agendaService.contextos().forEach(ctx => {
      if (ctx.name.toLowerCase().includes(query)) {
        const areaNames = ctx.areaIds
          .map(id => this.agendaService.areas().find(a => a.id === id)?.name)
          .filter(Boolean)
          .join(', ');

        results.push({
          type: 'contexto',
          id: ctx.id,
          title: ctx.name,
          subtitle: areaNames || 'Contexto',
          icon: 'location-outline',
          data: ctx
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  });

  onSearch(): void {
    // Trigger computed signal update
    // The searchQuery signal change will automatically trigger searchResults recomputation
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  selectResult(result: SearchResult): void {
    this.resultSelected.emit(result);
    this.clearSearch();
  }

  getTypeBadgeColor(type: string): string {
    switch (type) {
      case 'registro': return 'primary';
      case 'area': return 'success';
      case 'contexto': return 'tertiary';
      default: return 'medium';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'registro': return 'Evento';
      case 'area': return 'Área';
      case 'contexto': return 'Contexto';
      default: return type;
    }
  }

  private formatDate(date?: Date): string {
    if (!date) return 'Sin fecha';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
