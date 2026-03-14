export const workerLimitsContent = {
  es: {
    title: '⚠️ Límites de Workers',
    subtitle: 'Ejemplo 09: Cantidad máxima y gestión de recursos',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Los navegadores tienen límites en la cantidad de workers simultáneos. Este ejemplo permite crear muchos workers, detectar límites y monitorear el uso de recursos.',
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      systemInfo: '1️⃣ Obtener información del sistema',
      createMultiple: '2️⃣ Crear múltiples workers'
    },
    systemInfo: {
      title: '💻 Información de tu Sistema',
      items: {
        cpuCores: { label: 'Núcleos CPU' },
        recommended: { label: 'Límite recomendado', suffix: 'workers' },
        browser: { label: 'Navegador' },
        detected: { label: 'Límite detectado' }
      }
    },
    autoDetect: {
      title: '🔍 Auto-detección de Límites',
      description: 'Esta función crea workers progresivamente (1, 2, 3...) hasta encontrar el límite real de tu navegador.',
      startButton: '🔍 Detectar Límite Automáticamente',
      stopButton: '⏹️ Detener Detección',
      detectingTitle: 'Detectando límites...',
      completedLabel: 'Detección completada',
      resultTitle: '📊 Resultado de la Detección',
      result: { limitLabel: 'Límite Detectado:', timeLabel: 'Tiempo Total:', comparisonLabel: 'vs Recomendado:' }
    },
    manualControls: {
      title: '🎮 Controles Manuales',
      countLabel: 'Cantidad de workers a crear:',
      buttons: {
        createOne: '➕ Crear 1 Worker',
        createMultiple: '➕➕ Crear {{count}} Workers',
        stressTest: '🔥 Test de Estrés (50)',
        terminateAll: '🛑 Terminar Todos',
        clearLogs: '🗑️ Limpiar Logs'
      }
    },
    statsPanel: { title: '📊 Estado Actual', active: 'Workers Activos', totalCreated: 'Total Creados', errors: 'Errores', memory: 'Memoria Usada' },
    logPanel: { title: '📋 Log de Eventos', empty: 'Sistema iniciado. Listo para crear workers.' },
    logs: {
      systemStarted: 'Sistema iniciado. CPU cores detectados: {{cores}}',
      browserInfo: 'Navegador: {{browser}}',
      recommendedMax: 'Máximo recomendado de workers: {{recommended}}',
      autodetectSuggestion: 'Usa la auto-detección para encontrar el límite real de tu navegador',
      workerCreated: 'Worker #{{id}} creado exitosamente',
      workerError: 'Error en Worker #{{id}}',
      errorCreatingWorker: 'Error al crear worker: {{message}}',
      limitReachedWarning: 'Posiblemente has alcanzado el límite del navegador',
      creatingMultiple: 'Intentando crear {{count}} workers...',
      overRecommendedWarning: 'Advertencia: Estás creando más workers ({{count}}) que el recomendado ({{recommended}}) para tu sistema ({{cores}} cores)',
      multipleResult: 'Creación completada: {{success}} exitosos, {{fail}} fallidos',
      stressStart: '🔥 Iniciando test de estrés: intentando crear {{count}} workers...',
      stressInfo: '💻 Tu sistema tiene {{cores}} núcleos CPU. Máximo recomendado: {{recommended}} workers',
      stressSummary: '🔥 Test de estrés completado:',
      stressSuccess: '   ✅ {{count}} workers creados exitosamente',
      stressFail: '   ❌ {{count}} workers fallaron (límite alcanzado)',
      stressDetected: '   📊 Límite práctico detectado: ~{{limit}} workers',
      autodetectStart: 'Iniciando auto-detección de límites...',
      autodetectProgress: 'Creando worker #{{number}}...',
      autodetectDetected: 'Límite detectado: {{limit}} workers',
      autodetectComplete: 'Detección completada en {{seconds}}s',
      autodetectSupport: 'Tu navegador soporta hasta {{limit}} workers',
      autodetectStopped: 'Detección detenida por el usuario',
      terminateAll: 'Todos los workers terminados ({{count}} workers)',
      logsCleared: 'Logs limpiados'
    }
  },
  en: {
    title: '⚠️ Worker Limits',
    subtitle: 'Example 09: Maximum counts and resource management',
    infoTitle: '💡 What does this example show?',
    infoDescription:
      'Browsers enforce a limit on how many workers can run at once. This example lets you create many workers, detect limits, and monitor resource usage.',
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      systemInfo: '1️⃣ Gather system info',
      createMultiple: '2️⃣ Spin up multiple workers'
    },
    systemInfo: {
      title: '💻 Your System Information',
      items: {
        cpuCores: { label: 'CPU cores' },
        recommended: { label: 'Recommended limit', suffix: 'workers' },
        browser: { label: 'Browser' },
        detected: { label: 'Detected limit' }
      }
    },
    autoDetect: {
      title: '🔍 Automatic Limit Detection',
      description: 'This routine creates workers progressively (1, 2, 3...) until it finds the actual limit in your browser.',
      startButton: '🔍 Detect Limit Automatically',
      stopButton: '⏹️ Stop Detection',
      detectingTitle: 'Detecting limits...',
      completedLabel: 'Detection completed',
      resultTitle: '📊 Detection Result',
      result: { limitLabel: 'Detected limit:', timeLabel: 'Total time:', comparisonLabel: 'vs Recommended:' }
    },
    manualControls: {
      title: '🎮 Manual Controls',
      countLabel: 'Number of workers to create:',
      buttons: {
        createOne: '➕ Create 1 Worker',
        createMultiple: '➕➕ Create {{count}} Workers',
        stressTest: '🔥 Stress Test (50)',
        terminateAll: '🛑 Terminate All',
        clearLogs: '🗑️ Clear Logs'
      }
    },
    statsPanel: { title: '📊 Current Status', active: 'Active Workers', totalCreated: 'Total Created', errors: 'Errors', memory: 'Memory Used' },
    logPanel: { title: '📋 Event Log', empty: 'System ready. Ready to create workers.' },
    logs: {
      systemStarted: 'System started. Detected CPU cores: {{cores}}',
      browserInfo: 'Browser: {{browser}}',
      recommendedMax: 'Recommended max workers: {{recommended}}',
      autodetectSuggestion: 'Use auto-detect to find your browser\'s real limit',
      workerCreated: 'Worker #{{id}} created successfully',
      workerError: 'Error in Worker #{{id}}',
      errorCreatingWorker: 'Error creating worker: {{message}}',
      limitReachedWarning: 'You may have reached the browser limit',
      creatingMultiple: 'Attempting to create {{count}} workers...',
      overRecommendedWarning: 'Warning: You are creating more workers ({{count}}) than recommended ({{recommended}}) for your system ({{cores}} cores)',
      multipleResult: 'Creation complete: {{success}} success, {{fail}} failed',
      stressStart: '🔥 Starting stress test: trying to create {{count}} workers...',
      stressInfo: '💻 Your system has {{cores}} CPU cores. Recommended max: {{recommended}} workers',
      stressSummary: '🔥 Stress test completed:',
      stressSuccess: '   ✅ {{count}} workers created successfully',
      stressFail: '   ❌ {{count}} workers failed (limit reached)',
      stressDetected: '   📊 Practical limit detected: ~{{limit}} workers',
      autodetectStart: 'Starting automatic limit detection...',
      autodetectProgress: 'Creating worker #{{number}}...',
      autodetectDetected: 'Limit detected: {{limit}} workers',
      autodetectComplete: 'Detection completed in {{seconds}}s',
      autodetectSupport: 'Your browser supports up to {{limit}} workers',
      autodetectStopped: 'Detection stopped by the user',
      terminateAll: 'All workers terminated ({{count}} workers)',
      logsCleared: 'Logs cleared'
    }
  },
  pt: {
    title: '⚠️ Limites de Workers',
    subtitle: 'Exemplo 09: Quantidade máxima e gestão de recursos',
    infoTitle: '💡 O que este exemplo mostra?',
    infoDescription:
      'Os navegadores limitam a quantidade de workers simultâneos. Este exemplo permite criar muitos workers, detectar limites e monitorar recursos.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      systemInfo: '1️⃣ Obter informações do sistema',
      createMultiple: '2️⃣ Criar múltiplos workers'
    },
    systemInfo: {
      title: '💻 Informações do seu Sistema',
      items: {
        cpuCores: { label: 'Núcleos de CPU' },
        recommended: { label: 'Limite recomendado', suffix: 'workers' },
        browser: { label: 'Navegador' },
        detected: { label: 'Limite detectado' }
      }
    },
    autoDetect: {
      title: '🔍 Auto-detecção de Limites',
      description: 'Esta função cria workers progressivamente (1, 2, 3...) até encontrar o limite real do seu navegador.',
      startButton: '🔍 Detectar Limite Automaticamente',
      stopButton: '⏹️ Parar Detecção',
      detectingTitle: 'Detectando limites...',
      completedLabel: 'Detecção concluída',
      resultTitle: '📊 Resultado da Detecção',
      result: { limitLabel: 'Limite Detectado:', timeLabel: 'Tempo Total:', comparisonLabel: 'vs Recomendado:' }
    },
    manualControls: {
      title: '🎮 Controles Manuais',
      countLabel: 'Quantidade de workers a criar:',
      buttons: {
        createOne: '➕ Criar 1 Worker',
        createMultiple: '➕➕ Criar {{count}} Workers',
        stressTest: '🔥 Teste de Estresse (50)',
        terminateAll: '🛑 Terminar Todos',
        clearLogs: '🗑️ Limpar Logs'
      }
    },
    statsPanel: { title: '📊 Status Atual', active: 'Workers Ativos', totalCreated: 'Total Criados', errors: 'Erros', memory: 'Memória Usada' },
    logPanel: { title: '📋 Log de Eventos', empty: 'Sistema iniciado. Pronto para criar workers.' },
    logs: {
      systemStarted: 'Sistema iniciado. Núcleos de CPU detectados: {{cores}}',
      browserInfo: 'Navegador: {{browser}}',
      recommendedMax: 'Máximo recomendado de workers: {{recommended}}',
      autodetectSuggestion: 'Use a auto-detecção para encontrar o limite real do seu navegador',
      workerCreated: 'Worker #{{id}} criado com sucesso',
      workerError: 'Erro no Worker #{{id}}',
      errorCreatingWorker: 'Erro ao criar worker: {{message}}',
      limitReachedWarning: 'Possivelmente você alcançou o limite do navegador',
      creatingMultiple: 'Tentando criar {{count}} workers...',
      overRecommendedWarning: 'Atenção: Você está criando mais workers ({{count}}) do que o recomendado ({{recommended}}) para seu sistema ({{cores}} cores)',
      multipleResult: 'Criação concluída: {{success}} sucessos, {{fail}} falhas',
      stressStart: '🔥 Iniciando teste de estresse: tentando criar {{count}} workers...',
      stressInfo: '💻 Seu sistema possui {{cores}} núcleos de CPU. Máximo recomendado: {{recommended}} workers',
      stressSummary: '🔥 Teste de estresse concluído:',
      stressSuccess: '   ✅ {{count}} workers criados com sucesso',
      stressFail: '   ❌ {{count}} workers falharam (limite alcançado)',
      stressDetected: '   📊 Limite prático detectado: ~{{limit}} workers',
      autodetectStart: 'Iniciando auto-detecção de limites...',
      autodetectProgress: 'Criando worker #{{number}}...',
      autodetectDetected: 'Limite detectado: {{limit}} workers',
      autodetectComplete: 'Detecção concluída em {{seconds}}s',
      autodetectSupport: 'Seu navegador suporta até {{limit}} workers',
      autodetectStopped: 'Detecção interrompida pelo usuário',
      terminateAll: 'Todos os workers terminados ({{count}} workers)',
      logsCleared: 'Logs limpos'
    }
  }
};
