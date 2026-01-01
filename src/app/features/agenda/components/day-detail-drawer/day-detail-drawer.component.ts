import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';

@Component({
    selector: 'app-day-detail-drawer',
    standalone: true,
    imports: [CommonModule, IonicModule],
    template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ dateTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div *ngIf="registros.length === 0" class="empty-state">
        <ion-icon name="calendar-outline" color="medium"></ion-icon>
        <p>No hay eventos registrados para este día.</p>
      </div>

      <ion-list *ngIf="registros.length > 0">
        <ion-item *ngFor="let reg of registros" lines="full">
          <ion-label>
            <h2>{{ reg.name }}</h2>
            <p>{{ formatTime(reg.startTime) }} - {{ formatTime(reg.endTime) }}</p>
          </ion-label>
          <ion-chip slot="end" color="primary" mode="ios" outline="true">
            {{ getDuration(reg) }} min
          </ion-chip>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
    styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 16px;
      color: var(--ion-color-medium);
      
      ion-icon {
        font-size: 48px;
        opacity: 0.5;
      }
    }
  `]
})
export class DayDetailDrawerComponent {
    private modalCtrl = inject(ModalController);

    @Input() date: Date = new Date();
    @Input() registros: Registro[] = [];

    get dateTitle(): string {
        return this.date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    close() {
        this.modalCtrl.dismiss();
    }

    formatTime(date: Date | string | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    getDuration(reg: Registro): number {
        if (reg.duration) return reg.duration;
        if (reg.startTime && reg.endTime) {
            const start = new Date(reg.startTime).getTime();
            const end = new Date(reg.endTime).getTime();
            return Math.round((end - start) / 60000);
        }
        return 0;
    }
}
