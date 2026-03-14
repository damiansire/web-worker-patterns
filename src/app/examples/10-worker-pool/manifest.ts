import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'worker-pool',
  number: '10',
  route: '/examples/10-worker-pool',
  category: 'advanced',
  difficulty: 'advanced',
  loadComponent: () =>
    import('./worker-pool.component').then(m => m.WorkerPoolComponent),
  translations: {
    es: {
      title: 'Worker Pool',
      description:
        'Implementa un pool de workers reutilizables para procesar cientos de tareas con solo 4-8 workers. El patrón profesional para producción.',
      tags: ['Patrón', 'Producción']
    },
    en: {
      title: 'Worker Pool',
      description:
        'Implement a reusable pool of workers to process hundreds of tasks with just 4-8 workers. The production-ready pattern.',
      tags: ['Pattern', 'Production']
    },
    pt: {
      title: 'Worker Pool',
      description:
        'Implemente um pool reutilizável de workers para processar centenas de tarefas com apenas 4-8 workers. O padrão usado em produção.',
      tags: ['Padrão', 'Produção']
    }
  }
};
