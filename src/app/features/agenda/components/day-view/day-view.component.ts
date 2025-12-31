import { Component, Input, computed, signal, ChangeDetectionStrategy, OnChanges, SimpleChanges, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="day-view-container">
      
      <!-- Timeline simple -->
      <div class="timeline-visualization">
        <div class="hour-marker" *ngFor="let hour of hoursRange">
          <span class="hour-label">{{ formatHour(hour) }}</span>
          <div class="hour-line"></div>
        </div>
      </div>

      <!-- Events Overlay -->
      <div class="events-layer">
        <div class="event-card" 
             *ngFor="let reg of dayRegistros()" 
             [style]="getEventStyle(reg)"
             (click)="onEventClick(reg)">
          <div class="event-content">
            <span class="event-title">{{ reg.name }}</span>
            <span class="event-time">
              {{ formatTime(reg.startTime) }} - {{ formatTime(reg.endTime) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Indicador de Hora Actual (Overlay) -->
      <div class="current-time-line" [style.top.px]="currentTimeTopPx()">
        <div class="time-label">{{ currentTimeString() }}</div>
        <div class="line"></div>
      </div>

    </div>
  `,
  styles: [`
    .day-view-container {
      position: relative;
      background: var(--ion-background-color);
      padding: 16px;
      padding-top: 40px; 
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
    }

    .events-layer {
      position: absolute;
      top: 40px;
      left: 70px;
      right: 16px;
      bottom: 16px;
      pointer-events: none;
    }

    .event-card {
      position: absolute;
      left: 0;
      right: 0;
      background: rgba(var(--ion-color-primary-rgb), 0.15);
      border-left: 4px solid var(--ion-color-primary);
      border-radius: 4px;
      padding: 4px 8px;
      overflow: hidden;
      pointer-events: auto;
      z-index: 5;
    }

    .event-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .event-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--ion-color-primary-shade);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .event-time {
      font-size: 10px;
      color: var(--ion-color-medium);
    }

    .current-time-line {
      position: absolute;
      left: 0;
      width: 100%;
      display: flex;
      align-items: center;
      z-index: 10;
      pointer-events: none;
      
      .time-label {
        background: var(--ion-color-danger);
        color: white;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 8px;
        font-weight: 600;
        margin-left: 8px;
      }
      
      .line {
        flex: 1;
        height: 2px;
        background: var(--ion-color-danger);
      }
    }

    .timeline-visualization {
      display: flex;
      flex-direction: column;
      gap: 0; 
    }

    .hour-marker {
      display: flex;
      align-items: flex-start;
      height: 60px;
      position: relative;
      
      .hour-label {
        width: 50px;
        font-size: 12px;
        color: var(--ion-color-medium);
        transform: translateY(-50%);
        margin-top: 0; 
      }
      
      .hour-line {
        flex: 1;
        height: 1px;
        background: var(--ion-border-color);
        opacity: 0.3;
        margin-top: 0;
      }
    }
  `]
})
export class DayViewComponent implements OnChanges {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();

  hoursRange: Date[] = [];

  private readonly HOUR_HEIGHT = 60;
  private readonly START_OFFSET = 40;

  currentTimeString = computed(() => {
    return this.currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  });

  currentTimeTopPx = signal(0);

  // Signals for inputs
  private _registrosSignal = signal<Registro[]>([]);
  private _currentDateSignal = signal<Date>(new Date());

  dayRegistros = computed(() => {
    const list = this._registrosSignal();
    const target = this._currentDateSignal();

    console.log('[DayView] Filtering. Count:', list.length, 'Target:', target);

    const filtered = list.filter(r => {
      // Must have startTime to be shown on timeline
      if (!r.startTime) return false;

      const d = new Date(r.startTime);
      if (isNaN(d.getTime())) return false; // Invalid date

      const isSameDay = d.getDate() === target.getDate() &&
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear();

      if (isSameDay) {
        console.log('[DayView] Matched:', r.name, r.startTime);
      }
      return isSameDay;
    });

    return filtered;
  });

  constructor() {
    this.generateHours();
    this.updateTimePosition();

    // Debug effect
    effect(() => {
      console.log('[DayView] dayRegistros updated:', this.dayRegistros().length);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentDate']) {
      this._currentDateSignal.set(this.currentDate);
      this.updateTimePosition();
    }
    if (changes['registros']) {
      console.log('[DayView] Input registros changed:', this.registros.length);
      this._registrosSignal.set(this.registros);
    }
  }

  generateHours() {
    this.hoursRange = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 24; i++) {
      const d = new Date(baseDate);
      d.setHours(i);
      this.hoursRange.push(d);
    }
  }

  updateTimePosition() {
    const now = this.currentDate || new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const adjustedPos = this.START_OFFSET + (hours * this.HOUR_HEIGHT) + ((minutes / 60) * this.HOUR_HEIGHT);

    this.currentTimeTopPx.set(adjustedPos);
  }

  formatHour(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getEventStyle(reg: Registro): any {
    if (!reg.startTime) return { display: 'none' };

    const start = new Date(reg.startTime);
    // If endTime is missing, assume 1 hour duration or use duration prop
    let end: Date;
    if (reg.endTime) {
      end = new Date(reg.endTime);
    } else if (reg.duration) {
      end = new Date(start.getTime() + reg.duration * 60000);
    } else {
      // Default to 1 hour if nothing specified
      end = new Date(start.getTime() + 60 * 60000);
    }

    const startHour = start.getHours();
    const startMin = start.getMinutes();

    const durationMs = end.getTime() - start.getTime();
    const durationMin = durationMs / (1000 * 60);

    const top = (startHour * this.HOUR_HEIGHT) + ((startMin / 60) * this.HOUR_HEIGHT);
    const height = durationMin; // 1 min = 1 px

    return {
      top: `${top}px`,
      height: `${height}px`
    };
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  onEventClick(reg: Registro) {
    console.log('Event clicked:', reg);
  }
}
