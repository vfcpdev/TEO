/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/status-bar" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teo.app',
  appName: 'TEO',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      // Auto-ocultar splash después de cargar
      launchAutoHide: true,
      launchShowDuration: 2000,
      launchFadeOutDuration: 300,
      backgroundColor: '#3880ff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      // Estilo del texto del status bar (DARK = texto oscuro sobre fondo claro, LIGHT = texto claro sobre fondo oscuro)
      style: 'LIGHT',
      // Color de fondo (solo funciona en Android < 15)
      backgroundColor: '#3880ff',
      // Permitir que el webview se extienda detrás del status bar
      // Esto permite que la barra de notificaciones sea visible
      // El safe area padding se maneja automáticamente con SystemBars.insetsHandling
      overlaysWebView: true
    },
    // SystemBars: Configuración para Capacitor 8+ y Android edge-to-edge
    // @see https://capacitorjs.com/docs/apis/system-bars
    SystemBars: {
      // Inyectar CSS variables --safe-area-inset-* para compatibilidad
      insetsHandling: 'css',
      // Estilo del contenido del system bar
      style: 'DARK',
      // No ocultar las barras del sistema
      hidden: false
    }
  },
  // Live Reload para desarrollo en emulador
  server: {
    // Cambiar a la IP de tu máquina cuando uses emulador
    // Para encontrar tu IP: ipconfig (Windows) o ifconfig (Mac/Linux)
    // url: 'http://192.168.1.X:8100',
    // cleartext: true
  }
};

export default config;
