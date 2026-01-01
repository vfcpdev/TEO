import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime: string; date?: string };
    end: { dateTime: string; date?: string };
    htmlLink: string;
}

@Injectable({
    providedIn: 'root'
})
export class GoogleCalendarService {
    private http = inject(HttpClient);

    // State
    private _isAuthenticated = signal(false);
    private _accessToken = signal<string | null>(null);

    readonly isAuthenticated = this._isAuthenticated.asReadonly();

    constructor() {
        this.checkAuth();
    }

    async checkAuth() {
        const { value } = await Preferences.get({ key: 'google_access_token' });
        if (value) {
            this._accessToken.set(value);
            this._isAuthenticated.set(true);
        }
    }

    async login(token: string) {
        // In a real app, this would handle the OAuth flow.
        // Here we accept a token (pasted by user or from a future plugin)
        await Preferences.set({ key: 'google_access_token', value: token });
        this._accessToken.set(token);
        this._isAuthenticated.set(true);
    }

    async logout() {
        await Preferences.remove({ key: 'google_access_token' });
        this._accessToken.set(null);
        this._isAuthenticated.set(false);
    }

    /**
     * Fetch events from the primary calendar
     */
    async listEvents(timeMin: Date, timeMax: Date): Promise<GoogleCalendarEvent[]> {
        if (!this._isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const start = timeMin.toISOString();
        const end = timeMax.toISOString();
        const token = this._accessToken();

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime`;

        try {
            const response: any = await firstValueFrom(
                this.http.get(url, {
                    headers: new HttpHeaders({
                        'Authorization': `Bearer ${token}`
                    })
                })
            );
            return response.items || [];
        } catch (error) {
            console.error('Error fetching Google Calendar events', error);
            if ((error as any).status === 401) {
                this.logout(); // Token expired
            }
            throw error;
        }
    }

    /**
     * Create an event in Google Calendar
     */
    async createEvent(event: any): Promise<GoogleCalendarEvent> {
        if (!this._isAuthenticated()) throw new Error('Not authenticated');

        const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
        const token = this._accessToken();

        const body = {
            summary: event.title,
            description: event.description,
            start: { dateTime: new Date(event.startTime).toISOString() },
            end: { dateTime: new Date(event.endTime).toISOString() }
        };

        return firstValueFrom(
            this.http.post<GoogleCalendarEvent>(url, body, {
                headers: new HttpHeaders({
                    'Authorization': `Bearer ${token}`
                })
            })
        );
    }

    async updateEvent(eventId: string, event: any): Promise<GoogleCalendarEvent> {
        if (!this._isAuthenticated()) throw new Error('Not authenticated');

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
        const token = this._accessToken();

        const body = {
            summary: event.title,
            description: event.description,
            start: { dateTime: new Date(event.startTime).toISOString() },
            end: { dateTime: new Date(event.endTime).toISOString() }
        };

        return firstValueFrom(
            this.http.patch<GoogleCalendarEvent>(url, body, {
                headers: new HttpHeaders({
                    'Authorization': `Bearer ${token}`
                })
            })
        );
    }

    async deleteEvent(eventId: string): Promise<void> {
        if (!this._isAuthenticated()) throw new Error('Not authenticated');

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
        const token = this._accessToken();

        await firstValueFrom(
            this.http.delete(url, {
                headers: new HttpHeaders({
                    'Authorization': `Bearer ${token}`
                })
            })
        );
    }

    // Helper for SyncQueue
    async upsertEvent(payload: any) {
        if (payload.googleEventId) {
            return this.updateEvent(payload.googleEventId, payload);
        } else {
            return this.createEvent(payload);
        }
    }
}
