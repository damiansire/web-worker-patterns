import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { EXAMPLES } from '../../../core/domain/examples/examples.registry';

/**
 * Command palette (⌘K) del theme dev-tool. Se monta en un CDK Overlay desde el
 * shell. Filtra los ejemplos del registry y navega al seleccionado. Es la
 * prueba de integración real de una librería UI (CDK) en la arquitectura.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'devtool-command-palette',
  imports: [A11yModule],
  template: `
    <div
      class="dt-palette"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos: buscar ejemplo"
      cdkTrapFocus
      [cdkTrapFocusAutoCapture]="true"
      (keydown)="onKeydown($event)"
    >
      <input
        #search
        class="dt-palette-input"
        type="text"
        placeholder="Buscar ejemplo… (Esc para cerrar)"
        aria-label="Buscar ejemplo"
        [value]="query()"
        (input)="query.set(search.value)"
      />
      <ul class="dt-palette-list" role="listbox" aria-label="Ejemplos">
        @for (ex of filtered(); track ex.id; let i = $index) {
          <!--
            Patrón listbox ARIA: el teclado se maneja a nivel del diálogo
            (onKeydown: ArrowUp/Down/Enter/Escape), NO por opción. Las opciones
            de un listbox no son tabbables — el foco vive en el input. El click es
            solo una ayuda con mouse, así que desactivamos las reglas de teclado acá.
          -->
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
          <li
            role="option"
            [attr.aria-selected]="i === active()"
            [class.is-active]="i === active()"
            (mouseenter)="active.set(i)"
            (click)="go(ex.id)"
          >
            <span class="dt-palette-num">{{ ex.order }}</span>
            <span class="dt-palette-id">{{ ex.id }}</span>
            <span class="dt-palette-cat">{{ ex.category }}</span>
          </li>
        } @empty {
          <li class="dt-palette-empty">sin resultados</li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      .dt-palette {
        width: min(560px, 90vw);
        background: var(--surface-raised);
        border: var(--border-width) solid var(--border);
        border-radius: var(--radius);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        font-family: var(--font-mono);
        pointer-events: auto;
      }
      .dt-palette-input {
        width: 100%;
        box-sizing: border-box;
        padding: 14px 16px;
        background: var(--surface);
        color: var(--ink);
        border: none;
        border-bottom: var(--border-width) solid var(--border);
        font-family: var(--font-mono);
        font-size: 14px;
        outline: none;
      }
      .dt-palette-list {
        list-style: none;
        margin: 0;
        padding: 6px;
        max-height: 320px;
        overflow-y: auto;
      }
      .dt-palette-list li {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: var(--radius);
        cursor: pointer;
        color: var(--ink);
      }
      .dt-palette-list li.is-active {
        background: var(--accent);
        color: var(--surface);
      }
      .dt-palette-num {
        color: var(--ink-muted);
        font-size: 12px;
      }
      .is-active .dt-palette-num {
        color: var(--surface);
      }
      .dt-palette-cat {
        font-size: 11px;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .dt-palette-empty {
        padding: 12px;
        color: var(--ink-muted);
        cursor: default;
      }
    `,
  ],
})
export class DevToolCommandPaletteComponent {
  private readonly router = inject(Router);

  readonly closed = output<void>();

  protected readonly query = signal('');
  protected readonly active = signal(0);

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = q ? EXAMPLES.filter((e) => e.id.includes(q) || e.category.includes(q)) : EXAMPLES;
    return list;
  });

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.update((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const ex = items[this.active()];
      if (ex) this.go(ex.id);
    } else if (event.key === 'Escape') {
      this.closed.emit();
    }
  }

  protected go(id: string): void {
    this.router.navigate(['/t', 'dev-tool', 'example', id]);
    this.closed.emit();
  }
}
