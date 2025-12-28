import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { AgendaService } from '../../../../core/services/agenda.service';

@Component({
    selector: 'app-test-modal',
    standalone: true,
    imports: [CommonModule, IonIcon],
    templateUrl: './test-modal.component.html',
    styleUrls: ['./test-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestModalComponent {
    private modalCtrl = inject(ModalController);
    readonly agendaService = inject(AgendaService);

    // Signal to control secondary modal visibility
    showSecondaryModal = signal(false);

    constructor() {
        addIcons({ close });
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    onBorradorClick() {
        // Toggle secondary modal instead of dismissing
        this.showSecondaryModal.set(!this.showSecondaryModal());
    }

    onConfirmadoClick() {
        this.modalCtrl.dismiss({ action: 'confirmado' });
    }

    calculateAreaButtonTop(index: number): number {
        // Position buttons vertically, starting from a base position
        const baseTop = -30; // Start above center
        const spacing = 45; // Space between buttons
        return baseTop + (index * spacing);
    }

    closeAreaModal() {
        this.showSecondaryModal.set(false);
    }
}
