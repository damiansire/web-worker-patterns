import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'shared-worker',
  number: '07',
  route: '/examples/07-shared-worker',
  category: 'advanced',
  difficulty: 'advanced',
  loadComponent: () =>
    import('./shared-worker.component').then(m => m.SharedWorkerComponent),
  translations: {
    es: {
      title: 'Shared Worker',
      description:
        'Explora cómo un Shared Worker puede ser compartido entre múltiples pestañas del navegador. Ideal para sincronizar estado o gestionar conexiones WebSocket.',
      tags: ['Avanzado', 'Multi-tab']
    },
    en: {
      title: 'Shared Worker',
      description:
        'Explore how a Shared Worker can be shared across multiple browser contexts. Ideal for syncing state or managing shared WebSocket connections.',
      tags: ['Advanced', 'Multi-tab']
    },
    pt: {
      title: 'Shared Worker',
      description:
        'Explore como um Shared Worker pode ser compartilhado por várias abas, iframes ou janelas. Ideal para coordenar estado ou manter uma única conexão com serviços externos.',
      tags: ['Avançado', 'Multi-abas']
    }
  }
};
