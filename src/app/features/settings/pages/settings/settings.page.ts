import { Component, OnInit, signal, computed, ChangeDetectionStrategy, OnDestroy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AgendaMobileComponent } from '../../../../features/agenda/components/agenda-mobile/agenda-mobile.component';
import { AgendaDesktopComponent } from '../../../../features/agenda/components/agenda-desktop/agenda-desktop.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonLabel,
  IonIcon,
  IonToggle,
  Platform,
  IonButton,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonDatetime,
  IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  business,
  businessOutline,
  person,
  checkmark,
  moon,
  moonOutline,
  sunny,
  sunnyOutline,
  logOut,
  flash,
  bookOutline,
  peopleOutline,
  calendarOutline,
  laptopOutline,
  schoolOutline,
  linkOutline,
  documentTextOutline,
  close,
  flashOutline,
  colorPaletteOutline,
  colorPalette,
  informationCircleOutline,
  personOutline,
  locationOutline,
  add,
  homeOutline,
  closeOutline,
  trashOutline,
  createOutline,
  timeOutline,
  handLeftOutline,
  checkmarkOutline,
  cloudUploadOutline,
  cardOutline,
  mailOutline,
  closeCircle,
  warningOutline,
  cloudDownloadOutline,
  saveOutline,
  checkboxOutline,
  squareOutline,
  closeCircleOutline,
  repeatOutline,
  checkmarkCircleOutline,
  settingsOutline, closeSharp, rocket
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProfileSettingsComponent } from '../../components/profile-settings/profile-settings.component';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonButton,
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonLabel,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonDatetime,
    IonModal,
    IonToggle,
    ReactiveFormsModule,
    AgendaMobileComponent,
    AgendaDesktopComponent,
    ProfileSettingsComponent
  ]
})
export class SettingsPage implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly platform = inject(Platform);

  private resizeHandler = () => this.checkOrientation();

  userName = 'Usuario';
  splashEnabled = true;
  darkMode = false;
  quickAccessEnabled = true;
  selectedModule: string = 'agenda';
  isLandscape = false;
  isDesktop = computed(() => this.platform.width() >= 992);

  // Módulos simplificados
  modules = [
    { id: 'agenda', title: 'Agenda', icon: 'calendar-outline', color: 'primary' },
    { id: 'profiles', title: 'Perfiles', icon: 'people-outline', color: 'secondary' },
    { id: 'interface', title: 'Interfaz', icon: 'color-palette-outline', color: 'medium' }
  ];

  // Items de acceso rápido configurables
  quickAccessItems: QuickAccessItem[] = [
    {
      id: 'attendance',
      title: 'Asistencia',
      description: 'Registra y consulta asistencias',
      icon: 'checkmark-done-outline',
      route: '/settings?module=students',
      color: 'tertiary',
      enabled: true
    }
  ];

  // UI state for time picker (kept for agenda use if needed)
  timePickerOpen = signal(false);
  timePickerValue = signal<string>('08:00');
  timePickerField = signal<'startTime' | 'endTime'>('startTime');

  // Sub-views placeholders
  studentSubView = signal<'list' | 'attendance'>('list');

  constructor() {
    addIcons({ moonOutline, sunnyOutline, closeSharp, bookOutline, peopleOutline, rocket, flash, closeOutline, checkmarkOutline, cloudUploadOutline, checkmark, close, settingsOutline, trashOutline, calendarOutline, checkboxOutline, colorPalette, informationCircleOutline, add, laptopOutline, createOutline, locationOutline, schoolOutline, linkOutline, documentTextOutline, handLeftOutline, cardOutline, mailOutline, homeOutline, timeOutline, personOutline, warningOutline, closeCircleOutline, squareOutline, checkmarkCircleOutline, repeatOutline, colorPaletteOutline, flashOutline, saveOutline, cloudDownloadOutline, logOut, person, moon, sunny });
  }

  async ngOnInit() {
    this.checkOrientation();
    window.addEventListener('resize', this.resizeHandler);

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['module']) {
        this.selectedModule = params['module'];
      }
    });

    await this.loadSettings();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
  }

  checkOrientation() {
    this.isLandscape = window.innerWidth > window.innerHeight && window.innerHeight <= 500;
  }

  async loadSettings() {
    const { value: userNameValue } = await Preferences.get({ key: 'userName' });
    this.userName = userNameValue || 'Usuario';

    const { value: splashValue } = await Preferences.get({ key: 'splashEnabled' });
    this.splashEnabled = splashValue !== null ? splashValue === 'true' : true;

    const { value: darkValue } = await Preferences.get({ key: 'darkMode' });
    this.darkMode = darkValue === 'true';
    this.applyTheme(this.darkMode);

    const { value: quickAccessValue } = await Preferences.get({ key: 'quickAccessEnabled' });
    this.quickAccessEnabled = quickAccessValue !== null ? quickAccessValue === 'true' : true;

    const { value: quickItemsValue } = await Preferences.get({ key: 'quickAccessItems' });
    if (quickItemsValue) {
      try {
        const savedItems = JSON.parse(quickItemsValue);
        this.quickAccessItems = this.quickAccessItems.map(item => {
          const saved = savedItems.find((s: QuickAccessItem) => s.id === item.id);
          return saved ? { ...item, enabled: saved.enabled } : item;
        });
      } catch (e) {
        console.error('Error parsing quickAccessItems:', e);
      }
    }
  }

  applyTheme(isDark: boolean) {
    document.body.classList.toggle('dark', isDark);
  }

  async saveUserName() {
    const name = this.userName.trim() || 'Usuario';
    this.userName = name;
    await Preferences.set({ key: 'userName', value: name });
    this.toastService.success('Nombre actualizado');
  }

  async toggleTheme(event: any) {
    const isDark = event.detail.checked;
    this.darkMode = isDark;
    await Preferences.set({ key: 'darkMode', value: isDark.toString() });
    this.applyTheme(isDark);

    if (this.platform.is('capacitor')) {
      try {
        await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        await StatusBar.setBackgroundColor({ color: isDark ? '#222428' : '#3880ff' });
      } catch (error) {
        console.log('Error actualizando StatusBar:', error);
      }
    }
    this.toastService.success(isDark ? 'Tema oscuro activado' : 'Tema claro activado');
  }

  async toggleSplash(event: any) {
    const enabled = event.detail.checked;
    await Preferences.set({ key: 'splashEnabled', value: enabled.toString() });
    this.toastService.success(enabled ? 'Pantalla de bienvenida activada' : 'Pantalla de bienvenida desactivada');
  }

  async toggleQuickAccess(event: any) {
    const enabled = event.detail.checked;
    this.quickAccessEnabled = enabled;
    await Preferences.set({ key: 'quickAccessEnabled', value: enabled.toString() });
    this.toastService.success(enabled ? 'Acceso rápido habilitado' : 'Acceso rápido deshabilitado');
  }

  async toggleQuickAccessItem(item: QuickAccessItem, event: any) {
    item.enabled = event.detail.checked;
    await this.saveQuickAccessItems();
  }

  async saveQuickAccessItems() {
    const itemsToSave = this.quickAccessItems.map(({ id, enabled }) => ({ id, enabled }));
    await Preferences.set({ key: 'quickAccessItems', value: JSON.stringify(itemsToSave) });
  }

  selectModule(moduleId: string) {
    this.selectedModule = moduleId;
  }

  onSegmentChange(event: any) {
    this.selectedModule = event.detail.value;
  }

  onStudentSubViewChange(event: any) {
    this.studentSubView.set(event.detail.value);
  }

  getSelectedModuleTitle(): string {
    const module = this.modules.find(m => m.id === this.selectedModule);
    return module ? module.title : '';
  }

  // Time picker logic
  openTimePicker(value: string, field: 'startTime' | 'endTime') {
    this.timePickerValue.set(value);
    this.timePickerField.set(field);
    this.timePickerOpen.set(true);
  }

  cancelTimePicker() {
    this.timePickerOpen.set(false);
  }

  confirmTimePickerManual(datetime: any) {
    const val = datetime.value;
    if (val) {
      const timeStr = val.split('T')[1].substring(0, 5);
      // Logic would go here to update the relevant signal
      this.cancelTimePicker();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
