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
  IonAvatar,
  IonFab,
  IonFabButton,
  IonModal,
  IonToolbar,
  IonHeader,
  IonTitle,
  IonButtons,
  AlertController
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
        <div class="header-text">
          <h3>Perfiles</h3>
          <p>Gestiona tus perfiles y sus calendarios asociados (Personal, Trabajo, Familia, etc.).</p>
        </div>
        <ion-button class="ion-hide-lg-down" (click)="openAddModal()">
          <ion-icon name="person-add-outline" slot="start"></ion-icon>
          Nuevo Perfil
        </ion-button>
      </div>

      <ion-list lines="none" class="profile-list">
        @for (profile of profiles(); track profile.id) {
          <ion-item class="profile-item shadow-sm">
            @if (profile.color) {
              <div class="profile-color-indicator" [style.background-color]="profile.color" slot="start"></div>
            }
            <ion-avatar slot="start">
              <img [src]="profile.avatar || 'assets/avatars/default.png'" />
            </ion-avatar>
            <ion-label>
              <h2>{{ profile.name }} 
                @if (profile.isPrimary) {
                  <ion-icon name="star" color="warning"></ion-icon>
                }
              </h2>
              <p>{{ profile.role }} ({{ profile.alias }})</p>
            </ion-label>
            <div class="actions" slot="end">
              <ion-button fill="clear" (click)="editProfile(profile)">
                <ion-icon name="pencil-outline" slot="icon-only"></ion-icon>
              </ion-button>
              @if (!profile.isPrimary) {
                <ion-button fill="clear" color="danger" (click)="confirmDelete(profile.id)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-button>
              }
            </div>
          </ion-item>
        }
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="ion-hide-lg-up">
        <ion-fab-button (click)="openAddModal()">
          <ion-icon name="person-add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- MODAL PARA AÑADIR/EDITAR PERFIL -->
      <ion-modal [isOpen]="isModalOpen()" (didDismiss)="closeModal()" class="profile-modal">
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
              <ion-input [(ngModel)]="tempProfile.role" placeholder="Ej: Madre, Jefe, Tío, etc."></ion-input>
            </ion-item>

            <div class="color-picker-section">
              <label class="color-label">Color de Perfil</label>
              <div class="color-swatches">
                @for (color of availableColors; track color) {
                  <div 
                    class="color-swatch" 
                    [class.selected]="tempProfile.color === color"
                    [style.background-color]="color"
                    (click)="selectColor(color)">
                    @if (tempProfile.color === color) {
                      <ion-icon name="checkmark" style="color: white; font-size: 20px;"></ion-icon>
                    }
                  </div>
                }
              </div>
            </div>

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
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-text {
        h3 { font-weight: 700; margin-bottom: 4px; font-size: 1.125rem; margin-top: 0; }
        p { color: var(--ion-color-medium); font-size: 0.8125rem; margin: 0; }
      }
    }

    .profile-item {
      --background: var(--ion-card-background);
      --border-radius: 12px;
      margin-bottom: 10px;
      
      ion-avatar {
        width: 40px;
        height: 40px;
        margin-right: 12px;
      }
      
      h2 { font-weight: 600; font-size: 0.9375rem; display: flex; align-items: center; gap: 8px; }
      p { font-size: 0.8125rem; margin-top: 2px; }
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

    .color-picker-section {
      margin-bottom: 24px;
      
      .color-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--ion-color-step-600);
        margin-bottom: 12px;
      }
      
      .color-swatches {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        
        .color-swatch {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          
          &:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          
          &.selected {
            border-color: var(--ion-color-step-800);
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
        }
      }
    }

    .profile-color-indicator {
      width: 4px;
      height: 40px;
      border-radius: 2px;
      margin-right: 8px;
    }

    .modal-actions {
      margin-top: 32px;
    }

    /* Ajuste para Modal en Desktop */
    ::ng-deep .profile-modal {
      --width: 100%;
      --height: 100%;
      
      @media (min-width: 768px) {
        --width: 400px;
        --height: auto;
        --max-height: 600px;
        --border-radius: 16px;
        --box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        
        &::part(content) {
          border-radius: 16px;
        }
      }
    }
  `]
})
export class ProfileSettingsComponent {
  protected readonly registroService = inject(RegistroEstadoService);
  private readonly alertController = inject(AlertController);

  profiles = this.registroService.profiles;

  isModalOpen = signal(false);
  editingProfileId: string | null = null;
  tempProfile: CreateProfileDto = { name: '', alias: '', role: '', color: '#3B82F6' };

  // Predefined color palette
  availableColors = [
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
  ];

  constructor() {
    addIcons({ personAddOutline, pencilOutline, trashOutline, star, peopleCircleOutline, closeOutline, saveOutline, cameraOutline });
  }

  openAddModal() {
    this.editingProfileId = null;
    this.tempProfile = { name: '', alias: '', role: '', color: this.availableColors[0] };
    this.isModalOpen.set(true);
  }

  editProfile(profile: UserProfile) {
    this.editingProfileId = profile.id;
    this.tempProfile = {
      name: profile.name,
      alias: profile.alias,
      role: profile.role,
      avatar: profile.avatar,
      color: profile.color || this.availableColors[0]
    };
    this.isModalOpen.set(true);
  }

  selectColor(color: string) {
    this.tempProfile.color = color;
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async saveProfile() {
    if (this.editingProfileId) {
      // Update existing profile
      await this.registroService.updateProfile(this.editingProfileId, this.tempProfile);
    } else {
      // Create new profile
      const newProfile: UserProfile = {
        ...this.tempProfile,
        id: crypto.randomUUID(),
        isPrimary: false,
        isActive: true,
        createdAt: new Date(),
        config: {} as any
      };
      await this.registroService.addProfile(newProfile);
    }
    this.closeModal();
  }

  async confirmDelete(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este perfil?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.registroService.deleteProfile(id);
            } catch (error) {
              // Show error if trying to delete primary profile
              const errorAlert = await this.alertController.create({
                header: 'Error',
                message: 'No se puede eliminar el perfil principal.',
                buttons: ['OK']
              });
              await errorAlert.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  isValid() {
    return this.tempProfile.name.trim().length > 0 && this.tempProfile.alias.trim().length > 0;
  }
}
