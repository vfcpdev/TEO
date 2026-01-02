import { Component, OnInit, OnDestroy, signal, inject, computed, ChangeDetectionStrategy, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
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
  IonLabel,
  IonFab,
  IonFabButton,
  Platform,
  ModalController,
  AlertController,
  ActionSheetController,
  ToastController,
  ViewWillEnter,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  personOutline,
  settingsOutline,
  chevronForwardOutline,
  calendarOutline,
  todayOutline,
  timeOutline,
  calendar,
  calendarNumberOutline,
  personCircleOutline,
  informationCircleOutline,
  logOutOutline,
  checkmarkCircle,
  create,
  search,
  add,
  trashOutline,
  createOutline,
  checkboxOutline,
  closeOutline,
  swapHorizontalOutline,
  closeCircleOutline, constructOutline, funnel
} from 'ionicons/icons';

import { AgendaService } from '../core/services/agenda.service';
import { HolidayService } from '../core/services/holiday.service';
import { RegistroEstadoService } from '../core/services/registro-estado.service';
import { CourseService } from '../features/courses/services/course.service';
import { PlaceService } from '../features/places/services/place.service';
import { ErrorLoggerService } from '../core/services/error-logger.service';
import { FreeTimeGeneratorService } from '../core/services/free-time-generator.service';
import { Registro } from '../models/registro.model';
import { SettingsService } from '../core/services/settings.service';

import { DayViewComponent } from '../features/agenda/components/day-view/day-view.component';
import { WeekViewComponent } from '../features/agenda/components/week-view/week-view.component';
import { MonthViewComponent } from '../features/agenda/components/month-view/month-view.component';
import { AgendaFiltersComponent, FilterState } from '../features/agenda/components/agenda-filters/agenda-filters.component';
import { AgendaSearchComponent } from '../features/agenda/components/agenda-search/agenda-search.component';
import { FabOptionsComponent } from '../shared/components/fab-options/fab-options.component';
import { DayDetailDrawerComponent } from '../features/agenda/components/day-detail-drawer/day-detail-drawer.component';
import { BorradorWizardComponent } from '../shared/components/borrador-wizard/borrador-wizard.component';
import { AgendarWizardComponent } from '../shared/components/agendar-wizard/agendar-wizard.component';
import { ReportsComponent } from '../features/analytics/components/reports/reports.component';
import { RegistroStatus, RegistroPrioridad } from '../models/registro.model';

