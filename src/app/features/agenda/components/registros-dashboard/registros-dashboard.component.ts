import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonAvatar,
  IonChip,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  documentTextOutline,
  alertCircleOutline,
  peopleOutline,
  calendarOutline
} from 'ionicons/icons';
import { RegistroEstadoService } from '../../../../core/services/registro-estado.service';
import { AgendaService } from '../../../../core/services/agenda.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Registro, RegistroStatus } from '../../../../models/registro.model';
import { AreaConfig } from '../../../../models/agenda.model';

@Component({
  selector: 'app-registros-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonIcon,
    IonAvatar,
    IonChip,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText,
    StatusBadgeComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- SELECTOR DE PERFIL -->
      <div class="profile-selector-bar">
        @for (profile of profiles(); track profile.id) {
          <div class="profile-tab" 
               [class.active]="activeProfileId() === profile.id"
               (click)="selectProfile(profile.id)">
            <ion-avatar [style.border-color]="profile.color || '#ccc'">
              <img [src]="profile.avatar || 'assets/avatars/default.png'" />
            </ion-avatar>
            <ion-label>{{ profile.alias }}</ion-label>
          </div>
        }
      </div>

      <!-- SELECTOR DE ESTADO -->
      <ion-segment [value]="selectedStatus()" (ionChange)="onStatusChange($event)" class="status-segment">
        <ion-segment-button value="confirmado">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
          <ion-label>C</ion-label>
        </ion-segment-button>
        <ion-segment-button value="borrador">
          <ion-icon name="document-text-outline"></ion-icon>
          <ion-label>B</ion-label>
        </ion-segment-button>
        <ion-segment-button value="estudio">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <ion-label>E</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- LISTA DE REGISTROS -->
      <div class="registros-list">
        @if (filteredRegistros().length === 0) {
          <div class="empty-state">
             <ion-icon name="calendar-outline"></ion-icon>
             <p>No hay registros para este estado.</p>
          </div>
        } @else {
          @for (reg of filteredRegistros(); track reg.id) {
            <ion-card class="registro-card border-left" [style.border-left-color]="reg.status ? getStatusColor(reg.status) : '#ccc'">
              <ion-card-header>
                <div class="card-top">
                  @if (reg.status) {
                    <app-status-badge [status]="reg.status"></app-status-badge>
                  }
                  <ion-text color="medium">{{ reg.startTime | date:'shortTime' }}</ion-text>
                </div>
                <ion-card-title>{{ reg.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ reg.notes || 'Sin notas adicionales.' }}</p>
                @if (reg.areaId) {
                  <ion-chip outline color="primary">
                    <ion-label>{{ getAreaName(reg.areaId) }}</ion-label>
                  </ion-chip>
                }
              </ion-card-content>
            </ion-card>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--ion-background-color);
    }

    .profile-selector-bar {
      display: flex;
      padding: 12px;
      gap: 16px;
      overflow-x: auto;
      background: var(--ion-color-step-50);
      border-bottom: 1px solid var(--ion-color-step-100);
      
      .profile-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        opacity: 0.6;
        transition: all 0.3s ease;
        min-width: 60px;
        
        ion-avatar {
          width: 40px;
          height: 40px;
          border: 2px solid transparent;
        }
        
        ion-label {
          font-size: 11px;
          font-weight: 600;
        }
        
        &.active {
          opacity: 1;
          ion-avatar {
            border-color: var(--ion-color-primary);
            transform: scale(1.1);
          }
          ion-label {
            color: var(--ion-color-primary);
          }
        }
      }
    }

    .status-segment {
      margin: 12px;
      --background: var(--ion-color-step-100);
    }

    .registros-list {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
    }

    .registro-card {
      margin: 8px 4px;
      border-left: 4px solid #ccc;
      
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      ion-card-title {
        font-size: 18px;
        font-weight: 700;
      }
    }

    .empty-state {
      text-align: center;
      padding: 64px 20px;
      color: var(--ion-color-medium);
      
      ion-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
    }
  `]
})
export class RegistrosDashboardComponent {
  private readonly registroService = inject(RegistroEstadoService);
  private readonly agendaService = inject(AgendaService);

  profiles = this.registroService.profiles;
  activeProfileId = this.registroService.activeProfileId;
  selectedStatus = signal<RegistroStatus>(RegistroStatus.CONFIRMADO);

  filteredRegistros = computed(() => {
    return this.registroService.getRegistrosByStatus(this.selectedStatus())();
  });

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      documentTextOutline,
      alertCircleOutline,
      peopleOutline,
      calendarOutline
    });
  }


  selectProfile(id: string) {
    this.registroService.setActiveProfile(id);
  }

  onStatusChange(event: any) {
    this.selectedStatus.set(event.detail.value);
  }

  getStatusColor(status: RegistroStatus): string {
    switch (status) {
      case RegistroStatus.CONFIRMADO: return '#1e40af';
      case RegistroStatus.BORRADOR: return '#6b7280';
      case RegistroStatus.ESTUDIO: return '#f59e0b';
      default: return '#ccc';
    }
  }

  getAreaName(id: string) {
    return this.agendaService.areas().find(a => a.id === id)?.name || 'Sin Área';
  }
}
