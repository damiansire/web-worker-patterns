import { Injectable, computed, inject } from '@angular/core';
import { LanguageService } from './language.service';
import { EXAMPLES_REGISTRY } from '../../examples/examples.registry';

export interface ExampleView {
  number: string;
  title: string;
  description: string;
  tags: string[];
  route: string;
  category: string;
  difficulty: string;
}

export interface CategoryView {
  id: string;
  title: string;
  examples: ExampleView[];
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly language = inject(LanguageService);

  private readonly categoryOrder = [
    'understanding',
    'fundamentals',
    'optimization',
    'management',
    'advanced'
  ];

  readonly examples = computed<ExampleView[]>(() => {
    const lang = this.language.currentLanguage();
    return EXAMPLES_REGISTRY.map(manifest => {
      const meta = manifest.translations[lang] ?? manifest.translations['es'];
      return {
        number: manifest.number,
        route: manifest.route,
        title: meta.title,
        description: meta.description,
        tags: meta.tags,
        category: manifest.category,
        difficulty: manifest.difficulty
      };
    });
  });

  readonly categories = computed<CategoryView[]>(() => {
    const examples = this.examples();
    const categoryMap = new Map<string, ExampleView[]>();

    examples.forEach(example => {
      if (!categoryMap.has(example.category)) {
        categoryMap.set(example.category, []);
      }
      categoryMap.get(example.category)!.push(example);
    });

    categoryMap.forEach(list => {
      list.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    });

    return this.categoryOrder
      .filter(id => categoryMap.has(id))
      .map(id => ({
        id,
        title: this.language.t(`categories.${id}`),
        examples: categoryMap.get(id)!
      }));
  });

  getExamples(): ExampleView[] {
    return this.examples();
  }

  getCategories(): CategoryView[] {
    return this.categories();
  }
}
