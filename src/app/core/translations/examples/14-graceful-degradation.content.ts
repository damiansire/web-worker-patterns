export const gracefulDegradationContent = {
  es: {
    title: '🛡️ Degradación Elegante + Blob Workers',
    subtitle: 'Ejemplo 14: Detección de capacidades, Blob URL Workers y fallback automático',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Combina tres patrones de producción: 1) Detección de capacidades del navegador para elegir la mejor estrategia de ejecución, 2) Blob URL Workers que crean workers dinámicamente desde código inline (sin archivos separados), y 3) Fallback automático a main thread cuando los workers fallan.',
    prerequisite:
      '💡 En producción, no puedes asumir que todos los navegadores soportan las mismas APIs. Este ejemplo enseña a detectar capacidades y degradar automáticamente: si hay threading → usarlo, si no → ejecutar síncrono.',
    comparison: {
      badTitle: '❌ Sin Degradación',
      badItems: [
        'Falla si el browser no soporta Workers',
        'Requiere archivos worker separados (CORS)',
        'Error no recuperable si el worker falla',
        'Código acoplado a una sola estrategia'
      ],
      goodTitle: '✅ Degradación Elegante',
      goodItems: [
        'Detecta capacidades antes de ejecutar',
        'Blob URL Workers evitan problemas CORS',
        'Fallback automático a main thread',
        'Una sola API, múltiples implementaciones'
      ]
    },
    capabilityTitle: '🔍 Capacidades Detectadas',
    capabilityNames: { workers: 'Web Workers', sab: 'SharedArrayBuffer', atomics: 'Atomics', wasm: 'WebAssembly', moduleWorkers: 'Module Workers' },
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      detection: '1️⃣ Detección de Capacidades',
      blobWorker: '2️⃣ Blob URL Worker (worker dinámico)',
      autoResolve: '3️⃣ Auto-Resolver Modo de Ejecución'
    },
    statsPanel: { title: '📊 Estado', mode: 'Modo Resuelto', workers: 'Workers', sab: 'SharedArrayBuffer', wasm: 'WebAssembly', result: 'Resultado' },
    controls: {
      title: '🎮 Controles',
      modeLabel: 'Modo de ejecución:',
      modeAuto: '🤖 Auto (mejor disponible)',
      modeFile: '📄 Worker desde archivo',
      modeBlob: '💾 Blob URL Worker',
      modeMain: '🐌 Main Thread (síncrono)',
      modeHint: 'Auto elige la mejor opción según las capacidades detectadas',
      runButton: '🚀 Ejecutar Cómputo',
      redetect: '🔄 Re-detectar Capacidades'
    },
    logPanel: { title: '📝 Log', empty: 'Detecta capacidades y ejecuta un cómputo.' },
    logs: {
      detecting: '🔍 Detectando capacidades del navegador...',
      cores: '💻 Hardware concurrency: {{count}} threads',
      tierFull: '🏆 Threading completo disponible (SharedArrayBuffer + Workers)',
      tierWorkers: '⚡ Workers disponibles (sin memoria compartida)',
      tierNone: '🐌 Sin soporte de Workers — solo main thread',
      modeSelected: '▶️ Modo seleccionado: {{mode}}',
      blobCreated: '💾 Worker creado desde Blob URL (sin archivo separado)',
      blobCleanup: '🗑️ Blob URL liberada, worker terminado',
      mainThreadStart: '🐌 Ejecutando en main thread (bloqueará el UI)...',
      completed: '✅ Completado en modo {{mode}} en {{time}}ms',
      error: '❌ Error en modo {{mode}}: {{message}}',
      fallbackToMain: '⚠️ Cayendo a main thread como fallback...',
      logsCleared: 'Logs limpiados'
    },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Siempre detectar capacidades antes de usar APIs avanzadas (Workers, SAB, WASM)',
        'Blob URL Workers crean workers desde código inline — útil cuando CORS bloquea archivos separados',
        'El try/catch con fallback automático garantiza que la app SIEMPRE funciona, aunque degradada'
      ],
      tip: 'En producción, loguea qué modo se resuelve para cada usuario. Esto te da datos reales sobre qué porcentaje de tu audiencia puede usar threading.',
      usedBy: {
        title: '🏗️ Proyectos que usan este patrón',
        items: [
          'box2d3-wasm — Usa Blob URL Workers para cargar workers modulares y threading condicional (b2CreateThreadedWorld vs b2CreateWorld)',
          'sql.js — SQLite compilado a WASM, detecta SharedArrayBuffer y degrada a single-threaded si no está disponible'
        ]
      }
    }
  },
  en: {
    title: '🛡️ Graceful Degradation + Blob Workers',
    subtitle: 'Example 14: Capability detection, Blob URL Workers, and automatic fallback',
    infoTitle: '💡 What does this example illustrate?',
    infoDescription:
      'Combines three production patterns: 1) Browser capability detection to choose the best execution strategy, 2) Blob URL Workers that create workers dynamically from inline code (no separate files), and 3) Automatic fallback to main thread when workers fail.',
    prerequisite:
      '💡 In production, you cannot assume all browsers support the same APIs. This example teaches capability detection and automatic degradation: if threading is available → use it, if not → execute synchronously.',
    comparison: {
      badTitle: '❌ Without Degradation',
      badItems: ['Fails if browser lacks Workers', 'Requires separate worker files (CORS)', 'Unrecoverable error if worker fails', 'Code coupled to one strategy'],
      goodTitle: '✅ Graceful Degradation',
      goodItems: ['Detects capabilities before executing', 'Blob URL Workers avoid CORS issues', 'Automatic fallback to main thread', 'Single API, multiple implementations']
    },
    capabilityTitle: '🔍 Detected Capabilities',
    capabilityNames: { workers: 'Web Workers', sab: 'SharedArrayBuffer', atomics: 'Atomics', wasm: 'WebAssembly', moduleWorkers: 'Module Workers' },
    codeSummary: '📖 View Code - How does it work?',
    codeSections: { detection: '1️⃣ Capability Detection', blobWorker: '2️⃣ Blob URL Worker (dynamic worker)', autoResolve: '3️⃣ Auto-Resolve Execution Mode' },
    statsPanel: { title: '📊 Status', mode: 'Resolved Mode', workers: 'Workers', sab: 'SharedArrayBuffer', wasm: 'WebAssembly', result: 'Result' },
    controls: { title: '🎮 Controls', modeLabel: 'Execution mode:', modeAuto: '🤖 Auto (best available)', modeFile: '📄 File Worker', modeBlob: '💾 Blob URL Worker', modeMain: '🐌 Main Thread (sync)', modeHint: 'Auto picks the best option based on detected capabilities', runButton: '🚀 Run Computation', redetect: '🔄 Re-detect Capabilities' },
    logPanel: { title: '📝 Log', empty: 'Detect capabilities and run a computation.' },
    logs: { detecting: '🔍 Detecting browser capabilities...', cores: '💻 Hardware concurrency: {{count}} threads', tierFull: '🏆 Full threading available (SharedArrayBuffer + Workers)', tierWorkers: '⚡ Workers available (no shared memory)', tierNone: '🐌 No Worker support — main thread only', modeSelected: '▶️ Mode selected: {{mode}}', blobCreated: '💾 Worker created from Blob URL (no separate file)', blobCleanup: '🗑️ Blob URL revoked, worker terminated', mainThreadStart: '🐌 Running on main thread (will block UI)...', completed: '✅ Completed in {{mode}} mode in {{time}}ms', error: '❌ Error in {{mode}} mode: {{message}}', fallbackToMain: '⚠️ Falling back to main thread...', logsCleared: 'Logs cleared' },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'Always detect capabilities before using advanced APIs (Workers, SAB, WASM)',
        'Blob URL Workers create workers from inline code — useful when CORS blocks separate files',
        'try/catch with automatic fallback ensures the app ALWAYS works, even if degraded'
      ],
      tip: 'In production, log which mode resolves for each user. This gives you real data on what percentage of your audience can use threading.',
      usedBy: {
        title: '🏗️ Projects using this pattern',
        items: [
          'box2d3-wasm — Uses Blob URL Workers for modular worker loading and conditional threading (b2CreateThreadedWorld vs b2CreateWorld)',
          'sql.js — SQLite compiled to WASM, detects SharedArrayBuffer and degrades to single-threaded if unavailable'
        ]
      }
    }
  },
  pt: {
    title: '🛡️ Degradação Elegante + Blob Workers',
    subtitle: 'Exemplo 14: Detecção de capacidades, Blob URL Workers e fallback automático',
    infoTitle: '💡 O que este exemplo ilustra?',
    infoDescription: 'Combina três padrões de produção: detecção de capacidades, Blob URL Workers dinâmicos e fallback automático para main thread.',
    prerequisite: '💡 Em produção, você não pode assumir que todos os navegadores suportam as mesmas APIs. Este exemplo ensina a detectar e degradar automaticamente.',
    comparison: { badTitle: '❌ Sem Degradação', badItems: ['Falha se sem suporte Workers', 'Requer arquivos separados', 'Erro irrecuperável', 'Código acoplado'], goodTitle: '✅ Degradação Elegante', goodItems: ['Detecta capacidades', 'Blob URL Workers evitam CORS', 'Fallback automático', 'Uma API, múltiplas implementações'] },
    capabilityTitle: '🔍 Capacidades Detectadas',
    capabilityNames: { workers: 'Web Workers', sab: 'SharedArrayBuffer', atomics: 'Atomics', wasm: 'WebAssembly', moduleWorkers: 'Module Workers' },
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: { detection: '1️⃣ Detecção de Capacidades', blobWorker: '2️⃣ Blob URL Worker (worker dinâmico)', autoResolve: '3️⃣ Auto-Resolver Modo de Execução' },
    statsPanel: { title: '📊 Status', mode: 'Modo Resolvido', workers: 'Workers', sab: 'SharedArrayBuffer', wasm: 'WebAssembly', result: 'Resultado' },
    controls: { title: '🎮 Controles', modeLabel: 'Modo de execução:', modeAuto: '🤖 Auto (melhor disponível)', modeFile: '📄 Worker de arquivo', modeBlob: '💾 Blob URL Worker', modeMain: '🐌 Main Thread (síncrono)', modeHint: 'Auto escolhe a melhor opção', runButton: '🚀 Executar', redetect: '🔄 Re-detectar' },
    logPanel: { title: '📝 Log', empty: 'Detecte capacidades e execute um cálculo.' },
    logs: { detecting: '🔍 Detectando capacidades...', cores: '💻 Hardware concurrency: {{count}} threads', tierFull: '🏆 Threading completo disponível', tierWorkers: '⚡ Workers disponíveis', tierNone: '🐌 Sem Workers', modeSelected: '▶️ Modo: {{mode}}', blobCreated: '💾 Worker criado via Blob URL', blobCleanup: '🗑️ Blob URL liberada', mainThreadStart: '🐌 Executando na thread principal...', completed: '✅ Concluído em {{mode}} em {{time}}ms', error: '❌ Erro em {{mode}}: {{message}}', fallbackToMain: '⚠️ Caindo para main thread...', logsCleared: 'Logs limpos' },
    takeaways: {
      title: 'Pontos-Chave',
      items: ['Sempre detectar capacidades antes de usar APIs avançadas', 'Blob URL Workers criam workers sem arquivos separados', 'try/catch com fallback garante que a app funciona sempre'],
      tip: 'Em produção, registre qual modo é resolvido para cada usuário.',
      usedBy: {
        title: '🏗️ Projetos que usam este padrão',
        items: ['box2d3-wasm — Usa Blob URL Workers e threading condicional', 'sql.js — SQLite compilado para WASM, detecta SharedArrayBuffer']
      }
    }
  }
};
