import { setIntervalCounterContent } from './examples/01-setinterval-counter.content';
import { mainThreadContent } from './examples/02-main-thread.content';
import { basicCommunicationContent } from './examples/03-basic-communication.content';
import { offloadingComputationContent } from './examples/04-offloading-computation.content';
import { errorHandlingContent } from './examples/05-error-handling.content';
import { lifecycleTerminationContent } from './examples/06-lifecycle-termination.content';
import { transferableObjectsContent } from './examples/07-transferable-objects.content';
import { sharedWorkerContent } from './examples/08-shared-worker.content';
import { workerLimitsContent } from './examples/09-worker-limits.content';
import { workerPoolContent } from './examples/10-worker-pool.content';

/**
 * UI-level translations only: labels, navigation, chrome.
 * Per-example content (titles, descriptions, log messages) lives in
 * src/app/core/translations/examples/ — one file per example.
 * Example metadata (title, description, tags for cards/sidebar) lives
 * in each example's manifest.ts.
 */
export const translations = {
  es: {
    common: {
      appTitle: '🚀 Patrones de Web Workers',
      appSubtitle: 'Aprende a usar Web Workers con ejemplos prácticos e interactivos',
      footerMadeWithLove: 'Hecho con ❤️ para la comunidad de desarrolladores',
      footerMdnLink: 'Documentación de MDN'
    },
    geoNotification: {
      message: 'Tu navegador indica que estás en {country}. Hemos configurado el idioma en {language}.',
      dismiss: 'Entendido'
    },
    language: {
      selectorTitle: 'Selecciona tu idioma',
      selectorDescription: 'Elige el idioma para la experiencia completa de la aplicación.',
      spanish: 'Español',
      english: 'Inglés',
      portuguese: 'Portugués',
      changeButton: 'Cambiar idioma',
      closeButton: 'Mantener idioma actual'
    },
    codeExplanation: {
      angularButton: 'Angular',
      javascriptButton: 'JavaScript',
      defaultSummary: '📖 Ver Código - ¿Cómo funciona?',
      emptyState: {
        angular: 'Aún no hay código Angular disponible para este ejemplo.',
        javascript: 'Aún no hay código JavaScript disponible para este ejemplo.'
      }
    },
    difficulty: {
      beginner: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado'
    },
    sidebar: {
      title: '📚 Ejemplos',
      searchPlaceholder: 'Buscar ejemplos...',
      noResults: 'No se encontraron ejemplos para',
      clearSearch: 'Borrar búsqueda'
    },
    exampleNav: {
      previous: 'Anterior',
      next: 'Siguiente',
      allExamples: 'Todos los ejemplos'
    },
    logPanel: {
      defaultTitle: 'Registro de eventos',
      defaultEmpty: 'Esperando eventos...'
    },
    diagram: {
      defaultFlowTitle: 'Arquitectura',
      defaultQueueLabel: 'Cola de tareas'
    },
    categories: {
      understanding: 'Entendiendo por qué las necesitamos',
      fundamentals: 'Fundamentos de Web Workers',
      optimization: 'Optimización y Transferencia de Datos',
      management: 'Manejo de Errores y Gestión',
      advanced: 'Workers Avanzados'
    },
    home: {
      progressLabel: 'Progreso',
      heroTitle: 'Worker Lab',
      heroSubtitle: 'Plataforma de simulación para computación paralela. Manipula hilos secundarios, optimiza recursos y rompe los límites del navegador.',
      learnTitle: '💡 ¿Qué aprenderás?',
      learnItems: [
        'Cómo ejecutar código JavaScript en hilos de fondo',
        'Evitar que la interfaz de usuario se congele con tareas pesadas',
        'Cómo descargar trabajo ayuda a Core Web Vitals (INP, LCP)',
        'Optimizar el rendimiento con transferencia de datos',
        'Manejar errores correctamente en workers',
        'Compartir workers entre múltiples pestañas',
        'Gestionar el ciclo de vida de workers',
        'Entender límites y escalabilidad en producción'
      ],
      orderTitle: '📖 Orden Recomendado',
      orderItems: [
        'Empieza con Comunicación Básica para entender los fundamentos',
        'Continúa con Descarga de Cómputo para ver el caso de uso principal',
        'Aprende sobre Manejo de Errores para hacer tu código más robusto',
        'Explora Objetos Transferibles para optimizaciones de rendimiento',
        'Experimenta con Ciclo de Vida para gestión de recursos',
        'Entiende los Límites de Workers para aplicaciones escalables',
        'Aprende el patrón Worker Pool para escalar a muchas tareas',
        'Finalmente, prueba Shared Worker para casos avanzados'
      ]
    },
    examplesContent: {
      setIntervalCounter: setIntervalCounterContent.es,
      mainThread: mainThreadContent.es,
      basicCommunication: basicCommunicationContent.es,
      offloadingComputation: offloadingComputationContent.es,
      transferableObjects: transferableObjectsContent.es,
      errorHandling: errorHandlingContent.es,
      sharedWorker: sharedWorkerContent.es,
      lifecycleTermination: lifecycleTerminationContent.es,
      workerLimits: workerLimitsContent.es,
      workerPool: workerPoolContent.es
    }
  },

  en: {
    common: {
      appTitle: '🚀 Web Worker Patterns',
      appSubtitle: 'Learn how to use Web Workers with practical, interactive examples',
      footerMadeWithLove: 'Made with ❤️ for the developer community',
      footerMdnLink: 'MDN Documentation'
    },
    geoNotification: {
      message: 'Your browser reports you are in {country}. We have set your language to {language}.',
      dismiss: 'Got it'
    },
    language: {
      selectorTitle: 'Choose your language',
      selectorDescription: 'Pick the language for the full application experience.',
      spanish: 'Spanish',
      english: 'English',
      portuguese: 'Portuguese',
      changeButton: 'Change language',
      closeButton: 'Keep current language'
    },
    codeExplanation: {
      angularButton: 'Angular',
      javascriptButton: 'JavaScript',
      defaultSummary: '📖 View Code - How does it work?',
      emptyState: {
        angular: 'Angular code is not available for this example yet.',
        javascript: 'JavaScript code is not available for this example yet.'
      }
    },
    difficulty: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    },
    sidebar: {
      title: '📚 Examples',
      searchPlaceholder: 'Search examples...',
      noResults: 'No examples found for',
      clearSearch: 'Clear search'
    },
    exampleNav: {
      previous: 'Previous',
      next: 'Next',
      allExamples: 'All examples'
    },
    logPanel: {
      defaultTitle: 'Event Log',
      defaultEmpty: 'Waiting for events...'
    },
    diagram: {
      defaultFlowTitle: 'Architecture',
      defaultQueueLabel: 'Task Queue'
    },
    categories: {
      understanding: 'Understanding Why We Need Them',
      fundamentals: 'Web Workers Fundamentals',
      optimization: 'Optimization and Data Transfer',
      management: 'Error Handling and Management',
      advanced: 'Advanced Workers'
    },
    home: {
      progressLabel: 'Progress',
      heroTitle: 'Worker Lab',
      heroSubtitle: 'Parallel computing simulation platform. Manipulate background threads, optimize resources, and push the limits of the browser.',
      learnTitle: '💡 What will you learn?',
      learnItems: [
        'How to run JavaScript code in background threads',
        'Keep the user interface responsive during heavy tasks',
        'How offloading helps Core Web Vitals (INP, LCP)',
        'Optimize performance by transferring data efficiently',
        'Handle errors correctly inside workers',
        'Share workers between multiple tabs',
        'Manage the worker lifecycle effectively',
        'Understand limits and scalability in production'
      ],
      orderTitle: '📖 Recommended Order',
      orderItems: [
        'Start with Basic Communication to learn the fundamentals',
        'Continue with Offloading Computation to see the main use case',
        'Learn Error Handling to make your code more robust',
        'Explore Transferable Objects for performance optimizations',
        'Experiment with Lifecycle Management to control resources',
        'Understand Worker Limits for scalable applications',
        'Learn the Worker Pool pattern to scale to many tasks',
        'Finally, try Shared Worker for advanced scenarios'
      ]
    },
    examplesContent: {
      setIntervalCounter: setIntervalCounterContent.en,
      mainThread: mainThreadContent.en,
      basicCommunication: basicCommunicationContent.en,
      offloadingComputation: offloadingComputationContent.en,
      transferableObjects: transferableObjectsContent.en,
      errorHandling: errorHandlingContent.en,
      sharedWorker: sharedWorkerContent.en,
      lifecycleTermination: lifecycleTerminationContent.en,
      workerLimits: workerLimitsContent.en,
      workerPool: workerPoolContent.en
    }
  },

  pt: {
    common: {
      appTitle: '🚀 Padrões de Web Workers',
      appSubtitle: 'Aprenda a usar Web Workers com exemplos práticos e interativos',
      footerMadeWithLove: 'Feito com ❤️ para a comunidade de desenvolvedores',
      footerMdnLink: 'Documentação da MDN'
    },
    geoNotification: {
      message: 'Seu navegador indica que você está em {country}. Configuramos o idioma em {language}.',
      dismiss: 'Entendi'
    },
    language: {
      selectorTitle: 'Selecione seu idioma',
      selectorDescription: 'Escolha o idioma para aproveitar toda a experiência do aplicativo.',
      spanish: 'Espanhol',
      english: 'Inglês',
      portuguese: 'Português',
      changeButton: 'Alterar idioma',
      closeButton: 'Manter idioma atual'
    },
    codeExplanation: {
      angularButton: 'Angular',
      javascriptButton: 'JavaScript',
      defaultSummary: '📖 Ver Código - Como funciona?',
      emptyState: {
        angular: 'Ainda não há código Angular disponível para este exemplo.',
        javascript: 'Ainda não há código JavaScript disponível para este exemplo.'
      }
    },
    difficulty: {
      beginner: 'Básico',
      intermediate: 'Intermediário',
      advanced: 'Avançado'
    },
    sidebar: {
      title: '📚 Exemplos',
      searchPlaceholder: 'Buscar exemplos...',
      noResults: 'Nenhum exemplo encontrado para',
      clearSearch: 'Limpar busca'
    },
    exampleNav: {
      previous: 'Anterior',
      next: 'Próximo',
      allExamples: 'Todos os exemplos'
    },
    logPanel: {
      defaultTitle: 'Registro de eventos',
      defaultEmpty: 'Aguardando eventos...'
    },
    diagram: {
      defaultFlowTitle: 'Arquitetura',
      defaultQueueLabel: 'Fila de tarefas'
    },
    categories: {
      understanding: 'Entendendo Por Que Precisamos Deles',
      fundamentals: 'Fundamentos de Web Workers',
      optimization: 'Otimização e Transferência de Dados',
      management: 'Tratamento de Erros e Gerenciamento',
      advanced: 'Workers Avançados'
    },
    home: {
      progressLabel: 'Progresso',
      heroTitle: 'Worker Lab',
      heroSubtitle: 'Plataforma de simulação para computação paralela. Manipule threads secundárias, otimize recursos e ultrapasse os limites do navegador.',
      learnTitle: '💡 O que você vai aprender?',
      learnItems: [
        'Como executar código JavaScript em threads de fundo',
        'Evitar que a interface congele em tarefas pesadas',
        'Como descarregar trabalho ajuda as Core Web Vitals (INP, LCP)',
        'Otimizar o desempenho com transferência eficiente de dados',
        'Tratar erros corretamente dentro dos workers',
        'Compartilhar workers entre várias abas',
        'Gerenciar o ciclo de vida dos workers',
        'Entender limites e escalabilidade em produção'
      ],
      orderTitle: '📖 Ordem Recomendada',
      orderItems: [
        'Comece com Comunicação Básica para entender os fundamentos',
        'Continue com Descarga de Cálculo para ver o principal caso de uso',
        'Aprenda Tratamento de Erros para tornar seu código mais robusto',
        'Explore Objetos Transferíveis para otimizações de desempenho',
        'Experimente Ciclo de Vida para gerenciar recursos',
        'Entenda os Limites de Workers para aplicações escaláveis',
        'Aprenda o padrão Worker Pool para escalar para muitas tarefas',
        'Por fim, experimente Shared Worker para cenários avançados'
      ]
    },
    examplesContent: {
      setIntervalCounter: setIntervalCounterContent.pt,
      mainThread: mainThreadContent.pt,
      basicCommunication: basicCommunicationContent.pt,
      offloadingComputation: offloadingComputationContent.pt,
      transferableObjects: transferableObjectsContent.pt,
      errorHandling: errorHandlingContent.pt,
      sharedWorker: sharedWorkerContent.pt,
      lifecycleTermination: lifecycleTerminationContent.pt,
      workerLimits: workerLimitsContent.pt,
      workerPool: workerPoolContent.pt
    }
  }
};
