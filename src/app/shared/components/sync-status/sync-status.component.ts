import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, cloudDoneOutline, cloudOfflineOutline, alertCircleOutline, refreshOutline } from 'ionicons/icons';

@Component({
    selector: 'app-sync-status',
    standalone: true,
    imports: [CommonModule, IonicModule],
    template: `
    <div class="sync-status" [class]="status()" (click)="onStatusClick()">
      @switch (status()) {
        @case ('syncing') {
          <div class="status-content syncing">
            <ion-icon name="refresh-outline" class="spin"></ion-icon>
            <span class="label">Sincronizando...</span>
          </div>
        }
        @case ('error') {
          <div class="status-content error">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <span class="label">Error de Sincronización</span>
          </div>
        }
        @case ('offline') {
           <!-- Offline is handled by offline-indicator, but we can show cloud-offline here too or hide -->
           <div class="status-content offline">
             <ion-icon name="cloud-offline-outline"></ion-icon>
           </div>
        }
        @case ('idle') {
           <!-- Show nothing or green check for a moment? -->
           <!-- Let's show a subtle cloud-done if we want confirmation, or just hide -->
           <!-- <ion-icon name="cloud-done-outline" color="success"></ion-icon> -->
        }
      }
    </div>
  `,
    styles: [`
    :host {
      position: fixed;
      bottom: 20px;
      left: 20px; /* Opposite of FAB? or somewhere else */
      z-index: 1000;
      pointer-events: none;
    }

    .sync-status {
      pointer-events: auto;
      transition: all 0.3s ease;
    }

    .status-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      font-size: 12px;
      font-weight: 500;
    }

    .syncing {
      color: var(--ion-color-primary);
      border: 1px solid var(--ion-color-primary);
    }

    .error {
      background: var(--ion-color-danger);
      color: white;
    }

    .offline {
      color: var(--ion-color-medium);
      background: var(--ion-color-light);
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class SyncStatusComponent {
    private syncService = inject(SyncQueueService);

    status = this.syncService.syncStatus;

    constructor() {
        addIcons({ cloudUploadOutline, cloudDoneOutline, cloudOfflineOutline, alertCircleOutline, refreshOutline });
    }

    onStatusClick() {
        if (this.status() === 'error') {
            // Retry
            this.syncService.processQueue();
        }
    }
}
