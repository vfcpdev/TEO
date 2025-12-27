import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge } from '@ionic/angular/standalone';
import { RegistroStatus } from '../../../models/registro.model';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule, IonBadge],
    template: `
    <ion-badge [style.background-color]="getStatusColor()" class="status-badge">
      {{ getStatusLabel() }}
    </ion-badge>
  `,
    styles: [`
    .status-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class StatusBadgeComponent {
    @Input() status: RegistroStatus = RegistroStatus.BORRADOR;

    getStatusColor(): string {
        switch (this.status) {
            case RegistroStatus.CONFIRMADO: return '#1e40af'; // Azul Bosque Profundo
            case RegistroStatus.BORRADOR: return '#6b7280';    // Gris Slate
            case RegistroStatus.ESTUDIO: return '#f59e0b';     // Amber
            case RegistroStatus.DESCARTADO: return '#991b1b';  // Ladrillo
            case RegistroStatus.APLAZADO: return '#846200';    // Ocre Oscuro
            default: return '#6b7280';
        }
    }

    getStatusLabel(): string {
        switch (this.status) {
            case RegistroStatus.CONFIRMADO: return 'Confirmado';
            case RegistroStatus.BORRADOR: return 'Borrador';
            case RegistroStatus.ESTUDIO: return 'En Estudio';
            case RegistroStatus.DESCARTADO: return 'Descartado';
            case RegistroStatus.APLAZADO: return 'Aplazado';
            default: return this.status;
        }
    }
}
