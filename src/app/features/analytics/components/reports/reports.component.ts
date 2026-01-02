import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonProgressBar, IonButton, ToastController } from '@ionic/angular/standalone';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { AgendaService } from '../../../../core/services/agenda.service';
import { addIcons } from 'ionicons';
import { pieChartOutline, timeOutline, checkmarkDoneOutline, ribbonOutline, downloadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reports',
  standalone: true,
  template: `
    <div class="reports-container">
        <!-- Header with Export -->
        <div class="reports-header">
            <ion-segment [value]="selectedRange()" (ionChange)="onRangeChange($event)" class="range-selector">
              <ion-segment-button value="day">
                <ion-label>Hoy</ion-label>
              </ion-segment-button>
              <ion-segment-button value="week">
                <ion-label>Semana</ion-label>
              </ion-segment-button>
              <ion-segment-button value="month">
                <ion-label>Mes</ion-label>
              </ion-segment-button>
            </ion-segment>
            
            <ion-button fill="clear" (click)="exportData()">
                <ion-icon slot="icon-only" name="download-outline"></ion-icon>
            </ion-button>
        </div>

        <!-- Summary Cards -->
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-card class="summary-card valid-kpi">
                <ion-card-header>
                  <ion-card-subtitle>Completado</ion-card-subtitle>
                  <ion-card-title>
                    <ion-icon name="checkmark-done-outline"></ion-icon>
                    {{ summary().completionRate | number:'1.0-0' }}%
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  {{ summary().completedCount }} / {{ summary().totalCount }} tareas
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="summary-card info-kpi">
                <ion-card-header>
                  <ion-card-subtitle>Tiempo Total</ion-card-subtitle>
                  <ion-card-title>
                    <ion-icon name="time-outline"></ion-icon>
                    {{ summary().totalHours }}h
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                    Productividad
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Trend Chart -->
        @if (trendStats().length > 0) {
        <ion-card class="chart-card">
          <ion-card-header>
            <ion-card-title>Tendencia de Actividad</ion-card-title>
          </ion-card-header>
          <ion-card-content>
              <div class="trend-chart">
                  @for (item of trendStats(); track item.label) {
                      <div class="trend-bar-group">
                          <div class="trend-bar-wrapper">
                              <div class="trend-bar" [style.height.%]="item.percentage * 100"></div>
                          </div>
                          <div class="trend-label">{{ item.label }}</div>
                          <div class="trend-value">{{ item.value }}h</div>
                      </div>
                  }
              </div>
          </ion-card-content>
        </ion-card>
        }

        <!-- Area Distribution -->
        <ion-card class="chart-card">
          <ion-card-header>
            <ion-card-title>Distribución por Área</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="area-list">
              @for (item of areaStats(); track item.areaId) {
                <div class="area-item">
                  <div class="label-row">
                    <span class="name">{{ item.areaName }}</span>
                    <span class="value">{{ item.percentage | number:'1.0-1' }}%</span>
                  </div>
                  <ion-progress-bar [value]="item.percentage / 100" [color]="item.color || 'primary'"></ion-progress-bar>
                  <div class="detail-row">
                    <small>{{ item.totalMinutes }} mins</small>
                  </div>
                </div>
              }
            </div>
            
            @if (areaStats().length === 0) {
                <div class="empty-state">
                    <p>No hay datos para este período.</p>
                </div>
            }
          </ion-card-content>
        </ion-card>

    </div>
  `,
  styles: [`
    .reports-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 0 var(--spacing-sm);
    }
    
    .reports-header {
        display: flex;
        align-items: center;
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-md);
    }

    .range-selector {
      flex: 1;
      margin-bottom: 0; 
    }

    .summary-card {
      text-align: center;
      margin: 0;
      height: 100%;
    }

    .summary-card ion-card-title {
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
    }

    .valid-kpi ion-icon { color: var(--ion-color-success); }
    .info-kpi ion-icon { color: var(--ion-color-tertiary); }

    .chart-card {
      margin-top: 16px;
      margin-inline: 0;
    }

    .area-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .area-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      font-weight: 500;
    }
    
    .detail-row {
        text-align: right;
        color: var(--ion-color-medium);
    }

    .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--ion-color-medium);
        font-style: italic;
    }

    .trend-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 150px;
        padding-top: 20px;
        gap: 8px;
    }

    .trend-bar-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        height: 100%;
    }

    .trend-bar-wrapper {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: rgba(var(--ion-color-medium-rgb), 0.1);
        border-radius: 8px;
        overflow: hidden;
    }

    .trend-bar {
        width: 80%;
        background: var(--ion-color-primary);
        border-radius: 4px 4px 0 0;
        min-height: 4px; /* Ensure visibility */
        transition: height 0.3s ease;
    }

    .trend-label {
        font-size: 0.75rem;
        margin-top: 4px;
        color: var(--ion-color-medium);
    }
    
    .trend-value {
        font-size: 0.7rem;
        font-weight: bold;
    }
  `],
  imports: [CommonModule, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonProgressBar, IonButton]
})
export class ReportsComponent {
  private analyticsService = inject(AnalyticsService);
  private agendaService = inject(AgendaService);
  private toastController = inject(ToastController);

