import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';
import { AgendaService } from '../../../../core/services/agenda.service';

@Component({
  selector: 'app-month-view',
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="month-view-container">
      <div class="month-header">
        <ion-button fill="clear" size="small" (click)="previousMonth()">
          <ion-icon name="chevron-back"></ion-icon>
        </ion-button>
        <h2>{{ currentMonthName() }}</h2>
        <ion-button fill="clear" size="small" (click)="nextMonth()">
          <ion-icon name="chevron-forward"></ion-icon>
        </ion-button>
      </div>
      
      <ion-datetime
        presentation="date"
        size="cover"
        [value]="currentDateIso"
        (ionChange)="onDateChange($event)"
        [highlightedDates]="highlightedDates()"
        locale="es-ES"
        class="custom-calendar">
      </ion-datetime>
      
      @if (selectedDayEvents().length > 0) {
        <div class="events-summary">
          <h3>{{ selectedDayEvents().length }} evento{{ selectedDayEvents().length > 1 ? 's' : '' }}</h3>
          <div class="event-list">
            @for (event of selectedDayEvents(); track event.id) {
              <div class="event-item">
                <span class="event-dot" [style.background-color]="getAreaColor(event)"></span>
                <span class="event-name">{{ event.name }}</span>
                <span class="event-time">{{ formatTime(event.startTime) }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .month-view-container {
      background: var(--ion-background-color);
      border: var(--border-width-thin) solid var(--ion-border-color);
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      box-shadow: var(--shadow-md);
    }
    
    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) 0;
      
      h2 {
        margin: 0;
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-bold);
        color: var(--ion-text-color);
        text-transform: capitalize;
      }
      
      ion-button {
        --padding-start: var(--spacing-sm);
        --padding-end: var(--spacing-sm);
        
        ion-icon {
          font-size: 1.5rem;
        }
      }
    }

    .custom-calendar {
      max-width: 100%;
      border-radius: var(--radius-lg);
      --background: transparent;
    }
    
    .events-summary {
      border-top: var(--border-width-thin) solid var(--ion-border-color);
      padding-top: var(--spacing-lg);
      animation: fadeIn var(--transition-base);
      
      h3 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-body);
        font-weight: var(--font-weight-semibold);
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .event-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-height: 200px;
      overflow-y: auto;
    }
    
    .event-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--ion-color-step-50);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      cursor: pointer;
      
      &:hover {
        background: var(--ion-color-step-100);
        transform: translateX(4px);
      }
    }
    
    .event-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .event-name {
      flex: 1;
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-medium);
      color: var(--ion-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .event-time {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--ion-color-medium);
      font-variant-numeric: tabular-nums;
    }
  `]
})
export class MonthViewComponent {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();
  @Output() daySelected = new EventEmitter<Date>();

  readonly agendaService = inject(AgendaService);

  private _currentDate = signal(new Date());
  selectedDayEvents = signal<Registro[]>([]);

  onDateChange(event: any) {
    const dateStr = event.detail.value;
    if (dateStr) {
      const selectedDate = new Date(dateStr);
      this.daySelected.emit(selectedDate);
      this.updateSelectedDayEvents(selectedDate);
    }
  }

  get currentDateIso(): string {
    return this.currentDate.toISOString();
  }

  currentMonthName = computed(() => {
    return this._currentDate().toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  });

  highlightedDates = computed(() => {
    const dates = new Map<string, any>();

    this.registros.forEach(reg => {
      if (!reg.startTime) return;

      const area = this.agendaService.areas().find(a => a.id === reg.areaId);
      const color = area?.color || 'var(--ion-color-primary)';
      const dateKey = new Date(reg.startTime).toISOString().split('T')[0];

      // If multiple events on same day, use first area color
      if (!dates.has(dateKey)) {
        dates.set(dateKey, {
          date: dateKey,
          textColor: '#ffffff',
          backgroundColor: color,
        });
      }
    });

    return Array.from(dates.values());
  });

  previousMonth() {
    const newDate = new Date(this._currentDate());
    newDate.setMonth(newDate.getMonth() - 1);
    this._currentDate.set(newDate);
    this.currentDate = newDate;
  }

  nextMonth() {
    const newDate = new Date(this._currentDate());
    newDate.setMonth(newDate.getMonth() + 1);
    this._currentDate.set(newDate);
    this.currentDate = newDate;
  }

  getAreaColor(event: Registro): string {
    const area = this.agendaService.areas().find(a => a.id === event.areaId);
    return area?.color || 'var(--ion-color-primary)';
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private updateSelectedDayEvents(date: Date) {
    const events = this.registros.filter(reg => {
      if (!reg.startTime) return false;
      const regDate = new Date(reg.startTime);
      return regDate.getDate() === date.getDate() &&
        regDate.getMonth() === date.getMonth() &&
        regDate.getFullYear() === date.getFullYear();
    });
    this.selectedDayEvents.set(events);
  }
}
