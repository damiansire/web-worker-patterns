import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'main-thread',
  number: '02',
  route: '/examples/02-main-thread',
  category: 'understanding',
  difficulty: 'beginner',
  loadComponent: () =>
    import('./main-thread.component').then(m => m.MainThreadComponent),
  translations: {
    es: {
      title: 'Bloqueo del Main Thread',
      description:
        'Comprende el problema que los Web Workers resuelven. Observa cómo el cálculo de números primos bloquea completamente el hilo principal y congela la UI.',
      tags: ['Problema', 'Fundamentos']
    },
    en: {
      title: 'Main Thread Blocking',
      description:
        'Understand the problem that Web Workers solve. See how calculating prime numbers completely blocks the main thread and freezes the UI.',
      tags: ['Problem', 'Fundamentals']
    },
    pt: {
      title: 'Bloqueio da Thread Principal',
      description:
        'Entenda o problema que os Web Workers resolvem. Veja como o cálculo de números primos bloqueia completamente a thread principal e congela a interface.',
      tags: ['Problema', 'Fundamentos']
    }
  }
};
