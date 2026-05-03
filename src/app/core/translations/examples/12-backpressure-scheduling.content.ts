export const backpressureSchedulingContent = {
  es: {
    title: '⚡ Backpressure Scheduling',
    subtitle: 'Ejemplo 12: Scheduling con fallback síncrono cuando los workers se saturan',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Cuando todos los workers están ocupados y las tareas activas superan MAX_TASKS, las nuevas tareas se ejecutan síncronamente en el main thread en lugar de encolarse infinitamente. Esto garantiza progreso y previene desbordamiento de memoria.',
    prerequisite:
      '💡 Este es un patrón común en motores de simulación y aplicaciones de alto rendimiento. Si el pool está saturado, ejecutar en el thread actual es mejor que acumular una cola infinita.',
    comparison: {
      badTitle: '❌ Sin Backpressure',
      badItems: [
        'Cola crece sin límite',
        'Memoria se agota eventualmente',
        'Latencia impredecible',
        'Sin garantía de progreso'
      ],
      goodTitle: '✅ Con Backpressure',
      goodItems: [
        'MAX_TASKS limita la concurrencia',
        'Fallback síncrono garantiza progreso',
        'Memoria acotada',
        'Trade-off controlado: UI jank vs estabilidad'
      ]
    },
    codeSummary: '📖 Ver Código - ¿Cómo funciona el backpressure?',
    codeSections: {
      scheduleTask: '1️⃣ Función de Scheduling (happy path)',
      fallbackSync: '2️⃣ Fallback Síncrono (backpressure)',
      box2dReference: '3️⃣ Referencia: Implementación en C++'
    },
    statsPanel: {
      title: '📊 Dashboard del Scheduler',
      workers: 'Workers Activos',
      activeTasks: 'Tareas Activas',
      offloaded: 'A Workers',
      fallback: 'Fallback (sync)',
      completed: 'Completadas'
    },
    controls: {
      title: '🎮 Controles',
      workersLabel: 'Workers:',
      maxTasksLabel: 'MAX_TASKS:',
      maxTasksHint: 'Umbral de backpressure',
      initButton: '🚀 Inicializar Scheduler',
      burstSizeLabel: 'Ráfaga de tareas:',
      complexityLabel: 'Complejidad (1-50):',
      complexityHint: 'Mayor = más tiempo de cómputo',
      fireBurst: '💥 Ráfaga Instantánea',
      fireGradual: '🌊 Ráfaga Gradual',
      shutdown: '🛑 Apagar'
    },
    logPanel: { title: '📝 Log de Scheduling', empty: 'Inicializa el scheduler para comenzar.' },
    logs: {
      systemReady: 'Sistema listo — Configura MAX_TASKS y el tamaño de ráfaga.',
      cpuInfo: '💻 Núcleos CPU: {{cores}}',
      schedulerReady: '✅ Scheduler iniciado: {{workers}} workers, MAX_TASKS={{maxTasks}}',
      offloaded: '→ {{id}} enviada al Worker #{{worker}}',
      fallback: '⚠️ BACKPRESSURE: {{id}} ejecutada en main thread ({{active}}/{{max}} activas)',
      fallbackDone: '⚠️ {{id}} completada en main thread en {{time}}ms',
      workerDone: '✅ {{id}} completada por Worker #{{worker}} en {{time}}ms',
      workerError: '❌ Error en Worker #{{id}}',
      burstStart: '💥 Ráfaga de {{count}} tareas (MAX_TASKS={{maxTasks}})',
      gradualStart: '🌊 Ráfaga gradual de {{count}} tareas (100ms entre cada una)',
      initFirst: 'Primero inicializa el scheduler',
      shutdown: 'Scheduler apagado',
      logsCleared: 'Logs limpiados'
    },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Backpressure previene crecimiento infinito de la cola',
        'El fallback síncrono bloquea el UI pero garantiza progreso',
        'MAX_TASKS es el parámetro crítico: muy bajo = demasiado fallback, muy alto = mucha memoria'
      ],
      tip: 'Ajusta MAX_TASKS a 1.5× la cantidad de workers para un balance óptimo entre throughput y uso de memoria.',
      usedBy: {
        title: '🏗️ Proyectos que usan este patrón',
        items: ['box2d3-wasm — Motor de física Box2D compilado a WebAssembly, usa este patrón en su SchedulePhysicsTask']
      }
    }
  },
  en: {
    title: '⚡ Backpressure Scheduling',
    subtitle: 'Example 12: Scheduling with synchronous fallback when workers are saturated',
    infoTitle: '💡 What does this example illustrate?',
    infoDescription:
      'When all workers are busy and active tasks exceed MAX_TASKS, new tasks execute synchronously on the main thread instead of queuing forever. This guarantees progress and prevents memory overflow.',
    prerequisite:
      '💡 This is a common pattern in simulation engines and high-performance applications. When the pool is saturated, executing on the current thread is better than accumulating an unbounded queue.',
    comparison: {
      badTitle: '❌ Without Backpressure',
      badItems: [
        'Queue grows unbounded',
        'Memory eventually exhausted',
        'Unpredictable latency',
        'No progress guarantee'
      ],
      goodTitle: '✅ With Backpressure',
      goodItems: [
        'MAX_TASKS limits concurrency',
        'Sync fallback guarantees progress',
        'Bounded memory usage',
        'Controlled trade-off: UI jank vs stability'
      ]
    },
    codeSummary: '📖 View Code - How does backpressure work?',
    codeSections: {
      scheduleTask: '1️⃣ Scheduling Function (happy path)',
      fallbackSync: '2️⃣ Synchronous Fallback (backpressure)',
      box2dReference: '3️⃣ Reference: C++ Implementation'
    },
    statsPanel: {
      title: '📊 Scheduler Dashboard',
      workers: 'Active Workers',
      activeTasks: 'Active Tasks',
      offloaded: 'To Workers',
      fallback: 'Fallback (sync)',
      completed: 'Completed'
    },
    controls: {
      title: '🎮 Controls',
      workersLabel: 'Workers:',
      maxTasksLabel: 'MAX_TASKS:',
      maxTasksHint: 'Backpressure threshold',
      initButton: '🚀 Initialize Scheduler',
      burstSizeLabel: 'Burst size:',
      complexityLabel: 'Complexity (1-50):',
      complexityHint: 'Higher = more computation time',
      fireBurst: '💥 Instant Burst',
      fireGradual: '🌊 Gradual Burst',
      shutdown: '🛑 Shut Down'
    },
    logPanel: { title: '📝 Scheduling Log', empty: 'Initialize the scheduler to get started.' },
    logs: {
      systemReady: 'System ready — Configure MAX_TASKS and burst size.',
      cpuInfo: '💻 CPU cores: {{cores}}',
      schedulerReady: '✅ Scheduler started: {{workers}} workers, MAX_TASKS={{maxTasks}}',
      offloaded: '→ {{id}} sent to Worker #{{worker}}',
      fallback: '⚠️ BACKPRESSURE: {{id}} executed on main thread ({{active}}/{{max}} active)',
      fallbackDone: '⚠️ {{id}} completed on main thread in {{time}}ms',
      workerDone: '✅ {{id}} completed by Worker #{{worker}} in {{time}}ms',
      workerError: '❌ Error in Worker #{{id}}',
      burstStart: '💥 Burst of {{count}} tasks (MAX_TASKS={{maxTasks}})',
      gradualStart: '🌊 Gradual burst of {{count}} tasks (100ms between each)',
      initFirst: 'Initialize the scheduler first',
      shutdown: 'Scheduler shut down',
      logsCleared: 'Logs cleared'
    },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'Backpressure prevents unbounded queue growth',
        'Sync fallback blocks UI but guarantees progress',
        'MAX_TASKS is the critical parameter: too low = too many fallbacks, too high = too much memory'
      ],
      tip: 'Set MAX_TASKS to 1.5× the worker count for optimal balance between throughput and memory usage.',
      usedBy: {
        title: '🏗️ Projects using this pattern',
        items: ['box2d3-wasm — Box2D physics engine compiled to WebAssembly, uses this pattern in its SchedulePhysicsTask']
      }
    }
  },
  pt: {
    title: '⚡ Backpressure Scheduling',
    subtitle: 'Exemplo 12: Agendamento com fallback síncrono quando os workers estão saturados',
    infoTitle: '💡 O que este exemplo ilustra?',
    infoDescription:
      'Quando todos os workers estão ocupados e as tarefas ativas excedem MAX_TASKS, novas tarefas são executadas sincronamente na thread principal em vez de ficar na fila eternamente. Isso garante progresso e previne estouro de memória.',
    prerequisite:
      '💡 Este é um padrão comum em motores de simulação e aplicações de alto desempenho. Quando o pool está saturado, executar na thread atual é melhor do que acumular uma fila infinita.',
    comparison: {
      badTitle: '❌ Sem Backpressure',
      badItems: ['Fila cresce sem limite', 'Memória esgota', 'Latência imprevisível', 'Sem garantia de progresso'],
      goodTitle: '✅ Com Backpressure',
      goodItems: ['MAX_TASKS limita a concorrência', 'Fallback síncrono garante progresso', 'Uso de memória controlado', 'Trade-off controlado']
    },
    codeSummary: '📖 Ver Código - Como funciona o backpressure?',
    codeSections: {
      scheduleTask: '1️⃣ Função de Scheduling (caminho feliz)',
      fallbackSync: '2️⃣ Fallback Síncrono (backpressure)',
      box2dReference: '3️⃣ Referência: Implementação em C++'
    },
    statsPanel: { title: '📊 Dashboard do Scheduler', workers: 'Workers Ativos', activeTasks: 'Tarefas Ativas', offloaded: 'Para Workers', fallback: 'Fallback (sync)', completed: 'Concluídas' },
    controls: { title: '🎮 Controles', workersLabel: 'Workers:', maxTasksLabel: 'MAX_TASKS:', maxTasksHint: 'Limiar de backpressure', initButton: '🚀 Inicializar Scheduler', burstSizeLabel: 'Tamanho da rajada:', complexityLabel: 'Complexidade (1-50):', complexityHint: 'Maior = mais tempo de cálculo', fireBurst: '💥 Rajada Instantânea', fireGradual: '🌊 Rajada Gradual', shutdown: '🛑 Desligar' },
    logPanel: { title: '📝 Log de Scheduling', empty: 'Inicialize o scheduler para começar.' },
    logs: { systemReady: 'Sistema pronto.', cpuInfo: '💻 Núcleos CPU: {{cores}}', schedulerReady: '✅ Scheduler iniciado: {{workers}} workers, MAX_TASKS={{maxTasks}}', offloaded: '→ {{id}} enviada ao Worker #{{worker}}', fallback: '⚠️ BACKPRESSURE: {{id}} executada na thread principal ({{active}}/{{max}} ativas)', fallbackDone: '⚠️ {{id}} concluída na thread principal em {{time}}ms', workerDone: '✅ {{id}} concluída pelo Worker #{{worker}} em {{time}}ms', workerError: '❌ Erro no Worker #{{id}}', burstStart: '💥 Rajada de {{count}} tarefas (MAX_TASKS={{maxTasks}})', gradualStart: '🌊 Rajada gradual de {{count}} tarefas', initFirst: 'Inicialize o scheduler primeiro', shutdown: 'Scheduler desligado', logsCleared: 'Logs limpos' },
    takeaways: {
      title: 'Pontos-Chave',
      items: ['Backpressure previne crescimento infinito da fila', 'Fallback síncrono bloqueia UI mas garante progresso', 'MAX_TASKS é o parâmetro crítico'],
      tip: 'Defina MAX_TASKS para 1.5× a quantidade de workers.',
      usedBy: {
        title: '🏗️ Projetos que usam este padrão',
        items: ['box2d3-wasm — Motor de física Box2D compilado para WebAssembly']
      }
    }
  }
};
