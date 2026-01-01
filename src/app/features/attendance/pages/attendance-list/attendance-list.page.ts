import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonChip, IonFab, IonFabButton, IonSpinner, IonSearchbar,
  LoadingController, AlertController, ActionSheetController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle, closeCircle, timeOutline, helpCircleOutline,
  calendarOutline, peopleOutline, checkmarkDoneOutline, saveOutline,
  businessOutline, bookOutline, chevronBackOutline, todayOutline,
  listOutline, gridOutline, refreshOutline, trashOutline,
  checkboxOutline, squareOutline, createOutline, documentTextOutline
} from 'ionicons/icons';

import { AttendanceService } from '../../services/attendance.service';
import { CourseService } from '../../../courses/services/course.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Course } from '../../../../models/course.model';
import { AttendanceStatus, AttendanceWithStudentInfo } from '../../../../models/attendance.model';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonIcon, IonList, IonItem, IonLabel, IonSelect, IonSelectOption,
    IonChip, IonFab, IonFabButton, IonSpinner, IonSearchbar
  ],
  templateUrl: './attendance-list.page.html',
  styleUrls: ['./attendance-list.page.scss']
})
export class AttendanceListPage implements OnInit {
  private attendanceService = inject(AttendanceService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastService);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);
  private router = inject(Router);

  // Datos
  courses = signal<Course[]>([]);
  selectedCourseId = signal<string>('');
  sessionDate = signal<string>(this.getTodayDate());
  students = signal<AttendanceWithStudentInfo[]>([]);

  // Estados
  isLoading = signal(false);
  isSaving = signal(false);
  hasChanges = signal(false);

  // UI
  searchText = signal('');
  isSelectionMode = signal(false);
  selectedStudentIds = signal<Set<string>>(new Set());

  // Enums para template
  AttendanceStatus = AttendanceStatus;

  // Computed
  selectedCourse = computed(() => {
    const id = this.selectedCourseId();
    return this.courses().find(c => c.id === id);
  });

  filteredStudents = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const list = this.students();

    if (!search) return list;

    return list.filter(s =>
      s.studentFirstName.toLowerCase().includes(search) ||
      s.studentLastName.toLowerCase().includes(search) ||
      s.studentCode.toLowerCase().includes(search)
    );
  });

  attendanceStats = computed(() => {
    const list = this.students();
    return {
      total: list.length,
      present: list.filter(s => s.status === AttendanceStatus.PRESENTE).length,
      absent: list.filter(s => s.status === AttendanceStatus.AUSENTE).length,
      late: list.filter(s => s.status === AttendanceStatus.TARDANZA).length,
      justified: list.filter(s => s.status === AttendanceStatus.JUSTIFICADO).length
    };
  });

  selectedCount = computed(() => this.selectedStudentIds().size);

  constructor() {
    addIcons({ chevronBackOutline, saveOutline, bookOutline, calendarOutline, checkmarkCircle, closeCircle, timeOutline, helpCircleOutline, checkmarkDoneOutline, peopleOutline, documentTextOutline, createOutline, businessOutline, todayOutline, listOutline, gridOutline, refreshOutline, trashOutline, checkboxOutline, squareOutline });
  }

  ngOnInit() {
    this.loadCourses();
  }

  async loadCourses() {
    this.isLoading.set(true);
    try {
      const courses = await firstValueFrom(this.courseService.getAll());
      this.courses.set(courses.filter((c: Course) => c.isActive));

      // Seleccionar primer curso si hay
      if (courses.length > 0 && !this.selectedCourseId()) {
        this.selectedCourseId.set(courses[0].id);
        await this.loadStudents();
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      this.toastService.error('Error al cargar cursos');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadStudents() {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      this.students.set([]);
      return;
    }

    this.isLoading.set(true);
    try {
      const students = await this.attendanceService.getStudentsWithAttendance(
        courseId,
        this.sessionDate()
      );
      this.students.set(students);
      this.hasChanges.set(false);
    } catch (error) {
      console.error('Error loading students:', error);
      this.toastService.error('Error al cargar estudiantes');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onCourseChange(event: any) {
    this.selectedCourseId.set(event.detail.value);
    await this.loadStudents();
  }

  async onDateChange(event: any) {
    this.sessionDate.set(event.detail.value);
    await this.loadStudents();
  }

  /**
   * Cambiar estado de asistencia de un estudiante
   */
  toggleStatus(student: AttendanceWithStudentInfo) {
    if (this.isSelectionMode()) {
      this.toggleStudentSelection(student.studentId);
      return;
    }

    const statusOrder = [
      AttendanceStatus.PRESENTE,
      AttendanceStatus.AUSENTE,
      AttendanceStatus.TARDANZA,
      AttendanceStatus.JUSTIFICADO
    ];

    const currentIndex = statusOrder.indexOf(student.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    student.status = statusOrder[nextIndex];

    this.students.update(list =>
      list.map(s => s.studentId === student.studentId ? { ...s, status: student.status } : s)
    );
    this.hasChanges.set(true);
  }

  /**
   * Establecer estado específico
   */
  setStatus(student: AttendanceWithStudentInfo, status: AttendanceStatus) {
    this.students.update(list =>
      list.map(s => s.studentId === student.studentId ? { ...s, status } : s)
    );
    this.hasChanges.set(true);
  }

  /**
   * Marcar todos como presente
   */
  markAllPresent() {
    this.students.update(list =>
      list.map(s => ({ ...s, status: AttendanceStatus.PRESENTE }))
    );
    this.hasChanges.set(true);
  }

  /**
   * Marcar todos como ausente
   */
  markAllAbsent() {
    this.students.update(list =>
      list.map(s => ({ ...s, status: AttendanceStatus.AUSENTE }))
    );
    this.hasChanges.set(true);
  }

  /**
   * Guardar asistencia
   */
  async saveAttendance() {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      this.toastService.warning('Selecciona un curso');
      return;
    }

    const students = this.students();
    if (students.length === 0) {
      this.toastService.warning('No hay estudiantes para registrar');
      return;
    }

    this.isSaving.set(true);
    const loading = await this.loadingController.create({
      message: 'Guardando asistencia...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const attendances = students.map(s => ({
        courseId,
        studentId: s.studentId,
        sessionDate: new Date(this.sessionDate()),
        status: s.status,
        notes: s.notes
      }));

      const result = await this.attendanceService.saveBatchAttendance(attendances);

      await loading.dismiss();

      if (result.success > 0) {
        this.toastService.success(`Asistencia guardada: ${result.success} registros`);
        this.hasChanges.set(false);
      }

      if (result.failed > 0) {
        this.toastService.warning(`${result.failed} registros fallaron`);
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error saving attendance:', error);
      this.toastService.error('Error al guardar asistencia');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Obtener icono de estado
   */
  getStatusIcon(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENTE: return 'checkmark-circle';
      case AttendanceStatus.AUSENTE: return 'close-circle';
      case AttendanceStatus.TARDANZA: return 'time-outline';
      case AttendanceStatus.JUSTIFICADO: return 'help-circle-outline';
      default: return 'help-circle-outline';
    }
  }

  /**
   * Obtener color de estado
   */
  getStatusColor(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENTE: return 'success';
      case AttendanceStatus.AUSENTE: return 'danger';
      case AttendanceStatus.TARDANZA: return 'warning';
      case AttendanceStatus.JUSTIFICADO: return 'tertiary';
      default: return 'medium';
    }
  }

  /**
   * Obtener etiqueta de estado
   */
  getStatusLabel(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENTE: return 'Presente';
      case AttendanceStatus.AUSENTE: return 'Ausente';
      case AttendanceStatus.TARDANZA: return 'Tardanza';
      case AttendanceStatus.JUSTIFICADO: return 'Justificado';
      default: return 'Sin registro';
    }
  }

  /**
   * Obtener fecha de hoy
   */
  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  // --- Selección y Novedades Grupales ---

  toggleSelectionMode() {
    this.isSelectionMode.update(v => !v);
    if (!this.isSelectionMode()) {
      this.selectedStudentIds.set(new Set());
    }
  }

  toggleStudentSelection(studentId: string) {
    this.selectedStudentIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(studentId)) {
        newIds.delete(studentId);
      } else {
        newIds.add(studentId);
      }
      return newIds;
    });
  }

  selectAll() {
    const allIds = new Set(this.students().map(s => s.studentId));
    this.selectedStudentIds.set(allIds);
  }

  deselectAll() {
    this.selectedStudentIds.set(new Set());
  }

  async presentGroupNoveltyOptions() {
    if (this.selectedCount() === 0) return;

    const actionSheet = await this.actionSheetController.create({
      header: 'Aplicar Novedad Grupal',
      subHeader: `Seleccionados: ${this.selectedCount()}`,
      buttons: [
        {
          text: 'Justificado',
          icon: 'help-circle-outline',
          handler: () => {
            this.promptForReason(AttendanceStatus.JUSTIFICADO);
          }
        },
        {
          text: 'Tardanza',
          icon: 'time-outline',
          handler: () => {
            this.promptForReason(AttendanceStatus.TARDANZA);
          }
        },
        {
          text: 'Ausente',
          icon: 'close-circle',
          role: 'destructive',
          handler: () => {
            this.promptForReason(AttendanceStatus.AUSENTE);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async promptForReason(status: AttendanceStatus) {
    const alert = await this.alertController.create({
      header: 'Registrar Motivo',
      message: `Ingrese el motivo para la novedad grupal (${this.getStatusLabel(status)})`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Ej: Huelga de transporte, Evento escolar...'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aplicar',
          handler: (data) => {
            this.applyGroupNovelty(status, data.reason);
          }
        }
      ]
    });
    await alert.present();
  }

  applyGroupNovelty(status: AttendanceStatus, reason: string) {
    const notePrefix = '[Grupo] ';
    const formattedNote = reason ? `${notePrefix}${reason}` : notePrefix + 'Sin motivo especificado';
    const selectedIds = this.selectedStudentIds();

    this.students.update(list =>
      list.map(s => {
        if (selectedIds.has(s.studentId)) {
          return {
            ...s,
            status: status,
            notes: formattedNote
          };
        }
        return s;
      })
    );

    this.hasChanges.set(true);
    this.isSelectionMode.set(false);
    this.selectedStudentIds.set(new Set());
    this.toastService.success('Novedad grupal aplicada. No olvide guardar cambios.');
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
