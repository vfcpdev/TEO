import { Component, Input, computed, signal, ChangeDetectionStrategy, OnChanges, SimpleChanges, effect, ElementRef, AfterViewInit, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { AgendaService } from '../../../../core/services/agenda.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, IonicModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="day-view-container" #scrollContainer>
      
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
      padding: var(--spacing-lg);
      padding-top: var(--agenda-timeline-padding); 
      border: var(--border-width-thin) solid var(--ion-border-color);
      border-radius: var(--radius-xl);
      overflow-y: auto;
      scroll-behavior: smooth;
    }

    .events-layer {
      position: absolute;
      top: var(--agenda-timeline-padding);
      left: calc(var(--agenda-hour-label-width) + var(--spacing-lg) + var(--spacing-md));
      right: var(--spacing-lg);
      bottom: var(--spacing-lg);
      pointer-events: none;
    }

    .event-card {
      position: absolute;
      left: 0;
      right: 0;
      background: rgba(var(--ion-color-primary-rgb), var(--agenda-event-opacity));
      border-left: var(--agenda-event-border-width) solid var(--ion-color-primary);
      border-radius: var(--agenda-event-radius);
      padding: var(--agenda-event-padding);
      overflow: hidden;
      pointer-events: auto;
      z-index: 5;
      cursor: pointer;
      transition: transform var(--agenda-transition-event), 
                  box-shadow var(--agenda-transition-event),
                  background var(--agenda-transition-event);
      animation: fadeInEvent var(--transition-base);
      min-height: var(--agenda-event-min-height);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        background: rgba(var(--ion-color-primary-rgb), calc(var(--agenda-event-opacity) + 0.05));
        z-index: 10;
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInEvent {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .event-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .event-title {
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-semibold);
      color: var(--ion-color-primary-shade);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: var(--line-height-tight);
    }

    .event-time {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--ion-color-medium);
      line-height: var(--line-height-tight);
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
        background: var(--agenda-current-time-color);
        color: white;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-sm);
        margin-right: var(--spacing-sm);
        margin-left: var(--spacing-sm);
        animation: pulseTime 2s ease-in-out infinite;
        box-shadow: var(--shadow-sm);
      }
      
      .line {
        flex: 1;
        height: 2px;
        background: var(--agenda-current-time-color);
        box-shadow: 0 0 4px rgba(var(--ion-color-danger-rgb), 0.5);
      }
    }
    
    @keyframes pulseTime {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.85;
        transform: scale(0.98);
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
      height: var(--agenda-hour-height);
      position: relative;
      
      .hour-label {
        width: var(--agenda-hour-label-width);
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-medium);
        color: var(--ion-color-medium);
        transform: translateY(-50%);
        margin-top: 0;
        font-variant-numeric: tabular-nums;
      }
      
      .hour-line {
        flex: 1;
        height: 1px;
        background: var(--ion-border-color);
        opacity: 0.3;
        margin-top: 0;
        transition: opacity var(--transition-fast);
      }
      
      &:hover .hour-line {
        opacity: 0.5;
      }
    }
  `]
})
export class DayViewComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();

  readonly agendaService = inject(AgendaService);
  readonly toastService = inject(ToastService);

  hoursRange: Date[] = [];

  // Use design token values (base mobile value)
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

  private timeInterval: any;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor() {
    this.generateHours();
    this.updateTimePosition();

    // Debug effect
    effect(() => {
      console.log('[DayView] dayRegistros updated:', this.dayRegistros().length);
    });
  }

  ngOnInit() {
    // Update every minute
    this.timeInterval = setInterval(() => {
      this.updateTimePosition();
    }, 60000);
  }

  ngAfterViewInit() {
    // Auto-scroll to show 2 hours before current time
    setTimeout(() => {
      this.scrollToCurrentTime();
    }, 100);
  }

  private scrollToCurrentTime() {
    if (!this.scrollContainer) return;

    const now = this.currentDate || new Date();
    const hours = now.getHours();

    // Calculate position for 2 hours before current time
    const targetHour = Math.max(0, hours - 2);
    const scrollPosition = this.START_OFFSET + (targetHour * this.HOUR_HEIGHT);

    // Scroll to position
    this.scrollContainer.nativeElement.scrollTop = scrollPosition;
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
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

  onEventDrop(event: CdkDragDrop<Registro[]>): void {
    const registro = event.item.data as Registro;

    // Get the vertical distance moved
    const dropY = event.distance.y;

    // Calculate new time based on Y position
    // HOUR_HEIGHT pixels = 60 minutes
    const pixelsPerMinute = this.HOUR_HEIGHT / 60;
    const minutesDelta = Math.round(dropY / pixelsPerMinute);

    if (registro.startTime && minutesDelta !== 0) {
      const newStartTime = new Date(registro.startTime);
      newStartTime.setMinutes(newStartTime.getMinutes() + minutesDelta);

      let newEndTime: Date | undefined;
      if (registro.endTime) {
        newEndTime = new Date(registro.endTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + minutesDelta);
      }

      // Update registro through AgendaService
      this.agendaService.updateRegistro(registro.id, {
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: new Date()
      });

      // Show success toast
      const timeStr = this.formatTime(newStartTime);
      this.toastService.success(`Evento movido a ${timeStr}`);
    }
  }
}
