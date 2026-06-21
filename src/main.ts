import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Log de último recurso si el bootstrap falla: sin Angular arriba no hay otro canal.
// eslint-disable-next-line no-console
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
