import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { APP_CONSTANTS } from '../../shared/constants';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastController = inject(ToastController);

  async success(message: string, duration = APP_CONSTANTS.TOAST_DURATION_DEFAULT): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'success',
      icon: 'checkmark-circle-outline',
      position: 'top'
    });
    await toast.present();
  }

  async error(message: string, duration = APP_CONSTANTS.TOAST_DURATION_DEFAULT): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'danger',
      icon: 'close-circle-outline',
      position: 'top'
    });
    await toast.present();
  }

  async warning(message: string, duration = APP_CONSTANTS.TOAST_DURATION_DEFAULT): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'warning',
      icon: 'warning-outline',
      position: 'top'
    });
    await toast.present();
  }

  async info(message: string, duration = APP_CONSTANTS.TOAST_DURATION_DEFAULT): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'primary',
      icon: 'information-circle-outline',
      position: 'top'
    });
    await toast.present();
  }
}
