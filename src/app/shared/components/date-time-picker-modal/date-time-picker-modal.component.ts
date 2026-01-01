import { Component, Input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, checkmarkOutline, closeOutline, arrowBackOutline } from 'ionicons/icons';
import { AnalogClockComponent } from './analog-clock/analog-clock.component';

@Component({
  selector: 'app-date-time-picker-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, AnalogClockComponent],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button (click)="cancel()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="confirm()" [disabled]="!canConfirm()">
            <ion-icon name="checkmark-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      
      <ion-toolbar color="primary">
        <ion-segment [value]="step()" (ionChange)="onSegmentChange($event)" mode="md">
          <ion-segment-button value="date">
            <ion-label>Fecha</ion-label>
            <ion-icon name="calendar-outline"></ion-icon>
          </ion-segment-button>
          <ion-segment-button value="time" [disabled]="!selectedDate">
            <ion-label>Hora</ion-label>
            <ion-icon name="time-outline"></ion-icon>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding content-center">
      
      <!-- Date Step -->
      <div *ngIf="step() === 'date'" class="picker-step fade-in">
        <div class="selected-value" *ngIf="selectedDate">
          {{ formatDate(selectedDate) }}
        </div>
        <ion-datetime
          #datePicker
          presentation="date"
          [value]="selectedDate"
          [min]="minDate"
          locale="es-ES"
          size="cover"
          (ionChange)="onDateChange($event)"
          [showDefaultButtons]="false"
        ></ion-datetime>
      </div>

      <!-- Time Step -->
      <div *ngIf="step() === 'time'" class="picker-step fade-in">
        <!-- Display Header Mode Switcher -->
        <div class="time-header">
           <div class="time-display" 
                [class.active]="clockMode === 'hour'" 
                (click)="clockMode = 'hour'">
                {{ getDisplayHour() }}
           </div>
           <div class="time-separator">:</div>
           <div class="time-display" 
                [class.active]="clockMode === 'minute'" 
                (click)="clockMode = 'minute'">
                {{ getDisplayMinute() }}
           </div>
           <div class="am-pm">{{ getPeriod() }}</div>
        </div>
        
        <p class="instruction-text">
            {{ clockMode === 'hour' ? 'Selecciona la hora' : 'Selecciona los minutos' }}
        </p>

        <app-analog-clock
          [hour]="currentHour"
          [minute]="currentMinute"
          [mode]="clockMode"
          (timeChange)="onTimeChange($event)"
          (modeChange)="onClockModeChange($event)"
        ></app-analog-clock>
      </div>

    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start" *ngIf="step() === 'time'">
          <ion-button (click)="setStep('date')">
            <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
            Volver a Fecha
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button color="primary" fill="solid" (click)="nextOrConfirm()">
            {{ step() === 'date' ? 'Siguiente' : 'Confirmar' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    :host {
      --ion-toolbar-background: var(--ion-color-primary);
      --ion-toolbar-color: var(--ion-color-primary-contrast);
    }

    ion-content {
        --background: #fff;
    }

    ion-datetime {
      margin: 0 auto;
      border-radius: 8px;
    }

    .selected-value {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: var(--ion-color-primary);
      padding: 10px;
      background: var(--ion-color-light);
      border-radius: 8px;
      width: 100%;
    }

    .picker-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
    }
    
    .time-header {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
      font-size: 48px;
      font-weight: bold;
      color: var(--ion-color-dark);
      margin-bottom: 8px;
    }
    
    .time-display {
      opacity: 0.5;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    .time-display.active {
      opacity: 1;
      color: var(--ion-color-primary);
    }
    
    .time-separator {
        opacity: 0.5;
        margin-bottom: 8px; /* Alignment fix */
    }
    
    .am-pm {
        font-size: 18px;
        margin-left: 8px;
        color: var(--ion-color-medium);
    }
    
    .instruction-text {
        color: var(--ion-color-medium);
        margin-top: 0;
        margin-bottom: 20px;
        font-size: 14px;
    }

    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    ion-segment-button {
      --color: rgba(255,255,255,0.7);
      --color-checked: #fff;
      --indicator-color: #fff;
    }
  `]
})
export class DateTimePickerModalComponent implements OnInit {
  @Input() title: string = 'Seleccionar Fecha y Hora';
  @Input() initialValue?: string;
  @Input() minDate?: string;

  step = signal<'date' | 'time'>('date');

  selectedDate: string = '';

  // Internal time state
  currentHour: number = 12;
  currentMinute: number = 0;
  clockMode: 'hour' | 'minute' = 'hour';

  private modalCtrl = inject(ModalController);

  constructor() {
    addIcons({ calendarOutline, timeOutline, checkmarkOutline, closeOutline, arrowBackOutline });
  }

  ngOnInit() {
    if (this.initialValue) {
      this.selectedDate = this.initialValue;
      const d = new Date(this.initialValue);
      this.currentHour = d.getHours();
      this.currentMinute = d.getMinutes();
    } else {
      const now = new Date();
      this.selectedDate = now.toISOString();
      this.currentHour = now.getHours();
      this.currentMinute = now.getMinutes();
    }
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
  }

  onTimeChange(time: { hour: number, minute: number }) {
    this.currentHour = time.hour;
    this.currentMinute = time.minute;
  }

  onClockModeChange(mode: 'hour' | 'minute') {
    this.clockMode = mode;
  }

  onSegmentChange(event: any) {
    // Sync current selection before switching
    this.step.set(event.detail.value);
  }

  setStep(val: 'date' | 'time') {
    this.step.set(val);
  }

  getDisplayHour(): string {
    let h = this.currentHour % 12;
    if (h === 0) h = 12;
    return h.toString().padStart(2, '0');
  }

  getDisplayMinute(): string {
    return this.currentMinute.toString().padStart(2, '0');
  }

  getPeriod(): string {
    return this.currentHour >= 12 ? 'PM' : 'AM';
  }

  nextOrConfirm() {
    if (this.step() === 'date') {
      this.step.set('time');
      this.clockMode = 'hour'; // Reset to hour selection when entering time step
    } else {
      this.confirm(); // Allow confirm even if not explicitly "changed", usage of default is fine
    }
  }

  canConfirm(): boolean {
    return !!this.selectedDate;
  }

  confirm() {
    if (!this.canConfirm()) return;

    // Combine date and time
    const datePart = new Date(this.selectedDate);

    datePart.setHours(this.currentHour);
    datePart.setMinutes(this.currentMinute);
    datePart.setSeconds(0);
    datePart.setMilliseconds(0);

    const result = datePart.toISOString();
    this.modalCtrl.dismiss(result, 'confirm');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  formatDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}
