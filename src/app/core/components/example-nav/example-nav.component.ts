import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
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
}
