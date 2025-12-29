import { Component, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { IonIcon, IonLabel } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { documentTextOutline, calendarOutline } from 'ionicons/icons';

@Component({
    selector: 'app-fab-options',
    template: `
    <div class="fab-options-container" (click)="dismiss()">
      <div class="fab-options-content" (click)="$event.stopPropagation()">
        <div class="option-button" (click)="selectOption('borrador')">
          <ion-icon name="document-text-outline" color="medium"></ion-icon>
          <ion-label>Borrador</ion-label>
          <p class="option-description">Sin fecha ni hora</p>
        </div>
        
        <div class="option-button" (click)="selectOption('agendar')">
          <ion-icon name="calendar-outline" color="primary"></ion-icon>
          <ion-label>Agendar</ion-label>
          <p class="option-description">Con fecha y hora</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .fab-options-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20000;
    }

    .fab-options-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      animation: slideIn 0.3s ease-out;
    }

    // Landscape mode and Desktop: display options in columns (side by side)
    @media (orientation: landscape) and (max-width: 991px), (min-width: 992px) {
      .fab-options-content {
        flex-direction: row;
        gap: 20px;
      }
    }

    .option-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px 32px;
      background: var(--ion-card-background);
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      min-width: 200px;
    }

    .option-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .option-button ion-icon {
      font-size: 48px;
    }

    .option-button ion-label {
      font-size: 18px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .option-description {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
    standalone: true,
    imports: [CommonModule, IonIcon, IonLabel]
})
export class FabOptionsComponent {
    private modalCtrl = inject(ModalController);

    constructor() {
        addIcons({ documentTextOutline, calendarOutline });
    }

    selectOption(option: 'borrador' | 'agendar') {
        this.modalCtrl.dismiss(option);
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }
}
