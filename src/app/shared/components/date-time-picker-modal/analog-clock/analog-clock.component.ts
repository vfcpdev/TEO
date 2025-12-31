import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-analog-clock',
    standalone: true,
    imports: [CommonModule, IonicModule],
    template: `
    <div class="clock-container">
      <div class="clock-face" #clockFace (mousedown)="onStart($event)" (touchstart)="onStart($event)" (mousemove)="onMove($event)" (touchmove)="onMove($event)" (mouseup)="onEnd()" (touchend)="onEnd()">
        <div class="center-dot"></div>
        <div class="hand" [style.transform]="handTransform" [class.minute-hand]="mode === 'minute'">
            <div class="hand-tip"></div>
        </div>
        
        <!-- Clock Numbers -->
        <div *ngFor="let num of clockNumbers" class="clock-number" [style.left]="num.x + 'px'" [style.top]="num.y + 'px'" [class.selected]="isNumberSelected(num.value)">
          {{ num.label }}
        </div>
      </div>

      <!-- AM/PM Toggle -->
      <div class="am-pm-toggle">
        <div class="toggle-item" [class.active]="period === 'AM'" (click)="setPeriod('AM')">AM</div>
        <div class="toggle-item" [class.active]="period === 'PM'" (click)="setPeriod('PM')">PM</div>
      </div>
    </div>
  `,
    styles: [`
    .clock-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      user-select: none;
    }

    .clock-face {
      position: relative;
      width: 260px;
      height: 260px;
      border-radius: 50%;
      background-color: #f0f0f0; /* Light gray background */
      cursor: pointer;
      touch-action: none; /* Prevent scrolling while dragging */
      margin-bottom: 20px;
    }

    .center-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8px;
      height: 8px;
      background-color: var(--ion-color-primary);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .hand {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 40%; /* Radius of hand */
      background-color: var(--ion-color-primary);
      transform-origin: 50% 0%; /* Rotate from top (which is center of clock) */
      pointer-events: none;
      z-index: 5;
    }

    .hand-tip {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 36px;
        height: 36px;
        background-color: var(--ion-color-primary); /* Material Blue */
        border-radius: 50%;
        transform: translate(-50%, 50%);
        opacity: 0.2; /* Transparent circle at tip */
    }
    
    .hand.minute-hand .hand-tip {
        /* Optional: smaller tip for minutes if desired, or same */
    }

    .clock-number {
      position: absolute;
      width: 32px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      border-radius: 50%;
      font-size: 16px;
      font-weight: 500;
      color: #333;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .clock-number.selected {
      background-color: var(--ion-color-primary);
      color: white;
    }

    .am-pm-toggle {
      display: flex;
      gap: 20px;
    }

    .toggle-item {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #666;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-item.active {
      background-color: var(--ion-color-secondary); /* Usually complementary */
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
  `]
})
export class AnalogClockComponent implements AfterViewInit, OnChanges {
    @Input() hour: number = 12;
    @Input() minute: number = 0;
    @Input() mode: 'hour' | 'minute' = 'hour'; // Current selection mode
    @Output() timeChange = new EventEmitter<{ hour: number, minute: number }>();
    @Output() modeChange = new EventEmitter<'hour' | 'minute'>();

    @ViewChild('clockFace') clockFace!: ElementRef;

    period: 'AM' | 'PM' = 'AM';
    clockNumbers: { value: number, label: string, x: number, y: number }[] = [];
    handTransform: string = 'rotate(180deg)'; // Initial downward

    private isDragging = false;
    private radius = 130; // Half of 260px
    private numberRadius = 108; // Slightly inside

