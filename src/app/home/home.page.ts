import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonMenuButton,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  Platform,
  ViewWillEnter,
  ModalController,
  AlertController,
  ActionSheetController,
  ToastController,
  IonBadge,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  schoolOutline,
  todayOutline,
  add,
  timeOutline,
  calendarOutline,
  close,
  checkmark,
  checkmarkDone,
  addCircle,
  arrowBack,
  arrowForward,
  create,
  trash,
  closeOutline,
  checkmarkCircle,
  playCircle,
  time,
  peopleOutline, checkboxOutline, createOutline, swapHorizontalOutline, trashOutline, closeCircleOutline, ellipsisVertical, saveOutline
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CourseService } from '../features/courses/services/course.service';
import { PlaceService } from '../features/places/services/place.service';
import { Course, Place, DaySchedule } from '../models';

export interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
}

// Interface para items del timeline (cursos + eventos manuales + tiempo libre)
export interface TimelineItem {
  id: string;
  type: 'course' | 'manual' | 'free';
  name: string;
  startTime: string;
  endTime: string;
  duration: number; // minutos
  placeId?: string;
  code?: string;
  group?: number;
  modality?: 'presencial' | 'virtual';
  classroom?: string;
  virtualLink?: string;
}

// Interface para Registros del calendario
import { Registro, RegistroStatus, RegistroPrioridad } from '../models/registro.model';
import { ErrorLoggerService } from '../core/services/error-logger.service';
import { AgendaService } from '../core/services/agenda.service';
import { RegistroEstadoService } from '../core/services/registro-estado.service';
import { ManualEvent } from '../models/manual-event.model';
import { HolidayService } from '../core/services/holiday.service';
import { AnalogClockPickerComponent } from '../shared/components/analog-clock-picker/analog-clock-picker.component';
import { RegistroWizardComponent } from '../features/agenda/components/registro-wizard/registro-wizard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonIcon,
    IonMenuButton,
    IonButton,
    IonSegmentButton,
    IonSegment,
    IonBadge,
    IonCheckbox,
    IonGrid,
    IonRow,
    IonCol,
    RouterModule,
    IonLabel,
    AnalogClockPickerComponent,
    IonFab,
    IonFabButton
  ],
})
export class HomePage implements OnInit, ViewWillEnter {
  // Inyección con inject() - Angular 17+ best practice
  private readonly router = inject(Router);
  private readonly platform = inject(Platform);
  private readonly courseService = inject(CourseService);
  private readonly placeService = inject(PlaceService);
  private readonly modalController = inject(ModalController);
  private readonly alertController = inject(AlertController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly toastController = inject(ToastController);
  private readonly agendaService = inject(AgendaService);
  private readonly holidayService = inject(HolidayService);
  private readonly errorLogger = inject(ErrorLoggerService);
  private readonly registroEstadoService = inject(RegistroEstadoService);

  showSplash = signal(false);
  quickAccessEnabled = signal(true);
  quickAccessItems = signal<QuickAccessItem[]>([]);
  darkMode = signal(false);
  darkModeValue = false;
  themeToggleExpanded = signal(false);

  // Calendario
  selectedDate = signal<Date>(new Date());
  selectedDateText = signal<string>('Verificando fecha...');


  tempSelectedDate = signal<string | null>(null);
  calendarInitialValue: string | null = null; // Para evitar seleccion por defecto
  courses = signal<Course[]>([]);
  places = signal<Place[]>([]);
  loadingCourses = signal(false);

  // Estado edición
  editingEventId = signal<string | null>(null);

  // Calendario
  selectedCalendarTab = signal<'agenda' | 'week' | 'calendar'>('agenda');

  // Estado modal calendario
  isCalendarModalOpen = signal(false);

  // Estado visibilidad del calendario principal inline
  isMainCalendarVisible = signal(false);

  // Tab activo: 'calendario' | 'registro'
  tabCalendarioActivo: 'calendario' | 'registro' = 'calendario';

  // Sub-tab de estado para filtrar registros
  estadoTabActivo = signal<'todos' | 'borrador' | 'confirmado' | 'estudio'>('todos');

  // Signals para registros
  registros = computed(() => this.agendaService.registros());

  // Registros filtrados por estado
  registrosFiltrados = computed(() => {
    const todos = this.registros();
    const filtro = this.estadoTabActivo();
    if (filtro === 'todos') return todos;
    return todos.filter(r => r.status === filtro);
  });

  // Contadores por estado
  contadorBorradores = computed(() => this.registros().filter(r => r.status === 'borrador').length);
  contadorConfirmados = computed(() => this.registros().filter(r => r.status === 'confirmado').length);
  contadorEnEstudio = computed(() => this.registros().filter(r => r.status === 'estudio').length);

  // ===== SELECCIÓN MÚLTIPLE =====
  selectionMode = signal<boolean>(false);
  selectedRegistros = signal<Set<string>>(new Set());

  // Computed: Verificar si todos los items visibles están seleccionados
  allSelected = computed(() => {
    const filtrados = this.registrosFiltrados();
    const selected = this.selectedRegistros();
    return filtrados.length > 0 && filtrados.every(r => selected.has(r.id));
  });

  // Computed: Contar items seleccionados
  selectedCount = computed(() => this.selectedRegistros().size);

  // ===== DB ERROR STATE =====
  dbError = signal<boolean>(false);
  dbErrorMessage = signal<string>('');

  // Datos del nuevo registro
  nuevoRegistroNombre = '';
  nuevoRegistroFechaInicio = new Date().toISOString();
  nuevoRegistroFechaFin = new Date().toISOString();

  // Validación de pasos
  step1Valid = signal(false);
  step2Valid = signal(false);
  step3Valid = signal(false);

  // ID del registro en edición (null si es nuevo)
  editingRegistroId: string | null = null;

  calendarBreakpoints = [0, 0.75, 1];

  // Callback para resaltar fechas con eventos en el calendario
  // Propiedad para el binding del calendario (se actualiza para reactividad)
  highlightedDates = (isoString: string) => this.calculateHighlights(isoString);

  // Lógica de resaltado
  calculateHighlights(isoString: string) {
    const date = new Date(isoString);
    // Ajuste para evitar desfases de zona horaria al parsear YYYY-MM-DD
    const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const dateStr = localDate.toDateString();

    // 1. SOLO Festivos Colombianos (Círculo Rojo)
    if (this.holidayService.isHoliday(localDate)) {
      return {
        textColor: '#ffffff',
        backgroundColor: 'var(--ion-color-danger)',
        class: 'holiday-highlight'
      };
    }

    return undefined;
  }

  // Formulario nuevo evento
  showNewEventForm = signal(false);
  newEventName = '';
  newEventDateStr = ''; // YYYY-MM-DD
  newEventTimeStr = ''; // HH:mm

  // Estado de la vista (Agenda vs Horario)
  vistaActual = 'registros';

  onVistaChange(event: any) {
    this.vistaActual = event.detail.value;
  }

  // Opciones de formato para ion-datetime

  intervaloModoSeleccion: 'desde' | 'hasta' = 'desde'; // Toggle mode for interval
  datetimeFormatOptions = {
    date: {
      day: '2-digit' as const,
      month: 'short' as const,
      year: 'numeric' as const
    },
    time: {
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      hour12: true
    }
  };

  // Cursos del día seleccionado (computed)
  coursesOfDay = computed(() => {
    const date = this.selectedDate();
    const weekDay = this.getWeekDayFromDate(date);
    return this.courses()
      .map(course => {
        const schedule = course.schedules?.find((s: DaySchedule) => s.day === weekDay);
        return schedule ? { ...course, schedule } : null;
      })
      .filter((c): c is Course & { schedule: DaySchedule } => c !== null)
      .sort((a, b) => a.schedule!.startTime.localeCompare(b.schedule!.startTime));
  });

  // Eventos manuales del día seleccionado (computed)
  manualEventsOfDay = computed(() => {
    const selectedDateStr = this.selectedDate().toDateString();
    return this.agendaService.registros()
      .filter(registro => {
        if (!registro.startTime) return false;
        const regDate = typeof registro.startTime === 'string' ? new Date(registro.startTime) : registro.startTime;
        return regDate.toDateString() === selectedDateStr;
      })
      .sort((a, b) => {
        const da = a.startTime ? (typeof a.startTime === 'string' ? new Date(a.startTime) : a.startTime) : new Date(0);
        const db = b.startTime ? (typeof b.startTime === 'string' ? new Date(b.startTime) : b.startTime) : new Date(0);
        return da.getTime() - db.getTime();
      });
  });

  private readonly defaultQuickAccessItems: QuickAccessItem[] = [
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

  constructor() {
    addIcons({ schoolOutline, todayOutline, saveOutline, add, timeOutline, checkboxOutline, closeOutline, createOutline, swapHorizontalOutline, trashOutline, closeCircleOutline, calendarOutline, ellipsisVertical, create, trash, close, checkmark, checkmarkDone, addCircle, arrowBack, arrowForward, checkmarkCircle, playCircle, time, peopleOutline });

    effect(() => {
      // Dependencia: registros()
      const _ = this.agendaService.registros();
      // Forzar actualización cambiando la referencia de la función
      this.highlightedDates = (iso) => this.calculateHighlights(iso);
    });
  }

  async ngOnInit() {
    try {
      // Check if jeep-sqlite is available (for web/desktop platform)
      if (!this.platform.is('hybrid')) {
        const jeepSqlite = document.querySelector('jeep-sqlite');
        if (!jeepSqlite) {
          this.dbError.set(true);
          this.dbErrorMessage.set('Componente jeep-sqlite no encontrado. La base de datos no está disponible en modo web.');
          this.errorLogger.logWarning('DB Init', 'jeep-sqlite element not found');
          // Continue without DB - use in-memory data only
        }
      }

      // Load registros even if DB has issues (they might be in memory)
      // The agenda service should handle DB errors gracefully
      this.errorLogger.logInfo('HomePage', 'Component initialized');
    } catch (error) {
      this.dbError.set(true);
      this.dbErrorMessage.set('Error al inicializar la base de datos');
      this.errorLogger.logError('ngOnInit', error);
    }
    await this.loadTheme();

    // Ocultar el splash screen nativo si aún está visible
    await SplashScreen.hide();

    // Cargar configuración de acceso rápido inicial
    await this.loadQuickAccessSettings();

    // Inicializar texto de fecha
    this.selectedDateText.set(this.formatDateToSpanish(this.selectedDate()));

    // Verificar si el splash ya se mostró en esta sesión usando sessionStorage
    const splashAlreadyShown = sessionStorage.getItem('splashShownThisSession') === 'true';

    // Mostrar splash solo la primera vez que se carga la app (no en navegaciones posteriores)
    if (!splashAlreadyShown) {
      const { value } = await Preferences.get({ key: 'splashEnabled' });
      const splashEnabled = value !== null ? value === 'true' : true;

      if (splashEnabled) {
        this.showSplash.set(true);
        sessionStorage.setItem('splashShownThisSession', 'true');

        // Cerrar automáticamente después de 5 segundos
        setTimeout(() => {
          this.closeSplash();
        }, 5000);
      } else {
        sessionStorage.setItem('splashShownThisSession', 'true');
      }
    }
  }

  /**
   * Ionic lifecycle hook - se ejecuta cada vez que la página va a mostrarse
   * Ideal para recargar datos que pueden haber cambiado en otras páginas
   */
  async ionViewWillEnter() {
    // Recargar accesos rápidos cada vez que se vuelve a la página
    await this.loadQuickAccessSettings();
    // Sincronizar tema por si cambió en settings
    await this.loadTheme();
    // Cargar datos del calendario
    await this.loadCalendarData();
  }

  async loadCalendarData() {
    this.loadingCourses.set(true);
    try {
      // Cargar lugares y cursos
      this.placeService.getAll$().subscribe((places: Place[]) => this.places.set(places));
      this.courseService.getAll().subscribe((courses: Course[]) => this.courses.set(courses));
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      this.loadingCourses.set(false);
    }
  }

  // Navegación de fechas
  previousDay() {
    const current = this.selectedDate();
    const previous = new Date(current);
    previous.setDate(previous.getDate() - 1);
    this.selectedDate.set(previous);
  }

  nextDay() {
    const current = this.selectedDate();
    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    this.selectedDate.set(next);
  }

  goToToday() {
    this.selectedDate.set(new Date());
  }

  showDatePicker() {
    this.isCalendarModalOpen.set(true);
  }

  closeDatePicker() {
    this.isCalendarModalOpen.set(false);
  }

  showWeekView() {
    // TODO: Implementar vista semanal completa
    console.log('Vista semanal - por implementar');
  }

  onCalendarDateSelect(event: any) {
    if (event.detail.value) {
      this.tempSelectedDate.set(event.detail.value);
    }
  }

  // Toggle visibility of main inline calendar
  toggleMainCalendarView() {
    this.isMainCalendarVisible.set(!this.isMainCalendarVisible());
  }

  // Handle date selection from main inline calendar
  onMainCalendarDateSelect(event: any) {
    if (event.detail.value) {
      const newDate = new Date(event.detail.value);
      const localDate = new Date(newDate.getTime() + newDate.getTimezoneOffset() * 60000);

      this.selectedDate.set(localDate);
      this.selectedDateText.set(this.formatDateToSpanish(localDate));
    }
  }

  confirmDateSelection() {
    const tempValue = this.tempSelectedDate();
    if (tempValue) {
      const newDate = new Date(tempValue);
      // Ajuste de zona horaria
      const localDate = new Date(newDate.getTime() + newDate.getTimezoneOffset() * 60000);

      this.selectedDate.set(localDate);
      this.selectedDateText.set(this.formatDateToSpanish(localDate));
    }
    this.closeDatePicker();
  }

  cancelDateSelection() {
    this.tempSelectedDate.set(null);
    this.closeDatePicker();
  }

  /**
   * Guarda un nuevo registro usando AgendaService
   * Siguiendo patrones de Ionic Framework
   */

  // --- FASE C/D: Integración Nuevo Wizard ---
  async openRegistroWizard(registroToEdit?: Registro) {
    const modal = await this.modalController.create({
      component: RegistroWizardComponent,
      componentProps: { registroToEdit },
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    // Refresh if needed (AgendaService signals should handle it automatically)
  }

  // Quick save borrador - creates a draft registro instantly
  async quickSaveBorrador() {
    try {
      const alert = await this.alertController.create({
        header: 'Guardar Borrador Rápido',
        inputs: [
          {
            name: 'name',
            type: 'text',
            placeholder: 'Nombre del registro',
            attributes: {
              maxlength: 100
            }
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Guardar',
            handler: async (data) => {
              if (data.name && data.name.trim()) {
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const newBorrador: Registro = {
                  id: crypto.randomUUID(),
                  profileId: this.registroEstadoService.activeProfileId() || '',
                  name: data.name.trim(),
                  status: RegistroStatus.BORRADOR,
                  priority: RegistroPrioridad.SOFT,
                  startTime: now,
                  endTime: tomorrow,
                  isAllDay: false,
                  notes: '',
                  createdAt: now,
                  updatedAt: now
                };

                await this.agendaService.addRegistro(newBorrador);

                // Show success toast
                const toast = await this.toastController.create({
                  message: 'Borrador guardado exitosamente',
                  duration: 2000,
                  color: 'success',
                  position: 'bottom'
                });
                await toast.present();

                this.errorLogger.logInfo('QuickSave', `Borrador created: ${data.name}`);
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      this.errorLogger.logError('quickSaveBorrador', error);

      const toast = await this.toastController.create({
        message: 'Error al guardar borrador',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  // Helper para obtener fecha de próximo día de la semana

  formatDateToSpanish(date: Date): string {
    if (!date || isNaN(date.getTime())) return 'Fecha Desconocida';
    const daysArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthsArr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const dayName = daysArr[date.getDay()];
    const day = date.getDate();
    const monthName = monthsArr[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${monthName} de ${year}`;
  }

  // Utilidades
  getWeekDayFromDate(date: Date): number {
    return date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  }

  formatTime(time: string): string {
    // Formato: "14:30" -> "2:30 PM"
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  getPlaceName(placeId: string): string {
    const place = this.places().find(p => p.id === placeId);
    return place?.name || 'Desconocido';
  }

  getPlaceColor(placeId: string): string {
    const place = this.places().find(p => p.id === placeId);
    if (!place) return '#3880ff';
    // Generar color consistente basado en el ID del lugar
    const colors = ['#3880ff', '#eb445a', '#2dd36f', '#ffc409', '#92949c', '#c084fc'];
    const index = place.id.charCodeAt(0) % colors.length;
    return colors[index];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }



  getTotalHours(): string {
    const courses = this.coursesOfDay();
    if (courses.length === 0) return '0';

    let totalMinutes = 0;
    courses.forEach(course => {
      const [startHours, startMinutes] = course.schedule!.startTime.split(':').map(Number);
      const [endHours, endMinutes] = course.schedule!.endTime.split(':').map(Number);
      const start = startHours * 60 + startMinutes;
      const end = endHours * 60 + endMinutes;
      totalMinutes += (end - start);
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}.${Math.round(minutes / 6)}` : `${hours}`;
  }

  // ============ MÉTODOS PARA ESTADO ACTUAL ============

  // Obtiene el evento que está ocurriendo ahora mismo
  getCurrentEvent(): TimelineItem | null {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    // Solo mostrar evento actual si estamos viendo el día de hoy
    const today = new Date();
    const selected = this.selectedDate();
    if (today.toDateString() !== selected.toDateString()) {
      return null;
    }

    const timeline = this.getTimelineItems();
    return timeline.find(item =>
      item.type === 'course' &&
      item.startTime <= currentTime &&
      item.endTime > currentTime
    ) || null;
  }

  // Obtiene el próximo evento programado
  getNextEvent(): TimelineItem | null {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // Solo mostrar próximo evento si estamos viendo el día de hoy
    const today = new Date();
    const selected = this.selectedDate();
    if (today.toDateString() !== selected.toDateString()) {
      return null;
    }

    const timeline = this.getTimelineItems();
    return timeline.find(item =>
      item.type === 'course' &&
      item.startTime > currentTime
    ) || null;
  }

  // Nombre del día en español
  getDayNameSpanish(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }

  // Nombre del mes en español
  getMonthNameSpanish(date: Date): string {
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return months[date.getMonth()];
  }

  async loadQuickAccessSettings() {
    // Cargar si está habilitado
    const { value: enabledValue } = await Preferences.get({ key: 'quickAccessEnabled' });
    this.quickAccessEnabled.set(enabledValue !== null ? enabledValue === 'true' : true);

    // Cargar items configurados
    const { value: itemsValue } = await Preferences.get({ key: 'quickAccessItems' });
    if (itemsValue) {
      try {
        const savedItems = JSON.parse(itemsValue) as QuickAccessItem[];
        // Combinar items guardados con los defaults para asegurar que los íconos estén correctos
        const mergedItems = this.defaultQuickAccessItems.map(defaultItem => {
          const savedItem = savedItems.find(s => s.id === defaultItem.id);
          return savedItem ? { ...defaultItem, enabled: savedItem.enabled } : defaultItem;
        });
        this.quickAccessItems.set(mergedItems);
      } catch {
        this.quickAccessItems.set(this.defaultQuickAccessItems);
      }
    } else {
      this.quickAccessItems.set(this.defaultQuickAccessItems);
    }
  }

  getEnabledQuickAccessItems(): QuickAccessItem[] {
    return this.quickAccessItems().filter(item => item.enabled);
  }

  async loadTheme() {
    const { value } = await Preferences.get({ key: 'darkMode' });
    const isDark = value === 'true';
    this.darkMode.set(isDark);
    this.darkModeValue = isDark;
    document.body.classList.toggle('dark', isDark);
  }

  toggleThemeExpanded() {
    this.themeToggleExpanded.set(!this.themeToggleExpanded());
  }

  collapseThemeToggle() {
    setTimeout(() => {
      this.themeToggleExpanded.set(false);
    }, 200);
  }

  async toggleTheme(event: any) {
    const isDark = event.detail.checked;
    this.darkMode.set(isDark);
    this.darkModeValue = isDark;
    document.body.classList.toggle('dark', isDark);

    // Guardar preferencia
    await Preferences.set({
      key: 'darkMode',
      value: isDark.toString()
    });

    // Actualizar StatusBar si está en plataforma nativa
    if (this.platform.is('capacitor')) {
      try {
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light
        });
        await StatusBar.setBackgroundColor({
          color: isDark ? '#222428' : '#3880ff'
        });
      } catch (error) {
        console.log('Error updating StatusBar:', error);
      }
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  closeSplash() {
    this.showSplash.set(false);
  }

  // ============ MÉTODOS PARA TABS Y TIMELINE ============

  onCalendarTabChange(event: any) {
    this.selectedCalendarTab.set(event.detail.value);
  }

  // Obtiene los items del timeline incluyendo cursos, eventos manuales y tiempo libre
  getTimelineItems(): TimelineItem[] {
    const courses = this.coursesOfDay().map(c => ({
      id: c.id,
      type: 'course' as const,
      name: c.name,
      startTime: c.schedule.startTime,
      endTime: c.schedule.endTime,
      duration: this.getMinutesBetween(c.schedule.startTime, c.schedule.endTime),
      placeId: c.placeId,
      code: c.code,
      group: c.group,
      modality: c.modality,
      classroom: c.classroom,
      virtualLink: c.virtualLink
    }));

    const manualEvents = this.manualEventsOfDay().map(e => {
      // Si no tiene endTime, usar +1 hora
      const start = typeof e.startTime === 'string' ? new Date(e.startTime) : e.startTime;
      if (!start) return { id: e.id, type: 'manual' as const, name: e.name, startTime: '', endTime: '', duration: 0 };

      const startStr = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

      let endStr = '00:00';
      if (e.endTime) {
        const end = typeof e.endTime === 'string' ? new Date(e.endTime) : e.endTime;
        endStr = end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        endStr = end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      return {
        id: e.id,
        type: 'manual' as const,
        name: e.name,
        startTime: startStr,
        endTime: endStr,
        duration: this.getMinutesBetween(startStr, endStr)
      };
    });

    // Unir y ordenar por hora de inicio
    const allEvents = [...courses, ...manualEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (allEvents.length === 0) return [];

    const items: TimelineItem[] = [];
    const startOfDay = '08:00';
    const endOfDay = '20:00';

    // Tiempo libre inicial
    const firstEvent = allEvents[0];
    if (firstEvent.startTime > startOfDay) {
      const freeMinutes = this.getMinutesBetween(startOfDay, firstEvent.startTime);
      if (freeMinutes >= 15) {
        items.push({
          id: 'free-start',
          type: 'free',
          name: 'Disponible',
          startTime: startOfDay,
          endTime: firstEvent.startTime,
          duration: freeMinutes
        });
      }
    }

    allEvents.forEach((event, index) => {
      items.push(event);

      const nextEvent = allEvents[index + 1];
      if (nextEvent) {
        const gapMinutes = this.getMinutesBetween(event.endTime, nextEvent.startTime);
        if (gapMinutes >= 15) {
          items.push({
            id: `free-${index}`,
            type: 'free',
            name: 'Disponible',
            startTime: event.endTime,
            endTime: nextEvent.startTime,
            duration: gapMinutes
          });
        }
      } else if (event.endTime < endOfDay) {
        const freeMinutes = this.getMinutesBetween(event.endTime, endOfDay);
        if (freeMinutes >= 15) {
          items.push({
            id: 'free-end',
            type: 'free',
            name: 'Disponible',
            startTime: event.endTime,
            endTime: endOfDay,
            duration: freeMinutes
          });
        }
      }
    });

    return items;
  }

  // Calcula minutos entre dos tiempos (formato HH:mm)
  private getMinutesBetween(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  // Calcula el tiempo libre total del día
  getTotalFreeTime(): string {
    const timeline = this.getTimelineItems();
    const freeMinutes = timeline
      .filter(item => item.type === 'free')
      .reduce((total, item) => total + item.duration, 0);

    if (freeMinutes === 0) return '0 min';
    if (freeMinutes < 60) return `${freeMinutes} min`;

    const hours = Math.floor(freeMinutes / 60);
    const mins = freeMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }



  // ===== MÉTODOS DEL SISTEMA DE REGISTROS =====





  // ===== MÉTODOS DE EDICIÓN Y ELIMINACIÓN =====

  editarRegistro(registro: Registro) {
    // Abrir Wizard en modo edición
    this.openRegistroWizard(registro);
  }

  async eliminarRegistro(registroId: string) {
    const registro = this.registros().find(r => r.id === registroId) || this.agendaService.registros().find(r => r.id === registroId);

    const alert = await this.alertController.create({
      header: 'Eliminar Registro',
      message: registro ? `¿Estás seguro de eliminar "${registro.name}"?` : '¿Eliminar este registro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            this.agendaService.deleteRegistro(registroId);

            // Mostrar toast de confirmación
            const toast = await this.toastController.create({
              message: 'Registro eliminado correctamente',
              duration: 2000,
              color: 'success',
              position: 'bottom'
            });
            await toast.present();
          }
        }
      ]
    });

    await alert.present();
  }

  // ===== MÉTODOS DE SELECCIÓN MÚLTIPLE =====

  toggleSelectionMode() {
    const newMode = !this.selectionMode();
    this.selectionMode.set(newMode);
    if (!newMode) {
      // Al salir del modo selección, limpiar seleccionados
      this.selectedRegistros.set(new Set());
    }
  }

  toggleSelection(id: string) {
    const current = new Set(this.selectedRegistros());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedRegistros.set(current);
  }

  selectAll() {
    const ids = this.registrosFiltrados().map(r => r.id);
    this.selectedRegistros.set(new Set(ids));
  }

  deselectAll() {
    this.selectedRegistros.set(new Set());
  }

  async deleteSelected() {
    const count = this.selectedCount();
    if (count === 0) {
      this.errorLogger.logWarning('DeleteSelected', 'No items selected');
      return;
    }

    try {
      const alert = await this.alertController.create({
        header: 'Eliminar Registros',
        message: `¿Estás seguro de eliminar ${count} registro${count > 1 ? 's' : ''}?`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: async () => {
              try {
                const idsToDelete = Array.from(this.selectedRegistros());
                idsToDelete.forEach(id => this.agendaService.deleteRegistro(id));

                this.errorLogger.logInfo('DeleteSelected', `Deleted ${count} registro(s)`, { ids: idsToDelete });

                // Limpiar selección y salir del modo
                this.selectedRegistros.set(new Set());
                this.selectionMode.set(false);

                const toast = await this.toastController.create({
                  message: `${count} registro${count > 1 ? 's eliminados' : ' eliminado'}`,
                  duration: 2000,
                  color: 'success',
                  position: 'bottom'
                });
                await toast.present();
              } catch (error) {
                this.errorLogger.logError('DeleteSelected', error);
                const errorToast = await this.toastController.create({
                  message: 'Error al eliminar registros',
                  duration: 3000,
                  color: 'danger',
                  position: 'bottom'
                });
                await errorToast.present();
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      this.errorLogger.logError('DeleteSelected', error);
    }
  }

  async openStatusChangeModal() {
    const count = this.selectedCount();
    if (count === 0) {
      this.errorLogger.logWarning('StatusChange', 'No items selected');
      return;
    }

    try {
      const actionSheet = await this.actionSheetController.create({
        header: `Cambiar Estado (${count} registro${count > 1 ? 's' : ''})`,
        cssClass: 'status-change-action-sheet',
        buttons: [
          {
            text: 'Borrador',
            icon: 'document-text',
            cssClass: 'status-borrador',
            handler: () => this.changeStatusSelected(RegistroStatus.BORRADOR)
          },
          {
            text: 'Confirmado',
            icon: 'checkmark-circle',
            cssClass: 'status-confirmado',
            handler: () => this.changeStatusSelected(RegistroStatus.CONFIRMADO)
          },
          {
            text: 'En Estudio',
            icon: 'alert-circle',
            cssClass: 'status-estudio',
            handler: () => this.changeStatusSelected(RegistroStatus.ESTUDIO)
          },
          {
            text: 'Cancelar',
            icon: 'close',
            role: 'cancel',
            cssClass: 'status-cancel'
          }
        ]
      });

      await actionSheet.present();
    } catch (error) {
      this.errorLogger.logError('StatusChange', error);
      const errorToast = await this.toastController.create({
        message: 'Error al abrir modal de estado',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await errorToast.present();
    }
  }

  async changeStatusSelected(newStatus: RegistroStatus) {
    try {
      const ids = Array.from(this.selectedRegistros());
      const count = ids.length;

      ids.forEach(id => {
        this.agendaService.updateRegistro(id, { status: newStatus });
      });

      this.errorLogger.logInfo('StatusChange', `Updated ${count} registro(s) to ${newStatus}`, { ids });

      // Limpiar selección y salir del modo
      this.selectedRegistros.set(new Set());
      this.selectionMode.set(false);

      const statusLabel = newStatus === RegistroStatus.BORRADOR ? 'Borrador' :
        newStatus === RegistroStatus.CONFIRMADO ? 'Confirmado' : 'En Estudio';

      const toast = await this.toastController.create({
        message: `${count} registro${count > 1 ? 's actualizados' : ' actualizado'} a ${statusLabel}`,
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      this.errorLogger.logError('StatusChange', error);
      const errorToast = await this.toastController.create({
        message: 'Error al cambiar estado',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await errorToast.present();
    }
  }

  editSelected() {
    const count = this.selectedCount();
    if (count !== 1) return;

    const id = Array.from(this.selectedRegistros())[0];
    const registro = this.registros().find(r => r.id === id);

    if (registro) {
      this.editarRegistro(registro);
      // Limpiar selección
      this.selectedRegistros.set(new Set());
      this.selectionMode.set(false);
    }
  }

  calcularDias(fechaInicio: string | Date | undefined, fechaFin: string | Date | undefined): number {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 para incluir ambos días
  }

  // ===== MÉTODOS PARA FORMATO Y CÁLCULOS DE TIEMPO =====

  formatDateWithTime(isoDate: string | Date | undefined): string {
    if (!isoDate) return '';
    const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTiempoFaltante(registro: Registro): string {
    const ahora = new Date();
    if (!registro.startTime || !registro.endTime) return '';

    const inicio = new Date(registro.startTime);
    const fin = new Date(registro.endTime);

    // Si ya finalizó
    if (ahora > fin) {
      return 'Finalizado';
    }

    // Si está activo
    if (ahora >= inicio && ahora <= fin) {
      const diffTime = fin.getTime() - ahora.getTime();
      return this.formatearTiempo(diffTime, 'Finaliza en');
    }

    // Si es futuro
    const diffTime = inicio.getTime() - ahora.getTime();
    return this.formatearTiempo(diffTime, 'Inicia en');
  }

  getTiempoFaltanteLabel(registro: Registro): string {
    const ahora = new Date();
    if (!registro.startTime || !registro.endTime) return '';

    const inicio = new Date(registro.startTime);
    const fin = new Date(registro.endTime);

    if (ahora > fin) {
      return 'Estado:';
    } else if (ahora >= inicio && ahora <= fin) {
      return 'Finaliza en:';
    } else {
      return 'Inicia en:';
    }
  }

  getTiempoFaltanteValor(registro: Registro): string {
    const ahora = new Date();
    if (!registro.startTime || !registro.endTime) return '';

    const inicio = new Date(registro.startTime);
    const fin = new Date(registro.endTime);

    if (ahora > fin) {
      return 'Finalizado';
    } else if (ahora >= inicio && ahora <= fin) {
      const diffTime = fin.getTime() - ahora.getTime();
      return this.formatearTiempoSolo(diffTime);
    } else {
      const diffTime = inicio.getTime() - ahora.getTime();
      return this.formatearTiempoSolo(diffTime);
    }
  }

  private formatearTiempo(diffTime: number, prefijo: string): string {
    const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) {
      return `${prefijo} ${dias}d ${horas}h`;
    } else if (horas > 0) {
      return `${prefijo} ${horas}h ${minutos}m`;
    } else {
      return `${prefijo} ${minutos}m`;
    }
  }

  private formatearTiempoSolo(diffTime: number): string {
    const dias = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    } else if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else {
      return `${minutos}m`;
    }
  }

  estaActivo(registro: Registro): boolean {
    if (!registro.startTime || !registro.endTime) return false;
    const ahora = new Date();
    const inicio = new Date(registro.startTime);
    const fin = new Date(registro.endTime);
    return ahora >= inicio && ahora <= fin;
  }

  getIconoTiempoFaltante(registro: Registro): string {
    if (!registro.startTime || !registro.endTime) return 'help-circle';
    const ahora = new Date();
    const inicio = new Date(registro.startTime);
    const fin = new Date(registro.endTime);

    if (ahora > fin) {
      return 'checkmark-circle'; // Finalizado
    } else if (ahora >= inicio && ahora <= fin) {
      return 'play-circle'; // Activo
    } else {
      return 'time'; // Futuro
    }
  }

  // ===== RELOJ ANALÓGICO SVG =====

  getHourRotation(isoDate: string): number {
    if (!isoDate) return 0;
    const date = new Date(isoDate);
    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();
    return (hours * 30) + (minutes * 0.5); // 360 / 12 = 30 deg per hour
  }

  getMinuteRotation(isoDate: string): number {
    if (!isoDate) return 0;
    const date = new Date(isoDate);
    const minutes = date.getMinutes();
    return minutes * 6; // 360 / 60 = 6 deg per minute
  }
}
