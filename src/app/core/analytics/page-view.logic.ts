/**
 * Conteo de visitas con GoatCounter (gratis, sin cookies ni datos personales:
 * no hace falta banner de consentimiento). Panel: https://web-worker-patterns.goatcounter.com
 *
 * No se carga su `count.js`: la CSP del sitio solo permite scripts de 'self' y
 * el aislamiento cross-origin (COEP require-corp) bloquearía un script ajeno sin
 * cabecera CORP. Alcanza con un `sendBeacon` al endpoint `/count`, que es lo que
 * hace `count.js` por dentro; la CSP solo abre `connect-src` a este host.
 */
export const GOATCOUNTER_ENDPOINT = 'https://web-worker-patterns.goatcounter.com/count';

/** Único host donde se cuenta: el deploy de GitHub Pages. Local, e2e y self-host no suman. */
export const PRODUCTION_HOST = 'damiansire.github.io';

export interface PageView {
  /** `pathname + search` de la pantalla, sin el hash. */
  path: string;
  title: string;
  /** Solo en la primera pantalla de la sesión; en las navegaciones internas va vacío. */
  referrer: string;
  screenWidth: number;
}

export interface CountEnvironment {
  hostname: string;
  /** `navigator.webdriver`: Playwright, Selenium y otros navegadores automatizados. */
  automated: boolean;
  /** `document.visibilityState === 'prerender'`: la pestaña todavía no la vio nadie. */
  prerender: boolean;
}

/** Si esta visita se cuenta: solo personas reales en el sitio publicado. */
export function shouldCountPageView(env: CountEnvironment): boolean {
  return env.hostname === PRODUCTION_HOST && !env.automated && !env.prerender;
}

/**
 * Clave de sessionStorage donde public/coi-serviceworker.js deja el referrer
 * original (mismo literal allá). En la primera visita ese script recarga la
 * página para aislarla y la recarga trae como referrer al propio sitio: sin esto
 * se perdería de dónde llegó la persona.
 */
export const REFERRER_HANDOFF_KEY = 'wwp:referrer-antes-de-aislar';

/**
 * Referrer de la primera pantalla: el que dejó la carga previa a la recarga, si
 * hay; si no, el del documento. Los del propio sitio no son una fuente de visitas.
 */
export function firstPageReferrer(
  documentReferrer: string,
  handedOff: string | null,
  ownHost: string,
): string {
  const referrer = handedOff ?? documentReferrer;
  try {
    return new URL(referrer).hostname === ownHost ? '' : referrer;
  } catch {
    return '';
  }
}

/**
 * URL del hit, con los mismos parámetros que manda `count.js`:
 * p = path, t = título, r = referrer, s = ancho de pantalla.
 */
export function pageViewHitUrl(view: PageView, endpoint = GOATCOUNTER_ENDPOINT): string {
  const params = new URLSearchParams({ p: view.path, t: view.title, s: String(view.screenWidth) });
  if (view.referrer) {
    params.set('r', view.referrer);
  }
  return `${endpoint}?${params.toString()}`;
}
