import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './app/core/handlers/global-error.handler';

/**
 * Inicializa jeep-sqlite para soporte web antes de arrancar Angular
 */
async function initJeepSqlite(): Promise<void> {
  if (Capacitor.getPlatform() !== 'web') return;

  console.log('[main.ts] Initializing jeep-sqlite for web platform');

  // 1. Registrar el custom element de Stencil
  jeepSqlite(window);
  console.log('[main.ts] jeep-sqlite custom elements registered');

  // 2. Esperar a que el custom element esté definido
  await customElements.whenDefined('jeep-sqlite');
  console.log('[main.ts] jeep-sqlite custom element is defined');

  // 3. Dar tiempo para que Stencil complete la hidratación
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('[main.ts] jeep-sqlite initialization complete');
}

// Inicializar jeep-sqlite y luego arrancar Angular
initJeepSqlite().then(() => {
  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideRouter(routes, withPreloading(PreloadAllModules)),
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
      }),
      importProvidersFrom(IonicStorageModule.forRoot()),
      { provide: ErrorHandler, useClass: GlobalErrorHandler },
    ],
  });
});
