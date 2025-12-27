import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ManualEvent } from '../../../models/manual-event.model';

@Injectable({
    providedIn: 'root'
})
export class AgendaService {
    private eventsSignal = signal<ManualEvent[]>([]);
    readonly events = this.eventsSignal.asReadonly();

    private readonly STORAGE_KEY = 'agenda_events';

    constructor() {
        this.loadEvents();
    }

    async loadEvents() {
        const { value } = await Preferences.get({ key: this.STORAGE_KEY });
        if (value) {
            try {
                this.eventsSignal.set(JSON.parse(value));
            } catch (e) {
                console.error('Error parsing agenda events', e);
                this.eventsSignal.set([]);
            }
        }
    }

    private async saveEvents() {
        await Preferences.set({
            key: this.STORAGE_KEY,
            value: JSON.stringify(this.eventsSignal())
        });
    }

    async addEvent(event: Omit<ManualEvent, 'id'>) {
        const newEvent: ManualEvent = { ...event, id: Date.now().toString() };
        this.eventsSignal.update(list => [...list, newEvent]);
        await this.saveEvents();
    }

    async updateEvent(event: ManualEvent) {
        this.eventsSignal.update(list => list.map(e => e.id === event.id ? event : e));
        await this.saveEvents();
    }

    async deleteEvent(id: string) {
        this.eventsSignal.update(list => list.filter(e => e.id !== id));
        await this.saveEvents();
    }
}
