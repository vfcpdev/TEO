export interface MenuItem {
  title: string;
  url: string;
  icon: string;
  color?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Inicio',
    url: '/home',
    icon: 'home-outline',
    color: 'primary'
  },
  {
    title: 'Ajustes',
    url: '/settings',
    icon: 'settings-outline',
    color: 'medium'
  }
];
