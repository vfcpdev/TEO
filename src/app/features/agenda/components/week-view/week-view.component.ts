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
      <!-- Encabezados -->
      <div class="week-header">
        <div class="time-col-header"></div> <!-- Espacio para hora -->
        <div class="day-col" *ngFor="let day of weekDays; let i = index">
          <span class="day-name">{{ dayNames[i] }}</span>
          <span class="day-number">{{ day.getDate() }}</span>
          <div class="day-indicator" [class.active]="isToday(day)"></div>
        </div>
      </div>

      <div class="week-grid-body">
         <!-- Events Layer -->
         <!-- Relative container where we place absolute events -->
         <!-- Need to map Day Index (0-6) -> Left % -->
         <!-- And Time -> Top px -->
         
         <div class="week-events-layer">
            <div class="week-event" 
                 *ngFor="let reg of weekRegistros()"
                 [style]="getEventStyle(reg)">
                 <span class="event-title">{{ reg.name }}</span>
            </div>
         </div>
      
         <!-- Grid lines -->
         <div class="grid-row" *ngFor="let hour of hours">
             <div class="time-label">{{ hour }}:00</div>
             <div class="day-cell" *ngFor="let d of weekDays"></div>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .week-view-container {
      display: flex;
      flex-direction: column;
      background: var(--ion-background-color);
      border: var(--border-width-thin) solid var(--ion-border-color);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      height: 500px;
    }
    
    @media (min-width: 768px) and (max-width: 1023px) {
      .week-view-container {
        height: 600px;
      }
    }
    
    @media (min-width: 1024px) {
      .week-view-container {
        height: 700px;
      }
    }

    .week-header {
      display: grid;
      grid-template-columns: 50px repeat(7, 1fr);
      border-bottom: var(--border-width-thin) solid var(--ion-border-color);
      background: var(--ion-color-step-50);
      padding: var(--spacing-sm) 0;
      flex-shrink: 0;
    }
    
    .time-col-header { 
      width: 50px; 
    }

    .day-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs);
      transition: background var(--transition-fast);
    }
    
    .day-col:hover {
      background: var(--ion-color-step-100);
    }
    
    .day-name { 
      font-weight: var(--font-weight-semibold); 
      color: var(--ion-color-medium); 
      text-transform: uppercase;
      letter-spacing: var(--letter-spacing-wide);
    }
    
    .day-number { 
      font-size: var(--font-size-body); 
      font-weight: var(--font-weight-bold);
      color: var(--ion-text-color);
    }
    
    .day-indicator {
      width: 6px; 
      height: 6px; 
      border-radius: 50%; 
      opacity: 0;
      transition: opacity var(--transition-fast);
      
      &.active { 
        background: var(--ion-color-primary); 
        opacity: 1;
        animation: pulse 2s ease-in-out infinite;
      }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }

    .week-grid-body {
      flex: 1;
      overflow-y: auto;
      position: relative;
      scroll-behavior: smooth;
    }
    
    .week-events-layer {
        position: absolute;
        top: 0;
        left: 50px;
        right: 0;
        bottom: 0;
        z-index: 10;
        pointer-events: none;
    }
    
    .week-event {
        position: absolute;
        background: rgba(var(--ion-color-primary-rgb), var(--agenda-event-opacity));
        border-left: 3px solid var(--ion-color-primary);
        color: var(--ion-text-color);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        border-radius: var(--radius-sm);
        padding: var(--spacing-xs);
        overflow: hidden;
        pointer-events: auto;
        cursor: pointer;
        transition: all var(--transition-fast);
        box-shadow: var(--shadow-xs);
    }
    
    .week-event:hover {
      transform: scale(1.02);
      box-shadow: var(--shadow-md);
      z-index: 20;
      background: rgba(var(--ion-color-primary-rgb), calc(var(--agenda-event-opacity) + 0.05));
    }
    
    .week-event:active {
      transform: scale(0.98);
    }
    
    .event-title {
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: var(--font-weight-semibold);
    }

    .grid-row {
      display: grid;
      grid-template-columns: 50px repeat(7, 1fr);
      height: 40px;
      border-bottom: var(--border-width-thin) solid var(--ion-border-color);
      transition: background var(--transition-fast);
    }
    
    .grid-row:hover {
      background: rgba(var(--ion-color-primary-rgb), 0.02);
    }
    
    .time-label {
        font-size: var(--font-size-xs); 
        font-weight: var(--font-weight-medium);
        color: var(--ion-color-medium); 
        text-align: center; 
        margin-top: -6px;
        font-variant-numeric: tabular-nums;
    }
    
    .day-cell { 
      border-right: var(--border-width-thin) solid var(--ion-border-color); 
      opacity: 0.3;
      transition: opacity var(--transition-fast);
    }
    
    .day-cell:hover {
      opacity: 0.5;
    }
  `]
})
export class WeekViewComponent implements OnChanges {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();
  @Output() daySelected = new EventEmitter<Date>();

  readonly agendaService = inject(AgendaService);

  dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  // ...
  onDayClick(day: Date) {
    this.daySelected.emit(day);
  }



  weekDays: Date[] = [];
  hours = Array.from({ length: 24 }, (_, i) => i);

  weekRegistros = signal<Registro[]>([]);

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
    // 40px per hour
    const minutes = start.getHours() * 60 + start.getMinutes();
    const top = (minutes / 60) * 40;

    // Calculate Height
    let end: Date;
    if (reg.endTime) {
      end = new Date(reg.endTime);
    } else {
      // Default to 1 hour if no endTime
      end = new Date(start.getTime() + 60 * 60000);
    }
    const durMin = (end.getTime() - start.getTime()) / 60000;
    const height = (durMin / 60) * 40;

    // Calculate Left/Width
    // 1 column is 100% / 7 approx 14.28%
    // But we have total width to manage.
    // Simplest: use percentage relative to events container width (which is week-grid-body - 40px)
    // But week-events-layer is already offset by 40px.
    // So width is 100%.
    // Col width = 100% / 7.

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: `${colIndex * (100 / 7)}%`,
      width: `${100 / 7}%`
    };
  }
}
