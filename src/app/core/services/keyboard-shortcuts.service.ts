import { Injectable, inject, HostListener } from '@angular/core';
import { AgendaService } from './agenda.service';

@Injectable({
    providedIn: 'root'
})
export class KeyboardShortcutsService {
    private agendaService = inject(AgendaService);

    init() {
        window.addEventListener('keydown', (event) => this.handleKeydown(event));
    }

    private handleKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            event.preventDefault();
            this.agendaService.undo();
            console.log('Undo triggered via shortcut');
        }

        if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.shiftKey && event.key === 'Z'))) {
            event.preventDefault();
            this.agendaService.redo();
            console.log('Redo triggered via shortcut');
        }
    }
}
