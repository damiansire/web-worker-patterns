import {
  DOCUMENT,
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  firstPageReferrer,
  pageViewHitUrl,
  REFERRER_HANDOFF_KEY,
  shouldCountPageView,
} from './page-view.logic';

/**
 * Cuenta una visita por cada pantalla a la que se llega (la app es una SPA: sin
 * esto solo se contaría la carga inicial). Fuera del sitio publicado no hace nada.
 */
export function providePageViewAnalytics(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const document = inject(DOCUMENT);
      const window = document.defaultView;
      if (
        !window?.navigator.sendBeacon ||
        !shouldCountPageView({
          hostname: window.location.hostname,
          automated: window.navigator.webdriver,
          prerender: (document.visibilityState as string) === 'prerender',
        })
      ) {
        return;
      }

      // Primera visita: todavía sin aislar, el coi-serviceworker va a recargar la
      // página apenas tome el control (public/coi-serviceworker.js; puede ser más
      // de una recarga). Se cuenta la carga ya aislada; el referrer original lo
      // guarda ese script antes de recargar (REFERRER_HANDOFF_KEY).
      const isolationReloadPending =
        !window.crossOriginIsolated &&
        window.isSecureContext &&
        'serviceWorker' in window.navigator &&
        !window.navigator.serviceWorker.controller;
      if (isolationReloadPending) {
        return;
      }

      let handedOff: string | null = null;
      try {
        handedOff = window.sessionStorage.getItem(REFERRER_HANDOFF_KEY);
        window.sessionStorage.removeItem(REFERRER_HANDOFF_KEY);
      } catch {
        // Sin almacenamiento: se usa el referrer del documento.
      }
      let referrer = firstPageReferrer(document.referrer, handedOff, window.location.hostname);

      inject(Router)
        .events.pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe(() => {
          const url = pageViewHitUrl({
            path: window.location.pathname + window.location.search,
            title: document.title,
            referrer,
            screenWidth: window.screen.width,
          });
          referrer = '';
          try {
            window.navigator.sendBeacon(url);
          } catch {
            // Contar es un extra: si el navegador lo bloquea, la app sigue igual.
          }
        });
    }),
  ]);
}
