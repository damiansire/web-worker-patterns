import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { NavigationService } from '../../services/navigation.service';
import { LanguageSelectorComponent } from '../../components/language-selector/language-selector.component';

interface Example {
  number: string;
  title: string;
  description: string;
  tags: string[];
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, LanguageSelectorComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true
})
export class SidebarComponent {
  protected readonly language = inject(LanguageService);
  protected readonly navigation = inject(NavigationService);

  readonly examples = this.navigation.examples;
}

