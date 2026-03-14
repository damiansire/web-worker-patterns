export const setIntervalCounterContent = {
  es: {
    title: '⏱️ Contador con setInterval',
    subtitle: 'Ejemplo 01: Fundamentos de JavaScript - Ejecución periódica',
    infoTitle: '💡 ¿Qué enseña este ejemplo?',
    infoDescription:
      'Este ejemplo muestra cómo usar setInterval para ejecutar código periódicamente. Es fundamental entender esto antes de aprender sobre Web Workers, ya que los contadores son una forma común de demostrar cómo el hilo principal puede bloquearse.',
    codeSummary: '📖 Ver Código - ¿Cómo funciona?',
    codeSections: {
      createCounter: '1️⃣ Crear un Contador',
      setInterval: '2️⃣ Usar setInterval',
      clearInterval: '3️⃣ Detener el Contador',
      whyImportant: '4️⃣ ¿Por qué es importante?',
      angularImplementation: 'Implementación en Angular'
    },
    demo: {
      title: '🔢 Demo: Contador con setInterval',
      counterLabel: 'Contador activo',
      startButton: '▶️ Iniciar',
      pauseButton: '⏸️ Pausar',
      resetButton: '🔄 Reiniciar',
      speedLabel: 'Velocidad',
      speedUnit: 'ms'
    },
    threadView: {
      title: '🧵 Visualización del Hilo Principal',
      description:
        'Observa cómo las tareas se agregan a la cola, se procesan en el hilo principal y se completan. Esto te ayudará a entender qué pasa cuando el hilo se bloquea.',
      modeReal: 'Modo Real',
      modeSlow: 'Modo Lento',
      queueLabel: 'Cola de Tareas',
      queueEmpty: 'Sin tareas pendientes',
      mainThreadLabel: 'Hilo Principal',
      idleLabel: 'En reposo',
      resultLabel: 'Resultado',
      resultText: 'Contador actualizado',
      taskTypes: { interval: 'setInterval', render: 'Renderizado' }
    },
    noteTitle: '📝 Nota',
    noteDescription:
      'Este contador funciona perfectamente porque el hilo principal está libre. En el siguiente ejemplo (Bloqueo del Main Thread) verás qué pasa cuando el hilo principal está ocupado con cálculos pesados.'
  },
  en: {
    title: '⏱️ Counter with setInterval',
    subtitle: 'Example 01: JavaScript Fundamentals - Periodic Execution',
    infoTitle: '💡 What does this example teach?',
    infoDescription:
      "This example shows how to use setInterval to execute code periodically. It's fundamental to understand this before learning about Web Workers, as counters are a common way to demonstrate how the main thread can be blocked.",
    codeSummary: '📖 View Code - How does it work?',
    codeSections: {
      createCounter: '1️⃣ Create a Counter',
      setInterval: '2️⃣ Use setInterval',
      clearInterval: '3️⃣ Stop the Counter',
      whyImportant: '4️⃣ Why is it important?',
      angularImplementation: 'Angular Implementation'
    },
    demo: {
      title: '🔢 Demo: Counter with setInterval',
      counterLabel: 'Active counter',
      startButton: '▶️ Start',
      pauseButton: '⏸️ Pause',
      resetButton: '🔄 Reset',
      speedLabel: 'Speed',
      speedUnit: 'ms'
    },
    threadView: {
      title: '🧵 Main Thread Visualization',
      description:
        'Watch how tasks are added to the queue, processed in the main thread, and completed. This will help you understand what happens when the thread gets blocked.',
      modeReal: 'Real Mode',
      modeSlow: 'Slow Mode',
      queueLabel: 'Task Queue',
      queueEmpty: 'No pending tasks',
      mainThreadLabel: 'Main Thread',
      idleLabel: 'Idle',
      resultLabel: 'Result',
      resultText: 'Counter updated',
      taskTypes: { interval: 'setInterval', render: 'Rendering' }
    },
    noteTitle: '📝 Note',
    noteDescription:
      "This counter works perfectly because the main thread is free. In the next example (Main Thread Blocking) you'll see what happens when the main thread is busy with heavy calculations."
  },
  pt: {
    title: '⏱️ Contador com setInterval',
    subtitle: 'Exemplo 01: Fundamentos de JavaScript - Execução Periódica',
    infoTitle: '💡 O que este exemplo ensina?',
    infoDescription:
      'Este exemplo mostra como usar setInterval para executar código periodicamente. É fundamental entender isso antes de aprender sobre Web Workers, pois os contadores são uma forma comum de demonstrar como a thread principal pode ser bloqueada.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      createCounter: '1️⃣ Criar um Contador',
      setInterval: '2️⃣ Usar setInterval',
      clearInterval: '3️⃣ Parar o Contador',
      whyImportant: '4️⃣ Por que é importante?',
      angularImplementation: 'Implementação em Angular'
    },
    demo: {
      title: '🔢 Demo: Contador com setInterval',
      counterLabel: 'Contador ativo',
      startButton: '▶️ Iniciar',
      pauseButton: '⏸️ Pausar',
      resetButton: '🔄 Reiniciar',
      speedLabel: 'Velocidade',
      speedUnit: 'ms'
    },
    threadView: {
      title: '🧵 Visualização da Thread Principal',
      description:
        'Observe como as tarefas são adicionadas à fila, processadas na thread principal e concluídas. Isso ajudará você a entender o que acontece quando a thread é bloqueada.',
      modeReal: 'Modo Real',
      modeSlow: 'Modo Lento',
      queueLabel: 'Fila de Tarefas',
      queueEmpty: 'Sem tarefas pendentes',
      mainThreadLabel: 'Thread Principal',
      idleLabel: 'Em repouso',
      resultLabel: 'Resultado',
      resultText: 'Contador atualizado',
      taskTypes: { interval: 'setInterval', render: 'Renderização' }
    },
    noteTitle: '📝 Nota',
    noteDescription:
      'Este contador funciona perfeitamente porque a thread principal está livre. No próximo exemplo (Bloqueio da Thread Principal) você verá o que acontece quando a thread principal está ocupada com cálculos pesados.'
  }
};
