import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationService } from '../core/services/navigation.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent {
  protected readonly navigation = inject(NavigationService);

  readonly categories = this.navigation.categories;
}

