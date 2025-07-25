import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  provideFunctions,
} from '@angular/fire/functions';
import { routes } from './app.routes';

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
    provideAuth(() => {
      const auth = getAuth();
      if (isDevMode()) {
        connectAuthEmulator(auth, 'http://localhost:9099', {
          disableWarnings: true,
        });
      }
      return auth;
    }),
    provideFunctions(() => {
      const functions = getFunctions();
      if (isDevMode()) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
  ],
};
