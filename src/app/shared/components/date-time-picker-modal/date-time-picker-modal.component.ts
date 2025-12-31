import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, checkmarkOutline, closeOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
    selector: 'app-date-time-picker-modal',
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule],
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

    <ion-content class="ion-padding">
      
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
        <div class="selected-value">
          {{ formatTime(selectedTime) }}
        </div>
        <ion-datetime
          #timePicker
          presentation="time"
          [value]="selectedTime"
          locale="es-ES"
          size="cover"
          (ionChange)="onTimeChange($event)"
          [showDefaultButtons]="false"
        ></ion-datetime>
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
    }

    .picker-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
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
export class DateTimePickerModalComponent {
    @Input() title: string = 'Seleccionar Fecha y Hora';
    @Input() initialValue?: string;
    @Input() minDate?: string;

    step = signal<'date' | 'time'>('date');

    selectedDate: string = '';
    selectedTime: string = '';

    constructor(private modalCtrl: ModalController) {
        addIcons({ calendarOutline, timeOutline, checkmarkOutline, closeOutline, arrowBackOutline });
    }

    ngOnInit() {
        if (this.initialValue) {
            this.selectedDate = this.initialValue;
            this.selectedTime = this.initialValue;
        } else {
            const now = new Date().toISOString();
            this.selectedDate = now;
            this.selectedTime = now;
        }
    }

    onDateChange(event: any) {
        this.selectedDate = event.detail.value;
    }

    onTimeChange(event: any) {
        this.selectedTime = event.detail.value;
    }

    onSegmentChange(event: any) {
        this.step.set(event.detail.value);
    }

    setStep(val: 'date' | 'time') {
        this.step.set(val);
    }

    nextOrConfirm() {
        if (this.step() === 'date') {
            this.step.set('time');
        } else {
            this.confirm();
        }
    }

    canConfirm(): boolean {
        return !!this.selectedDate && !!this.selectedTime;
    }

    confirm() {
        if (!this.canConfirm()) return;

        // Combine date and time
        const datePart = new Date(this.selectedDate);
        const timePart = new Date(this.selectedTime);

        datePart.setHours(timePart.getHours());
        datePart.setMinutes(timePart.getMinutes());
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

    formatTime(iso: string) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
}