    ngAfterViewInit() {
        this.generateNumbers();
        this.updateClock();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['hour'] || changes['minute'] || changes['mode']) {
            this.updateClock();
            if (changes['mode']) {
                this.generateNumbers();
            }
        }
    }

    generateNumbers() {
        this.clockNumbers = [];
        const count = 12;
        const step = 360 / count;

        for (let i = 1; i <= count; i++) {
            const angle = (i * step - 90) * (Math.PI / 180); // -90 to start at top
            const x = this.radius + this.numberRadius * Math.cos(angle);
            const y = this.radius + this.numberRadius * Math.sin(angle);

            let label = i.toString();
            let value = i;

            if (this.mode === 'minute') {
                value = i === 12 ? 0 : i * 5;
                label = value.toString().padStart(2, '0');
            }

            this.clockNumbers.push({ value, label, x, y });
        }
    }

    updateClock() {
        // Determine AM/PM if not set (or keep consistency)
        if (this.hour >= 12) {
            this.period = 'PM';
        } else {
            this.period = 'AM';
        }

        this.calculateHandPosition();
    }

    calculateHandPosition() {
        let degrees = 0;
        if (this.mode === 'hour') {
            const h = this.hour % 12 || 12; // 12hr format
            degrees = (h * 30) - 180; // 30 deg per hour. -180 because CSS transform-origin is top (center of clock), and hand points down initially? 
            // Wait, let's standardize.
            // Hand pointing UP is 0deg rotation?
            // In CSS: top: 50%, left: 50%, height: 40%. transform-origin: top center.
            // So default hand points DOWN (because height grows downwards).
            // 12 o'clock is UP. So default needs to be rotated 180deg to point UP.
            // Angle for 12 is 0 deg (12 * 30 = 360). 
            // So rotation = (h * 30) + 180.
            degrees = (h * 30) + 180;
        } else {
            degrees = (this.minute * 6) + 180; // 6 deg per minute
        }
        this.handTransform = `translate(-50%, 0) rotate(${degrees}deg)`;
    }

    onStart(event: MouseEvent | TouchEvent) {
        this.isDragging = true;
        this.handleInteraction(event);
        event.preventDefault(); // Prevent scroll
    }

    onMove(event: MouseEvent | TouchEvent) {
        if (!this.isDragging) return;
        this.handleInteraction(event);
        event.preventDefault();
    }

    onEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            // Auto switch to minutes if just finished hours
            if (this.mode === 'hour') {
                setTimeout(() => this.modeChange.emit('minute'), 300);
            }
        }
    }

    handleInteraction(event: MouseEvent | TouchEvent) {
        const rect = this.clockFace.nativeElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let clientX, clientY;
        if (event instanceof MouseEvent) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        }

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        // Angle in degrees
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        // Convert to 0-360 where -90 (top) is 0
        // Atan2: Right is 0, Down is 90, Left is 180, Up is -90
        // We want Up to be 0/12/00.
        // angle + 90
        angle += 90;
        if (angle < 0) angle += 360;

        // Now angle is 0 at 12 o'clock, 90 at 3 o'clock.

        if (this.mode === 'hour') {
            // 12 hours = 360 deg, 1 hour = 30 deg
            let h = Math.round(angle / 30);
            if (h === 0) h = 12;

            // Handle PM
            let finalHour = h;
            if (this.period === 'PM' && h !== 12) finalHour = h + 12;
            if (this.period === 'AM' && h === 12) finalHour = 0;

            if (finalHour !== this.hour) {
                this.hour = finalHour;
                this.emitChange();
            }

        } else {
            // 60 minutes = 360 deg, 1 minute = 6 deg
            let m = Math.round(angle / 6);
            if (m === 60) m = 0;

            if (m !== this.minute) {
                this.minute = m;
                this.emitChange();
            }
        }

        this.calculateHandPosition();
    }

    setPeriod(p: 'AM' | 'PM') {
        if (this.period === p) return;
        this.period = p;

        // Adjust hour
        if (p === 'PM' && this.hour < 12) {
            this.hour += 12;
        } else if (p === 'AM' && this.hour >= 12) {
            this.hour -= 12;
        }

        this.emitChange();
    }

    emitChange() {
        this.timeChange.emit({ hour: this.hour, minute: this.minute });
    }

    isNumberSelected(val: number): boolean {
        if (this.mode === 'hour') {
            // Convert current hour to 1-12
            const h = this.hour % 12 || 12;
            return h === val;
        } else {
            return this.minute === val;
        }
    }
}