// Interface para items del timeline (cursos + eventos manuales + tiempo libre)
export interface TimelineItem {
  id: string;
  type: 'course' | 'manual' | 'free';
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  placeId?: string;
  code?: string;
  group?: number;
  modality?: 'presencial' | 'virtual';
  classroom?: string;
  virtualLink?: string;
  notes?: string;
}

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
    IonButton,
    IonIcon,
    IonMenuButton,
    IonSegmentButton,
    IonSegment,
    RouterModule,
    IonLabel,
    IonFab,
    IonFabButton,
    IonGrid,
    IonRow,
    IonCol,
    IonBadge,
    DayViewComponent,
    WeekViewComponent,
    MonthViewComponent,
    AgendaFiltersComponent,
    AgendaSearchComponent,
    ReportsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit, ViewWillEnter, OnDestroy {
  // Inyección con inject()
  private readonly ngZone = inject(NgZone);
  private readonly route = inject(ActivatedRoute);
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
  private readonly freeTimeGenerator = inject(FreeTimeGeneratorService);
  private readonly settingsService = inject(SettingsService);

  showSplash = signal(false);
  darkMode = signal(false);

  // Reloj en tiempo real
  currentDate = signal<Date>(new Date());
  private intervalId: any;

  // Calendario
  selectedDate = signal<Date>(new Date());

  // Texto del header: Fecha + Hora actual con segundos
  selectedDateText = computed(() => {
    const now = this.currentDate();
    const is24h = this.settingsService.timeFormat24h();

    // Fecha: "Domingo, 28 de diciembre"
    const datePart = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const capitalizedDate = datePart.charAt(0).toUpperCase() + datePart.slice(1);

    // Hora: "19:30:45" o "7:30:45 PM"
    const timePart = now.toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24h
    });

    return `${capitalizedDate} | ${timePart}`;
  });

  vistaActual = signal<'agenda' | 'dia' | 'semana' | 'mes' | 'anio' | 'estados' | 'stats'>('agenda');

  // Signals para registros
  registros = computed(() => this.agendaService.registros());

  // Filtros y búsqueda
  showFilters = signal(false);
  activeFilters = signal<FilterState | null>(null);

  registrosFiltrados = computed(() => {
    const filters = this.activeFilters();
    const allRegistros = this.registros();

    if (!filters) return allRegistros;

    return allRegistros.filter(reg => {
      // Filter by areas
      if (filters.areaIds.length > 0 && reg.areaId && !filters.areaIds.includes(reg.areaId)) {
        return false;
      }

      // Filter by contextos
      if (filters.contextoIds.length > 0 && reg.contextoId && !filters.contextoIds.includes(reg.contextoId)) {
        return false;
      }

      // Filter by tipos
      if (filters.tipoIds.length > 0 && reg.tipoId && !filters.tipoIds.includes(reg.tipoId)) {
        return false;
      }

      return true;
    });
  });

  // SELECCIÓN
  selectionMode = signal<boolean>(false);
  selectedRegistros = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedRegistros().size);

  today = new Date();

  constructor() {
    addIcons({ funnel, add, timeOutline, constructOutline, todayOutline, calendarOutline, calendarNumberOutline, chevronForwardOutline, homeOutline, personOutline, settingsOutline, calendar, personCircleOutline, informationCircleOutline, logOutOutline, checkmarkCircle, create, search, trashOutline, createOutline, checkboxOutline, closeOutline, swapHorizontalOutline, closeCircleOutline });
  }

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const vista = params['vista'];
      if (vista && ['agenda', 'dia', 'semana', 'mes'].includes(vista)) {
        this.vistaActual.set(vista as any);
      }
    });

    // Iniciar reloj optimizado fuera de Zone para no saturar la detección de cambios
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        // Actualizamos la señal dentro de zona para asegurar que la vista tiene la nueva hora
        this.ngZone.run(() => {
          this.currentDate.set(new Date());
        });
      }, 1000);
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ionViewWillEnter() { }

  onVistaChange(event: any) {
    this.vistaActual.set(event.detail.value);
  }

  openRegistroWizard() {
    // Implementación mínima
    console.log('Open wizard');
  }

  getTimelineItemsNext6Hours(): TimelineItem[] {
    return [];
  }

  getFreeTimeMessage(): string {
    return 'Tienes el resto del día libre.';
  }

  getTimelineItems(): TimelineItem[] {
    return [];
  }

  editarRegistro(registro: Registro) {
    console.log('Edit', registro);
  }

  formatDateWithTime(date: any): string {
    return date ? new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
  }

  getAreaName(reg: Registro): string {
    if (reg.areaId) {
      const area = this.agendaService.areas().find(a => a.id === reg.areaId);
      if (area) return area.name;
    }
    return reg.contextoId || 'General';
  }

  getDuration(reg: Registro): number {
    if (reg.duration) return reg.duration;
    if (reg.startTime && reg.endTime) {
      const start = new Date(reg.startTime).getTime();
      const end = new Date(reg.endTime).getTime();
      return Math.round((end - start) / 60000);
    }
    return 0;
  }

  getTimeRemaining(reg: Registro): string {
    if (!reg.startTime) return '-';
    const now = new Date();
    const start = new Date(reg.startTime);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs < 0) return 'En curso / Pasado';

    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Filters and Search
  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  applyFilters(filters: FilterState) {
    this.activeFilters.set(filters);
  }

  onSearchResultSelected(result: any) {
    if (result.type === 'registro') {
      // Navigate to the day view with the event
      const registro = result.data as Registro;
      if (registro.startTime) {
        this.selectedDate.set(new Date(registro.startTime));
        this.vistaActual.set('dia');
      }
    } else if (result.type === 'area') {
      // Filter by area
      this.applyFilters({
        areaIds: [result.id],
        contextoIds: [],
        tipoIds: [],
        statusFilter: []
      });
    }
  }

  // FAB Options Modal
  async openFabOptions() {
    const modal = await this.modalController.create({
      component: FabOptionsComponent,
      cssClass: 'fab-options-modal',
      backdropDismiss: true,
      showBackdrop: true,
      mode: 'ios'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data === 'borrador') {
      this.openBorradorQuick();
    } else if (data === 'agendar') {
      this.openAgendarWithCalendar();
    }
  }

  async openDayDrawer(date: Date) {
    const list = this.registros();
    // Filter for that day
    const target = new Date(date);
    const dayRegistros = list.filter(r => {
      if (!r.startTime) return false;
      const d = new Date(r.startTime);
      return d.getDate() === target.getDate() &&
        d.getMonth() === target.getMonth() &&
        d.getFullYear() === target.getFullYear();
    });

    const modal = await this.modalController.create({
      component: DayDetailDrawerComponent,
      componentProps: {
        date: date,
        registros: dayRegistros
      },
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.5, 1],
      cssClass: 'day-drawer-modal'
    });
    await modal.present();
  }

  private async openBorradorQuick() {
    try {
      console.log('[DEBUG] Starting openBorradorQuick');
      console.log('[DEBUG] BorradorWizardComponent:', BorradorWizardComponent);

      const modal = await this.modalController.create({
        component: BorradorWizardComponent,
        cssClass: 'borrador-wizard-modal'
      });

      console.log('[DEBUG] Modal created successfully:', modal);

      await modal.present();
      console.log('[DEBUG] Modal presented successfully');

      const { data } = await modal.onWillDismiss();
      console.log('[DEBUG] Modal dismissed with data:', data);

      if (data) {
        console.log('Crear borrador:', data);
        // TODO: Llamar a servicio para guardar borrador
      }
    } catch (error) {
      console.error('[ERROR] Failed to open Borrador wizard:', error);
    }
  }


  private async openAgendarWithCalendar() {
    try {
      const modal = await this.modalController.create({
        component: AgendarWizardComponent,
        cssClass: 'agendar-wizard-modal'
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();

      if (data) {
        // Obtener profileId actual
        const profileId = 'default-profile';

        this.agendaService.addRegistro({
          id: crypto.randomUUID(),
          profileId,
          name: data.nombre,
          startTime: new Date(data.fechaInicio),
          endTime: new Date(data.fechaFin),
          status: RegistroStatus.CONFIRMADO,
          priority: RegistroPrioridad.SOFT,
          isAllDay: false,
          areaId: data.areaIds[0],
          contextoId: data.contextoIds[0],
          reminderEnabled: data.reminderEnabled,
          reminderTime: data.reminderTime,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Mostrar toast
        const toast = await this.toastController.create({
          message: `Registro "${data.nombre}" agendado`,
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('[ERROR] Failed to schedule registro:', error);
    }
  }
}
