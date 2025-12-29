import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { RegistroBuffer } from '../../../models/registro.model';

/**
 * Componente para visualizar buffers (tiempos antes/después) de un registro.
 * Muestra franjas semitransparentes con descripción y duración.
 * 
 * FASE 1.2: Visualización básica de buffers
 */
@Component({
    selector: 'app-buffer-visualizer',
    standalone: true,
    imports: [CommonModule, IonIcon],
    templateUrl: './buffer-visualizer.component.html',
    styleUrls: ['./buffer-visualizer.component.scss']
})
export class BufferVisualizerComponent {
    /**
     * Tipo de buffer: 'before' o 'after'
     */
    @Input() type: 'before' | 'after' = 'before';

    /**
     * Datos del buffer (duración y descripción)
     */
    @Input() buffer?: RegistroBuffer;

    /**
     * Altura proporcional basada en duración (1px = 2 minutos por defecto)
     */
    @Input() pixelsPerMinute = 2;

    /**
     * Calcular altura en píxeles
     */
    get heightPx(): number {
        if (!this.buffer) return 0;
        return this.buffer.duration * this.pixelsPerMinute;
    }

    /**
     * Obtener ícono según tipo de buffer
     */
    get icon(): string {
        return this.type === 'before' ? 'arrow-down-outline' : 'arrow-up-outline';
    }

    /**
     * Obtener descripción con fallback
     */
    get description(): string {
        if (this.buffer?.description) {
            return this.buffer.description;
        }
        return this.type === 'before' ? 'Preparación' : 'Regreso';
    }
}
