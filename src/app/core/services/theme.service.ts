import { Injectable, signal, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly STORAGE_KEY = 'theme_mode';

    currentTheme = signal<ThemeMode>('auto');

    constructor() {
        this.loadTheme();

        // Apply theme whenever it changes
        effect(() => {
            this.applyTheme();
        });

        // Listen for system theme changes when in auto mode
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.currentTheme() === 'auto') {
                this.applyTheme();
            }
        });
    }

    async setTheme(mode: ThemeMode): Promise<void> {
        this.currentTheme.set(mode);
        await Preferences.set({
            key: this.STORAGE_KEY,
            value: mode
        });
    }

    toggleDarkMode(): void {
        const current = this.currentTheme();
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
        this.setTheme(next);
    }

    isDarkMode(): boolean {
        const mode = this.currentTheme();
        if (mode === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return mode === 'dark';
    }

    private async loadTheme(): Promise<void> {
        const { value } = await Preferences.get({ key: this.STORAGE_KEY });
        if (value && this.isValidThemeMode(value)) {
            this.currentTheme.set(value as ThemeMode);
        }
    }

    private applyTheme(): void {
        const shouldBeDark = this.isDarkMode();
        document.body.classList.toggle('dark', shouldBeDark);
    }

    private isValidThemeMode(value: string): boolean {
        return value === 'light' || value === 'dark' || value === 'auto';
    }
}
