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
        // Schedule Legacy
        if (registro.reminderEnabled && registro.reminderTime) {
            await this.scheduleSingle(registro, registro.reminderTime, 'legacy');
        }

        // Schedule Multiples
        if (registro.reminders && registro.reminders.length > 0) {
            for (const reminder of registro.reminders) {
                const notifId = await this.scheduleSingle(registro, reminder.time, reminder.id);
                if (notifId) {
                    reminder.notificationId = notifId;
                }
            }
        }

        return null; // Return value not used for multiple, but strictly kept for signature compatibility if needed
    }

    private async scheduleSingle(registro: Registro, minutesBefore: number, discriminator: string): Promise<number | null> {
        if (!registro.startTime) return null;

        const eventDate = new Date(registro.startTime);
        const notificationDate = new Date(eventDate.getTime() - minutesBefore * 60000);

        if (notificationDate.getTime() < Date.now()) {
            return null;
        }

        const notificationId = this.generateId(`${registro.id}-${discriminator}`);

        const success = await this.notificationService.schedule({
            id: notificationId,
            title: 'Recordatorio de Evento',
            body: `${registro.name} comienza en ${minutesBefore} minutos`,
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

    async cancelAllFor(registro: Registro) {
        // Cancel legacy
        if (registro.notificationId) {
            await this.cancelFor(registro.notificationId);
        }

        // Cancel multiples
        if (registro.reminders) {
            for (const reminder of registro.reminders) {
                if (reminder.notificationId) {
                    await this.cancelFor(reminder.notificationId);
                } else {
                    // Try to cancel by predicted ID if not stored
                    const predictedId = this.generateId(`${registro.id}-${reminder.id}`);
                    await this.cancelFor(predictedId);
                }
            }
        }
    }

    private generateId(stringId: string): number {
        let hash = 0;
        if (stringId.length === 0) return hash;
        for (let i = 0; i < stringId.length; i++) {
            const char = stringId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}
