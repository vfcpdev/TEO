export interface Theme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        tertiary: string;
        success: string;
        warning: string;
        danger: string;
        medium: string;
        light: string;
        dark: string;
    };
}

export const THEMES: Theme[] = [
    {
        id: 'forest',
        name: 'Bosque Profundo',
        colors: {
            primary: '#1e40af',    // Blue 800
            secondary: '#6366f1',  // Indigo 500
            tertiary: '#f59e0b',   // Amber 500
            success: '#15803d',
            warning: '#b8751e',
            danger: '#991b1b',
            medium: '#4b5563',
            light: '#f0f9ff',
            dark: '#1f2937'
        }
    },
    {
        id: 'ocean',
        name: 'Brisa Marina',
        colors: {
            primary: '#00695c',    // Teal 800
            secondary: '#0288d1',  // Light Blue 700
            tertiary: '#4db6ac',   // Teal 300
            success: '#2e7d32',
            warning: '#ed6c02',
            danger: '#d32f2f',
            medium: '#546e7a',
            light: '#e0f7fa',
            dark: '#263238'
        }
    },
    {
        id: 'sunset',
        name: 'Atardecer Violeta',
        colors: {
            primary: '#7b1fa2',    // Purple 700
            secondary: '#c2185b',  // Pink 700
            tertiary: '#ff6f00',   // Amber 900
            success: '#388e3c',
            warning: '#f57c00',
            danger: '#c62828',
            medium: '#616161',
            light: '#f3e5f5',
            dark: '#212121'
        }
    },
    {
        id: 'minimalist',
        name: 'Minimalista',
        colors: {
            primary: '#212121',    // Grey 900
            secondary: '#616161',  // Grey 700
            tertiary: '#9e9e9e',   // Grey 500
            success: '#1b5e20',
            warning: '#e65100',
            danger: '#b71c1c',
            medium: '#9e9e9e',
            light: '#fafafa',
            dark: '#000000'
        }
    },
    {
        id: 'solar',
        name: 'Energía Solar',
        colors: {
            primary: '#ff6f00',    // Orange 900
            secondary: '#ffc107',  // Amber 500
            tertiary: '#ffb74d',   // Orange 300
            success: '#689f38',
            warning: '#f57c00',
            danger: '#d84315',
            medium: '#8d6e63',
            light: '#fff8e1',
            dark: '#3e2723'
        }
    }
];

