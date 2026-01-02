import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Registro } from '../../../../models/registro.model';
import { AgendaService } from '../../../../core/services/agenda.service';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, closeOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-day-detail-drawer',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="previousDay()" fill="clear">
            <ion-icon name="chevron-back" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="ion-text-center">{{ formattedDate() }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="nextDay()" fill="clear">
            <ion-icon name="chevron-forward" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="close()" fill="clear">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      @if (dayRegistros().length === 0) {
        <div class="empty-state">
          <ion-icon name="calendar-outline" color="medium"></ion-icon>
          <h3>Sin eventos</h3>
          <p>No hay registros para este día</p>
        </div>
      } @else {
        <div class="registros-container">
          @for (registro of dayRegistros(); track registro.id) {
            <ion-card class="registro-card" (click)="onRegistroClick(registro)">
              <ion-card-header>
                <div class="card-header-content">
                  <ion-card-title>{{ registro.name }}</ion-card-title>
                  <ion-chip [color]="getStatusColor(registro.status)" mode="ios">
                    {{ registro.status }}
                  </ion-chip>
                </div>
              </ion-card-header>
              <ion-card-content>
                <div class="registro-details">
                  <div class="detail-row">
                    <ion-icon name="time-outline"></ion-icon>
                    <span>{{ formatTime(registro.startTime) }} - {{ formatTime(registro.endTime) }}</span>
                  </div>
                  <div class="detail-row">
                    <ion-icon name="hourglass-outline"></ion-icon>
                    <span>{{ getDuration(registro) }} minutos</span>
                  </div>
                  @if (registro.notes) {
                    <div class="detail-row notes">
                      <ion-icon name="document-text-outline"></ion-icon>
                      <span>{{ registro.notes }}</span>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`
    ion-toolbar {
      --background: var(--ion-color-primary);
      --color: var(--ion-color-primary-contrast);
    }

    ion-title {
      font-size: 1rem;
      font-weight: 600;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      gap: 12px;
      color: var(--ion-color-medium);
      text-align: center;
      
      ion-icon {
        font-size: 64px;
        opacity: 0.5;
      }

      h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }

    .registros-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 16px;
    }

    .registro-card {
      margin: 0;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:active {
        transform: scale(0.98);
      }
    }

    .card-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      ion-card-title {
        font-size: 1rem;
        margin: 0;
        flex: 1;
      }

      ion-chip {
        margin: 0;
        font-size: 0.75rem;
        text-transform: capitalize;
      }
    }

    .registro-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      span {
        flex: 1;
      }

      &.notes {
        span {
          font-style: italic;
          line-height: 1.4;
        }
      }
    }
  `]
})
export class DayDetailDrawerComponent {
  private modalCtrl = inject(ModalController);
  private agendaService = inject(AgendaService);

  @Input() date: Date = new Date();

  currentDate = signal<Date>(new Date());

  dayRegistros = computed(() => {
    const target = this.currentDate();
    const allRegistros = this.agendaService.registros();

    return allRegistros.filter(r => {
      if (!r.startTime) return false;
      const d = new Date(r.startTime);
      return d.getDate() === target.getDate() &&
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear();
    }).sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  });

  formattedDate = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  constructor() {
    addIcons({ chevronBack, chevronForward, closeOutline, calendarOutline });

    // Initialize with input date
    effect(() => {
      if (this.date) {
        this.currentDate.set(new Date(this.date));
      }
    });
  }

  previousDay() {
    const current = this.currentDate();
    const previous = new Date(current);
    previous.setDate(previous.getDate() - 1);
    this.currentDate.set(previous);
  }

  nextDay() {
    const current = this.currentDate();
    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    this.currentDate.set(next);
  }

  close() {
    this.modalCtrl.dismiss();
  }

  onRegistroClick(registro: Registro) {
    this.modalCtrl.dismiss({ registro });
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

  getStatusColor(status: string | undefined): string {
    switch (status) {
      case 'confirmado': return 'success';
      case 'pendiente': return 'warning';
      case 'cancelado': return 'danger';
      default: return 'medium';
    }
  }
}
