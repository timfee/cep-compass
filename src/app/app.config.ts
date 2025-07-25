import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'timfee-cep-compass',
        appId: '1:313000633718:web:f9c1b47788fa41fcdac657',
        storageBucket: 'timfee-cep-compass.firebasestorage.app',
        apiKey: 'AIzaSyD6KC2xozJ0-psZT_jlwpLLUxpBPgnXiCk',
        authDomain: 'timfee-cep-compass.firebaseapp.com',
        messagingSenderId: '313000633718',
      }),
    ),
    provideAuth(() => getAuth()),
  ],
};
