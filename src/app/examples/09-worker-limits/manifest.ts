import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'worker-limits',
  number: '09',
  route: '/examples/09-worker-limits',
  category: 'advanced',
  difficulty: 'advanced',
  loadComponent: () =>
    import('./worker-limits.component').then(m => m.WorkerLimitsComponent),
  translations: {
    es: {
      title: 'Límites de Workers',
      description:
        'Descubre cuántos workers puede manejar tu navegador y qué sucede cuando alcanzas esos límites. Incluye test de estrés y mejores prácticas.',
      tags: ['Límites', 'Escalabilidad']
    },
    en: {
      title: 'Worker Limits',
      description:
        'Discover how many workers your browser can handle and what happens when you reach those limits. Includes stress tests and best practices.',
      tags: ['Limits', 'Scalability']
    },
    pt: {
      title: 'Limites de Workers',
      description:
        'Descubra quantos workers seu navegador pode suportar e o que acontece quando esses limites são alcançados. Inclui testes de estresse e boas práticas.',
      tags: ['Limites', 'Escalabilidade']
    }
  }
};
