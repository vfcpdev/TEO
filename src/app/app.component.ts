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
  IonToggle,
  AlertController,
  ModalController
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
  sunny
} from 'ionicons/icons';
import { MENU_ITEMS, MenuItem } from './shared/constants/menu-items';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular/standalone';
import { AgendaService } from './core/services/agenda.service';
import { AboutModalComponent } from './shared/components/about-modal/about-modal.component';

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
    IonToggle,
    RouterLink,
    FormsModule
  ],
})

export class AppComponent implements OnInit {
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);
  private readonly agendaService = inject(AgendaService);

  menuItems: MenuItem[] = MENU_ITEMS;
  darkMode: boolean = false;

  constructor() {
    addIcons({
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
      sunny
    });
  }

  async ngOnInit() {
    try {
      await this.platform.ready();
      await this.loadThemeOnly();
      if (this.platform.is('capacitor')) {
        await this.setupStatusBar();
      }
    } catch (error) {
      console.error('Error en inicialización:', error);
    }
  }

  private async loadThemeOnly(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: 'darkMode' });
      const isDark = value === 'true';
      this.darkMode = isDark;
      document.body.classList.toggle('dark', isDark);
      return true;
    } catch (error) {
      console.error('Error cargando tema:', error);
      return false;
    }
  }

  async setupStatusBar() {
    try {
      await StatusBar.setStyle({
        style: this.darkMode ? Style.Dark : Style.Light
      });
      await StatusBar.setBackgroundColor({
        color: this.darkMode ? '#222428' : '#3880ff'
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

  async toggleTheme(event: any) {
    const isDark = event.detail.checked;
    this.darkMode = isDark;
    document.body.classList.toggle('dark', isDark);

    // Guardar preferencia
    await Preferences.set({
      key: 'darkMode',
      value: isDark.toString()
    });

    // Actualizar StatusBar
    if (this.platform.is('capacitor')) {
      await this.setupStatusBar();
    }
  }

  async logout() {
    await Preferences.remove({ key: 'userName' });
    this.router.navigate(['/login']);
  }

  async showAboutModal() {
    const modal = await this.modalController.create({
      component: AboutModalComponent,
      cssClass: 'about-modal-custom'
    });
    await modal.present();
  }
}
