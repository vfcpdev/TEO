import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonListHeader, IonLabel, IonItem, IonIcon, PopoverController } from '@ionic/angular/standalone';
import { THEMES } from '../../../../core/constants/themes';
import { addIcons } from 'ionicons';
import { colorPalette, checkmark } from 'ionicons/icons';

@Component({
    selector: 'app-theme-popover',
    template: `
    <ion-list lines="none">
      <ion-list-header>
        <ion-label>Selecciona un Tema</ion-label>
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
    imports: [CommonModule, IonList, IonListHeader, IonLabel, IonItem, IonIcon]
})
export class ThemePopoverComponent {
    private popoverCtrl = inject(PopoverController);
    themes = THEMES;
    currentTheme: string = '';

    constructor() {
        addIcons({ colorPalette, checkmark });
    }

    selectTheme(themeId: string) {
        this.popoverCtrl.dismiss(themeId);
    }
}
