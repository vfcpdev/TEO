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
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonFooter,
  IonToggle,
  AlertController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  homeOutline,
  personOutline,
  settingsOutline,
  chevronForwardOutline,
  closeSharp,
  chevronBackSharp,
  moon,
  sunny,
  logOut,
  informationCircleOutline
} from 'ionicons/icons';
import { MENU_ITEMS, MenuItem } from './shared/constants/menu-items';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Platform } from '@ionic/angular/standalone';

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
  // Inyección con inject() - Angular 17+ best practice
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  menuItems: MenuItem[] = MENU_ITEMS;
  darkMode: boolean = false;

  constructor() {
    addIcons({
      homeOutline,
      personOutline,
      settingsOutline,
      chevronForwardOutline,
      closeSharp,
      chevronBackSharp,
      moon,
      sunny,
      logOut,
      informationCircleOutline
    });
  }

  /**
   * ngOnInit - Punto de entrada para inicialización de Angular
   */
  async ngOnInit() {
    try {
      // Esperar a que Ionic/Capacitor esté completamente listo
      await this.platform.ready();

      // Cargar configuraciones básicas
      await this.loadThemeOnly();

      // Configurar Safe Areas y StatusBar solo en dispositivo nativo
      if (this.platform.is('capacitor')) {
        await this.setupStatusBar();
      }

      console.log('App inicializada correctamente');
    } catch (error) {
      console.error('Error en inicialización:', error);
    }
  }

  /**
   * Carga el tema sin llamar a setupStatusBar (evita recursión)
   */
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
      // Configurar estilo según el tema actual
      await StatusBar.setStyle({
        style: this.darkMode ? Style.Dark : Style.Light
      });

      // Configurar color de fondo
      await StatusBar.setBackgroundColor({
        color: this.darkMode ? '#222428' : '#3880ff'
      });

      // Mostrar StatusBar
      await StatusBar.show();
    } catch (error) {
      console.log('StatusBar configuration error:', error);
    }
  }

  /**
   * Carga el tema y actualiza StatusBar (para uso después de inicialización)
   */
  async loadTheme() {
    await this.loadThemeOnly();
    // Actualizar StatusBar cuando cambia el tema
    if (this.platform.is('capacitor')) {
      await this.setupStatusBar();
    }
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  /**
   * Toggle de tema directo (para el FAB global)
   */
  async toggleThemeDirect() {
    const isDark = !this.darkMode;
    this.darkMode = isDark;
    document.body.classList.toggle('dark', isDark);

    // Guardar preferencia
    await Preferences.set({
      key: 'darkMode',
      value: isDark.toString()
    });

    // Actualizar StatusBar si está en plataforma nativa
    if (this.platform.is('capacitor')) {
      await this.setupStatusBar();
    }
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
    // Limpiar datos de usuario
    await Preferences.remove({ key: 'userName' });
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Muestra un modal con información sobre la aplicación
   */
  async showAboutModal() {
    const alert = await this.alertController.create({
      header: 'Acerca de ClassApp',
      subHeader: 'v2.0.0',
      message: `
        <div style="text-align: left;">
          <p><strong>Framework:</strong> Ionic 8 + Angular 20</p>
          <p><strong>Autor:</strong> ClassApp Team</p>
          <p><strong>Almacenamiento:</strong> Firebase + SQLite</p>
          <p><strong>Plataformas:</strong> iOS, Android, Web</p>
          <p><strong>Actualización:</strong> Diciembre 2025</p>
        </div>
      `,
      buttons: ['Cerrar'],
      cssClass: 'about-alert'
    });

    await alert.present();
  }
}
