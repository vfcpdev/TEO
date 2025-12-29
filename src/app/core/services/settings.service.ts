import { Injectable, signal, effect, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular/standalone';
import { ToastService } from './toast.service';

import { THEMES } from '../constants/themes';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly platform = inject(Platform);
    private readonly toastService = inject(ToastService);

    // Señales de configuración
    userName = signal<string>('Usuario');
    darkMode = signal<boolean>(false);
    splashEnabled = signal<boolean>(true);
    quickAccessEnabled = signal<boolean>(true);
    timeFormat24h = signal<boolean>(false);
    currentTheme = signal<string>('forest');

    constructor() {
        this.loadSettings();
    }

    async loadSettings() {
        try {
            // User Name
            const { value: nameVal } = await Preferences.get({ key: 'userName' });
            if (nameVal) this.userName.set(nameVal);

            // Splash
            const { value: splashVal } = await Preferences.get({ key: 'splashEnabled' });
            this.splashEnabled.set(splashVal !== null ? splashVal === 'true' : true);

            // Dark Mode + Theme
            const { value: darkVal } = await Preferences.get({ key: 'darkMode' });
            const isDark = darkVal === 'true';
            this.darkMode.set(isDark);

            // Cargar tema guardado
            const { value: themeVal } = await Preferences.get({ key: 'currentTheme' });
            const themeId = themeVal || 'forest';
            this.currentTheme.set(themeId);

            // Aplicar todo
            this.applyThemeMode(isDark);
            this.applyThemePalette(themeId);

            // Quick Access
            const { value: quickVal } = await Preferences.get({ key: 'quickAccessEnabled' });
            this.quickAccessEnabled.set(quickVal !== null ? quickVal === 'true' : true);

            // Time Format
            const { value: timeFormatVal } = await Preferences.get({ key: 'timeFormat24h' });
            this.timeFormat24h.set(timeFormatVal === 'true');

        } catch (e) {
            console.error('Error loading settings', e);
        }
    }

    // --- ACTIONS ---

    async setUserName(name: string) {
        this.userName.set(name);
        await Preferences.set({ key: 'userName', value: name });
        this.toastService.success('Nombre actualizado');
    }

    async setDarkMode(isDark: boolean) {
        this.darkMode.set(isDark);
        await Preferences.set({ key: 'darkMode', value: isDark.toString() });
        this.applyThemeMode(isDark);
        // Re-aplicar variables del tema actual por si el modo oscuro las afecta (opcional, pero buena práctica)
        this.applyThemePalette(this.currentTheme());
        this.toastService.success(isDark ? 'Tema oscuro activado' : 'Tema claro activado');
    }

    async setTheme(themeId: string) {
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) {
            this.currentTheme.set(themeId);
            await Preferences.set({ key: 'currentTheme', value: themeId });
            this.applyThemePalette(themeId);
            this.toastService.success(`Tema ${theme.name} aplicado`);
        }
    }

    async setSplashEnabled(enabled: boolean) {
        this.splashEnabled.set(enabled);
        await Preferences.set({ key: 'splashEnabled', value: enabled.toString() });
        this.toastService.success(enabled ? 'Pantalla de bienvenida activada' : 'Pantalla de bienvenida desactivada');
    }

    async setQuickAccessEnabled(enabled: boolean) {
        this.quickAccessEnabled.set(enabled);
        await Preferences.set({ key: 'quickAccessEnabled', value: enabled.toString() });
        this.toastService.success(enabled ? 'Acceso rápido habilitado' : 'Acceso rápido deshabilitado');
    }

    async setTimeFormat24h(is24h: boolean) {
        this.timeFormat24h.set(is24h);
        await Preferences.set({ key: 'timeFormat24h', value: is24h.toString() });
    }

    // --- PRIVATE HELPERS ---

    private async applyThemeMode(isDark: boolean) {
        document.body.classList.toggle('dark', isDark);

        if (this.platform.is('capacitor')) {
            try {
                // Ajustar status bar según modo y tema (simplificado)
                await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
                // El color de fondo se podría derivar del tema actual también
                const bgColor = isDark ? '#121212' : '#ffffff';
                await StatusBar.setBackgroundColor({ color: bgColor });
            } catch (error) {
                console.log('Error updating status bar:', error);
            }
        }
    }

    private applyThemePalette(themeId: string) {
        const theme = THEMES.find(t => t.id === themeId);
        if (!theme) return;

        const root = document.documentElement;
        const setVar = (name: string, value: string) => root.style.setProperty(name, value);

        // Helper simple de hex a rgb
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
        };

        const colors: any = theme.colors;
        for (const colorName in colors) {
            const hex = colors[colorName];
            // Solo aplicamos variables CSS si el color está definido
            if (hex) {
                setVar(`--ion-color-${colorName}`, hex);
                const rgb = hexToRgb(hex);
                if (rgb) {
                    setVar(`--ion-color-${colorName}-rgb`, rgb);
                }
                // Nota: Shades y Tints se omiten por brevedad, Ionic generará fallback o se pueden calcular
            }
        }
    }
}
