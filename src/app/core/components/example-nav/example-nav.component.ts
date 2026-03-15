import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-example-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './example-nav.component.html',
  styleUrl: './example-nav.component.scss'
})
export class ExampleNavComponent {
  readonly currentNumber = input.required<string>();

  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);
  protected readonly language = inject(LanguageService);

  readonly prevExample = computed(() => {
    const examples = this.navigation.examples();
    const idx = examples.findIndex(e => e.number === this.currentNumber());
    return idx > 0 ? examples[idx - 1] : null;
  });

  readonly nextExample = computed(() => {
    const examples = this.navigation.examples();
    const idx = examples.findIndex(e => e.number === this.currentNumber());
    return idx >= 0 && idx < examples.length - 1 ? examples[idx + 1] : null;
  });

  navigatePrev(event: Event): void {
    const prev = this.prevExample();
    if (!prev) return;
    event.preventDefault();
    this.router.navigateByUrl(prev.route).then(() => this.scrollToTop());
  }

  navigateNext(event: Event): void {
    const next = this.nextExample();
    if (!next) return;
    event.preventDefault();
    this.router.navigateByUrl(next.route).then(() => this.scrollToTop());
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
}
