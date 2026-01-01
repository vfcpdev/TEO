import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NetworkService implements OnDestroy {
    isOnline = signal<boolean>(navigator.onLine);

    constructor() {
        window.addEventListener('online', this.updateStatus);
        window.addEventListener('offline', this.updateStatus);
    }

    ngOnDestroy() {
        window.removeEventListener('online', this.updateStatus);
        window.removeEventListener('offline', this.updateStatus);
    }

    private updateStatus = () => {
        this.isOnline.set(navigator.onLine);
        console.log('[NetworkService] Status changed:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
    };
}
