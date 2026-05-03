import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'graceful-degradation',
  number: '14',
  route: '/examples/14-graceful-degradation',
  category: 'advanced',
  difficulty: 'advanced',
  loadComponent: () =>
    import('./graceful-degradation.component').then(m => m.GracefulDegradationComponent),
  translations: {
    es: {
      title: 'Degradación Elegante',
      description:
        'Detecta capacidades del navegador y degrada de threading a single-thread automáticamente. Incluye Blob URL Workers para crear workers dinámicamente sin archivos separados.',
      tags: ['Feature Detection', 'Blob Workers']
    },
    en: {
      title: 'Graceful Degradation',
      description:
        'Detect browser capabilities and automatically degrade from threading to single-thread. Includes Blob URL Workers for creating workers dynamically without separate files.',
      tags: ['Feature Detection', 'Blob Workers']
    },
    pt: {
      title: 'Degradação Elegante',
      description:
        'Detecte capacidades do navegador e degrade de threading para single-thread automaticamente. Inclui Blob URL Workers para criar workers dinamicamente sem arquivos separados.',
      tags: ['Feature Detection', 'Blob Workers']
    }
  }
};
