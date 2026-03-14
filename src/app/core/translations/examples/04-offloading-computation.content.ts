export const offloadingComputationContent = {
  es: {
    title: '⚡ Descarga de Cómputo Pesado',
    subtitle: 'Ejemplo 04: Evitando el bloqueo de la UI',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Calcula números primos de forma intensiva. Prueba ambos botones y observa cómo el contador y la animación se comportan diferente cuando el cálculo se hace en el hilo principal vs. en un worker.',
    prerequisite:
      '💡 En el Ejemplo 02 viste el problema. En el 03 aprendiste a comunicarte con un worker. Ahora combinarás ambos para resolver el bloqueo de la UI.',
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      createWorker: '1️⃣ Crear Worker para Cómputo',
      sendTask: '2️⃣ Enviar Tarea al Worker',
      processInWorker: '3️⃣ Procesar en Worker',
      receiveResult: '4️⃣ Recibir Resultado'
    },
    demo: {
      title: '🔢 Calculadora de Números Primos',
      countLabel: '¿Cuántos números primos calcular?',
      workerButton: '🚀 Calcular con Worker',
      workerNote: '(No bloquea la UI)',
      mainButton: '🐌 Calcular en Hilo Principal',
      mainNote: '(Bloquea la UI)'
    },
    result: {
      completedPrefix: '✅ Cálculo completado con',
      totalLabel: 'Total calculados:',
      primesSuffix: 'números primos',
      lastFiveLabel: 'Últimos 5:',
      durationLabel: 'Tiempo transcurrido:',
      durationUnit: 'ms',
      largestLabel: 'Número primo más grande:',
      methodLabels: { worker: 'Worker', main: 'Hilo Principal' },
      warningTitle: '⚠️ Nota:',
      warningDescription:
        'Durante este cálculo, la UI estuvo completamente congelada. El contador se detuvo y las animaciones dejaron de funcionar.'
    },
    uiTest: {
      title: '🎯 Prueba de Respuesta de la UI',
      info: 'Si la UI está bloqueada, este contador se congelará',
      note: 'La caja debería seguir rebotando suavemente'
    },
    alerts: { unsupported: 'Web Workers no soportados en este navegador' },
    logs: {
      workerStart: '🚀 Iniciando cálculo de {{count}} números primos en Worker...',
      workerComplete: '✅ Worker completó el cálculo',
      workerError: '❌ Error en el worker',
      mainStart: '🐌 Iniciando cálculo de {{count}} números primos en el hilo principal...',
      mainWarning: '⚠️ La UI se congelará durante el cálculo',
      mainComplete: '✅ Cálculo en hilo principal completado'
    },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Mover cálculos al worker mantiene la UI completamente fluida',
        'Descargar trabajo mejora la respuesta (INP) y puede ayudar al LCP al reducir long tasks en el hilo principal',
        'El mismo algoritmo produce los mismos resultados en ambos hilos',
        'El worker no tiene acceso al DOM ni a window'
      ],
      tip: 'OMT reduce riesgo y mejora la fluidez percibida; el tiempo total puede ser similar o algo mayor por el paso de mensajes. Compara siempre con y sin worker para justificar la complejidad.'
    }
  },
  en: {
    title: '⚡ Heavy Computation Offloading',
    subtitle: 'Example 04: Avoiding UI freezes',
    infoTitle: '💡 What does this example show?',
    infoDescription:
      'It calculates prime numbers intensively. Try both buttons and see how the counter and animation behave differently when the calculation runs on the main thread versus a worker.',
    prerequisite:
      '💡 In Example 02 you saw the problem. In 03 you learned to communicate with a worker. Now you\'ll combine both to solve UI blocking.',
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      createWorker: '1️⃣ Create Worker for Computation',
      sendTask: '2️⃣ Send Task to the Worker',
      processInWorker: '3️⃣ Process inside the Worker',
      receiveResult: '4️⃣ Receive Result'
    },
    demo: {
      title: '🔢 Prime Number Calculator',
      countLabel: 'How many prime numbers to calculate?',
      workerButton: '🚀 Calculate with Worker',
      workerNote: '(Does not block the UI)',
      mainButton: '🐌 Calculate on Main Thread',
      mainNote: '(Blocks the UI)'
    },
    result: {
      completedPrefix: '✅ Calculation completed with',
      totalLabel: 'Total computed:',
      primesSuffix: 'prime numbers',
      lastFiveLabel: 'Last 5:',
      durationLabel: 'Elapsed time:',
      durationUnit: 'ms',
      largestLabel: 'Largest prime:',
      methodLabels: { worker: 'Worker', main: 'Main Thread' },
      warningTitle: '⚠️ Note:',
      warningDescription:
        'During this calculation the UI was completely frozen. The counter stopped and animations paused.'
    },
    uiTest: {
      title: '🎯 UI Responsiveness Test',
      info: 'If the UI is blocked, this counter will freeze',
      note: 'The square should keep bouncing smoothly'
    },
    alerts: { unsupported: 'Web Workers are not supported in this browser' },
    logs: {
      workerStart: '🚀 Starting calculation of {{count}} prime numbers in the worker...',
      workerComplete: '✅ Worker finished the calculation',
      workerError: '❌ Worker error',
      mainStart: '🐌 Starting calculation of {{count}} prime numbers on the main thread...',
      mainWarning: '⚠️ The UI will freeze during this calculation',
      mainComplete: '✅ Main thread calculation completed'
    },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'Moving computations to the worker keeps the UI fully responsive',
        'Offloading improves responsiveness (INP) and can help LCP by reducing long tasks on the main thread',
        'The same algorithm produces identical results on both threads',
        'Workers have no access to the DOM or window'
      ],
      tip: 'OMT reduces risk and improves perceived responsiveness; total time may be similar or slightly higher due to message passing. Always compare with and without a worker to justify the complexity.'
    }
  },
  pt: {
    title: '⚡ Descarga de Cálculo Pesado',
    subtitle: 'Exemplo 04: Evitando travamentos na UI',
    infoTitle: '💡 O que este exemplo demonstra?',
    infoDescription:
      'Calcula números primos de forma intensiva. Experimente ambos os botões e observe como o contador e a animação se comportam de maneira diferente quando o cálculo ocorre na thread principal ou em um worker.',
    prerequisite:
      '💡 No Exemplo 02 você viu o problema. No 03 aprendeu a se comunicar com um worker. Agora combinará ambos para resolver o bloqueio da UI.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      createWorker: '1️⃣ Criar Worker para Cálculo',
      sendTask: '2️⃣ Enviar tarefa para o Worker',
      processInWorker: '3️⃣ Processar no Worker',
      receiveResult: '4️⃣ Receber Resultado'
    },
    demo: {
      title: '🔢 Calculadora de Números Primos',
      countLabel: 'Quantos números primos calcular?',
      workerButton: '🚀 Calcular com Worker',
      workerNote: '(Não bloqueia a UI)',
      mainButton: '🐌 Calcular na Thread Principal',
      mainNote: '(Bloqueia a UI)'
    },
    result: {
      completedPrefix: '✅ Cálculo concluído com',
      totalLabel: 'Total calculado:',
      primesSuffix: 'números primos',
      lastFiveLabel: 'Últimos 5:',
      durationLabel: 'Tempo decorrido:',
      durationUnit: 'ms',
      largestLabel: 'Maior número primo:',
      methodLabels: { worker: 'Worker', main: 'Thread Principal' },
      warningTitle: '⚠️ Nota:',
      warningDescription:
        'Durante este cálculo a UI ficou completamente congelada. O contador parou e as animações foram interrompidas.'
    },
    uiTest: {
      title: '🎯 Teste de Responsividade da UI',
      info: 'Se a UI estiver bloqueada, este contador vai congelar',
      note: 'O quadrado deve continuar se movendo suavemente'
    },
    alerts: { unsupported: 'Web Workers não são suportados neste navegador' },
    logs: {
      workerStart: '🚀 Iniciando o cálculo de {{count}} números primos no worker...',
      workerComplete: '✅ Worker concluiu o cálculo',
      workerError: '❌ Erro no worker',
      mainStart: '🐌 Iniciando o cálculo de {{count}} números primos na thread principal...',
      mainWarning: '⚠️ A UI ficará congelada durante o cálculo',
      mainComplete: '✅ Cálculo na thread principal concluído'
    },
    takeaways: {
      title: 'Pontos-Chave',
      items: [
        'Mover cálculos para o worker mantém a UI completamente fluida',
        'Descarregar trabalho melhora a responsividade (INP) e pode ajudar o LCP ao reduzir long tasks na thread principal',
        'O mesmo algoritmo produz resultados idênticos em ambas as threads',
        'O worker não tem acesso ao DOM nem ao window'
      ],
      tip: 'OMT reduz risco e melhora a fluidez percebida; o tempo total pode ser similar ou um pouco maior devido à troca de mensagens. Compare sempre com e sem worker para justificar a complexidade.'
    }
  }
};
