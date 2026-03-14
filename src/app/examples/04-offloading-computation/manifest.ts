import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'offloading-computation',
  number: '04',
  route: '/examples/04-offloading-computation',
  category: 'fundamentals',
  difficulty: 'beginner',
  loadComponent: () =>
    import('./offloading-computation.component').then(m => m.OffloadingComputationComponent),
  translations: {
    es: {
      title: 'Descarga de Cómputo',
      description:
        'Descubre cómo evitar que la UI se congele ejecutando cálculos pesados (como números primos) en un worker separado del hilo principal.',
      tags: ['Performance', 'Cálculos']
    },
    en: {
      title: 'Offloading Computation',
      description:
        'See how to avoid UI freezes by running heavy calculations (like prime numbers) in a worker instead of the main thread.',
      tags: ['Performance', 'Computation']
    },
    pt: {
      title: 'Descarga de Cálculo',
      description:
        'Descubra como evitar que a interface congele executando cálculos pesados (como números primos) em um worker separado da thread principal.',
      tags: ['Performance', 'Cálculo']
    }
  }
};
