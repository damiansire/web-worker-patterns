import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DevToolCommandPaletteComponent } from '../command-palette/devtool-command-palette.component';
import { ThemeSelectorComponent } from '../../../theming/theme-selector.component';
import { LanguageSwitcherComponent } from '../../../ui-primitives/language-switcher.component';
import { ExampleRunnerService } from '../../../core/services/example-runner.service';

/**
 * Shell dev-tool: barra superior tipo IDE con disparador del command palette
 * (⌘K / Ctrl+K). El palette se monta en un CDK Overlay; su CSS global se carga
 * lazy vía ThemePack.stylesheets y se purga al salir del theme (ARQUITECTURA §7).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'devtool-shell',
  imports: [RouterOutlet, RouterLink, ThemeSelectorComponent, LanguageSwitcherComponent],
  host: { '(document:keydown)': 'onKeydown($event)' },
  template: `
    <div class="dt-shell">
      <header class="dt-titlebar">
        <a class="dt-brand" routerLink="/t/dev-tool">
          <span class="dt-prompt">▍</span> web-worker-patterns
        </a>
        <div class="dt-actions">
          <button type="button" class="dt-kbd" (click)="openPalette()">
            <kbd>⌘</kbd><kbd>K</kbd> <span>command palette</span>
          </button>
          <wwp-language-switcher />
          <theme-selector />
        </div>
      </header>
      <main class="dt-main">
        <router-outlet />
      </main>
      <footer class="dt-statusbar">
        <span
          class="dt-stat dt-status"
          [class.is-on]="phase() === 'worker'"
          [class.is-block]="phase() === 'main'"
        >
          ● {{ statusLabel() }}
        </span>
        <span class="dt-stat">web workers</span>
        <span class="dt-grow"></span>
        <span class="dt-stat">UTF-8</span>
        <span class="dt-stat">TypeScript</span>
        <span class="dt-stat">⌘K</span>
      </footer>
    </div>
  `,
  styles: [
    `
      .dt-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--surface);
        color: var(--ink);
        font-family: var(--font-body);
      }
      .dt-titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: var(--surface-raised);
        border-bottom: var(--border-width) solid var(--border);
      }
      .dt-brand {
        font-family: var(--font-mono);
        font-size: 13px;
        color: var(--ink);
        text-decoration: none;
      }
      .dt-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dt-prompt {
        color: var(--accent);
      }
      .dt-kbd {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--ink-muted);
        background: var(--surface);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        padding: 4px 10px;
        cursor: pointer;
      }
      .dt-kbd kbd {
        background: var(--surface-raised);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 0 4px;
        font-family: var(--font-mono);
      }
      .dt-main {
        flex: 1;
        padding: 24px 20px;
      }
      .dt-statusbar {
        position: sticky;
        bottom: 0;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 5px 16px;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--ink-muted);
        background: var(--surface-raised);
        border-top: var(--border-width) solid var(--border);
      }
      .dt-grow {
        flex: 1;
      }
      .dt-status.is-on {
        color: var(--accent);
      }
      .dt-status.is-block {
        color: var(--thread-blocked);
      }
    `,
  ],
})
export class DevToolShellComponent implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly runner = inject(ExampleRunnerService);
  private overlayRef?: OverlayRef;

  protected readonly phase = this.runner.phase;
  protected readonly statusLabel = computed(() => {
    switch (this.phase()) {
      case 'worker':
        return 'worker activo';
      case 'main':
        return 'main bloqueado';
      default:
        return 'idle';
    }
  });

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.togglePalette();
    } else if (event.key === 'Escape') {
      this.closePalette();
    }
  }

  /** Foco a restaurar al cerrar la paleta (retorno de foco, WCAG 2.4.3). */
  private paletteOpener: HTMLElement | null = null;

  protected openPalette(): void {
    if (this.overlayRef) return;
    this.paletteOpener =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'dt-overlay-backdrop',
      positionStrategy: this.overlay.position().global().centerHorizontally().top('14vh'),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
    const ref = this.overlayRef.attach(new ComponentPortal(DevToolCommandPaletteComponent));
    ref.instance.closed.subscribe(() => this.closePalette());
    this.overlayRef.backdropClick().subscribe(() => this.closePalette());
  }

  private togglePalette(): void {
    if (this.overlayRef) {
      this.closePalette();
    } else {
      this.openPalette();
    }
  }

  private closePalette(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    // Devuelve el foco a quien abrió la paleta (no se pierde en el body).
    this.paletteOpener?.focus?.();
    this.paletteOpener = null;
  }

  ngOnDestroy(): void {
    this.closePalette();
  }
}
