export const mainThreadContent = {
  es: {
    title: '🔒 Bloqueo del Main Thread',
    subtitle: 'Ejemplo 02: El problema que resuelven los Web Workers',
    infoTitle: '⚠️ ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Este ejemplo muestra qué pasa cuando ejecutamos cálculos pesados directamente en el hilo principal. Observa cómo la UI se congela completamente durante el cálculo de números primos.',
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      calculatePrimes: '1️⃣ Función de Cálculo de Números Primos',
      executeInMain: '2️⃣ Ejecutar Cálculo en el Main Thread',
      problem: '3️⃣ El Problema'
    },
    demo: {
      title: '🔢 Calculadora de Números Primos (Main Thread)',
      countLabel: '¿Cuántos números primos calcular?',
      button: '🔒 Calcular en Main Thread',
      note: '(La UI se bloqueará)'
    },
    result: {
      completedPrefix: '✅ Cálculo completado',
      totalLabel: 'Total calculados:',
      primesSuffix: 'números primos',
      lastFiveLabel: 'Últimos 5:',
      durationLabel: 'Tiempo transcurrido:',
      durationUnit: 'ms',
      largestLabel: 'Número primo más grande:',
      warningTitle: '⚠️ Nota importante:',
      warningDescription:
        'Durante este cálculo, la UI estuvo completamente congelada. El contador se detuvo y las animaciones dejaron de funcionar. Este es el problema que los Web Workers resuelven.'
    },
    processorView: {
      title: '💻 Lo que sucede dentro del procesador',
      description:
        'Observa cómo el procesador evalúa cada número en tiempo real. Los números verdes son primos y los rojos no lo son. Nota cómo se van agregando mientras el hilo principal está bloqueado.',
      processing: 'Procesando...',
      numbersEvaluated: 'números evaluados',
      currentNumberLabel: 'Revisando:',
      binaryLabel: 'binario'
    },
    uiTest: {
      title: '🎯 Prueba de Respuesta de la UI',
      info: 'Si la UI está bloqueada, este contador se congelará',
      note: 'La caja debería seguir rebotando suavemente',
      testTitle: '⚠️ Prueba esto:',
      testDescription:
        'Haz clic en "Calcular" y observa cómo el contador se congela completamente. Esto es exactamente el problema que los Web Workers resuelven.'
    },
    logs: {
      mainStart: '🔒 Iniciando cálculo de {{count}} números primos en el Main Thread...',
      mainWarning: '⚠️ ADVERTENCIA: La UI se congelará durante el cálculo',
      mainComplete: '✅ Cálculo en Main Thread completado'
    },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Los cálculos pesados bloquean completamente la interfaz',
        'El usuario no puede interactuar mientras el hilo principal trabaja',
        'Los Web Workers permiten mover este trabajo a un hilo separado'
      ],
      tip: 'Cualquier operación que tarde más de 50ms debería considerarse para un Web Worker.'
    }
  },
  en: {
    title: '🔒 Main Thread Blocking',
    subtitle: 'Example 02: The problem Web Workers solve',
    infoTitle: '⚠️ What does this example show?',
    infoDescription:
      'This example shows what happens when we run heavy calculations directly on the main thread. Notice how the UI completely freezes during the prime number calculation.',
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      calculatePrimes: '1️⃣ Prime Number Calculation Function',
      executeInMain: '2️⃣ Execute Calculation on Main Thread',
      problem: '3️⃣ The Problem'
    },
    demo: {
      title: '🔢 Prime Number Calculator (Main Thread)',
      countLabel: 'How many prime numbers to calculate?',
      button: '🔒 Calculate on Main Thread',
      note: '(The UI will freeze)'
    },
    result: {
      completedPrefix: '✅ Calculation completed',
      totalLabel: 'Total computed:',
      primesSuffix: 'prime numbers',
      lastFiveLabel: 'Last 5:',
      durationLabel: 'Elapsed time:',
      durationUnit: 'ms',
      largestLabel: 'Largest prime:',
      warningTitle: '⚠️ Important note:',
      warningDescription:
        'During this calculation, the UI was completely frozen. The counter stopped and animations paused. This is the problem that Web Workers solve.'
    },
    processorView: {
      title: '💻 What happens inside the processor',
      description:
        'Watch how the processor evaluates each number in real time. Green numbers are primes and red ones are not. Notice how they are added while the main thread is blocked.',
      processing: 'Processing...',
      numbersEvaluated: 'numbers evaluated',
      currentNumberLabel: 'Reviewing:',
      binaryLabel: 'binary'
    },
    uiTest: {
      title: '🎯 UI Responsiveness Test',
      info: 'If the UI is blocked, this counter will freeze',
      note: 'The square should keep bouncing smoothly',
      testTitle: '⚠️ Try this:',
      testDescription:
        'Click "Calculate" and watch how the counter freezes completely. This is exactly the problem that Web Workers solve.'
    },
    logs: {
      mainStart: '🔒 Starting calculation of {{count}} prime numbers on the Main Thread...',
      mainWarning: '⚠️ WARNING: The UI will freeze during this calculation',
      mainComplete: '✅ Main Thread calculation completed'
    },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'Heavy computations completely block the interface',
        'Users cannot interact while the main thread is working',
        'Web Workers allow moving this work to a separate thread'
      ],
      tip: 'Any operation taking longer than 50ms should be considered for a Web Worker.'
    }
  },
  pt: {
    title: '🔒 Bloqueio da Thread Principal',
    subtitle: 'Exemplo 02: O problema que os Web Workers resolvem',
    infoTitle: '⚠️ O que este exemplo mostra?',
    infoDescription:
      'Este exemplo mostra o que acontece quando executamos cálculos pesados diretamente na thread principal. Observe como a interface congela completamente durante o cálculo de números primos.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      calculatePrimes: '1️⃣ Função de Cálculo de Números Primos',
      executeInMain: '2️⃣ Executar Cálculo na Thread Principal',
      problem: '3️⃣ O Problema'
    },
    demo: {
      title: '🔢 Calculadora de Números Primos (Thread Principal)',
      countLabel: 'Quantos números primos calcular?',
      button: '🔒 Calcular na Thread Principal',
      note: '(A interface será bloqueada)'
    },
    result: {
      completedPrefix: '✅ Cálculo concluído',
      totalLabel: 'Total calculado:',
      primesSuffix: 'números primos',
      lastFiveLabel: 'Últimos 5:',
      durationLabel: 'Tempo decorrido:',
      durationUnit: 'ms',
      largestLabel: 'Maior número primo:',
      warningTitle: '⚠️ Nota importante:',
      warningDescription:
        'Durante este cálculo, a interface ficou completamente congelada. O contador parou e as animações foram interrompidas. Este é o problema que os Web Workers resolvem.'
    },
    processorView: {
      title: '💻 O que acontece dentro do processador',
      description:
        'Observe como o processador avalia cada número em tempo real. Os números verdes são primos e os vermelhos não são. Note como eles são adicionados enquanto a thread principal está bloqueada.',
      processing: 'Processando...',
      numbersEvaluated: 'números avaliados',
      currentNumberLabel: 'Revisando:',
      binaryLabel: 'binário'
    },
    uiTest: {
      title: '🎯 Teste de Responsividade da Interface',
      info: 'Se a interface estiver bloqueada, este contador vai congelar',
      note: 'O quadrado deve continuar se movendo suavemente',
      testTitle: '⚠️ Experimente isto:',
      testDescription:
        'Clique em "Calcular" e observe como o contador congela completamente. Este é exatamente o problema que os Web Workers resolvem.'
    },
    logs: {
      mainStart: '🔒 Iniciando o cálculo de {{count}} números primos na Thread Principal...',
      mainWarning: '⚠️ AVISO: A interface ficará congelada durante o cálculo',
      mainComplete: '✅ Cálculo na Thread Principal concluído'
    },
    takeaways: {
      title: 'Pontos-Chave',
      items: [
        'Cálculos pesados bloqueiam completamente a interface',
        'O usuário não pode interagir enquanto a thread principal trabalha',
        'Web Workers permitem mover este trabalho para uma thread separada'
      ],
      tip: 'Qualquer operação que demore mais de 50ms deve ser considerada para um Web Worker.'
    }
  }
};
