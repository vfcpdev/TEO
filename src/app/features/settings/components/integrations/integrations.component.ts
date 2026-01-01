import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonNote, IonCard, IonCardContent, ToastController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle, linkOutline, checkmarkCircle, alertCircle, syncOutline } from 'ionicons/icons';
import { GoogleCalendarService } from '../../../../core/services/integrations/google-calendar.service';
import { AgendaService } from '../../../../core/services/agenda.service';

@Component({
    selector: 'app-integrations',
    standalone: true,
    template: `
    <ion-content class="ion-padding integration-content">
      <ion-card class="integration-card">
        <ion-card-content>
          <div class="service-header">
            <ion-icon name="logo-google" size="large" color="danger"></ion-icon>
            <div class="service-info">
              <h2>Google Calendar</h2>
              <p>Sincroniza tus eventos automáticamente</p>
            </div>
          </div>

          @if (googleService.isAuthenticated()) {
            <div class="status-connected">
              <ion-icon name="checkmark-circle" color="success"></ion-icon>
              <span>Conectado</span>
            </div>
            
            <div class="actions">
                <ion-button expand="block" (click)="syncNow()" class="sync-btn">
                    <ion-icon slot="start" name="sync-outline"></ion-icon>
                    Sincronizar Ahora
                </ion-button>
                
                 <ion-button expand="block" fill="outline" color="medium" (click)="disconnect()">
                    Desconectar
                </ion-button>
            </div>

          } @else {
            <div class="auth-form">
               <ion-note color="warning" class="info-note">
                  <ion-icon name="alert-circle"></ion-icon>
                  Modo Desarrollador: Pega tu Access Token de Google aquí.
               </ion-note>
               
               <ion-item fill="outline" class="token-input">
                  <ion-label position="stacked">Access Token</ion-label>
                  <ion-input [(ngModel)]="tokenInput" placeholder="ya29..."></ion-input>
               </ion-item>

               <ion-button expand="block" (click)="connect()" [disabled]="!tokenInput">
                  <ion-icon slot="start" name="link-outline"></ion-icon>
                  Conectar
               </ion-button>
               
               <div class="help-text">
                   <small>Ve a <a href="https://developers.google.com/oauthplayground" target="_blank">OAuth Playground</a>, selecciona Google Calendar API v3, autoriza y copia el Access Token.</small>
               </div>
            </div>
          }
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
    styles: [`
    .integration-card {
        margin: 0;
    }
    .service-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
    }
    .service-info h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
    .service-info p {
        margin: 4px 0 0;
        color: var(--ion-color-medium);
        font-size: 14px;
    }
    .status-connected {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ion-color-success);
        font-weight: 500;
        margin-bottom: 20px;
        padding: 10px;
        background: var(--ion-color-success-contrast);
        border-radius: 8px;
    }
    .token-input {
        margin-bottom: 16px;
        --background: transparent;
    }
    .info-note {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin-bottom: 16px;
        font-size: 12px;
    }
    .help-text {
        margin-top: 16px;
        text-align: center;
        color: var(--ion-color-medium);
    }
    .actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
  `],
    imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon, IonItem, IonLabel, IonInput, IonNote, IonCard, IonCardContent]
})
export class IntegrationsComponent {
    public googleService = inject(GoogleCalendarService);
    private agendaService = inject(AgendaService);
    private toastCtrl = inject(ToastController);
    private modalCtrl = inject(ModalController);

    tokenInput = '';

    constructor() {
        addIcons({ logoGoogle, linkOutline, checkmarkCircle, alertCircle, syncOutline });
    }

    async connect() {
        if (this.tokenInput) {
            await this.googleService.login(this.tokenInput);
            this.showToast('Conectado a Google Calendar');
        }
    }

    async disconnect() {
        await this.googleService.logout();
        this.tokenInput = '';
    }

    async syncNow() {
        try {
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);

            const events = await this.googleService.listEvents(now, nextWeek);

            // Simple Import Logic: convert to 'Registros' (in memory for now)
            // In real full sync, this would be in a SyncService with diffing.
            let count = 0;
            for (const ev of events) {
                if (ev.start?.dateTime) {
                    // Check duplicate by name + time? simpler: just add as import
                    // Ideally use SyncService but for this task "Sync Logic" can be simple import
                    this.agendaService.addRegistro({
                        id: crypto.randomUUID(),
                        profileId: 'default', // TODO: user ID
                        name: ev.summary || 'Evento Google',
                        status: 'completado', // Imported
                        priority: 'soft',
                        startTime: new Date(ev.start.dateTime),
                        endTime: ev.end?.dateTime ? new Date(ev.end.dateTime) : undefined,
                        isAllDay: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        contextoId: 'google_import' // Tag as imported
                    } as any);
                    count++;
                }
            }

            this.showToast(`Sincronizado: ${count} eventos importados.`);
        } catch (err) {
            this.showToast('Error al sincronizar. Token expirado?', 'danger');
        }
    }

    close() {
        this.modalCtrl.dismiss();
    }

    private async showToast(msg: string, color: 'success' | 'danger' = 'success') {
        const t = await this.toastCtrl.create({
            message: msg,
            duration: 2000,
            color: color,
            position: 'bottom'
        });
        await t.present();
    }
}
