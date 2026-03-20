import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { NavigationService, CategoryView } from '../../services/navigation.service';
import { LanguageSelectorComponent } from '../../components/language-selector/language-selector.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LanguageSelectorComponent, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  standalone: true
})
export class SidebarComponent {
  protected readonly language = inject(LanguageService);
  protected readonly navigation = inject(NavigationService);

  readonly searchQuery = signal('');

  readonly expandedCategories = signal<Set<string>>(
    new Set(this.navigation.categories().map(c => c.id))
  );

  readonly filteredCategories = computed<CategoryView[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const categories = this.navigation.categories();

    if (!query) {
      return categories;
    }

    return categories
      .map(category => ({
        ...category,
        examples: category.examples.filter(
          example =>
            example.title.toLowerCase().includes(query) ||
            example.tags.some(tag => tag.toLowerCase().includes(query)) ||
            example.number.includes(query)
        )
      }))
      .filter(category => category.examples.length > 0);
  });

  isCategoryExpanded(categoryId: string): boolean {
    if (this.searchQuery().trim()) {
      return true;
    }
    return this.expandedCategories().has(categoryId);
  }

  toggleCategory(categoryId: string): void {
    this.expandedCategories.update(set => {
      const next = new Set(set);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }
}
