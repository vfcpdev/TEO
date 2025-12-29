import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonListHeader, IonLabel, IonItem, IonIcon, IonToggle, PopoverController } from '@ionic/angular/standalone';
import { THEMES } from '../../../../core/constants/themes';
import { SettingsService } from '../../../../core/services/settings.service';
import { addIcons } from 'ionicons';
import { colorPalette, checkmark, moon, sunny } from 'ionicons/icons';

@Component({
  selector: 'app-theme-popover',
  template: `
    <ion-list lines="none">
      <ion-list-header>
        <ion-label>Selecciona un Tema</ion-label>
      </ion-list-header>
      
      <!-- Dark Mode Toggle -->
      <ion-item>
        <ion-icon slot="start" [name]="settingsService.darkMode() ? 'moon' : 'sunny'" [color]="settingsService.darkMode() ? 'warning' : 'primary'"></ion-icon>
        <ion-label>{{ settingsService.darkMode() ? 'Modo Oscuro' : 'Modo Claro' }}</ion-label>
        <ion-toggle slot="end" [checked]="settingsService.darkMode()" (ionChange)="toggleDarkMode($event)"></ion-toggle>
      </ion-item>
      
      <ion-list-header>
        <ion-label>Paleta de Colores</ion-label>
      </ion-list-header>
      
      <ion-item button *ngFor="let theme of themes" (click)="selectTheme(theme.id)">
        <ion-icon slot="start" name="color-palette" [style.color]="theme.colors.primary"></ion-icon>
        <ion-label>
          <h2>{{ theme.name }}</h2>
        </ion-label>
        <ion-icon *ngIf="currentTheme === theme.id" slot="end" name="checkmark" color="primary"></ion-icon>
      </ion-item>
    </ion-list>
  `,
  standalone: true,
  imports: [CommonModule, IonList, IonListHeader, IonLabel, IonItem, IonIcon, IonToggle]
})
export class ThemePopoverComponent {
  private popoverCtrl = inject(PopoverController);
  public readonly settingsService = inject(SettingsService);
  themes = THEMES;
  currentTheme: string = '';

  constructor() {
    addIcons({ colorPalette, checkmark, moon, sunny });
  }

  selectTheme(themeId: string) {
    this.popoverCtrl.dismiss(themeId);
  }

  async toggleDarkMode(event: any) {
    await this.settingsService.setDarkMode(event.detail.checked);
  }
}
