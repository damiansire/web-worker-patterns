import { Injectable, computed, inject } from '@angular/core';
import { LanguageService } from './language.service';

interface ExampleConfig {
  number: string;
  route: string;
  translationKey: string;
  category: string;
}

export interface ExampleView {
  number: string;
  title: string;
  description: string;
  tags: string[];
  route: string;
  category: string;
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

  private readonly config: ExampleConfig[] = [
    { number: '01', route: '/examples/01-setinterval-counter', translationKey: 'setIntervalCounter', category: 'understanding' },
    { number: '02', route: '/examples/02-main-thread', translationKey: 'mainThread', category: 'understanding' },
    { number: '04', route: '/examples/04-offloading-computation', translationKey: 'offloadingComputation', category: 'understanding' },
    { number: '03', route: '/examples/03-basic-communication', translationKey: 'basicCommunication', category: 'fundamentals' },
    { number: '05', route: '/examples/05-transferable-objects', translationKey: 'transferableObjects', category: 'optimization' },
    { number: '06', route: '/examples/06-error-handling', translationKey: 'errorHandling', category: 'management' },
    { number: '08', route: '/examples/08-lifecycle-termination', translationKey: 'lifecycleTermination', category: 'management' },
    { number: '07', route: '/examples/07-shared-worker', translationKey: 'sharedWorker', category: 'advanced' },
    { number: '09', route: '/examples/09-worker-limits', translationKey: 'workerLimits', category: 'advanced' },
    { number: '10', route: '/examples/10-worker-pool', translationKey: 'workerPool', category: 'advanced' }
  ];

  private readonly categoryOrder = ['understanding', 'fundamentals', 'optimization', 'management', 'advanced'];

  readonly examples = computed<ExampleView[]>(() =>
    this.config.map(example => {
      const basePath = `examplesMeta.${example.translationKey}`;
      return {
        number: example.number,
        route: example.route,
        title: this.language.t(`${basePath}.title`),
        description: this.language.t(`${basePath}.description`),
        tags: this.language.t(`${basePath}.tags`),
        category: example.category
      };
    })
  );

  readonly categories = computed<CategoryView[]>(() => {
    const examples = this.examples();
    const categoryMap = new Map<string, ExampleView[]>();

    // Agrupar ejemplos por categoría
    examples.forEach(example => {
      if (!categoryMap.has(example.category)) {
        categoryMap.set(example.category, []);
      }
      categoryMap.get(example.category)!.push(example);
    });

    // Ordenar ejemplos dentro de cada categoría por número
    categoryMap.forEach((examples, category) => {
      examples.sort((a, b) => parseInt(a.number) - parseInt(b.number));
    });

    // Crear array de categorías ordenadas
    return this.categoryOrder
      .filter(categoryId => categoryMap.has(categoryId))
      .map(categoryId => ({
        id: categoryId,
        title: this.language.t(`categories.${categoryId}`),
        examples: categoryMap.get(categoryId)!
      }));
  });

  getExamples(): ExampleView[] {
    return this.examples();
  }

  getCategories(): CategoryView[] {
    return this.categories();
  }
}

