export const lifecycleTerminationContent = {
  es: {
    title: '♻️ Ciclo de Vida y Terminación',
    subtitle: 'Ejemplo 08: Gestión del ciclo de vida de Workers',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Gestionar correctamente la vida de un Worker evita fugas de memoria y procesos colgados. Este ejemplo muestra cómo crear, usar y terminar un Worker de forma controlada.',
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      createWorker: '1️⃣ Crear Worker',
      terminateWorker: '2️⃣ Terminar Worker'
    },
    controlPanel: {
      title: '🎮 Control del Worker',
      status: {
        none: 'Worker no creado',
        created: 'Worker listo',
        working: 'Procesando...',
        completed: 'Completado'
      },
      buttons: {
        create: '➕ Crear Worker',
        start: '▶️ Iniciar Tarea Larga',
        terminate: '🛑 Terminar Worker',
        clear: '🗑️ Limpiar Logs'
      },
      progressLabel: '{{progress}}%'
    },
    statsPanel: { title: '📊 Estadísticas', created: 'Workers Creados', completed: 'Tareas Completadas', terminated: 'Terminaciones' },
    logPanel: { title: '📋 Log de Eventos', empty: 'Sistema iniciado. Esperando acciones...' },
    logs: {
      systemReady: 'Sistema iniciado. Crea un worker para comenzar.',
      creating: 'Creando nuevo Worker...',
      workerCreated: 'Worker creado exitosamente',
      startTask: 'Iniciando tarea de 5 segundos...',
      taskCompleted: 'Tarea completada: {{result}}',
      workerError: 'Error en worker: {{message}}',
      workerTerminated: 'Worker terminado',
      logsCleared: 'Logs limpiados'
    }
  },
  en: {
    title: '♻️ Worker Lifecycle & Termination',
    subtitle: "Example 08: Managing a worker's lifecycle",
    infoTitle: '💡 What does this example cover?',
    infoDescription:
      'Managing a Worker correctly prevents memory leaks and zombie processes. This example illustrates how to create, use, and terminate a Worker in a controlled manner.',
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      createWorker: '1️⃣ Create Worker',
      terminateWorker: '2️⃣ Terminate Worker'
    },
    controlPanel: {
      title: '🎮 Worker Controls',
      status: {
        none: 'Worker not created',
        created: 'Worker ready',
        working: 'Processing...',
        completed: 'Completed'
      },
      buttons: {
        create: '➕ Create Worker',
        start: '▶️ Start Long Task',
        terminate: '🛑 Terminate Worker',
        clear: '🗑️ Clear Logs'
      },
      progressLabel: '{{progress}}%'
    },
    statsPanel: { title: '📊 Statistics', created: 'Workers Created', completed: 'Tasks Completed', terminated: 'Terminations' },
    logPanel: { title: '📋 Event Log', empty: 'System ready. Waiting for actions...' },
    logs: {
      systemReady: 'System initialized. Create a worker to get started.',
      creating: 'Creating new worker...',
      workerCreated: 'Worker created successfully',
      startTask: 'Starting 5-second task...',
      taskCompleted: 'Task completed: {{result}}',
      workerError: 'Worker error: {{message}}',
      workerTerminated: 'Worker terminated',
      logsCleared: 'Logs cleared'
    }
  },
  pt: {
    title: '♻️ Ciclo de Vida e Término',
    subtitle: 'Exemplo 08: Gerenciando o ciclo de vida de um Worker',
    infoTitle: '💡 O que este exemplo aborda?',
    infoDescription:
      'Gerenciar corretamente um Worker evita vazamentos de memória e processos presos. Este exemplo mostra como criar, usar e terminar um Worker de maneira controlada.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      createWorker: '1️⃣ Criar Worker',
      terminateWorker: '2️⃣ Terminar Worker'
    },
    controlPanel: {
      title: '🎮 Controles do Worker',
      status: {
        none: 'Worker não criado',
        created: 'Worker pronto',
        working: 'Processando...',
        completed: 'Concluído'
      },
      buttons: {
        create: '➕ Criar Worker',
        start: '▶️ Iniciar Tarefa Longa',
        terminate: '🛑 Terminar Worker',
        clear: '🗑️ Limpar Logs'
      },
      progressLabel: '{{progress}}%'
    },
    statsPanel: { title: '📊 Estatísticas', created: 'Workers Criados', completed: 'Tarefas Concluídas', terminated: 'Terminações' },
    logPanel: { title: '📋 Log de Eventos', empty: 'Sistema iniciado. Aguardando ações...' },
    logs: {
      systemReady: 'Sistema iniciado. Crie um worker para começar.',
      creating: 'Criando novo worker...',
      workerCreated: 'Worker criado com sucesso',
      startTask: 'Iniciando tarefa de 5 segundos...',
      taskCompleted: 'Tarefa concluída: {{result}}',
      workerError: 'Erro no worker: {{message}}',
      workerTerminated: 'Worker terminado',
      logsCleared: 'Logs limpos'
    }
  }
};