  selectedRange = signal<'day' | 'week' | 'month'>('day');

  constructor() {
    addIcons({ pieChartOutline, timeOutline, checkmarkDoneOutline, ribbonOutline, downloadOutline });
  }

  // Computed data based on range
  filteredRegistros = computed(() => {
    const range = this.selectedRange();
    const all = this.agendaService.registros();
    const now = new Date();

    let start: Date, end: Date;

    if (range === 'day') { // Hoy
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    } else if (range === 'week') { // Últimos 7 días
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = new Date();
    } else { // Último mes
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      end = new Date();
    }

    return this.analyticsService.filterByRange(all, start, end);
  });

  summary = computed(() => {
    return this.analyticsService.getSummary(this.filteredRegistros());
  });

  areaStats = computed(() => {
    const regs = this.filteredRegistros();
    const dist = this.analyticsService.getAreaDistribution(regs);
    const totalDuration = Object.values(dist).reduce((a, b) => a + b, 0);

    const areas = this.agendaService.areas();

    return Object.entries(dist)
      .map(([areaId, mins]) => {
        const area = areas.find(a => a.id === areaId);
        return {
          areaId,
          areaName: area ? area.name : 'Desconocido',
          totalMinutes: Math.round(mins),
          percentage: totalDuration > 0 ? (mins / totalDuration * 100) : 0,
          color: area ? area.color : 'medium'
        };
      })
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  });

  trendStats = computed(() => {
    const range = this.selectedRange();
    const regs = this.filteredRegistros();

    const now = new Date();
    let start: Date, end: Date;
    let granularity: 'day' | 'week' = 'day';

    if (range === 'day') {
      // For 'day', maybe show hour breakdown? Or just ignore? 
      // Let's show last 7 days comparisons if 'day' is selected? 
      // Or just hide it. The user asked for "Weekly/Monthly summaries"
      return [];
    } else if (range === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 6); // Last 7 days inclusive
      end = new Date();
      granularity = 'day';
    } else {
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      end = new Date();
      granularity = 'week';
    }

    const trend = this.analyticsService.getTrend(regs, start, end, granularity);

    // Calculate max for bar scaling
    const maxVal = Math.max(...trend.map(t => t.value), 1); // Avoid div by 0

    return trend.map(t => ({
      ...t,
      label: range === 'month' ? t.date.substring(5) : t.date.substring(8) + '/' + t.date.substring(5, 7), // Simple formatting
      percentage: (t.value / maxVal),
      displayValue: t.value + 'h'
    }));
  });

  onRangeChange(event: any) {
    this.selectedRange.set(event.detail.value);
  }

  exportData() {
    const summary = this.summary();
    const areas = this.areaStats();
    const trend = this.trendStats();
    const range = this.selectedRange();

    let csvContent = `Reporte de Productividad - ${new Date().toLocaleDateString()}\n`;
    csvContent += `Periodo: ${range}\n\n`;

    csvContent += `RESUMEN GENERAL\n`;
    csvContent += `Completado,${summary.completedCount}/${summary.totalCount} (${summary.completionRate.toFixed(1)}%)\n`;
    csvContent += `Tiempo Total,${summary.totalHours}h\n`;
    csvContent += `Área más activa,${areas.length > 0 ? areas[0].areaName : 'N/A'}\n\n`;

    csvContent += `DISTRIBUCIÓN POR ÁREA\n`;
    csvContent += `Área,Minutos,Porcentaje\n`;
    areas.forEach(a => {
      csvContent += `${a.areaName},${a.totalMinutes},${a.percentage.toFixed(1)}%\n`;
    });
    csvContent += `\n`;

    csvContent += `TENDENCIA (${range === 'month' ? 'Semanal' : 'Diaria'})\n`;
    csvContent += `Etiqueta,Horas\n`;
    trend.forEach(t => {
      csvContent += `${t.label},${t.value}\n`;
    });

    this.downloadCsv(csvContent, `reporte-${range}-${new Date().toISOString().split('T')[0]}.csv`);
  }

  private downloadCsv(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
