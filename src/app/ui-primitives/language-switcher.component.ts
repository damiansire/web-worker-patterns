import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { LanguageCode, LanguageService } from '../core/services/language.service';

/**
 * Selector de idioma neutral y compartido (ES · EN · PT). Es un primitivo por
 * tokens, igual criterio que el chart: su estructura (tres botones) es la misma
 * en todos los themes y solo cambia el estilo, así que vive fuera de `themes/` y
 * se pinta con tokens semánticos. Lee/escribe el idioma vía LanguageService (la
 * fuente de verdad: geo + persistencia), que es neutral.
 *
 * Cubre el hueco de que la app elige idioma por geolocalización pero no daba al
 * usuario forma manual de cambiarlo.
 */
@Component({
  selector: 'wwp-language-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpperCasePipe],
  template: `
    <div class="ls" role="group" aria-label="Cambiar idioma / change language">
      @for (l of languages; track l.code) {
        <button
          type="button"
          class="ls-btn"
          [class.ls-on]="current() === l.code"
          [attr.aria-pressed]="current() === l.code"
          [attr.lang]="l.code"
          [attr.title]="l.nativeLabel"
          (click)="pick(l.code)"
        >
          {{ l.code | uppercase }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      .ls {
        display: inline-flex;
        gap: 2px;
        align-items: center;
        font-family: var(--font-mono, ui-monospace, monospace);
      }
      .ls-btn {
        appearance: none;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        padding: 5px 8px;
        color: var(--ink-muted, #666);
        background: transparent;
        border: var(--border-width, 1px) solid transparent;
        border-radius: var(--radius, 4px);
        transition:
          color 0.15s ease,
          background 0.15s ease,
          border-color 0.15s ease;
      }
      .ls-btn:hover {
        color: var(--ink, #111);
      }
      .ls-btn.ls-on {
        color: var(--surface, #fff);
        background: var(--accent, #e63924);
        border-color: var(--accent, #e63924);
      }
      .ls-btn:focus-visible {
        outline: 2px solid var(--accent, #e63924);
        outline-offset: 2px;
      }
    `,
  ],
})
export class LanguageSwitcherComponent {
  private readonly lang = inject(LanguageService);
  protected readonly languages = this.lang.languages;
  protected readonly current = this.lang.currentLanguage;

  pick(code: LanguageCode): void {
    this.lang.setLanguage(code);
  }
}
