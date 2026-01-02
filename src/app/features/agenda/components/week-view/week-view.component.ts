import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';
import { AgendaService } from '../../../../core/services/agenda.service';

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="week-view-container">
      <!-- Encabezados de días clickeables -->
      <div class="week-header">
        <div class="day-col" 
             *ngFor="let day of weekDays; let i = index"
             [class.today]="isToday(day)"
             [class.has-events]="getEventCount(day) > 0"
             (click)="onDayClick(day)">
          <span class="day-name">{{ dayNames[i] }}</span>
          <span class="day-number">{{ day.getDate() }}</span>
          <div class="day-indicator" [class.active]="isToday(day)"></div>
          @if (getEventCount(day) > 0) {
            <span class="event-count">{{ getEventCount(day) }}</span>
          }
        </div>
      </div>

      <!-- Grid simplificado - celdas clickeables por hora -->
      <div class="week-grid-body">
        <div class="hour-row" *ngFor="let hour of displayHours">
          <div class="time-label">{{ hour }}:00</div>
          <div class="day-cell" 
               *ngFor="let day of weekDays"
               [class.has-events]="hasEventsAtHour(day, hour)"
               [class.is-free-time]="hasFreeTimeAtHour(day, hour)"
               (click)="onDayClick(day)">
            @for (reg of getEventsAtHour(day, hour); track reg.id) {
               @if (!isFreeTime(reg)) {
                 <div class="event-dot" [style.background-color]="getEventColor(reg)"></div>
               }
            }
          </div>
        </div>
      </div>
      
      <!-- Hint de interacción -->
      <div class="interaction-hint">
        <ion-icon name="hand-left-outline"></ion-icon>
        Toca un día para ver detalles
      </div>
    </div>
  `,
  styles: [`
    .week-view-container {
      display: flex;
      flex-direction: column;
      background: var(--ion-background-color);
      border: 1px solid var(--ion-border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }

    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 2px solid var(--ion-color-primary);
      background: var(--ion-color-step-50);
      padding: var(--spacing-sm) 0;
    }
    
    .day-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--spacing-sm);
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      position: relative;
      min-height: 70px;
      
      &:hover {
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        transform: scale(1.02);
      }
      
      &:active {
        transform: scale(0.98);
      }
      
      &.today {
        background: rgba(var(--ion-color-primary-rgb), 0.15);
        
        .day-number {
          color: var(--ion-color-primary);
        }
      }
      
      &.has-events {
        .day-number {
          font-weight: 800;
        }
      }
    }
    
    .day-name {
      font-size: 0.7rem;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .day-number {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-top: 2px;
    }
    
    .day-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: transparent;
      margin-top: 4px;
      
      &.active {
        background: var(--ion-color-primary);
      }
    }
    
    .event-count {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--ion-color-primary);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .week-grid-body {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }
    
    .hour-row {
      display: grid;
      grid-template-columns: 50px repeat(7, 1fr);
      min-height: 40px;
      border-bottom: 1px solid var(--ion-border-color);
    }
    
    .time-label {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--ion-color-medium);
      text-align: center;
      padding-top: 4px;
      background: var(--ion-color-step-50);
    }
    
    .day-cell {
      border-left: 1px solid var(--ion-border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
      
      &:hover {
        background: rgba(var(--ion-color-primary-rgb), 0.05);
      }
      
      &.has-events {
        background: rgba(var(--ion-color-primary-rgb), 0.08);
      }
      
      &.is-free-time {
        background: rgba(var(--ion-color-success-rgb), 0.15) !important;
        border: 1px dashed rgba(var(--ion-color-success-rgb), 0.3);
      }
    }
    
    .event-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ion-color-primary);
    }
    
    .interaction-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm);
      background: var(--ion-color-step-50);
      color: var(--ion-color-medium);
      font-size: 0.8rem;
      border-top: 1px solid var(--ion-border-color);
      
      ion-icon {
        font-size: 1rem;
      }
    }
    
    @media (min-width: 768px) {
      .day-name {
        font-size: 0.8rem;
      }
      
      .day-number {
        font-size: 1.5rem;
      }
      
      .interaction-hint {
        display: none;
      }
    }
  `]
})
export class WeekViewComponent implements OnChanges {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();
  @Output() daySelected = new EventEmitter<Date>();

  readonly agendaService = inject(AgendaService);

  dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Display hours from 6am to 10pm for a cleaner view
  displayHours = Array.from({ length: 17 }, (_, i) => i + 6);

  // Base configuration - MUST MATCH CSS TOKENS
  // Mobile base: 60px height
  private readonly HOUR_HEIGHT = 60;

  onDayClick(day: Date) {
    this.daySelected.emit(day);
  }

  weekDays: Date[] = [];
  hours = Array.from({ length: 24 }, (_, i) => i);

  weekRegistros = signal<Registro[]>([]);

  // Get count of events for a specific day
  getEventCount(day: Date): number {
    return this.weekRegistros().filter(r => {
      if (!r.startTime) return false;
      const d = new Date(r.startTime);
      return d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getFullYear() === day.getFullYear();
    }).length;
  }

  // Check if there are events at a specific hour for a day
  hasEventsAtHour(day: Date, hour: number): boolean {
    return this.weekRegistros().some(r => {
      if (!r.startTime) return false;
      const d = new Date(r.startTime);
      return d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getHours() === hour;
    });
  }

  constructor() {
    this.generateWeek();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentDate']) {
      this.generateWeek();
      this.filterEvents();
    }
    if (changes['registros']) {
      this.filterEvents();
    }
  }

  generateWeek() {
    const d = new Date(this.currentDate);
    const day = d.getDay(); // 0 (Sun) - 6 (Sat)
    // Normalize to Mon-Sun (0-6)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);

    const monday = new Date(d.setDate(diff));
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      this.weekDays.push(next);
    }
  }

  filterEvents() {
    if (!this.weekDays.length) return;
    const start = this.weekDays[0]; // Mon 00:00
    start.setHours(0, 0, 0, 0);
    const end = new Date(this.weekDays[6]); // Sun
    end.setHours(23, 59, 59, 999);

    const filtered = this.registros.filter(r => {
      if (!r.startTime) return false; // Skip if no startTime
      const rDate = new Date(r.startTime);
      return rDate >= start && rDate <= end;
    });
    this.weekRegistros.set(filtered);
  }

  isToday(d: Date): boolean {
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }

  getEventStyle(reg: Registro): any {
    if (!reg.startTime) return { display: 'none' };

    const start = new Date(reg.startTime);

    // Find which day column (index 0-6)
    // Check equality with weekDays
    const colIndex = this.weekDays.findIndex(d =>
      d.getDate() === start.getDate() && d.getMonth() === start.getMonth()
    );

    if (colIndex === -1) return { display: 'none' };

    // Calculate Top (Time)
    // HOUR_HEIGHT per hour
    // Logic must match CSS --agenda-hour-height
    // Since we can't easily read CSS var in TS synchronously without computed styles,
    // we assume the base logic and rely on CSS for visual scaling if needed, 
    // OR ideally we use a uniform value.
    // For now, let's use the Base value 60.

    const minutes = start.getHours() * 60 + start.getMinutes();
    const top = (minutes / 60) * this.HOUR_HEIGHT;

    // Calculate Height
    let end: Date;
    if (reg.endTime) {
      end = new Date(reg.endTime);
    } else {
      // Default to 1 hour if no endTime
      end = new Date(start.getTime() + 60 * 60000);
    }
    const durMin = (end.getTime() - start.getTime()) / 60000;
    const height = (durMin / 60) * this.HOUR_HEIGHT;

    // Calculate Left/Width
    // 1 column is 100% / 7 approx 14.28%

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${colIndex * (100 / 7)}%`,
      width: `${100 / 7}%`,
      backgroundColor: reg.contextoId === 'registro' ? 'var(--ion-color-primary)' : (this.getAreaColor(reg) || 'var(--ion-color-primary)')
    };
  }

  getAreaColor(reg: Registro): string | undefined {
    const area = this.agendaService.areas().find(a => a.id === reg.areaId);
    return area?.color;
  }

  getEventColor(reg: Registro): string {
    const areaColor = this.getAreaColor(reg);
    return areaColor || 'var(--ion-color-primary)';
  }

  isFreeTime(reg: Registro): boolean {
    return (reg as any).esAutoGenerado === true;
  }

  hasFreeTimeAtHour(day: Date, hour: number): boolean {
    return this.weekRegistros().some(r => {
      if (!this.isFreeTime(r)) return false;

      // Check overlap
      if (!r.startTime || !r.endTime) return false;
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);

      const cellStart = new Date(day);
      cellStart.setHours(hour, 0, 0, 0);
      const cellEnd = new Date(cellStart);
      cellEnd.setHours(hour + 1, 0, 0, 0);

      // Simple overlap check
      return start < cellEnd && end > cellStart;
    });
  }

  getEventsAtHour(day: Date, hour: number): Registro[] {
    return this.weekRegistros().filter(r => {
      if (!r.startTime) return false;
      const d = new Date(r.startTime);
      return d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getHours() === hour;
    });
  }
}
