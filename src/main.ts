import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
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

  // 1. Registrar el custom element
  jeepSqlite(window);

  // 2. Esperar a que el custom element esté definido
  await customElements.whenDefined('jeep-sqlite');
  console.log('[main.ts] jeep-sqlite custom element defined');

  // 3. Buscar o crear el elemento en el DOM
  let jeepEl = document.querySelector('jeep-sqlite') as any;
  if (!jeepEl) {
    jeepEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepEl);
  }

  // 4. Esperar a que el componente esté listo (Stencil lifecycle)
  if (typeof jeepEl.componentOnReady === 'function') {
    await jeepEl.componentOnReady();
    console.log('[main.ts] jeep-sqlite component ready');
  } else {
    // Fallback: esperar un pequeño delay para que el componente se inicialice
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[main.ts] jeep-sqlite waited for initialization');
  }

  // 5. Inicializar el web store
  try {
    await jeepEl.initWebStore();
    console.log('[main.ts] jeep-sqlite web store initialized');
  } catch (err) {
    console.warn('[main.ts] jeep-sqlite initWebStore error (may already be initialized):', err);
  }
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
      { provide: ErrorHandler, useClass: GlobalErrorHandler },
    ],
  });
});
