import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
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
        <div class="day-col" *ngFor="let day of days; let i = index">
          <span class="day-name">{{ day }}</span>
          <!-- Resaltar día actual si corresponde (ej. simulación) -->
          <div class="day-indicator" [class.active]="i === 3"></div>
        </div>
      </div>

      <!-- Grid Simplificado (Placeholder) -->
      <div class="week-grid">
        <div class="grid-row" *ngFor="let time of times">
          <div class="time-label">{{ time }}</div>
          <div class="day-cell" *ngFor="let day of days"></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .week-view-container {
      background: var(--ion-background-color);
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
      overflow: hidden;
      min-height: 400px;
    }

    .week-header {
      display: grid;
      grid-template-columns: 40px repeat(7, 1fr);
      border-bottom: 1px solid var(--ion-border-color);
      background: var(--ion-color-light);
      padding: 8px 0;

      .day-col {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .day-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--ion-color-medium);
        }

        .day-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 4px;
          
          &.active {
            background: var(--ion-color-primary);
          }
        }
      }
    }

    .week-grid {
      display: flex;
      flex-direction: column;
      max-height: 500px;
      overflow-y: auto;
    }

    .grid-row {
      display: grid;
      grid-template-columns: 40px repeat(7, 1fr);
      height: 50px;
      border-bottom: 1px solid var(--ion-border-color);

      .time-label {
        font-size: 10px;
        color: var(--ion-color-medium);
        text-align: center;
        padding-top: 4px;
        border-right: 1px solid var(--ion-border-color);
      }

      .day-cell {
        border-right: 1px solid var(--ion-border-color);
        &:last-child { border-right: none; }
      }
    }
  `]
})
export class WeekViewComponent {
    days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    times = ['08:00', '12:00', '16:00', '20:00']; // Simplificado
    @Input() registros: Registro[] = [];
}
