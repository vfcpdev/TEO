import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';

@Component({
  selector: 'app-month-view',
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="month-view-container">
      <ion-datetime
        presentation="date"
        size="cover"
        [value]="currentDateIso"
        (ionChange)="onDateChange($event)"
        [highlightedDates]="highlightedDates"

        locale="es-ES"
        class="custom-calendar">
      </ion-datetime>
    </div>
  `,
  styles: [`
    .month-view-container {
      background: var(--ion-background-color);
      border: 1px solid var(--ion-border-color);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      justify-content: center;
    }

    .custom-calendar {
      max-width: 100%;
      border-radius: 8px;
      --background: transparent;
    }
  `]
})
export class MonthViewComponent {
  @Input() registros: Registro[] = [];
  @Input() currentDate: Date = new Date();
  @Output() daySelected = new EventEmitter<Date>();

  onDateChange(event: any) {
    const dateStr = event.detail.value;
    if (dateStr) {
      this.daySelected.emit(new Date(dateStr));
    }
  }

  get currentDateIso(): string {
    return this.currentDate.toISOString();
  }

  // Ejemplo de fechas resaltadas con registros
  highlightedDates = [
    {
      date: '2025-12-31',
      textColor: '#ffffff',
      backgroundColor: 'var(--ion-color-primary)',
    }
  ];
}
