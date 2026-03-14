export const workerPoolContent = {
  es: {
    title: '🏊 Worker Pool Pattern',
    subtitle: 'Ejemplo 10: Procesar muchas tareas con pocos workers',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'En lugar de crear un worker por tarea, un Worker Pool reutiliza un número fijo de workers para procesar múltiples tareas en cola. Este es el patrón usado en producción.',
    comparison: {
      badTitle: '❌ Enfoque Malo',
      badItems: [
        'Crear 1 worker por tarea',
        '100 tareas = 100 workers',
        'Alcanza límites del navegador',
        'Alto consumo de memoria'
      ],
      goodTitle: '✅ Worker Pool',
      goodItems: [
        'Pool fijo de 4-8 workers',
        '100 tareas = 4-8 workers reutilizados',
        'Sin límites de tareas',
        'Uso eficiente de recursos'
      ]
    },
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      createPool: '1️⃣ Crear Worker Pool',
      addTask: '2️⃣ Agregar Tareas a la Cola',
      assignTask: '3️⃣ Asignar Tareas a Workers',
      receiveResult: '4️⃣ Recibir Resultados'
    },
    statsPanel: {
      title: '📊 Dashboard del Pool',
      poolSize: 'Workers en Pool',
      queue: 'En Cola',
      processing: 'Procesando',
      completed: 'Completadas',
      throughput: 'Tareas/seg',
      avgTime: 'Tiempo Prom'
    },
    controls: {
      title: '🎮 Controles',
      poolSizeLabel: 'Tamaño del Pool:',
      poolSizeHint: 'Recomendado: 4-8 workers',
      initButton: '🚀 Inicializar Pool',
      taskCountLabel: 'Cantidad de Tareas:',
      taskHint: 'Puedes agregar más tareas que workers',
      taskDurationLabel: 'Duración de cada tarea (ms):',
      addTasks: '➕ Agregar Tareas',
      stressTest: '🔥 Stress Test (100)',
      clearQueue: '🗑️ Limpiar Cola',
      shutdown: '🛑 Apagar Pool'
    },
    logPanel: { title: '📝 Log de Actividad', empty: 'Sistema listo. Inicializa el pool para comenzar.' },
    logs: {
      systemReady: 'Sistema listo. Configura e inicializa tu Worker Pool.',
      cpuInfo: '💻 Núcleos CPU detectados: {{cores}}',
      invalidPoolSize: 'Por favor, ingresa un tamaño de pool entre 1 y 16',
      poolInitialized: 'Worker Pool inicializado con {{size}} workers',
      recommendation: '✨ Recomendación: Tu sistema tiene {{cores}} núcleos CPU',
      initializeFirst: 'Primero debes inicializar el pool',
      tasksAdded: '{{count}} tareas agregadas a la cola',
      stressStart: '🔥 Iniciando stress test con 100 tareas...',
      queueCleared: 'Cola limpiada: {{count}} tareas removidas',
      poolShutdown: 'Worker Pool apagado',
      logsCleared: 'Logs limpiados',
      workerProcessing: 'Worker #{{id}} procesando {{task}}',
      workerCompleted: 'Worker #{{id}} completó {{task}} en {{time}}ms',
      workerError: 'Error en Worker #{{id}}: {{message}}'
    }
  },
  en: {
    title: '🏊 Worker Pool Pattern',
    subtitle: 'Example 10: Process many tasks with few workers',
    infoTitle: '💡 What does this example illustrate?',
    infoDescription:
      'Instead of creating one worker per task, a Worker Pool reuses a fixed number of workers to process a queue of tasks. This is the production-ready pattern.',
    comparison: {
      badTitle: '❌ Bad Approach',
      badItems: [
        'Create one worker per task',
        '100 tasks = 100 workers',
        'Hits browser limits quickly',
        'High memory usage'
      ],
      goodTitle: '✅ Worker Pool',
      goodItems: [
        'Fixed pool of 4-8 workers',
        '100 tasks = 4-8 reused workers',
        'No task limit',
        'Efficient resource usage'
      ]
    },
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      createPool: '1️⃣ Create Worker Pool',
      addTask: '2️⃣ Add Tasks to the Queue',
      assignTask: '3️⃣ Assign Tasks to Workers',
      receiveResult: '4️⃣ Receive Results'
    },
    statsPanel: {
      title: '📊 Pool Dashboard',
      poolSize: 'Workers in Pool',
      queue: 'Queued',
      processing: 'Processing',
      completed: 'Completed',
      throughput: 'Tasks/sec',
      avgTime: 'Avg Time'
    },
    controls: {
      title: '🎮 Controls',
      poolSizeLabel: 'Pool size:',
      poolSizeHint: 'Recommended: 4-8 workers',
      initButton: '🚀 Initialize Pool',
      taskCountLabel: 'Task count:',
      taskHint: 'You can add more tasks than workers',
      taskDurationLabel: 'Task duration (ms):',
      addTasks: '➕ Add Tasks',
      stressTest: '🔥 Stress Test (100)',
      clearQueue: '🗑️ Clear Queue',
      shutdown: '🛑 Shut Down Pool'
    },
    logPanel: { title: '📝 Activity Log', empty: 'System ready. Initialize the pool to get started.' },
    logs: {
      systemReady: 'System ready. Configure and initialize your Worker Pool.',
      cpuInfo: '💻 Detected CPU cores: {{cores}}',
      invalidPoolSize: 'Please enter a pool size between 1 and 16',
      poolInitialized: 'Worker Pool initialized with {{size}} workers',
      recommendation: '✨ Recommendation: Your system has {{cores}} CPU cores',
      initializeFirst: 'Initialize the pool first',
      tasksAdded: '{{count}} tasks added to the queue',
      stressStart: '🔥 Starting stress test with 100 tasks...',
      queueCleared: 'Queue cleared: {{count}} tasks removed',
      poolShutdown: 'Worker Pool shut down',
      logsCleared: 'Logs cleared',
      workerProcessing: 'Worker #{{id}} processing {{task}}',
      workerCompleted: 'Worker #{{id}} completed {{task}} in {{time}}ms',
      workerError: 'Error in Worker #{{id}}: {{message}}'
    }
  },
  pt: {
    title: '🏊 Worker Pool Pattern',
    subtitle: 'Exemplo 10: Processar muitas tarefas com poucos workers',
    infoTitle: '💡 O que este exemplo ilustra?',
    infoDescription:
      'Em vez de criar um worker por tarefa, um Worker Pool reutiliza um número fixo de workers para processar uma fila de tarefas. Este é o padrão usado em produção.',
    comparison: {
      badTitle: '❌ Abordagem Ruim',
      badItems: [
        'Criar 1 worker por tarefa',
        '100 tarefas = 100 workers',
        'Atinge rapidamente os limites do navegador',
        'Alto consumo de memória'
      ],
      goodTitle: '✅ Worker Pool',
      goodItems: [
        'Pool fixo de 4-8 workers',
        '100 tarefas = 4-8 workers reutilizados',
        'Sem limite de tarefas',
        'Uso eficiente de recursos'
      ]
    },
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      createPool: '1️⃣ Criar Worker Pool',
      addTask: '2️⃣ Adicionar Tarefas à Fila',
      assignTask: '3️⃣ Atribuir Tarefas aos Workers',
      receiveResult: '4️⃣ Receber Resultados'
    },
    statsPanel: {
      title: '📊 Dashboard do Pool',
      poolSize: 'Workers no Pool',
      queue: 'Na Fila',
      processing: 'Processando',
      completed: 'Concluídas',
      throughput: 'Tarefas/s',
      avgTime: 'Tempo Méd'
    },
    controls: {
      title: '🎮 Controles',
      poolSizeLabel: 'Tamanho do Pool:',
      poolSizeHint: 'Recomendado: 4-8 workers',
      initButton: '🚀 Inicializar Pool',
      taskCountLabel: 'Quantidade de Tarefas:',
      taskHint: 'Você pode adicionar mais tarefas do que workers',
      taskDurationLabel: 'Duração de cada tarefa (ms):',
      addTasks: '➕ Adicionar Tarefas',
      stressTest: '🔥 Stress Test (100)',
      clearQueue: '🗑️ Limpar Fila',
      shutdown: '🛑 Desligar Pool'
    },
    logPanel: { title: '📝 Log de Atividade', empty: 'Sistema pronto. Inicialize o pool para começar.' },
    logs: {
      systemReady: 'Sistema pronto. Configure e inicialize seu Worker Pool.',
      cpuInfo: '💻 Núcleos de CPU detectados: {{cores}}',
      invalidPoolSize: 'Informe um tamanho de pool entre 1 e 16',
      poolInitialized: 'Worker Pool inicializado com {{size}} workers',
      recommendation: '✨ Recomendação: Seu sistema possui {{cores}} núcleos de CPU',
      initializeFirst: 'Primeiro inicialize o pool',
      tasksAdded: '{{count}} tarefas adicionadas à fila',
      stressStart: '🔥 Iniciando stress test com 100 tarefas...',
      queueCleared: 'Fila limpa: {{count}} tarefas removidas',
      poolShutdown: 'Worker Pool desligado',
      logsCleared: 'Logs limpos',
      workerProcessing: 'Worker #{{id}} processando {{task}}',
      workerCompleted: 'Worker #{{id}} concluiu {{task}} em {{time}}ms',
      workerError: 'Erro no Worker #{{id}}: {{message}}'
    }
  }
};
