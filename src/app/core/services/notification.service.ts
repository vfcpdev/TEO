import { Injectable, inject } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private platform = inject(Platform);

    constructor() {
        this.init();
    }

    private async init() {
        if (!this.platform.is('capacitor')) return;

        // Register Action Types
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: 'REMINDER_ACTIONS',
                    actions: [
                        {
                            id: 'snooze',
                            title: 'Posponer 5 min',
                            foreground: false // Perform in background without opening app
                        },
                        {
                            id: 'dismiss',
                            title: 'Descartar',
                            destructive: true,
                            foreground: false
                        }
                    ]
                }
            ]
        });

        // Listen for actions
        LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
            if (action.actionId === 'snooze') {
                console.log('Snooze action triggered for notification', action.notification.id);

                // Reschedule for +5 minutes
                const snoozeTime = new Date(Date.now() + 5 * 60000);

                // We reuse the same notification ID for simplicity
                const id = action.notification.id;

                await LocalNotifications.schedule({
                    notifications: [{
                        id: id,
                        title: action.notification.title,
                        body: action.notification.body + ' (Pospuesto)',
                        schedule: { at: snoozeTime },
                        actionTypeId: 'REMINDER_ACTIONS',
                        extra: action.notification.extra
                    }]
                });
            }
        });
    }

    async requestPermissions(): Promise<boolean> {
        if (!this.platform.is('capacitor')) {
            console.log('Notifications not supported on web/PWA yet, or relying on browser API');
            return true;
        }

        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    }

    async schedule(options: {
        id: number;
        title: string;
        body: string;
        at: Date;
        actionTypeId?: string;
        extra?: any;
    }): Promise<boolean> {
        if (!options.at || options.at.getTime() < Date.now()) {
            return false;
        }

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        id: options.id,
                        title: options.title,
                        body: options.body,
                        schedule: { at: options.at },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: options.actionTypeId,
                        extra: options.extra
                    }
                ]
            });
            console.log(`Notification scheduled: ${options.title} at ${options.at.toLocaleTimeString()}`);
            return true;
        } catch (error) {
            console.error('Error scheduling notification', error);
            return false;
        }
    }

    async cancelNotification(notificationId: number) {
        if (!notificationId) return;
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    }
}
