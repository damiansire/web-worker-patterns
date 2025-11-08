import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { NavigationService } from '../../services/navigation.service';

interface Example {
  number: string;
  title: string;
  description: string;
  tags: string[];
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true
})
export class SidebarComponent {
  protected readonly language = inject(LanguageService);
  protected readonly navigation = inject(NavigationService);

  readonly examples = this.navigation.examples;
}

