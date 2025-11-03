// app.config.ts (SOLUCIÓN PARA VERSIONES ANTERIORES A Angular 16)

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core'; // 👈 Añadir importProvidersFrom
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms'; // 👈 Importar ReactiveFormsModule directamente

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    
    // 💡 Usa importProvidersFrom y pasa el ReactiveFormsModule como argumento
    importProvidersFrom(ReactiveFormsModule)
  ]
};

