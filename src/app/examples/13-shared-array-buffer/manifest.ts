import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'shared-array-buffer',
  number: '13',
  route: '/examples/13-shared-array-buffer',
  category: 'advanced',
  difficulty: 'advanced',
  loadComponent: () =>
    import('./shared-array-buffer.component').then(m => m.SharedArrayBufferComponent),
  translations: {
    es: {
      title: 'SharedArrayBuffer + Atomics',
      description:
        'Memoria compartida real entre threads. Múltiples workers leen y escriben el mismo buffer simultáneamente, coordinados con operaciones atómicas.',
      tags: ['Memoria Compartida', 'Atomics']
    },
    en: {
      title: 'SharedArrayBuffer + Atomics',
      description:
        'Real shared memory between threads. Multiple workers read and write the same buffer simultaneously, coordinated with atomic operations.',
      tags: ['Shared Memory', 'Atomics']
    },
    pt: {
      title: 'SharedArrayBuffer + Atomics',
      description:
        'Memória compartilhada real entre threads. Múltiplos workers leem e escrevem no mesmo buffer simultaneamente, coordenados com operações atômicas.',
      tags: ['Memória Compartilhada', 'Atomics']
    }
  }
};
