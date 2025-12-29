import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
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
      
      <!-- Indicador de Hora Actual -->
      <div class="current-time-line" [style.top.%]="currentTimePercentage()">
        <div class="time-label">{{ currentTimeString() }}</div>
        <div class="line"></div>
      </div>

      <!-- Timeline simple para demostración de concepto -->
      <div class="timeline-visualization">
        <div class="hour-marker" *ngFor="let hour of hoursRange">
          <span class="hour-label">{{ formatHour(hour) }}</span>
          <div class="hour-line"></div>
        </div>
      </div>

      <!-- Mensaje temporal -->
      <div class="empty-state">
         <p>Vista de Hoy: -2h / +5h</p>
      </div>
    </div>
  `,
    styles: [`
    .day-view-container {
      position: relative;
      background: var(--ion-background-color);
      min-height: 400px;
      padding: 16px;
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
      overflow: hidden;
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
      }
      
      .line {
        flex: 1;
        height: 2px;
        background: var(--ion-color-danger);
      }
    }

    .timeline-visualization {
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .hour-marker {
      display: flex;
      align-items: center;
      opacity: 0.5;
      
      .hour-label {
        width: 50px;
        font-size: 12px;
        color: var(--ion-color-medium);
      }
      
      .hour-line {
        flex: 1;
        height: 1px;
        background: var(--ion-border-color);
      }
    }
  `]
})
export class DayViewComponent {
    @Input() registros: Registro[] = [];
    @Input() currentDate: Date = new Date();

    // Rango dinámico: Now - 2h a Now + 5h
    hoursRange: Date[] = [];

    currentTimeString = computed(() => {
        return this.currentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    });

    currentTimePercentage = signal(30); // Posición fija demostrativa por ahora

    constructor() {
        this.generateHours();
    }

    generateHours() {
        const now = new Date();
        const start = new Date(now.getTime() - 2 * 60 * 60 * 1000); // -2h
        // Generar horas para el rango
        for (let i = 0; i < 8; i++) {
            const d = new Date(start.getTime() + i * 60 * 60 * 1000);
            d.setMinutes(0);
            d.setSeconds(0);
            this.hoursRange.push(d);
        }
    }

    formatHour(date: Date): string {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
}
