import { Injectable, inject } from '@angular/core';
import { Registro } from '../../models/registro.model';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root'
})
export class ReminderService {
    private notificationService = inject(NotificationService);

    /**
     * Schedules a reminder for a specific Registro.
     * Returns the generated Notification ID if successful, null otherwise.
     */
    async scheduleFor(registro: Registro): Promise<number | null> {
        if (!registro.startTime || !registro.reminderEnabled || !registro.reminderTime) {
            return null;
        }

        const eventDate = new Date(registro.startTime);
        const notificationDate = new Date(eventDate.getTime() - registro.reminderTime * 60000);

        // Don't schedule if time is in the past
        if (notificationDate.getTime() < Date.now()) {
            return null;
        }

        // Generate a unique numeric ID from the string UUID
        const notificationId = this.generateId(registro.id);

        const success = await this.notificationService.schedule({
            id: notificationId,
            title: 'Recordatorio de Evento',
            body: `${registro.name} comienza en ${registro.reminderTime} minutos`,
            at: notificationDate,
            actionTypeId: 'REMINDER_ACTIONS',
            extra: {
                registroId: registro.id
            }
        });

        return success ? notificationId : null;
    }

    async cancelFor(notificationId: number) {
        if (notificationId) {
            await this.notificationService.cancelNotification(notificationId);
        }
    }

    async cancelReminder(id: string) {
        const notificationId = this.generateId(id);
        await this.cancelFor(notificationId);
    }

    private generateId(stringId: string): number {
        // Simple hash function to get integer from string
        let hash = 0;
        if (stringId.length === 0) return hash;
        for (let i = 0; i < stringId.length; i++) {
            const char = stringId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}
