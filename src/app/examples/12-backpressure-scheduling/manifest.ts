import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'backpressure-scheduling',
  number: '12',
  route: '/examples/12-backpressure-scheduling',
  category: 'advanced',
  difficulty: 'advanced',
  loadComponent: () =>
    import('./backpressure-scheduling.component').then(m => m.BackpressureSchedulingComponent),
  translations: {
    es: {
      title: 'Backpressure Scheduling',
      description:
        'Aprende el patrón de scheduling con backpressure: cuando los workers se saturan, las tareas se ejecutan síncronamente como fallback automático.',
      tags: ['Backpressure', 'Producción']
    },
    en: {
      title: 'Backpressure Scheduling',
      description:
        'Learn the backpressure scheduling pattern: when workers are saturated, tasks automatically fall back to synchronous execution.',
      tags: ['Backpressure', 'Production']
    },
    pt: {
      title: 'Backpressure Scheduling',
      description:
        'Aprenda o padrão de agendamento com backpressure: quando os workers estão saturados, as tarefas são executadas sincronamente como fallback.',
      tags: ['Backpressure', 'Produção']
    }
  }
};
