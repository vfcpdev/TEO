import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';
import { NetworkService } from '../../../core/services/network.service';

@Component({
    selector: 'app-offline-indicator',
    standalone: true,
    imports: [CommonModule, IonIcon],
    template: `
    @if (isOffline()) {
      <div class="offline-banner">
        <ion-icon name="cloud-offline-outline"></ion-icon>
        <span>Sin conexión - Trabajando en modo offline</span>
      </div>
    }
  `,
    styles: [`
    .offline-banner {
      background-color: var(--ion-color-warning);
      color: var(--ion-color-warning-contrast);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px;
      font-size: 14px;
      font-weight: 500;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `]
})
export class OfflineIndicatorComponent {
    private networkService = inject(NetworkService);
    isOffline = computed(() => !this.networkService.isOnline());

    constructor() {
        addIcons({ cloudOfflineOutline });
    }
}
