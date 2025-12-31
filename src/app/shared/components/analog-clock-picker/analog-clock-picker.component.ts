import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timePicker } from 'analogue-time-picker';


@Component({
    selector: 'app-analog-clock-picker',
    templateUrl: './analog-clock-picker.component.html',
    styleUrls: ['./analog-clock-picker.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class AnalogClockPickerComponent implements OnInit, AfterViewInit {
    @ViewChild('pickerContainer') pickerContainer!: ElementRef<HTMLElement>;

    @Input() time: string = '08:00'; // Formato HH:mm
    @Input() showSeconds: boolean = false;
    @Input() interactive: boolean = true;
    @Output() timeChange = new EventEmitter<string>();

    hours: number = 8;
    minutes: number = 0;

    private picker: any;

    ngOnInit() {
        this.parseTime();
    }

    ngAfterViewInit() {
        this.initPicker();
    }



    private parseTime() {
        if (this.time) {
            const [h, m] = this.time.split(':').map(Number);
            this.hours = h || 0;
            this.minutes = m || 0;
        }
    }

    private initPicker() {
        if (!this.pickerContainer) return;

        // Limpiar el contenedor solo por si acaso
        this.pickerContainer.nativeElement.innerHTML = '';

        // Opciones del picker
        const options = {
            element: this.pickerContainer.nativeElement,
            time: {
                hour: this.hours,
                minute: this.minutes
            },
            width: 200,
            // La librería emite cambios cuando el usuario interactúa
            // Según el d.ts y docs, podemos pasar un callback
        };

        try {
            // Inicializar el picker
            this.picker = timePicker(options);

            // Suscribirse a cambios si la librería lo permite vía eventos o similar
            // Si no, podemos usar un intervalo o manejar el click de confirmación
            // Revisando docs, a veces se usa onClose
            if (this.picker && typeof this.picker.onClose === 'function') {
                this.picker.onClose = (time: any) => {
                    this.updateTime(time.hour, time.minute);
                };
            }

            // Algunos pickers de este tipo tienen un botón de OK que cierra o emite
            // Si es una vista estática (interactive=false), deshabilitamos clics
            if (!this.interactive) {
                this.pickerContainer.nativeElement.style.pointerEvents = 'none';
            }
        } catch (error) {
            console.error('Error al inicializar analogue-time-picker:', error);
        }
    }

    private updateTime(h: number, m: number) {
        this.hours = h;
        this.minutes = m;
        const hStr = h.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        this.time = `${hStr}:${mStr}`;
        this.timeChange.emit(this.time);
    }

    // Incrementar/Decrementar con botones (mantener compatibilidad si se desea)
    incrementHour() {
        this.hours = (this.hours + 1) % 24;
        this.refreshPicker();
    }

    decrementHour() {
        this.hours = (this.hours - 1 + 24) % 24;
        this.refreshPicker();
    }

    incrementMinute() {
        this.minutes = (this.minutes + 1) % 60;
        this.refreshPicker();
    }

    decrementMinute() {
        this.minutes = (this.minutes - 1 + 60) % 60;
        this.refreshPicker();
    }

    private refreshPicker() {
        // Si la librería soporta actualización dinámica de la hora
        // Si no, reinicializamos
        this.initPicker();
        this.updateTime(this.hours, this.minutes);
    }
}
