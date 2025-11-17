import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../services/language.service';
import { NavigationService } from '../../services/navigation.service';
import { LanguageSelectorComponent } from '../../components/language-selector/language-selector.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LanguageSelectorComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true
})
export class SidebarComponent {
  protected readonly language = inject(LanguageService);
  protected readonly navigation = inject(NavigationService);

  readonly categories = this.navigation.categories;
}

