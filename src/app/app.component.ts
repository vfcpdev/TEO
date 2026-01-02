import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonItemGroup,
  IonItemDivider,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonFooter,
  AlertController,
  ModalController,
  PopoverController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  homeOutline,
  personOutline,
  settingsOutline,
  chevronForwardOutline,
  calendarOutline,
  todayOutline,
  calendar,
  calendarNumberOutline,
  personCircleOutline,
  informationCircleOutline,
  logOutOutline,
  constructOutline,
  moon,
  sunny,
  colorPalette,
  funnelOutline
} from 'ionicons/icons';
import { MENU_ITEMS, MenuItem } from './shared/constants/menu-items';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular/standalone';
import { AgendaService } from './core/services/agenda.service';
import { KeyboardShortcutsService } from './core/services/keyboard-shortcuts.service';
import { AboutModalComponent } from './shared/components/about-modal/about-modal.component';
import { SettingsService } from './core/services/settings.service';
import { ThemePopoverComponent } from './features/settings/components/theme-popover/theme-popover.component';
import { THEMES } from './core/constants/themes';
import { SyncStatusComponent } from './shared/components/sync-status/sync-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonApp,
    IonRouterOutlet,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonItemGroup,
    IonItemDivider,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonFooter,
    RouterLink,
    FormsModule,
    FormsModule,
    SyncStatusComponent
  ],
})

export class AppComponent implements OnInit {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);
  private readonly popoverController = inject(PopoverController);
  private readonly agendaService = inject(AgendaService);
  public readonly settingsService = inject(SettingsService);
  private readonly keyboardShortcuts = inject(KeyboardShortcutsService);

  menuItems: MenuItem[] = MENU_ITEMS;

  constructor() {
    addIcons({
      // ...
      homeOutline,
      personOutline,
      settingsOutline,
      chevronForwardOutline,
      calendarOutline,
      todayOutline,
      calendar,
      calendarNumberOutline,
      personCircleOutline,
      informationCircleOutline,
      logOutOutline,
      constructOutline,
      moon,
      sunny,
      colorPalette,
      funnelOutline
    });
  }

  async ngOnInit() {
    try {
      await this.platform.ready();
      // SettingsService will handle theme loading
      if (this.platform.is('capacitor')) {
        await this.setupStatusBar();
      }
      this.keyboardShortcuts.init();
    } catch (error) {
      console.error('Error en inicialización:', error);
    }
  }

  async setupStatusBar() {
    try {
      const isDark = this.settingsService.darkMode();
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light
      });
      await StatusBar.setBackgroundColor({
        color: isDark ? '#222428' : '#3880ff'
      });
      await StatusBar.show();
    } catch (error) {
      console.log('StatusBar error:', error);
    }
  }

  setVista(vista: string) {
    // Aquí podrías usar un servicio compartido o navegar con parámetros
    // Por ahora, navegamos a home y el componente home debería manejar la vista
    this.router.navigate(['/home'], { queryParams: { vista } });
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  async logout() {
    await Preferences.remove({ key: 'userName' });
    this.router.navigate(['/login']);
  }

  openFilters() {
    // Navigate to home with filters query param
    this.router.navigate(['/home'], { queryParams: { openFilters: true } });
  }

  async showAboutModal() {
    const modal = await this.modalController.create({
      component: AboutModalComponent,
      cssClass: 'about-modal-custom'
    });
    await modal.present();
  }

  async presentThemePopover(event: Event) {
    const popover = await this.popoverController.create({
      component: ThemePopoverComponent,
      event: event,
      componentProps: {
        currentTheme: this.settingsService.currentTheme()
      }
    });

    await popover.present();

    const { data } = await popover.onWillDismiss();
    if (data) {
      await this.settingsService.setTheme(data);
    }
  }

  getThemeIconColor(): string {
    const currentTheme = this.settingsService.currentTheme();
    const theme = THEMES.find(t => t.id === currentTheme);
    return theme ? theme.colors.primary : '#3880ff';
  }
}
