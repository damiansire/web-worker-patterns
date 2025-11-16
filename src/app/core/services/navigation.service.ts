import { Injectable, computed, inject } from '@angular/core';
import { LanguageService } from './language.service';

interface ExampleConfig {
  number: string;
  route: string;
  translationKey: string;
}

export interface ExampleView {
  number: string;
  title: string;
  description: string;
  tags: string[];
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly language = inject(LanguageService);

  private readonly config: ExampleConfig[] = [
    { number: '01', route: '/examples/01-setinterval-counter', translationKey: 'setIntervalCounter' },
    { number: '02', route: '/examples/02-main-thread', translationKey: 'mainThread' },
    { number: '03', route: '/examples/03-basic-communication', translationKey: 'basicCommunication' },
    { number: '04', route: '/examples/04-offloading-computation', translationKey: 'offloadingComputation' },
    { number: '05', route: '/examples/05-transferable-objects', translationKey: 'transferableObjects' },
    { number: '06', route: '/examples/06-error-handling', translationKey: 'errorHandling' },
    { number: '07', route: '/examples/07-shared-worker', translationKey: 'sharedWorker' },
    { number: '08', route: '/examples/08-lifecycle-termination', translationKey: 'lifecycleTermination' },
    { number: '09', route: '/examples/09-worker-limits', translationKey: 'workerLimits' },
    { number: '10', route: '/examples/10-worker-pool', translationKey: 'workerPool' }
  ];

  readonly examples = computed<ExampleView[]>(() =>
    this.config.map(example => {
      const basePath = `examplesMeta.${example.translationKey}`;
      return {
        number: example.number,
        route: example.route,
        title: this.language.t(`${basePath}.title`),
        description: this.language.t(`${basePath}.description`),
        tags: this.language.t(`${basePath}.tags`)
      };
    })
  );

  getExamples(): ExampleView[] {
    return this.examples();
  }
}

