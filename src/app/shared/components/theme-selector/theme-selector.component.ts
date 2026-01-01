import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="theme-selector-row">
      <ion-icon name="contrast-outline" color="medium"></ion-icon>
      <span class="theme-label">Tema</span>
      <ion-select 
        [value]="themeService.currentTheme()" 
        (ionChange)="onThemeChange($event)"
        interface="popover"
        mode="ios">
        <ion-select-option value="light">Claro</ion-select-option>
        <ion-select-option value="auto">Auto</ion-select-option>
        <ion-select-option value="dark">Oscuro</ion-select-option>
      </ion-select>
    </div>
  `,
  styles: [`
    .theme-selector-row {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--ion-background-color);
      border-radius: var(--radius-sm);
      border: 1px solid var(--ion-border-color);
      transition: all var(--transition-fast);
      width: fit-content;
      
      &:hover {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-step-50);
      }
      
      ion-icon {
        font-size: 1.125rem;
        flex-shrink: 0;
      }
    }
    
    .theme-label {
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-medium);
      color: var(--ion-text-color);
      white-space: nowrap;
    }
    
    ion-select {
      max-width: 100px;
      min-width: 90px;
      font-size: var(--font-size-small);
      --padding-start: var(--spacing-xs);
      --padding-end: var(--spacing-xs);
    }
  `]
})
export class ThemeSelectorComponent {
  readonly themeService = inject(ThemeService);

  onThemeChange(event: any): void {
    const mode = event.detail.value as ThemeMode;
    this.themeService.setTheme(mode);
  }
}
