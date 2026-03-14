import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'error-handling',
  number: '05',
  route: '/examples/05-error-handling',
  category: 'management',
  difficulty: 'intermediate',
  loadComponent: () =>
    import('./error-handling.component').then(m => m.ErrorHandlingComponent),
  translations: {
    es: {
      title: 'Manejo de Errores',
      description:
        'Aprende a capturar y manejar errores que ocurren dentro de un worker usando el evento onerror. Incluye ejemplos de diferentes tipos de errores.',
      tags: ['Debugging', 'Errores']
    },
    en: {
      title: 'Error Handling',
      description:
        'Learn how to catch and handle errors that happen inside a worker by using the onerror event. Includes examples of different error types.',
      tags: ['Debugging', 'Errors']
    },
    pt: {
      title: 'Tratamento de Erros',
      description:
        'Aprenda a capturar e tratar erros que ocorrem dentro de um worker usando o evento onerror. Inclui exemplos de diferentes tipos de erro.',
      tags: ['Depuração', 'Erros']
    }
  }
};
