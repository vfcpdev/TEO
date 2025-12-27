import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonAvatar,
  IonFab,
  IonFabButton,
  IonModal,
  IonToolbar,
  IonHeader,
  IonTitle,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  pencilOutline,
  trashOutline,
  star,
  peopleCircleOutline,
  closeOutline,
  saveOutline,
  cameraOutline
} from 'ionicons/icons';
import { RegistroEstadoService } from '../../../../core/services/registro-estado.service';
import { UserProfile, CreateProfileDto } from '../../../../models/profile.model';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonAvatar,
    IonFab,
    IonFabButton,
    IonModal,
    IonToolbar,
    IonHeader,
    IonTitle,
    IonButtons
  ],
  template: `
    <div class="profiles-container">
      <div class="section-header">
        <h3>Perfiles de Familia</h3>
        <p>Gestiona los miembros de tu núcleo familiar para agendas compartidas.</p>
      </div>

      <ion-list lines="none" class="profile-list">
        @for (profile of profiles(); track profile.id) {
          <ion-item class="profile-item shadow-sm">
            <ion-avatar slot="start">
              <img [src]="profile.avatar || 'assets/avatars/default.png'" />
            </ion-avatar>
            <ion-label>
              <h2>{{ profile.name }} 
                @if (profile.isPrimary) {
                  <ion-icon name="star" color="warning"></ion-icon>
                }
              </h2>
              <p>{{ profile.role | titlecase }} ({{ profile.alias }})</p>
            </ion-label>
            <div class="actions" slot="end">
              <ion-button fill="clear" (click)="editProfile(profile)">
                <ion-icon name="pencil-outline" slot="icon-only"></ion-icon>
              </ion-button>
              @if (!profile.isPrimary) {
                <ion-button fill="clear" color="danger" (click)="deleteProfile(profile.id)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-button>
              }
            </div>
          </ion-item>
        }
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="openAddModal()">
          <ion-icon name="person-add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL PARA AÑADIR/EDITAR PERFIL -->
      <ion-modal [isOpen]="isModalOpen()" (didDismiss)="closeModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title>{{ editingProfileId ? 'Editar Perfil' : 'Nuevo Perfil' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeModal()">
                  <ion-icon icon="close-outline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          
          <div class="modal-content ion-padding">
            <div class="avatar-selector">
               <ion-avatar>
                 <img [src]="tempProfile.avatar || 'assets/avatars/default.png'" />
               </ion-avatar>
               <ion-button fill="clear" size="small">
                 <ion-icon name="camera-outline" slot="start"></ion-icon> Cambiar Foto
               </ion-button>
            </div>

            <ion-item fill="outline" class="input-item">
              <ion-label position="floating">Nombre Completo</ion-label>
              <ion-input [(ngModel)]="tempProfile.name" placeholder="Ej: Maria Lopez"></ion-input>
            </ion-item>

            <ion-item fill="outline" class="input-item">
              <ion-label position="floating">Alias (Corto)</ion-label>
              <ion-input [(ngModel)]="tempProfile.alias" placeholder="Ej: Mama"></ion-input>
            </ion-item>

            <ion-item fill="outline" class="input-item">
              <ion-label position="floating">Rol / Parentesco</ion-label>
              <ion-select [(ngModel)]="tempProfile.role" interface="popover">
                <ion-select-option value="padre">Padre</ion-select-option>
                <ion-select-option value="madre">Madre</ion-select-option>
                <ion-select-option value="hijo">Hijo</ion-select-option>
                <ion-select-option value="hija">Hija</ion-select-option>
                <ion-select-option value="otro">Otro</ion-select-option>
              </ion-select>
            </ion-item>

            <div class="modal-actions">
              <ion-button expand="block" (click)="saveProfile()" [disabled]="!isValid()">
                <ion-icon name="save-outline" slot="start"></ion-icon>
                Guardar Perfil
              </ion-button>
            </div>
          </div>
        </ng-template>
      </ion-modal>
    </div>
  `,
  styles: [`
    .profiles-container {
      padding: 16px;
      padding-bottom: 80px;
    }

    .section-header {
      margin-bottom: 24px;
      h3 { font-weight: 700; margin-bottom: 4px; }
      p { color: var(--ion-color-medium); font-size: 14px; }
    }

    .profile-item {
      --background: var(--ion-card-background);
      --border-radius: 12px;
      margin-bottom: 12px;
      
      ion-avatar {
        width: 48px;
        height: 48px;
        margin-right: 16px;
      }
      
      h2 { font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 8px; }
    }

    .avatar-selector {
       display: flex;
       flex-direction: column;
       align-items: center;
       margin-bottom: 24px;
       
       ion-avatar {
         width: 80px;
         height: 80px;
         margin-bottom: 8px;
         border: 2px solid var(--ion-color-primary);
       }
    }

    .input-item {
      margin-bottom: 16px;
      --background: var(--ion-color-step-50);
      --border-radius: 8px;
    }

    .modal-actions {
      margin-top: 32px;
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  protected readonly registroService = inject(RegistroEstadoService);

  profiles = this.registroService.profiles;

  isModalOpen = signal(false);
  editingProfileId: string | null = null;
  tempProfile: CreateProfileDto = { name: '', alias: '', role: 'otro' };

  constructor() {
    addIcons({ personAddOutline, pencilOutline, trashOutline, star, peopleCircleOutline, closeOutline, saveOutline, cameraOutline });
  }

  ngOnInit() {
  }

  openAddModal() {
    this.editingProfileId = null;
    this.tempProfile = { name: '', alias: '', role: 'otro' };
    this.isModalOpen.set(true);
  }

  editProfile(profile: UserProfile) {
    this.editingProfileId = profile.id;
    this.tempProfile = {
      name: profile.name,
      alias: profile.alias,
      role: profile.role,
      avatar: profile.avatar
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveProfile() {
    if (this.editingProfileId) {
      // Update logic (to be added to service if needed, for now we simulate)
    } else {
      const newProfile: UserProfile = {
        ...this.tempProfile,
        id: crypto.randomUUID(),
        isPrimary: false,
        isActive: true,
        createdAt: new Date(),
        config: {} as any
      };
      this.registroService.addProfile(newProfile);
    }
    this.closeModal();
  }

  deleteProfile(id: string) {
    // Delete logic (to be added to service)
  }

  isValid() {
    return this.tempProfile.name.trim().length > 0 && this.tempProfile.alias.trim().length > 0;
  }
}
