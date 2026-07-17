/*
 * coi-serviceworker: habilita cross-origin isolation (crossOriginIsolated === true)
 * en hosts que NO permiten mandar cabeceras de respuesta propias — el caso de
 * GitHub Pages. Sin esto, el ejemplo 12 (SharedArrayBuffer + Atomics) no puede
 * correr en el demo desplegado porque el documento no queda aislado.
 *
 * Cómo funciona: registra un Service Worker que intercepta cada fetch same-origin
 * y le vuelve a agregar `Cross-Origin-Opener-Policy: same-origin` y
 * `Cross-Origin-Embedder-Policy: require-corp` a la respuesta. En la primera
 * visita hace UNA recarga controlada para que el documento ya venga aislado.
 *
 * Técnica de dominio público popularizada por gzuidhof/coi-serviceworker (MIT);
 * reimplementada acá, autocontenida, sin dependencias.
 */

if (typeof window === 'undefined') {
  // ── Contexto Service Worker ──
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'deregister') {
      self.registration
        .unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => clients.forEach((client) => client.navigate(client.url)));
    }
  });

  self.addEventListener('fetch', (event) => {
    const request = event.request;
    // No tocamos navegaciones cache-only ni requests que no sean GET.
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // 0 = respuesta opaca (cross-origin sin CORS): no se puede leer ni
          // re-envolver, la dejamos pasar tal cual.
          if (response.status === 0) {
            return response;
          }

          const headers = new Headers(response.headers);
          headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
          headers.set('Cross-Origin-Opener-Policy', 'same-origin');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        })
        .catch((error) => {
          // Ante un fallo de red, no rompemos la navegación: log y propagar.
          console.error('coi-serviceworker: fetch falló', error);
          throw error;
        }),
    );
  });
} else {
  // ── Contexto ventana ──
  (() => {
    if (window.crossOriginIsolated !== false) {
      // Ya aislado (o el navegador no expone el flag): nada que hacer.
      return;
    }
    if (!window.isSecureContext) {
      // Service Workers requieren contexto seguro (https o localhost).
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register(window.document.currentScript.src, {
        scope: window.document.currentScript.src.substring(
          0,
          window.document.currentScript.src.lastIndexOf('/') + 1,
        ),
      })
      .then((registration) => {
        // Si aparece una versión nueva del SW, recargamos para tomarla.
        registration.addEventListener('updatefound', () => window.location.reload());

        // El SW quedó activo pero todavía no controla esta página: una única
        // recarga la deja bajo su control y, con las cabeceras inyectadas,
        // crossOriginIsolated pasa a true. No hay loop: tras la recarga
        // `navigator.serviceWorker.controller` ya está seteado.
        if (registration.active && !navigator.serviceWorker.controller) {
          window.location.reload();
        }
      })
      .catch((error) => console.error('coi-serviceworker: registro falló', error));
  })();
}
