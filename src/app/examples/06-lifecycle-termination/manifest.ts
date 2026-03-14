import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'lifecycle-termination',
  number: '06',
  route: '/examples/06-lifecycle-termination',
  category: 'management',
  difficulty: 'intermediate',
  loadComponent: () =>
    import('./lifecycle-termination.component').then(m => m.LifecycleTerminationComponent),
  translations: {
    es: {
      title: 'Ciclo de Vida',
      description:
        'Gestiona correctamente el ciclo de vida de los workers: creación, uso y terminación. Aprende a liberar recursos y memoria de forma apropiada.',
      tags: ['Gestión', 'Recursos']
    },
    en: {
      title: 'Lifecycle Management',
      description:
        'Properly manage the worker lifecycle: create, use, and terminate workers. Learn how to free resources and memory at the right time.',
      tags: ['Management', 'Resources']
    },
    pt: {
      title: 'Ciclo de Vida',
      description:
        'Gerencie corretamente o ciclo de vida dos workers: criação, uso e término. Aprenda a liberar recursos e memória de forma adequada.',
      tags: ['Gestão', 'Recursos']
    }
  }
};
