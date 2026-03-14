export const offloadingComputationContent = {
  es: {
    title: '⚡ Descarga de Cómputo Pesado',
    subtitle: 'Ejemplo 04: Evitando el bloqueo de la UI',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Calcula números primos de forma intensiva. Prueba ambos botones y observa cómo el contador y la animación se comportan diferente cuando el cálculo se hace en el hilo principal vs. en un worker.',
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
    }
  },
  en: {
    title: '⚡ Heavy Computation Offloading',
    subtitle: 'Example 04: Avoiding UI freezes',
    infoTitle: '💡 What does this example show?',
    infoDescription:
      'It calculates prime numbers intensively. Try both buttons and see how the counter and animation behave differently when the calculation runs on the main thread versus a worker.',
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
    }
  },
  pt: {
    title: '⚡ Descarga de Cálculo Pesado',
    subtitle: 'Exemplo 04: Evitando travamentos na UI',
    infoTitle: '💡 O que este exemplo demonstra?',
    infoDescription:
      'Calcula números primos de forma intensiva. Experimente ambos os botões e observe como o contador e a animação se comportam de maneira diferente quando o cálculo ocorre na thread principal ou em um worker.',
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
    }
  }
};
