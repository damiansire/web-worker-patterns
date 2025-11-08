import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../core/services/navigation.service';
import { LanguageService } from '../core/services/language.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent {
  protected readonly navigation = inject(NavigationService);
  protected readonly language = inject(LanguageService);

  readonly examples = this.navigation.examples;
  readonly learnItems = computed(() => this.language.t<string[]>('home.learnItems', []));
  readonly orderItems = computed(() => this.language.t<string[]>('home.orderItems', []));
}

