import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "cep-compass", appId: "1:51334273431:web:6bc40cff90e235e7e5ccd2", storageBucket: "cep-compass.firebasestorage.app", apiKey: "AIzaSyAjgllirkW9CZsL3XEnoYWZyj7TGXViX20", authDomain: "cep-compass.firebaseapp.com", messagingSenderId: "51334273431" })), provideAuth(() => getAuth())
  ]
};
