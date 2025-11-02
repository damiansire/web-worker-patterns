import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  getExamples() {
    return [
      {
        number: '01',
        title: 'Comunicación Básica',
        description: 'El "Hola Mundo" de los Web Workers. Aprende cómo el hilo principal y el worker se comunican mediante mensajes usando postMessage y onmessage.',
        tags: ['Básico', 'Fundamentos'],
        route: '/examples/01-basic-communication'
      },
      {
        number: '02',
        title: 'Descarga de Cómputo',
        description: 'Descubre cómo evitar que la UI se congele ejecutando cálculos pesados (como números primos) en un worker separado del hilo principal.',
        tags: ['Performance', 'Cálculos'],
        route: '/examples/02-offloading-computation'
      },
      {
        number: '03',
        title: 'Objetos Transferibles',
        description: 'Optimiza el rendimiento transfiriendo la propiedad de objetos grandes como ArrayBuffer en lugar de clonarlos. Perfecto para imágenes y datos binarios.',
        tags: ['Optimización', 'ArrayBuffer'],
        route: '/examples/03-transferable-objects'
      },
      {
        number: '04',
        title: 'Manejo de Errores',
        description: 'Aprende a capturar y manejar errores que ocurren dentro de un worker usando el evento onerror. Incluye ejemplos de diferentes tipos de errores.',
        tags: ['Debugging', 'Errores'],
        route: '/examples/04-error-handling'
      },
      {
        number: '05',
        title: 'Shared Worker',
        description: 'Explora cómo un Shared Worker puede ser compartido entre múltiples pestañas del navegador. Ideal para sincronizar estado o gestionar conexiones WebSocket.',
        tags: ['Avanzado', 'Multi-tab'],
        route: '/examples/05-shared-worker'
      },
      {
        number: '06',
        title: 'Ciclo de Vida',
        description: 'Gestiona correctamente el ciclo de vida de los workers: creación, uso y terminación. Aprende a liberar recursos y memoria de forma apropiada.',
        tags: ['Gestión', 'Recursos'],
        route: '/examples/06-lifecycle-termination'
      },
      {
        number: '07',
        title: 'Límites de Workers',
        description: 'Descubre cuántos workers puede manejar tu navegador y qué sucede cuando alcanzas esos límites. Incluye test de estrés y mejores prácticas.',
        tags: ['Límites', 'Escalabilidad'],
        route: '/examples/07-worker-limits'
      },
      {
        number: '08',
        title: 'Worker Pool',
        description: 'Implementa un pool de workers reutilizables para procesar cientos de tareas con solo 4-8 workers. El patrón profesional para producción.',
        tags: ['Patrón', 'Producción'],
        route: '/examples/08-worker-pool'
      }
    ];
  }
}

