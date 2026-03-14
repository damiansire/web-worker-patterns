import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../core/services/language.service';
import { NavigationService } from '../core/services/navigation.service';
import { ProgressService } from '../core/services/progress.service';

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
  protected readonly progress = inject(ProgressService);

  readonly categories = this.navigation.categories;
  readonly learnTitle = computed(() => this.language.t<string>('home.learnTitle'));
  readonly learnItems = computed(() => this.language.t<string[]>('home.learnItems', []));
  readonly orderTitle = computed(() => this.language.t<string>('home.orderTitle'));
  readonly orderItems = computed(() => this.language.t<string[]>('home.orderItems', []));
}

