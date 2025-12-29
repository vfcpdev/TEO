import { Component } from '@angular/core';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  ModalController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  personOutline,
  logoAngular,
  logoIonic,
  flashOutline,
  serverOutline,
  buildOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol
  ],
  template: `
    <ion-content class="ion-no-scroll custom-modal-content">
      <div class="modal-wrapper">
        <!-- Logo superpuesto: Absolute position relative to wrapper -->
        <div class="logo-wrapper">
          <div class="logo-sq">
            <img src="assets/icon/icon.png" alt="TEO Logo">
          </div>
        </div>

        <!-- Tarjeta de Información -->
        <div class="glass-card">
          <div class="card-content">
            <!-- TEO Iniciales bajo el logo -->
            <h1 class="top-initials">TEO</h1>

            <h2 class="app-title">
              <span class="title-chip">
                <span class="gold-initial">T</span>iempo 
                <span class="gold-initial">E</span>s 
                <span class="gold-initial">O</span>ro
              </span>
            </h2>
            <p class="app-desc">Asistente inteligente para la gestión del tiempo</p>

            <div class="divider"></div>

            <ion-grid class="info-grid">
              <ion-row>
                <ion-col size="6">
                  <div class="mini-info">
                    <ion-icon name="person-outline" color="secondary" class="mini-icon"></ion-icon>
                    <span class="label">Autor</span>
                    <span class="value">VFCP</span>
                  </div>
                </ion-col>
                <ion-col size="6">
                  <div class="mini-info">
                    <ion-icon name="build-outline" color="primary" class="mini-icon"></ion-icon>
                    <span class="label">Versión</span>
                    <span class="value">1.0.1</span>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <div class="technologies-section">
              <span class="tech-label">Powering TEO</span>
              <div class="tech-icons">
                <ion-icon name="logo-angular" color="danger"></ion-icon>
                <ion-icon name="logo-ionic" color="primary"></ion-icon>
                <ion-icon name="flash-outline" color="warning"></ion-icon>
                <ion-icon name="server-outline" color="medium"></ion-icon>
              </div>
            </div>

            <div class="actions">
              <ion-button (click)="dismiss()" fill="outline" shape="round" color="primary" class="accept-btn-small">
                Aceptar
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content {
      --background: transparent;
    }

    .custom-modal-content {
      --background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .modal-wrapper {
      position: relative;
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
      /* 55px Padding Superior = Espacio para la MITAD SUPERIOR del logo (110px/2) */
      padding-top: 55px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .logo-wrapper {
      position: absolute;
      /* Top 0 del wrapper. Como el card empieza en 55px por el padding, 
         y el logo mide 110px, su centro (55px) se alinea con el borde del card */
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 20;
      /* Pointer events none para que no bloquee clicks si se solapa mal, 
         pero allow clicks en logo si fuera interactivo */
      pointer-events: none;
    }

    .logo-sq {
      pointer-events: auto;
      width: 110px;
      height: 110px;
      padding: 0;
      background: var(--ion-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border-radius: 20px;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 20px;
      }
    }
    
    .top-initials {
      /* Margen 0 top porque el padding del card ya da el espacio */
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 900;
      color: #FFD700;
      /* Sombra en gris para resaltar (interpretando 'sobre' como sombra) */
      text-shadow: 2px 2px 4px rgba(128, 128, 128, 0.6), 0 0 2px rgba(0,0,0,0.2);
      letter-spacing: 2px;
      text-align: center;
      display: block;
    }

    .glass-card {
      background: var(--ion-background-color);
      border-radius: 24px;
      /* Padding-top: 55px (mitad inferior logo) + 5px (gap visual mínimo) = 60px */
      padding: 60px 16px 16px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--ion-border-color);
    }

    .app-title {
      text-align: center;
      margin: 0 0 8px;
    }

    .title-chip {
      background: #000000;
      color: #ffffff;
      padding: 6px 16px;
      border-radius: 20px;
      display: inline-block;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    .gold-initial {
      color: #FFD700;
      font-size: 1.1em;
      text-shadow: 0 1px 1px rgba(0,0,0,0.3);
    }

    .app-desc {
      text-align: center;
      font-size: 13px;
      color: var(--ion-color-medium);
      margin: 4px 0 12px;
    }

    .divider {
      height: 1px;
      background: var(--ion-border-color);
      width: 60%;
      margin: 0 auto 12px;
    }

    .mini-info {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      
      .mini-icon {
        font-size: 18px;
        margin-bottom: 0;
        opacity: 0.8;
      }

      .label {
        font-size: 9px;
        text-transform: uppercase;
        color: var(--ion-color-medium);
        letter-spacing: 1px;
      }
      
      .value {
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-text-color);
      }
    }

    .technologies-section {
      margin-top: 12px;
      text-align: center;
      background: rgba(var(--ion-color-primary-rgb), 0.05); 
      padding: 8px;
      border-radius: 12px;

      .tech-label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: block;
        margin-bottom: 4px;
        color: var(--ion-color-medium);
      }

      .tech-icons {
        display: flex;
        justify-content: center;
        gap: 12px;
        
        ion-icon {
          font-size: 20px;
          transition: transform 0.2s;
          filter: none;
          
          &:hover {
            transform: scale(1.2);
          }
        }
      }
    }

    .actions {
      margin-top: 12px;
      display: flex;
      justify-content: center;
    }

    .accept-btn-small {
      min-width: 80px;
      height: 32px;
      font-size: 12px;
      --border-color: initial;
      --color: initial;
      
      &:hover {
        --background: initial;
      }
    }
  `]
})
export class AboutModalComponent {
  constructor(private modalCtrl: ModalController) {
    addIcons({
      personOutline,
      logoAngular,
      logoIonic,
      flashOutline,
      serverOutline,
      buildOutline
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
