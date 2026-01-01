import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';

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
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
      height: 600px; /* Fixed height for scroll */
      overflow: hidden;
    }

    .week-header {
      display: grid;
      grid-template-columns: 40px repeat(7, 1fr);
      border-bottom: 1px solid var(--ion-border-color);
      background: var(--ion-color-light);
      padding: 8px 0;
      flex-shrink: 0;
    }
    
    .time-col-header { width: 40px; }

    .day-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
    
    .day-name { font-weight: 600; color: var(--ion-color-medium); }
    .day-number { font-size: 14px; font-weight: bold; }
    .day-indicator.active { width: 6px; height: 6px; background: var(--ion-color-primary); border-radius: 50%; margin-top: 2px; }

    .week-grid-body {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }
    
    .week-events-layer {
        position: absolute;
        top: 0;
        left: 40px; /* Offset time col */
        right: 0;
        bottom: 0;
        z-index: 10;
        pointer-events: none;
    }
    
    .week-event {
        position: absolute;
        background: var(--ion-color-primary);
        color: white;
        font-size: 9px;
        border-radius: 2px;
        padding: 1px 2px;
        overflow: hidden;
        pointer-events: auto;
        opacity: 0.8;
    }

    .grid-row {
      display: grid;
      grid-template-columns: 40px repeat(7, 1fr);
      height: 40px; /* Compact height for week view */
      border-bottom: 1px solid var(--ion-border-color);
    }
    
    .time-label {
        font-size: 9px; color: var(--ion-color-medium); text-align: center; margin-top: -6px;
    }
    .day-cell { border-right: 1px solid var(--ion-border-color); opacity: 0.3; }
  `]
})
export class WeekViewComponent implements OnChanges {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();
  @Output() daySelected = new EventEmitter<Date>();

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
