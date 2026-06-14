import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DevToolCommandPaletteComponent } from '../command-palette/devtool-command-palette.component';

/**
 * Shell dev-tool: barra superior tipo IDE con disparador del command palette
 * (⌘K / Ctrl+K). El palette se monta en un CDK Overlay; su CSS global se carga
 * lazy vía ThemePack.stylesheets y se purga al salir del theme (ARQUITECTURA §7).
 */
@Component({
  selector: 'devtool-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="dt-shell">
      <header class="dt-titlebar">
        <a class="dt-brand" routerLink="/t/dev-tool">
          <span class="dt-prompt">▍</span> web-worker-patterns
        </a>
        <button type="button" class="dt-kbd" (click)="openPalette()">
          <kbd>⌘</kbd><kbd>K</kbd> <span>command palette</span>
        </button>
      </header>
      <main class="dt-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .dt-shell {
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
        padding: 24px 20px;
      }
    `,
  ],
})
export class DevToolShellComponent implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private overlayRef?: OverlayRef;

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.togglePalette();
    } else if (event.key === 'Escape') {
      this.closePalette();
    }
  }

  protected openPalette(): void {
    if (this.overlayRef) return;
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
  }

  ngOnDestroy(): void {
    this.closePalette();
  }
}
