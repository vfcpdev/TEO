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

        // Re-aplicar tema con ajustes para modo oscuro
        this.applyThemePalette(this.currentTheme());
    }

    // Helper: convertir hex a array RGB
    private hexToRgbArray(hex: string): number[] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [0, 0, 0];
    }

    // Helper: convertir RGB a hex
    private rgbToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // Calcular shade (10% más oscuro)
    private calculateShade(hex: string): string {
        const rgb = this.hexToRgbArray(hex);
        return this.rgbToHex(
            Math.round(rgb[0] * 0.9),
            Math.round(rgb[1] * 0.9),
            Math.round(rgb[2] * 0.9)
        );
    }

    // Calcular tint (10% más claro)
    private calculateTint(hex: string): string {
        const rgb = this.hexToRgbArray(hex);
        return this.rgbToHex(
            Math.min(255, Math.round(rgb[0] + (255 - rgb[0]) * 0.1)),
            Math.min(255, Math.round(rgb[1] + (255 - rgb[1]) * 0.1)),
            Math.min(255, Math.round(rgb[2] + (255 - rgb[2]) * 0.1))
        );
    }

    // Calcular color de contraste (blanco o negro según luminosidad)
    private calculateContrast(hex: string): string {
        const rgb = this.hexToRgbArray(hex);
        // Fórmula de luminosidad relativa (WCAG)
        const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
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

        // Aplicar cada color con todas sus variantes
        for (const colorName in colors) {
            const hex = colors[colorName];
            if (!hex) continue;

            // Color base
            setVar(`--ion-color-${colorName}`, hex);

            // RGB
            const rgb = hexToRgb(hex);
            if (rgb) {
                setVar(`--ion-color-${colorName}-rgb`, rgb);
            }

            // Shade (más oscuro)
            const shade = this.calculateShade(hex);
            setVar(`--ion-color-${colorName}-shade`, shade);

            // Tint (más claro)
            const tint = this.calculateTint(hex);
            setVar(`--ion-color-${colorName}-tint`, tint);

            // Contrast (texto sobre este color)
            const contrast = this.calculateContrast(hex);
            setVar(`--ion-color-${colorName}-contrast`, contrast);
            const contrastRgb = hexToRgb(contrast);
            if (contrastRgb) {
                setVar(`--ion-color-${colorName}-contrast-rgb`, contrastRgb);
            }
        }

        // Variables adicionales según modo oscuro
        const isDark = this.darkMode();

        if (isDark) {
            // Modo oscuro: fondos oscuros, textos claros
            setVar('--ion-background-color', '#121212');
            setVar('--ion-background-color-rgb', '18, 18, 18');
            setVar('--ion-card-background', '#1e1e1e');
            setVar('--ion-text-color', '#f1f5f9');
            setVar('--ion-text-color-rgb', '241, 245, 249');
            setVar('--ion-border-color', '#404040');
            setVar('--ion-toolbar-background', '#1e1e1e');
            setVar('--ion-item-background', '#121212');

            // Segments en oscuro
            setVar('--segment-text-color', '#d1d5db');
            setVar('--segment-text-color-hover', '#f3f4f6');
            setVar('--segment-text-color-checked', '#ffffff');
        } else {
            // Modo claro: usar colores del tema
            setVar('--ion-background-color', theme.colors.light);
            const lightRgb = hexToRgb(theme.colors.light);
            if (lightRgb) {
                setVar('--ion-background-color-rgb', lightRgb);
            }
            setVar('--ion-card-background', '#ffffff');
            setVar('--ion-text-color', theme.colors.dark);
            const darkRgb = hexToRgb(theme.colors.dark);
            if (darkRgb) {
                setVar('--ion-text-color-rgb', darkRgb);
            }
            setVar('--ion-border-color', this.calculateTint(theme.colors.medium));
            setVar('--ion-toolbar-background', theme.colors.primary);
            setVar('--ion-item-background', '#ffffff');

            // Segments en claro
            setVar('--segment-text-color', theme.colors.dark);
            setVar('--segment-text-color-hover', theme.colors.dark);
            setVar('--segment-text-color-checked', '#ffffff');
        }

        // Variables comunes para ambos modos
        setVar('--indicator-color', theme.colors.primary);
    }
}
