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
import { SettingsService } from '../../../../core/services/settings.service';

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
  public readonly settingsService = inject(SettingsService); // Public for HTML access

  private resizeHandler = () => this.checkOrientation();

  // Local state only for view logic
  selectedModule: string = 'agenda';
  isLandscape = false;
  isDesktop = computed(() => this.platform.width() >= 992);

  // Módulos simplificados
  modules = [
    { id: 'agenda', title: 'Agenda', icon: 'calendar-outline', color: 'primary' },
    { id: 'profiles', title: 'Perfiles', icon: 'people-outline', color: 'secondary' },
    { id: 'design', title: 'Diseño', icon: 'color-palette-outline', color: 'medium' }
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

  // UI state for time picker
  timePickerOpen = signal(false);
  timePickerValue = signal<string>('08:00');
  timePickerField = signal<'startTime' | 'endTime'>('startTime');
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

    // Cargar items de acceso rápido locales (aún no en service, o mover a service luego)
    await this.loadQuickAccessItems();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
  }

  checkOrientation() {
    this.isLandscape = window.innerWidth > window.innerHeight && window.innerHeight <= 500;
  }

  async loadQuickAccessItems() {
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

  async toggleTheme(event: any) {
    this.settingsService.setDarkMode(event.detail.checked);
  }

  async toggleSplash(event: any) {
    this.settingsService.setSplashEnabled(event.detail.checked);
  }

  async toggleQuickAccess(event: any) {
    this.settingsService.setQuickAccessEnabled(event.detail.checked);
  }

  async toggleTimeFormat(event: any) {
    this.settingsService.setTimeFormat24h(event.detail.checked);
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
      this.cancelTimePicker();
    }
  }

  private popoverCtrl = inject(PopoverController);
  import { THEMES } from '../../../../core/constants/themes'; // Add import at top manually if needed or auto-import

  async presentThemePopover(event: Event) {
  const popover = await this.popoverCtrl.create({
    component: ThemePopoverComponent, // We need to create this or use template
    event: event,
    componentProps: {
      currentTheme: this.settingsService.currentTheme()
    }
  });

  // Simplification: Using inline template via key-value might be hard without component.
  // Let's use a simpler ActionSheet or standard Popover with List.
  // Re-thinking: User asked for "+ button menu". Popover with list of themes is best.
  // I will dynamically create content using html template if possible or separate component. 
  // For simplicity in this step, let's assume we use a simple list inside a popover defined in HTML or creating a small component.

  // Better approach: Create a small standalone component for the popover content in the same file or separate.
  // or just use ActionSheet which isnative and cleaner? User said "floating menu" (menu flotante), popover fits better.

  // Let's create `ThemeSelectionComponent` inline or in separate file. 
  // Steps: 
  // 1. Create `ThemeSelectionComponent` in `settings.page.ts` (if allows multi-component) or separate.
  // 2. Use it here.

  // For now, let's put the logic.
  popover.present();

  const { data } = await popover.onWillDismiss();
  if (data) {
    this.settingsService.setTheme(data);
  }
}

logout() {
  this.authService.logout();
  this.router.navigate(['/login']);
}
}
