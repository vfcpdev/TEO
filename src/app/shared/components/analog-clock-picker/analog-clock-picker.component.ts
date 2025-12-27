import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
    selector: 'app-analog-clock-picker',
    templateUrl: './analog-clock-picker.component.html',
    styleUrls: ['./analog-clock-picker.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class AnalogClockPickerComponent implements OnInit, OnDestroy {
    @ViewChild('clockSvg') clockSvg!: ElementRef<SVGElement>;

    // Exponer Math para el template
    Math = Math;

    // Índices para las marcas de hora
    hourIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    @Input() time: string = '08:00'; // Formato HH:mm
    @Input() showSeconds: boolean = false;
    @Input() interactive: boolean = true;
    @Output() timeChange = new EventEmitter<string>();

    hours: number = 8;
    minutes: number = 0;
    seconds: number = 0;

    private timer: any;
    private isDragging: boolean = false;
    dragTarget: 'hour' | 'minute' | null = null; // Público para el template
    private centerX: number = 100;
    private centerY: number = 100;

    ngOnInit() {
        this.parseTime();

        // Si mostramos segundos, actualizar cada segundo
        if (this.showSeconds) {
            this.timer = setInterval(() => {
                this.seconds = (this.seconds + 1) % 60;
                if (this.seconds === 0) {
                    this.minutes = (this.minutes + 1) % 60;
                    if (this.minutes === 0) {
                        this.hours = (this.hours + 1) % 24;
                    }
                }
                this.emitTime();
            }, 1000);
        }
    }

    ngOnDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    private parseTime() {
        if (this.time) {
            const [h, m] = this.time.split(':').map(Number);
            this.hours = h || 0;
            this.minutes = m || 0;
        }
    }

    // Cálculo de rotación para cada manecilla
    get hourRotation(): number {
        // (horas / 12) * 360 + (minutos / 60) * 30
        const h = this.hours % 12;
        return (h / 12) * 360 + (this.minutes / 60) * 30;
    }

    get minuteRotation(): number {
        // (minutos / 60) * 360 + (segundos / 60) * 6
        return (this.minutes / 60) * 360 + (this.seconds / 60) * 6;
    }

    get secondRotation(): number {
        // (segundos / 60) * 360
        return (this.seconds / 60) * 360;
    }

    // Texto digital de la hora
    get digitalTime(): string {
        const h = this.hours.toString().padStart(2, '0');
        const m = this.minutes.toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    // Emitir el tiempo seleccionado
    private emitTime() {
        const h = this.hours.toString().padStart(2, '0');
        const m = this.minutes.toString().padStart(2, '0');
        this.time = `${h}:${m}`;
        this.timeChange.emit(this.time);
    }

    // ===== INTERACTIVIDAD (Drag) =====

    onPointerDown(event: PointerEvent, target: 'hour' | 'minute') {
        if (!this.interactive) return;
        this.isDragging = true;
        this.dragTarget = target;
        this.updateFromPointer(event);
    }

    @HostListener('document:pointermove', ['$event'])
    onPointerMove(event: PointerEvent) {
        if (!this.isDragging || !this.dragTarget) return;
        this.updateFromPointer(event);
    }

    @HostListener('document:pointerup')
    onPointerUp() {
        this.isDragging = false;
        this.dragTarget = null;
    }

    private updateFromPointer(event: PointerEvent) {
        if (!this.clockSvg) return;

        const svg = this.clockSvg.nativeElement;
        const rect = svg.getBoundingClientRect();

        // Centro del SVG en coordenadas de pantalla
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Posición del puntero relativa al centro
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;

        // Calcular ángulo (0° = 12 en punto)
        let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        if (this.dragTarget === 'minute') {
            // Convertir ángulo a minutos (0-59)
            this.minutes = Math.round(angle / 6) % 60;
        } else if (this.dragTarget === 'hour') {
            // Convertir ángulo a horas (0-11) + mantener AM/PM
            const newHour = Math.round(angle / 30) % 12;
            this.hours = this.hours >= 12 ? newHour + 12 : newHour;
            if (this.hours === 12 && this.hours < 12) this.hours = 0;
            if (this.hours === 24) this.hours = 12;
        }

        this.emitTime();
    }

    // Alternar AM/PM
    toggleAmPm() {
        if (this.hours >= 12) {
            this.hours -= 12;
        } else {
            this.hours += 12;
        }
        this.emitTime();
    }

    get amPmLabel(): string {
        return this.hours >= 12 ? 'PM' : 'AM';
    }

    // Helpers para posiciones de marcas de hora
    getMarkX1(i: number): number {
        return 100 + 80 * Math.sin(i * 30 * Math.PI / 180);
    }

    getMarkY1(i: number): number {
        return 100 - 80 * Math.cos(i * 30 * Math.PI / 180);
    }

    getMarkX2(i: number): number {
        return 100 + 88 * Math.sin(i * 30 * Math.PI / 180);
    }

    getMarkY2(i: number): number {
        return 100 - 88 * Math.cos(i * 30 * Math.PI / 180);
    }

    getNumberX(idx: number): number {
        return 100 + 70 * Math.sin(idx * 30 * Math.PI / 180);
    }

    getNumberY(idx: number): number {
        return 100 - 70 * Math.cos(idx * 30 * Math.PI / 180) + 5;
    }

    // Incrementar/Decrementar con botones
    incrementHour() {
        this.hours = (this.hours + 1) % 24;
        this.emitTime();
    }

    decrementHour() {
        this.hours = (this.hours - 1 + 24) % 24;
        this.emitTime();
    }

    incrementMinute() {
        this.minutes = (this.minutes + 1) % 60;
        this.emitTime();
    }

    decrementMinute() {
        this.minutes = (this.minutes - 1 + 60) % 60;
        this.emitTime();
    }
}
