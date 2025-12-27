import { ErrorHandler, Injectable, Injector, NgZone, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private injector = inject(Injector);
    private zone = inject(NgZone);
    private logger = inject(LoggerService);

    async handleError(error: any): Promise<void> {
        // Extraer el mensaje de error
        const message = error.message || error.toString();

        // Loguear el error internamente
        this.logger.error('Excepción no capturada:', error);

        // Obtener ToastController de forma perezosa para evitar dependencias circulares
        const toastController = this.injector.get(ToastController);

        // Mostrar notificación al usuario dentro de la zona de Angular
        this.zone.run(async () => {
            const toast = await toastController.create({
                message: `Error inesperado: ${message}`,
                duration: 5000,
                position: 'bottom',
                color: 'danger',
                buttons: [
                    {
                        text: 'Cerrar',
                        role: 'cancel'
                    }
                ]
            });
            await toast.present();
        });

        // Delegar a la consola por defecto para depuración
        console.error('Error capturado por GlobalErrorHandler:', error);
    }
}
