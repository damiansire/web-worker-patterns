import { ExampleManifest } from '../../core/models/example-manifest.model';

export const MANIFEST: ExampleManifest = {
  id: 'basic-communication',
  number: '03',
  route: '/examples/03-basic-communication',
  category: 'fundamentals',
  difficulty: 'beginner',
  loadComponent: () =>
    import('./basic-communication.component').then(m => m.BasicCommunicationComponent),
  translations: {
    es: {
      title: 'Comunicación Básica',
      description:
        'El "Hola Mundo" de los Web Workers. Aprende cómo el hilo principal y el worker se comunican mediante mensajes usando postMessage y onmessage.',
      tags: ['Básico', 'Fundamentos']
    },
    en: {
      title: 'Basic Communication',
      description:
        'The "Hello World" of Web Workers. Learn how the main thread and the worker communicate using postMessage and onmessage.',
      tags: ['Basics', 'Foundations']
    },
    pt: {
      title: 'Comunicação Básica',
      description:
        'O "Olá Mundo" dos Web Workers. Aprenda como a thread principal e o worker se comunicam usando postMessage e onmessage.',
      tags: ['Básico', 'Fundamentos']
    }
  }
};
