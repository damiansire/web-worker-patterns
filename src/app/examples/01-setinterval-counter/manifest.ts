import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'set-interval-counter',
  number: '01',
  route: '/examples/01-setinterval-counter',
  category: 'understanding',
  difficulty: 'beginner',
  loadComponent: () =>
    import('./setinterval-counter.component').then(m => m.SetIntervalCounterComponent),
  translations: {
    es: {
      title: 'Contador con setInterval',
      description:
        'Aprende los fundamentos de JavaScript: cómo usar setInterval para ejecutar código periódicamente. Esencial antes de entender Web Workers.',
      tags: ['Fundamentos', 'JavaScript']
    },
    en: {
      title: 'Counter with setInterval',
      description:
        'Learn JavaScript fundamentals: how to use setInterval to execute code periodically. Essential before understanding Web Workers.',
      tags: ['Fundamentals', 'JavaScript']
    },
    pt: {
      title: 'Contador com setInterval',
      description:
        'Aprenda os fundamentos de JavaScript: como usar setInterval para executar código periodicamente. Essencial antes de entender Web Workers.',
      tags: ['Fundamentos', 'JavaScript']
    }
  }
};
