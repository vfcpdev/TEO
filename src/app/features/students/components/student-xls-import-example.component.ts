import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { StudentXlsImportService } from '../services/student-xls-import.service';
import { StudentService } from '../services/student.service';
import { CourseStudentService } from '../services/course-student.service';
import { ToastService } from '../../../core/services/toast.service';
import { XlsImportResult } from '../../../models/student.model';

/**
 * EJEMPLO DE USO DEL SERVICIO StudentXlsImportService
 * 
 * Este archivo muestra cómo integrar el parser XLS en un componente
 * para importar listas de estudiantes desde archivos Excel.
 */

@Component({
  selector: 'app-student-xls-import-example',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Importar Lista de Estudiantes (XLS)</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="import-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Seleccionar archivo XLS</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <input 
              type="file" 
              accept=".xls,.xlsx" 
              (change)="onFileSelected($event)"
              #fileInput
            />
            
            <ion-button 
              expand="block" 
              (click)="importStudents()" 
              [disabled]="!selectedFile || importing"
            >
              <ion-icon name="cloud-upload" slot="start"></ion-icon>
              {{ importing ? 'Importando...' : 'Importar Estudiantes' }}
            </ion-button>

            <ion-button 
              expand="block" 
              fill="outline" 
              (click)="downloadSample()"
            >
              <ion-icon name="download" slot="start"></ion-icon>
              Descargar Ejemplo
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Resultados de la importación -->
        <ion-card *ngIf="importResult">
          <ion-card-header>
            <ion-card-title>
              {{ importResult.success ? 'Importación Exitosa' : 'Errores en Importación' }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Información del curso -->
            <div *ngIf="importResult.courseInfo" class="course-info">
              <h3>Información del Curso</h3>
              <p><strong>Código:</strong> {{ importResult.courseInfo.courseCode }}</p>
              <p><strong>Nombre:</strong> {{ importResult.courseInfo.courseName }}</p>
              <p><strong>Grupo:</strong> {{ importResult.courseInfo.group }}</p>
              <p><strong>Estudiantes esperados:</strong> {{ importResult.courseInfo.studentCount }}</p>
            </div>

            <!-- Estadísticas -->
            <div class="stats">
              <p><strong>Total de filas:</strong> {{ importResult.totalRows }}</p>
              <p><strong>Estudiantes importados:</strong> {{ importResult.importedCount }}</p>
              <p><strong>Errores:</strong> {{ importResult.errors.length }}</p>
            </div>

            <!-- Lista de errores -->
            <div *ngIf="importResult.errors.length > 0" class="errors">
              <h4>Errores encontrados:</h4>
              <ion-list>
                <ion-item *ngFor="let error of importResult.errors">
                  <ion-label>
                    <h3>Fila {{ error.row }}</h3>
                    <p>{{ error.message }}</p>
                    <p *ngIf="error.field"><small>Campo: {{ error.field }}</small></p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </div>

            <!-- Lista de estudiantes importados -->
            <div *ngIf="importResult.students.length > 0" class="students">
              <h4>Estudiantes a importar:</h4>
              <ion-list>
                <ion-item *ngFor="let student of importResult.students">
                  <ion-label>
                    <h3>{{ student.lastName }}, {{ student.firstName }}</h3>
                    <p>{{ student.documentType }}: {{ student.documentNumber }}</p>
                    <p><small>Código: {{ student.code }}</small></p>
                  </ion-label>
                </ion-item>
              </ion-list>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .import-container {
      padding: 16px;
    }

    input[type="file"] {
      margin-bottom: 16px;
      width: 100%;
    }

    .course-info, .stats, .errors, .students {
      margin-top: 16px;
    }

    .course-info h3, .errors h4, .students h4 {
      margin-bottom: 8px;
      color: var(--ion-color-primary);
    }
  `]
})
export class StudentXlsImportExampleComponent {
  selectedFile: File | null = null;
  importing = false;
  importResult: XlsImportResult | null = null;

  private xlsImportService = inject(StudentXlsImportService);
  private studentService = inject(StudentService);
  private courseStudentService = inject(CourseStudentService);
  private toastService = inject(ToastService);

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.importResult = null;
    }
  }

  /**
   * Importar estudiantes desde el archivo XLS
   */
  async importStudents(): Promise<void> {
    if (!this.selectedFile) {
      await this.toastService.warning('Por favor seleccione un archivo');
      return;
    }

    this.importing = true;

    try {
      // Parsear el archivo XLS
      this.importResult = await this.xlsImportService.parseXlsFile(this.selectedFile);

      if (!this.importResult.success) {
        await this.toastService.error(
          `Error al importar: ${this.importResult.errors.length} errores encontrados`
        );
        return;
      }

      // Si el parseo fue exitoso, guardar los estudiantes
      await this.saveStudents(this.importResult);

    } catch (error) {
      console.error('Error al importar estudiantes:', error);
      await this.toastService.error('Error al importar estudiantes');
    } finally {
      this.importing = false;
    }
  }

  /**
   * Guardar estudiantes en la base de datos
   */
  private async saveStudents(result: XlsImportResult): Promise<void> {
    try {
      // Guardar cada estudiante
      for (const studentDto of result.students) {
        await this.studentService.create(studentDto);
      }

      // Si hay matrículas, procesarlas
      if (result.enrollments && result.enrollments.length > 0) {
        for (const enrollment of result.enrollments) {
          // Obtener el ID del estudiante por su código
          const student = await this.studentService.getByCode(enrollment.studentCode);

          if (student) {
            // Aquí deberías obtener el courseId desde el courseCode
            // Este es un ejemplo simplificado
            // Nota: El grupo se maneja en otra tabla o campo si es necesario
            await this.courseStudentService.enrollStudent(
              'course-id', // Reemplazar con el ID real del curso
              student.id
            );
          }
        }
      }

      await this.toastService.success(
        `${result.importedCount} estudiantes importados exitosamente`
      );

    } catch (error) {
      console.error('Error al guardar estudiantes:', error);
      await this.toastService.error('Error al guardar estudiantes');
      throw error;
    }
  }

  /**
   * Descargar archivo de ejemplo
   */
  downloadSample(): void {
    this.xlsImportService.generateSampleXLS();
  }
}
