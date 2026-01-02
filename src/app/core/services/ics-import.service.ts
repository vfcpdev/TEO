import { Injectable } from '@angular/core';

export interface IcsEvent {
    uid?: string;
    summary: string;
    description?: string;
    dtStart: Date;
    dtEnd?: Date;
    location?: string;
    allDay: boolean; // Computed if dtStart has no time component
}

@Injectable({
    providedIn: 'root'
})
export class IcsImportService {

    constructor() { }

    /**
     * Reads an .ics file and returns a list of parsed events.
     */
    async parseIcsFile(file: File): Promise<IcsEvent[]> {
        const text = await file.text();
        return this.parseIcsContent(text);
    }

    private parseIcsContent(content: string): IcsEvent[] {
        const events: IcsEvent[] = [];
        const lines = content.split(/\r\n|\n|\r/);

        let currentEvent: Partial<IcsEvent> | null = null;
        let inEvent = false;

        // Simple VEVENT parser
        // Handling multi-line values is simplified here (often they start with space)

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('BEGIN:VEVENT')) {
                inEvent = true;
                currentEvent = {};
                continue;
            }

            if (line.startsWith('END:VEVENT')) {
                if (inEvent && currentEvent && currentEvent.summary && currentEvent.dtStart) {
                    events.push(currentEvent as IcsEvent);
                }
                inEvent = false;
                currentEvent = null;
                continue;
            }

            if (inEvent && currentEvent) {
                if (line.startsWith('SUMMARY:')) {
                    currentEvent.summary = this.extractValue(line, 'SUMMARY');
                } else if (line.startsWith('DESCRIPTION:')) {
                    currentEvent.description = this.extractValue(line, 'DESCRIPTION');
                } else if (line.startsWith('DTSTART')) {
                    // Can be DTSTART;VALUE=DATE:20240101 or DTSTART:20240101T090000Z
                    const val = line.substring(line.indexOf(':') + 1);
                    currentEvent.dtStart = this.parseIcsDate(val);
                    currentEvent.allDay = line.includes('VALUE=DATE');
                } else if (line.startsWith('DTEND')) {
                    const val = line.substring(line.indexOf(':') + 1);
                    currentEvent.dtEnd = this.parseIcsDate(val);
                } else if (line.startsWith('UID:')) {
                    currentEvent.uid = this.extractValue(line, 'UID');
                }
            }
        }

        return events;
    }

    private extractValue(line: string, key: string): string {
        // Basic extraction, doesn't handle unwrapping long lines fully yet
        return line.substring(key.length + 1).replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
    }

    private parseIcsDate(dateStr: string): Date {
        // Formats: 20240129, 20240129T130000, 20240129T130000Z
        try {
            const year = parseInt(dateStr.substring(0, 4), 10);
            const month = parseInt(dateStr.substring(4, 6), 10) - 1; // 0-indexed
            const day = parseInt(dateStr.substring(6, 8), 10);

            let hour = 0, min = 0, sec = 0;

            if (dateStr.includes('T')) {
                const timePart = dateStr.split('T')[1];
                hour = parseInt(timePart.substring(0, 2), 10);
                min = parseInt(timePart.substring(2, 4), 10);
                sec = parseInt(timePart.substring(4, 6), 10);
            }

            // naive parsing (local time), ignoring Z timezone for simplicity in this MVP
            return new Date(year, month, day, hour, min, sec);
        } catch (e) {
            console.warn('Error parsing ICS date', dateStr, e);
            return new Date();
        }
    }
}
