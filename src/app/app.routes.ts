import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'attendance',
    loadComponent: () => import('./features/attendance/pages/attendance-list/attendance-list.page').then(m => m.AttendanceListPage)
  },
  // Rutas de places eliminadas - la funcionalidad está integrada en Settings
  // El acceso directo "Lugares" navega a /settings?module=place
];
