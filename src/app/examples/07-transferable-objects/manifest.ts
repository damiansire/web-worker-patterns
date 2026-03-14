import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'transferable-objects',
  number: '07',
  route: '/examples/07-transferable-objects',
  category: 'optimization',
  difficulty: 'intermediate',
  loadComponent: () =>
    import('./transferable-objects.component').then(m => m.TransferableObjectsComponent),
  translations: {
    es: {
      title: 'Objetos Transferibles',
      description:
        'Optimiza el rendimiento transfiriendo la propiedad de objetos grandes como ArrayBuffer en lugar de clonarlos. Perfecto para imágenes y datos binarios.',
      tags: ['Optimización', 'ArrayBuffer']
    },
    en: {
      title: 'Transferable Objects',
      description:
        'Optimize performance by transferring ownership of large objects like ArrayBuffer instead of cloning them. Perfect for images and binary data.',
      tags: ['Optimization', 'ArrayBuffer']
    },
    pt: {
      title: 'Objetos Transferíveis',
      description:
        'Otimize o desempenho transferindo a propriedade de objetos grandes como ArrayBuffer em vez de cloná-los. Perfeito para imagens e dados binários.',
      tags: ['Otimização', 'ArrayBuffer']
    }
  }
};
