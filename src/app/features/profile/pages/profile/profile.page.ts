import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonIcon,
  IonInput,
  IonAvatar,
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  mailOutline,
  callOutline,
  schoolOutline,
  saveOutline,
  closeSharp,
  chevronBackSharp
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonIcon,
    IonInput,
    IonAvatar,
    IonButton
  ]
})
export class ProfilePage implements OnInit {
  userName = 'Usuario';
  userEmail = '';
  userPhone = '';
  userPlace = '';

  constructor(
    private toastService: ToastService,
    private router: Router
  ) {
    addIcons({
      closeSharp,
      chevronBackSharp,
      personCircleOutline,
      mailOutline,
      callOutline,
      schoolOutline,
      saveOutline
    });
  }

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    const { value: name } = await Preferences.get({ key: 'userName' });
    const { value: email } = await Preferences.get({ key: 'userEmail' });
    const { value: phone } = await Preferences.get({ key: 'userPhone' });
    const { value: place } = await Preferences.get({ key: 'userPlace' });

    this.userName = name || 'Usuario';
    this.userEmail = email || '';
    this.userPhone = phone || '';
    this.userPlace = place || '';
  }

  async saveProfile() {
    await Preferences.set({ key: 'userName', value: this.userName.trim() || 'Usuario' });
    await Preferences.set({ key: 'userEmail', value: this.userEmail.trim() });
    await Preferences.set({ key: 'userPhone', value: this.userPhone.trim() });
    await Preferences.set({ key: 'userPlace', value: this.userPlace.trim() });

    this.toastService.success('Perfil guardado correctamente');
  }

  closeProfile() {
    this.router.navigate(['/home']);
  }
}
