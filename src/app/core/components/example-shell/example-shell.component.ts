import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ExampleLayout = 'focus' | 'split' | 'comparison' | 'timeline';

/**
 * Standard container for every example page. Accepts a layout mode and
 * projects content into named slots via CSS attribute selectors, so each
 * example only needs to declare its layout intent — not its CSS grid.
 *
 * Layouts:
 *   focus      — single column, header → code → controls (introductory examples)
 *   split      — two columns: code on the left, visualization + controls on the right
 *   comparison — two columns of equal width for side-by-side "bad vs good" demos
 *   timeline   — horizontal sequence of states (lifecycle examples)
 */
@Component({
  selector: 'app-example-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './example-shell.component.html',
  styleUrl: './example-shell.component.scss'
})
export class ExampleShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() layout: ExampleLayout = 'split';
}
