import { computed, inject, Injectable, signal } from '@angular/core';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';

const THEME_STORAGE_KEY = 'wwp-theme';

function readStoredTheme(): ThemeId | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
}

/**
 * ThemeService (ARQUITECTURA §4.2).
 *
 * Responsable de: cuál es el theme activo (signal), e inyectar/purgar el CSS
 * global de la librería UI de cada theme sin que se pisen. El `data-theme` en
 * `<html>` activa el bloque de tokens correspondiente (§6).
 *
 * El estado de dominio NO vive acá: cambiar de theme no toca el
 * ThreadMonitorService ni el ExampleRunnerService, así un worker corriendo sigue
 * corriendo al hacer el switch.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly registry = inject(THEME_REGISTRY);

  // El theme persistido (localStorage) tiene prioridad como valor inicial; la URL
  // lo sobreescribe vía el guard al navegar. Default skeleton (siempre presente).
  readonly activeId = signal<ThemeId>(readStoredTheme() ?? 'skeleton');
  readonly active = computed<ThemePack>(
    () => this.registry.get(this.activeId()) ?? this.registry.values().next().value!,
  );

  /** `<link>` inyectados por theme, para poder purgarlos al salir. */
  private readonly loadedLinks = new Map<ThemeId, HTMLLinkElement[]>();

  setTheme(id: ThemeId): void {
    if (!this.registry.has(id)) {
      return;
    }
    this.injectStylesheets(id);
    this.activeId.set(id);
    this.purgeOtherStylesheets(id);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['theme'] = id;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    }
  }

  private injectStylesheets(id: ThemeId): void {
    if (typeof document === 'undefined' || this.loadedLinks.has(id)) {
      return;
    }
    const hrefs = this.registry.get(id)?.stylesheets ?? [];
    const links = hrefs.map((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset['themeCss'] = id;
      document.head.appendChild(link);
      return link;
    });
    if (links.length) {
      this.loadedLinks.set(id, links);
    }
  }

  private purgeOtherStylesheets(keep: ThemeId): void {
    for (const [id, links] of this.loadedLinks) {
      if (id === keep) {
        continue;
      }
      links.forEach((link) => link.remove());
      this.loadedLinks.delete(id);
    }
  }
}
