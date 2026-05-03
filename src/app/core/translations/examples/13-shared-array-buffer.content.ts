export const sharedArrayBufferContent = {
  es: {
    title: '🧠 SharedArrayBuffer + Atomics',
    subtitle: 'Ejemplo 13: Memoria compartida real entre threads del navegador',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'SharedArrayBuffer permite que múltiples workers lean y escriban la MISMA región de memoria simultáneamente — sin copias. Es el mecanismo que habilita WebAssembly multi-threaded: todo el heap WASM se comparte como un SharedArrayBuffer entre los Web Workers.',
    prerequisite:
      '💡 En el Ejemplo 07 aprendiste Transferable Objects (zero-copy pero unidireccional). SharedArrayBuffer es el siguiente nivel: memoria compartida BIDIRECCIONAL entre todos los threads.',
    sabWarning: '⚠️ SharedArrayBuffer no está disponible. Tu servidor necesita las cabeceras: Cross-Origin-Embedder-Policy: require-corp y Cross-Origin-Opener-Policy: same-origin',
    comparison: {
      badTitle: '❌ Sin Atomics (Race Condition)',
      badItems: [
        'read-modify-write no es atómico',
        'Actualizaciones se pierden',
        'Resultado impredecible',
        'Bugs imposibles de reproducir'
      ],
      goodTitle: '✅ Con Atomics (Thread-Safe)',
      goodItems: [
        'Atomics.add() es atómico',
        'Ninguna actualización se pierde',
        'Resultado determinista',
        'Coordinación correcta entre threads'
      ]
    },
    codeSummary: '📖 Ver Código - ¿Cómo funciona SharedArrayBuffer?',
    codeSections: {
      createBuffer: '1️⃣ Crear y Compartir el Buffer',
      atomicOps: '2️⃣ Operaciones Atómicas (seguro)',
      raceCondition: '3️⃣ Sin Atomics = Race Condition'
    },
    statsPanel: {
      title: '📊 Resultados',
      sabSupport: 'SharedArrayBuffer',
      expected: 'Esperado',
      atomicResult: 'Resultado Atómico',
      unsafeResult: 'Resultado Sin Atomics',
      lostUpdates: 'Updates Perdidos'
    },
    controls: {
      title: '🎮 Controles',
      workersLabel: 'Workers concurrentes:',
      iterationsLabel: 'Iteraciones por worker:',
      iterationsHint: 'Más iteraciones = más evidente la race condition',
      runAtomic: '✅ Test Atómico (seguro)',
      runUnsafe: '💥 Test Sin Atomics (race condition)'
    },
    logPanel: { title: '📝 Log', empty: 'Ejecuta un test para ver los resultados.' },
    logs: {
      sabAvailable: '✅ SharedArrayBuffer disponible',
      sabUnavailable: '❌ SharedArrayBuffer NO disponible. Tu servidor necesita cabeceras COOP/COEP.',
      cpuInfo: '💻 Núcleos CPU: {{cores}}',
      atomicStart: '🔬 Iniciando test atómico: {{workers}} workers × {{iterations}} iteraciones',
      unsafeStart: '⚠️ Iniciando test INSEGURO: {{workers}} workers × {{iterations}} iteraciones (¡se perderán actualizaciones!)',
      workerDone: '✅ Worker #{{id}} completó {{local}} iteraciones',
      atomicResult: '🎯 Resultado atómico: {{result}} / {{expected}} esperado ({{time}}ms) — ¡PERFECTO!',
      unsafeResult: '💥 Resultado inseguro: {{result}} / {{expected}} esperado — ¡{{lost}} actualizaciones PERDIDAS! ({{time}}ms)',
      logsCleared: 'Logs limpiados'
    },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'SharedArrayBuffer comparte la MISMA memoria entre threads (a diferencia de postMessage que copia)',
        'Sin Atomics, las operaciones read-modify-write causan race conditions y pierden actualizaciones',
        'Es el mecanismo que habilita WebAssembly multi-threaded — sin él, los módulos WASM con pthreads no funcionan',
        'Requiere cabeceras COOP/COEP en el servidor — esto es un bloqueador común en producción'
      ],
      tip: 'SharedArrayBuffer es el mecanismo que habilita WebAssembly threading. Sin él, los módulos WASM multi-threaded no pueden funcionar.',
      usedBy: {
        title: '🏗️ Proyectos que usan este patrón',
        items: [
          'box2d3-wasm — Motor de física Box2D compilado a WASM, usa SharedArrayBuffer para compartir el heap entre pthreads',
          'ffmpeg.wasm — FFmpeg compilado a WebAssembly, usa SharedArrayBuffer para procesamiento de video multi-threaded'
        ]
      }
    }
  },
  en: {
    title: '🧠 SharedArrayBuffer + Atomics',
    subtitle: 'Example 13: Real shared memory between browser threads',
    infoTitle: '💡 What does this example illustrate?',
    infoDescription:
      'SharedArrayBuffer allows multiple workers to read and write the SAME memory region simultaneously — no copies. It is the mechanism that enables multi-threaded WebAssembly: the entire WASM heap is shared as a SharedArrayBuffer between Web Workers.',
    prerequisite:
      '💡 In Example 07 you learned Transferable Objects (zero-copy but one-way). SharedArrayBuffer is the next level: BIDIRECTIONAL shared memory between all threads.',
    sabWarning: '⚠️ SharedArrayBuffer is not available. Your server needs headers: Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Opener-Policy: same-origin',
    comparison: {
      badTitle: '❌ Without Atomics (Race Condition)',
      badItems: ['read-modify-write is not atomic', 'Updates are lost', 'Unpredictable result', 'Impossible to reproduce bugs'],
      goodTitle: '✅ With Atomics (Thread-Safe)',
      goodItems: ['Atomics.add() is atomic', 'No updates lost', 'Deterministic result', 'Correct thread coordination']
    },
    codeSummary: '📖 View Code - How does SharedArrayBuffer work?',
    codeSections: { createBuffer: '1️⃣ Create and Share the Buffer', atomicOps: '2️⃣ Atomic Operations (safe)', raceCondition: '3️⃣ Without Atomics = Race Condition' },
    statsPanel: { title: '📊 Results', sabSupport: 'SharedArrayBuffer', expected: 'Expected', atomicResult: 'Atomic Result', unsafeResult: 'Unsafe Result', lostUpdates: 'Lost Updates' },
    controls: { title: '🎮 Controls', workersLabel: 'Concurrent workers:', iterationsLabel: 'Iterations per worker:', iterationsHint: 'More iterations = more evident race condition', runAtomic: '✅ Atomic Test (safe)', runUnsafe: '💥 Non-Atomic Test (race condition)' },
    logPanel: { title: '📝 Log', empty: 'Run a test to see results.' },
    logs: { sabAvailable: '✅ SharedArrayBuffer available', sabUnavailable: '❌ SharedArrayBuffer NOT available. Your server needs COOP/COEP headers.', cpuInfo: '💻 CPU cores: {{cores}}', atomicStart: '🔬 Starting atomic test: {{workers}} workers × {{iterations}} iterations', unsafeStart: '⚠️ Starting UNSAFE test: {{workers}} workers × {{iterations}} iterations (updates WILL be lost!)', workerDone: '✅ Worker #{{id}} completed {{local}} iterations', atomicResult: '🎯 Atomic result: {{result}} / {{expected}} expected ({{time}}ms) — PERFECT!', unsafeResult: '💥 Unsafe result: {{result}} / {{expected}} expected — {{lost}} updates LOST! ({{time}}ms)', logsCleared: 'Logs cleared' },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'SharedArrayBuffer shares the SAME memory between threads (unlike postMessage which copies)',
        'Without Atomics, read-modify-write operations cause race conditions and lose updates',
        'It is the mechanism that enables multi-threaded WebAssembly — without it, WASM modules with pthreads cannot work',
        'Requires COOP/COEP headers on the server — this is a common blocker in production'
      ],
      tip: 'SharedArrayBuffer is the mechanism that enables WebAssembly threading. Without it, multi-threaded WASM modules cannot work.',
      usedBy: {
        title: '🏗️ Projects using this pattern',
        items: [
          'box2d3-wasm — Box2D physics engine compiled to WASM, uses SharedArrayBuffer to share the heap between pthreads',
          'ffmpeg.wasm — FFmpeg compiled to WebAssembly, uses SharedArrayBuffer for multi-threaded video processing'
        ]
      }
    }
  },
  pt: {
    title: '🧠 SharedArrayBuffer + Atomics',
    subtitle: 'Exemplo 13: Memória compartilhada real entre threads do navegador',
    infoTitle: '💡 O que este exemplo ilustra?',
    infoDescription: 'SharedArrayBuffer permite que múltiplos workers leiam e escrevam na MESMA região de memória simultaneamente — sem cópias. É o mecanismo que habilita WebAssembly multi-threaded.',
    prerequisite: '💡 No Exemplo 07 você aprendeu Transferable Objects. SharedArrayBuffer é o próximo nível: memória compartilhada BIDIRECIONAL.',
    sabWarning: '⚠️ SharedArrayBuffer não está disponível. Seu servidor precisa das headers COOP/COEP.',
    comparison: { badTitle: '❌ Sem Atomics (Race Condition)', badItems: ['read-modify-write não é atômico', 'Atualizações são perdidas', 'Resultado imprevisível', 'Bugs impossíveis de reproduzir'], goodTitle: '✅ Com Atomics (Thread-Safe)', goodItems: ['Atomics.add() é atômico', 'Nenhuma atualização perdida', 'Resultado determinístico', 'Coordenação correta entre threads'] },
    codeSummary: '📖 Ver Código - Como funciona SharedArrayBuffer?',
    codeSections: { createBuffer: '1️⃣ Criar e Compartilhar o Buffer', atomicOps: '2️⃣ Operações Atômicas (seguro)', raceCondition: '3️⃣ Sem Atomics = Race Condition' },
    statsPanel: { title: '📊 Resultados', sabSupport: 'SharedArrayBuffer', expected: 'Esperado', atomicResult: 'Resultado Atômico', unsafeResult: 'Resultado Inseguro', lostUpdates: 'Updates Perdidos' },
    controls: { title: '🎮 Controles', workersLabel: 'Workers concorrentes:', iterationsLabel: 'Iterações por worker:', iterationsHint: 'Mais iterações = race condition mais evidente', runAtomic: '✅ Teste Atômico (seguro)', runUnsafe: '💥 Teste Sem Atomics (race condition)' },
    logPanel: { title: '📝 Log', empty: 'Execute um teste para ver os resultados.' },
    logs: { sabAvailable: '✅ SharedArrayBuffer disponível', sabUnavailable: '❌ SharedArrayBuffer NÃO disponível.', cpuInfo: '💻 Núcleos CPU: {{cores}}', atomicStart: '🔬 Iniciando teste atômico: {{workers}} workers × {{iterations}} iterações', unsafeStart: '⚠️ Iniciando teste INSEGURO', workerDone: '✅ Worker #{{id}} concluiu {{local}} iterações', atomicResult: '🎯 Resultado atômico: {{result}} / {{expected}} — PERFEITO!', unsafeResult: '💥 Resultado inseguro: {{result}} / {{expected}} — {{lost}} atualizações PERDIDAS!', logsCleared: 'Logs limpos' },
    takeaways: {
      title: 'Pontos-Chave',
      items: ['SharedArrayBuffer compartilha a MESMA memória entre threads', 'Sem Atomics, operações causam race conditions', 'É o mecanismo que habilita WebAssembly multi-threaded', 'Requer headers COOP/COEP no servidor'],
      tip: 'SharedArrayBuffer é o mecanismo que habilita threading em WebAssembly.',
      usedBy: {
        title: '🏗️ Projetos que usam este padrão',
        items: ['box2d3-wasm — Motor de física Box2D compilado para WASM', 'ffmpeg.wasm — FFmpeg compilado para WebAssembly']
      }
    }
  }
};
