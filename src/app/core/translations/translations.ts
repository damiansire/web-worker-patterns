export const translations = {
  es: {
    common: {
      appTitle: '🚀 Patrones de Web Workers',
      appSubtitle: 'Aprende a usar Web Workers con ejemplos prácticos e interactivos',
      footerMadeWithLove: 'Hecho con ❤️ para la comunidad de desarrolladores',
      footerMdnLink: 'Documentación de MDN'
    },
    language: {
      selectorTitle: 'Selecciona tu idioma',
      selectorDescription: 'Elige el idioma para la experiencia completa de la aplicación.',
      spanish: 'Español',
      english: 'Inglés',
      portuguese: 'Portugués',
      changeButton: 'Cambiar idioma',
      closeButton: 'Mantener idioma actual'
    },
    codeExplanation: {
      angularButton: 'Angular',
      javascriptButton: 'JavaScript',
      emptyState: {
        angular: 'Aún no hay código Angular disponible para este ejemplo.',
        javascript: 'Aún no hay código JavaScript disponible para este ejemplo.'
      }
    },
    sidebar: {
      title: '📚 Ejemplos'
    },
    examplesMeta: {
      setIntervalCounter: {
        title: 'Contador con setInterval',
        description: 'Aprende los fundamentos de JavaScript: cómo usar setInterval para ejecutar código periódicamente. Esencial antes de entender Web Workers.',
        tags: ['Fundamentos', 'JavaScript']
      },
      mainThread: {
        title: 'Bloqueo del Main Thread',
        description: 'Comprende el problema que los Web Workers resuelven. Observa cómo el cálculo de números primos bloquea completamente el hilo principal y congela la UI.',
        tags: ['Problema', 'Fundamentos']
      },
      basicCommunication: {
        title: 'Comunicación Básica',
        description: 'El "Hola Mundo" de los Web Workers. Aprende cómo el hilo principal y el worker se comunican mediante mensajes usando postMessage y onmessage.',
        tags: ['Básico', 'Fundamentos']
      },
      offloadingComputation: {
        title: 'Descarga de Cómputo',
        description: 'Descubre cómo evitar que la UI se congele ejecutando cálculos pesados (como números primos) en un worker separado del hilo principal.',
        tags: ['Performance', 'Cálculos']
      },
      transferableObjects: {
        title: 'Objetos Transferibles',
        description: 'Optimiza el rendimiento transfiriendo la propiedad de objetos grandes como ArrayBuffer en lugar de clonarlos. Perfecto para imágenes y datos binarios.',
        tags: ['Optimización', 'ArrayBuffer']
      },
      errorHandling: {
        title: 'Manejo de Errores',
        description: 'Aprende a capturar y manejar errores que ocurren dentro de un worker usando el evento onerror. Incluye ejemplos de diferentes tipos de errores.',
        tags: ['Debugging', 'Errores']
      },
      sharedWorker: {
        title: 'Shared Worker',
        description: 'Explora cómo un Shared Worker puede ser compartido entre múltiples pestañas del navegador. Ideal para sincronizar estado o gestionar conexiones WebSocket.',
        tags: ['Avanzado', 'Multi-tab']
      },
      lifecycleTermination: {
        title: 'Ciclo de Vida',
        description: 'Gestiona correctamente el ciclo de vida de los workers: creación, uso y terminación. Aprende a liberar recursos y memoria de forma apropiada.',
        tags: ['Gestión', 'Recursos']
      },
      workerLimits: {
        title: 'Límites de Workers',
        description: 'Descubre cuántos workers puede manejar tu navegador y qué sucede cuando alcanzas esos límites. Incluye test de estrés y mejores prácticas.',
        tags: ['Límites', 'Escalabilidad']
      },
      workerPool: {
        title: 'Worker Pool',
        description: 'Implementa un pool de workers reutilizables para procesar cientos de tareas con solo 4-8 workers. El patrón profesional para producción.',
        tags: ['Patrón', 'Producción']
      }
    },
    home: {
      learnTitle: '💡 ¿Qué aprenderás?',
      learnItems: [
        'Cómo ejecutar código JavaScript en hilos de fondo',
        'Evitar que la interfaz de usuario se congele con tareas pesadas',
        'Optimizar el rendimiento con transferencia de datos',
        'Manejar errores correctamente en workers',
        'Compartir workers entre múltiples pestañas',
        'Gestionar el ciclo de vida de workers',
        'Entender límites y escalabilidad en producción'
      ],
      orderTitle: '📖 Orden Recomendado',
      orderItems: [
        'Empieza con Comunicación Básica para entender los fundamentos',
        'Continúa con Descarga de Cómputo para ver el caso de uso principal',
        'Aprende sobre Manejo de Errores para hacer tu código más robusto',
        'Explora Objetos Transferibles para optimizaciones de rendimiento',
        'Experimenta con Ciclo de Vida para gestión de recursos',
        'Entiende los Límites de Workers para aplicaciones escalables',
        'Aprende el patrón Worker Pool para escalar a muchas tareas',
        'Finalmente, prueba Shared Worker para casos avanzados'
      ]
    },
    examplesContent: {
      setIntervalCounter: {
        title: '⏱️ Contador con setInterval',
        subtitle: 'Ejemplo 01: Fundamentos de JavaScript - Ejecución periódica',
        infoTitle: '💡 ¿Qué enseña este ejemplo?',
        infoDescription: 'Este ejemplo muestra cómo usar setInterval para ejecutar código periódicamente. Es fundamental entender esto antes de aprender sobre Web Workers, ya que los contadores son una forma común de demostrar cómo el hilo principal puede bloquearse.',
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
          description: 'Observa cómo las tareas se agregan a la cola, se procesan en el hilo principal y se completan. Esto te ayudará a entender qué pasa cuando el hilo se bloquea.',
          queueLabel: 'Cola de Tareas',
          queueEmpty: 'Sin tareas pendientes',
          mainThreadLabel: 'Hilo Principal',
          idleLabel: 'En reposo',
          resultLabel: 'Resultado',
          resultText: 'Contador actualizado',
          taskTypes: {
            interval: 'setInterval',
            render: 'Renderizado'
          }
        },
        noteTitle: '📝 Nota',
        noteDescription: 'Este contador funciona perfectamente porque el hilo principal está libre. En el siguiente ejemplo (Bloqueo del Main Thread) verás qué pasa cuando el hilo principal está ocupado con cálculos pesados.'
      },
      mainThread: {
        title: '🔒 Bloqueo del Main Thread',
        subtitle: 'Ejemplo 02: El problema que resuelven los Web Workers',
        infoTitle: '⚠️ ¿Qué demuestra este ejemplo?',
        infoDescription: 'Este ejemplo muestra qué pasa cuando ejecutamos cálculos pesados directamente en el hilo principal. Observa cómo la UI se congela completamente durante el cálculo de números primos.',
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
          warningDescription: 'Durante este cálculo, la UI estuvo completamente congelada. El contador se detuvo y las animaciones dejaron de funcionar. Este es el problema que los Web Workers resuelven.'
        },
        processorView: {
          title: '💻 Lo que sucede dentro del procesador',
          description: 'Observa cómo el procesador evalúa cada número en tiempo real. Los números verdes son primos y los rojos no lo son. Nota cómo se van agregando mientras el hilo principal está bloqueado.',
          processing: 'Procesando...',
          numbersEvaluated: 'números evaluados'
        },
        uiTest: {
          title: '🎯 Prueba de Respuesta de la UI',
          info: 'Si la UI está bloqueada, este contador se congelará',
          note: 'La caja debería seguir rebotando suavemente',
          testTitle: '⚠️ Prueba esto:',
          testDescription: 'Haz clic en "Calcular" y observa cómo el contador se congela completamente. Esto es exactamente el problema que los Web Workers resuelven.'
        },
        logs: {
          mainStart: '🔒 Iniciando cálculo de {{count}} números primos en el Main Thread...',
          mainWarning: '⚠️ ADVERTENCIA: La UI se congelará durante el cálculo',
          mainComplete: '✅ Cálculo en Main Thread completado'
        }
      },
      basicCommunication: {
        title: '🚀 Comunicación Básica con Web Workers',
        subtitle: 'Ejemplo 03: Enviando y recibiendo mensajes',
        infoTitle: '💡 ¿Qué hace este ejemplo?',
        infoDescription: 'Este es el "Hola Mundo" de los Web Workers. Escribe un mensaje y envíalo al worker. El worker lo recibirá, lo procesará y te responderá de vuelta.',
        codeSummary: '📖 Ver Código - ¿Cómo funciona?',
        codeSections: {
          createWorker: '1️⃣ Crear el Worker',
          sendToWorker: '2️⃣ Enviar mensaje al Worker',
          receiveInWorker: '3️⃣ Recibir mensaje en el Worker',
          receiveInMain: '4️⃣ Recibir respuesta del Worker'
        },
        flowTitle: '🔄 Flujo de Comunicación',
        flowSteps: ['Hilo Principal', 'postMessage() ↓', 'Worker', '↑ postMessage()', 'Hilo Principal'],
        messageLabel: 'Mensaje para el Worker:',
        messagePlaceholder: 'Escribe tu mensaje aquí...',
        defaultMessage: '¡Hola Worker!',
        sendButton: 'Enviar Mensaje al Worker',
        emptyState: 'Los mensajes aparecerán aquí...',
        senderMain: '📤 Hilo Principal',
        senderWorker: '📥 Worker'
      },
      offloadingComputation: {
        title: '⚡ Descarga de Cómputo Pesado',
        subtitle: 'Ejemplo 04: Evitando el bloqueo de la UI',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'Calcula números primos de forma intensiva. Prueba ambos botones y observa cómo el contador y la animación se comportan diferente cuando el cálculo se hace en el hilo principal vs. en un worker.',
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
          methodLabels: {
            worker: 'Worker',
            main: 'Hilo Principal'
          },
          warningTitle: '⚠️ Nota:',
          warningDescription: 'Durante este cálculo, la UI estuvo completamente congelada. El contador se detuvo y las animaciones dejaron de funcionar.'
        },
        uiTest: {
          title: '🎯 Prueba de Respuesta de la UI',
          info: 'Si la UI está bloqueada, este contador se congelará',
          note: 'La caja debería seguir rebotando suavemente'
        },
        alerts: {
          unsupported: 'Web Workers no soportados en este navegador'
        },
        logs: {
          workerStart: '🚀 Iniciando cálculo de {{count}} números primos en Worker...',
          workerComplete: '✅ Worker completó el cálculo',
          workerError: '❌ Error en el worker',
          mainStart: '🐌 Iniciando cálculo de {{count}} números primos en el hilo principal...',
          mainWarning: '⚠️ La UI se congelará durante el cálculo',
          mainComplete: '✅ Cálculo en hilo principal completado'
        }
      },
      transferableObjects: {
        title: '🚀 Objetos Transferibles',
        subtitle: 'Ejemplo 05: Transferencia vs. Clonación de datos',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'Los objetos transferibles (como ArrayBuffer) pueden "transferir" su propiedad al worker en lugar de ser clonados. Esto es muchísimo más rápido para grandes volúmenes de datos.',
        codeSummary: '📖 Ver Código - ¿Cómo funciona?',
        codeSections: {
          createBuffer: '1️⃣ Crear ArrayBuffer',
          methodClone: '2️⃣ Método 1: Clonación (Lento)',
          methodTransfer: '3️⃣ Método 2: Transferencia (Rápido)'
        },
        demo: {
          title: '🖼️ Procesamiento de Imagen',
          sizeLabel: 'Tamaño de los datos:',
          sizeOptions: [
            { value: 1, label: '1 MB (imagen 256x256)' },
            { value: 4, label: '4 MB (imagen 512x512)' },
            { value: 16, label: '16 MB (imagen 1024x1024)' },
            { value: 64, label: '64 MB (imagen 2048x2048)' }
          ],
          transferButton: '⚡ Con Transferencia',
          transferNote: '(Transferir propiedad)',
          cloneButton: '📋 Con Clonación',
          cloneNote: '(Clonación estructurada)'
        },
        comparison: {
          transferLabel: 'Con Transferencia',
          cloneLabel: 'Con Clonación',
          unit: 'milisegundos'
        },
        result: {
          title: '📊 Análisis de Rendimiento',
          improvementLabel: 'Mejora con transferencia:',
          improvementSuffix: '% más rápido',
          differenceLabel: 'Diferencia:',
          differenceSuffix: 'ms ahorrados'
        },
        canvasLabels: {
          original: 'Original',
          transfer: 'Con Transferencia',
          clone: 'Con Clonación'
        },
        logs: {
          workerError: 'Error en el worker'
        }
      },
      errorHandling: {
        title: '⚠️ Manejo de Errores en Workers',
        subtitle: 'Ejemplo 06: Capturando y manejando errores',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'Los errores que ocurren dentro de un Web Worker deben manejarse correctamente para evitar que la aplicación falle. Este ejemplo muestra distintos tipos de errores y cómo capturarlos.',
        codeSummary: '📖 Ver Código - ¿Cómo funciona?',
        codeSections: {
          configureHandler: '1️⃣ Configurar el manejador de errores',
          throwError: '2️⃣ Provocar un error desde el Worker'
        },
        errorTypes: {
          reference: {
            title: '❌ 1. Error de Referencia',
            description: 'Intentar usar una función o variable que no existe.',
            button: 'Provocar ReferenceError',
            logLabel: 'ReferenceError'
          },
          type: {
            title: '🔢 2. Error de Tipo',
            description: 'Operación con tipos de datos incorrectos.',
            button: 'Provocar TypeError',
            logLabel: 'TypeError'
          },
          math: {
            title: '➗ 3. Error Matemático',
            description: 'Operaciones matemáticas inválidas o datos corruptos.',
            button: 'Provocar Error Matemático',
            logLabel: 'Error Matemático'
          },
          custom: {
            title: '🎯 4. Error Personalizado',
            description: 'Lanzar un error con un mensaje específico.',
            button: 'Lanzar Error Personalizado',
            logLabel: 'Error Personalizado'
          },
          success: {
            title: '✅ 5. Operación Exitosa',
            description: 'Ejecuta una operación que finaliza sin errores.',
            button: 'Ejecutar sin Errores',
            logLabel: 'Éxito'
          }
        },
        logPanel: {
          title: '📋 Consola de Eventos',
          empty: 'Sistema iniciado. Esperando acciones...'
        },
        logs: {
          workerCreated: '🔧 Worker creado exitosamente',
          systemReady: '✨ Sistema de manejo de errores listo',
          messageReceived: '📨 {{message}}',
          resultReceived: '   └─ Resultado: {{result}}',
          errorCaptured: '❌ ERROR CAPTURADO EN EL WORKER:',
          errorMessage: '   └─ Mensaje: {{message}}',
          errorFile: '   └─ Archivo: {{file}}',
          errorLine: '   └─ Línea: {{line}}, Columna: {{column}}',
          recreatingWorker: '🔄 Recreando worker...',
          triggerError: '🎯 Provocando error de tipo: "{{type}}"',
          consoleCleared: 'Consola limpiada'
        },
        alerts: {
          unsupported: 'Tu navegador no soporta Web Workers'
        }
      },
      sharedWorker: {
        title: '🌐 Shared Worker',
        subtitle: 'Ejemplo 07: Comunicación entre múltiples pestañas',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'Un Shared Worker puede compartirse entre pestañas, iframes o ventanas. Es ideal para coordinar estado compartido o mantener una sola conexión a recursos externos.',
        compatibilityNote: {
          title: '⚠️ Nota de compatibilidad:',
          details: 'Los Shared Workers no están disponibles en todos los navegadores. Safari no los soporta. Firefox y Chrome sí.'
        },
        codeSummary: '📖 Ver Código - ¿Cómo funciona?',
        codeSections: {
          createSharedWorker: '1️⃣ Crear Shared Worker',
          connectAndSend: '2️⃣ Conectar y enviar mensajes'
        },
        statusPanel: {
          title: '📊 Estado de la Conexión',
          statusLabel: 'Estado del Worker:',
          tabIdLabel: 'Tu ID de pestaña:',
          connectedLabel: 'Pestañas conectadas:',
          statuses: {
            disconnected: 'Desconectado',
            connected: 'Conectado',
            unsupported: 'No soportado'
          }
        },
        chatPanel: {
          title: '💬 Chat entre Pestañas',
          placeholder: 'Escribe un mensaje...',
          sendButton: 'Enviar',
          instructions: '💡 Abre esta misma página en otra pestaña para ver cómo se comparten los mensajes.',
          emptyState: 'Los mensajes aparecerán aquí. Abre otra pestaña para probar la comunicación.',
          systemSender: '🤖 Sistema',
          systemMessages: {
            connected: 'Conectado como {{tabId}}',
            tabConnected: 'Pestaña conectada',
            tabDisconnected: 'Pestaña desconectada'
          }
        },
        alerts: {
          unsupported: 'SharedWorker no está soportado en este navegador'
        }
      },
      lifecycleTermination: {
        title: '♻️ Ciclo de Vida y Terminación',
        subtitle: 'Ejemplo 08: Gestión del ciclo de vida de Workers',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'Gestionar correctamente la vida de un Worker evita fugas de memoria y procesos colgados. Este ejemplo muestra cómo crear, usar y terminar un Worker de forma controlada.',
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
        statsPanel: {
          title: '📊 Estadísticas',
          created: 'Workers Creados',
          completed: 'Tareas Completadas',
          terminated: 'Terminaciones'
        },
        logPanel: {
          title: '📋 Log de Eventos',
          empty: 'Sistema iniciado. Esperando acciones...'
        },
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
      workerLimits: {
        title: '⚠️ Límites de Workers',
        subtitle: 'Ejemplo 09: Cantidad máxima y gestión de recursos',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'Los navegadores tienen límites en la cantidad de workers simultáneos. Este ejemplo permite crear muchos workers, detectar límites y monitorear el uso de recursos.',
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
          result: {
            limitLabel: 'Límite Detectado:',
            timeLabel: 'Tiempo Total:',
            comparisonLabel: 'vs Recomendado:'
          }
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
        statsPanel: {
          title: '📊 Estado Actual',
          active: 'Workers Activos',
          totalCreated: 'Total Creados',
          errors: 'Errores',
          memory: 'Memoria Usada'
        },
        logPanel: {
          title: '📋 Log de Eventos',
          empty: 'Sistema iniciado. Listo para crear workers.'
        },
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
      workerPool: {
        title: '🏊 Worker Pool Pattern',
        subtitle: 'Ejemplo 10: Procesar muchas tareas con pocos workers',
        infoTitle: '💡 ¿Qué demuestra este ejemplo?',
        infoDescription: 'En lugar de crear un worker por tarea, un Worker Pool reutiliza un número fijo de workers para procesar múltiples tareas en cola. Este es el patrón usado en producción.',
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
        logPanel: {
          title: '📝 Log de Actividad',
          empty: 'Sistema listo. Inicializa el pool para comenzar.'
        },
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
      }
    }
  },
  en: {
    common: {
      appTitle: '🚀 Web Worker Patterns',
      appSubtitle: 'Learn how to use Web Workers with practical, interactive examples',
      footerMadeWithLove: 'Made with ❤️ for the developer community',
      footerMdnLink: 'MDN Documentation'
    },
    language: {
      selectorTitle: 'Choose your language',
      selectorDescription: 'Pick the language for the full application experience.',
      spanish: 'Spanish',
      english: 'English',
      portuguese: 'Portuguese',
      changeButton: 'Change language',
      closeButton: 'Keep current language'
    },
    codeExplanation: {
      angularButton: 'Angular',
      javascriptButton: 'JavaScript',
      emptyState: {
        angular: 'Angular code is not available for this example yet.',
        javascript: 'JavaScript code is not available for this example yet.'
      }
    },
    sidebar: {
      title: '📚 Examples'
    },
    examplesMeta: {
      setIntervalCounter: {
        title: 'Counter with setInterval',
        description: 'Learn JavaScript fundamentals: how to use setInterval to execute code periodically. Essential before understanding Web Workers.',
        tags: ['Fundamentals', 'JavaScript']
      },
      mainThread: {
        title: 'Main Thread Blocking',
        description: 'Understand the problem that Web Workers solve. See how calculating prime numbers completely blocks the main thread and freezes the UI.',
        tags: ['Problem', 'Fundamentals']
      },
      basicCommunication: {
        title: 'Basic Communication',
        description: 'The "Hello World" of Web Workers. Learn how the main thread and the worker communicate using postMessage and onmessage.',
        tags: ['Basics', 'Foundations']
      },
      offloadingComputation: {
        title: 'Offloading Computation',
        description: 'See how to avoid UI freezes by running heavy calculations (like prime numbers) in a worker instead of the main thread.',
        tags: ['Performance', 'Computation']
      },
      transferableObjects: {
        title: 'Transferable Objects',
        description: 'Optimize performance by transferring ownership of large objects like ArrayBuffer instead of cloning them. Perfect for images and binary data.',
        tags: ['Optimization', 'ArrayBuffer']
      },
      errorHandling: {
        title: 'Error Handling',
        description: 'Learn how to catch and handle errors that happen inside a worker by using the onerror event. Includes examples of different error types.',
        tags: ['Debugging', 'Errors']
      },
      sharedWorker: {
        title: 'Shared Worker',
        description: 'Explore how a Shared Worker can be shared across multiple browser contexts. Ideal for syncing state or managing shared WebSocket connections.',
        tags: ['Advanced', 'Multi-tab']
      },
      lifecycleTermination: {
        title: 'Lifecycle Management',
        description: 'Properly manage the worker lifecycle: create, use, and terminate workers. Learn how to free resources and memory at the right time.',
        tags: ['Management', 'Resources']
      },
      workerLimits: {
        title: 'Worker Limits',
        description: 'Discover how many workers your browser can handle and what happens when you reach those limits. Includes stress tests and best practices.',
        tags: ['Limits', 'Scalability']
      },
      workerPool: {
        title: 'Worker Pool',
        description: 'Implement a reusable pool of workers to process hundreds of tasks with just 4-8 workers. The production-ready pattern.',
        tags: ['Pattern', 'Production']
      }
    },
    home: {
      learnTitle: '💡 What will you learn?',
      learnItems: [
        'How to run JavaScript code in background threads',
        'Keep the user interface responsive during heavy tasks',
        'Optimize performance by transferring data efficiently',
        'Handle errors correctly inside workers',
        'Share workers between multiple tabs',
        'Manage the worker lifecycle effectively',
        'Understand limits and scalability in production'
      ],
      orderTitle: '📖 Recommended Order',
      orderItems: [
        'Start with Basic Communication to learn the fundamentals',
        'Continue with Offloading Computation to see the main use case',
        'Learn Error Handling to make your code more robust',
        'Explore Transferable Objects for performance optimizations',
        'Experiment with Lifecycle Management to control resources',
        'Understand Worker Limits for scalable applications',
        'Learn the Worker Pool pattern to scale to many tasks',
        'Finally, try Shared Worker for advanced scenarios'
      ]
    },
    examplesContent: {
      setIntervalCounter: {
        title: '⏱️ Counter with setInterval',
        subtitle: 'Example 01: JavaScript Fundamentals - Periodic Execution',
        infoTitle: '💡 What does this example teach?',
        infoDescription: 'This example shows how to use setInterval to execute code periodically. It\'s fundamental to understand this before learning about Web Workers, as counters are a common way to demonstrate how the main thread can be blocked.',
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
          description: 'Watch how tasks are added to the queue, processed in the main thread, and completed. This will help you understand what happens when the thread gets blocked.',
          queueLabel: 'Task Queue',
          queueEmpty: 'No pending tasks',
          mainThreadLabel: 'Main Thread',
          idleLabel: 'Idle',
          resultLabel: 'Result',
          resultText: 'Counter updated',
          taskTypes: {
            interval: 'setInterval',
            render: 'Rendering'
          }
        },
        noteTitle: '📝 Note',
        noteDescription: 'This counter works perfectly because the main thread is free. In the next example (Main Thread Blocking) you\'ll see what happens when the main thread is busy with heavy calculations.'
      },
      mainThread: {
        title: '🔒 Main Thread Blocking',
        subtitle: 'Example 02: The problem Web Workers solve',
        infoTitle: '⚠️ What does this example show?',
        infoDescription: 'This example shows what happens when we run heavy calculations directly on the main thread. Notice how the UI completely freezes during the prime number calculation.',
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
          warningDescription: 'During this calculation, the UI was completely frozen. The counter stopped and animations paused. This is the problem that Web Workers solve.'
        },
        processorView: {
          title: '💻 What happens inside the processor',
          description: 'Watch how the processor evaluates each number in real time. Green numbers are primes and red ones are not. Notice how they are added while the main thread is blocked.',
          processing: 'Processing...',
          numbersEvaluated: 'numbers evaluated'
        },
        uiTest: {
          title: '🎯 UI Responsiveness Test',
          info: 'If the UI is blocked, this counter will freeze',
          note: 'The square should keep bouncing smoothly',
          testTitle: '⚠️ Try this:',
          testDescription: 'Click "Calculate" and watch how the counter freezes completely. This is exactly the problem that Web Workers solve.'
        },
        logs: {
          mainStart: '🔒 Starting calculation of {{count}} prime numbers on the Main Thread...',
          mainWarning: '⚠️ WARNING: The UI will freeze during this calculation',
          mainComplete: '✅ Main Thread calculation completed'
        }
      },
      basicCommunication: {
        title: '🚀 Basic Communication with Web Workers',
        subtitle: 'Example 03: Sending and receiving messages',
        infoTitle: '💡 What does this example do?',
        infoDescription: 'This is the "Hello World" of Web Workers. Type a message and send it to the worker. The worker receives it, processes it, and sends a response back.',
        codeSummary: '📖 View Code - How does it work?',
        codeSections: {
          createWorker: '1️⃣ Create the Worker',
          sendToWorker: '2️⃣ Send message to the Worker',
          receiveInWorker: '3️⃣ Receive message in the Worker',
          receiveInMain: '4️⃣ Receive response from the Worker'
        },
        flowTitle: '🔄 Communication Flow',
        flowSteps: ['Main Thread', 'postMessage() ↓', 'Worker', '↑ postMessage()', 'Main Thread'],
        messageLabel: 'Message for the Worker:',
        messagePlaceholder: 'Type your message here...',
        defaultMessage: 'Hello Worker!',
        sendButton: 'Send Message to Worker',
        emptyState: 'Messages will appear here...',
        senderMain: '📤 Main Thread',
        senderWorker: '📥 Worker'
      },
      offloadingComputation: {
        title: '⚡ Heavy Computation Offloading',
        subtitle: 'Example 04: Avoiding UI freezes',
        infoTitle: '💡 What does this example show?',
        infoDescription: 'It calculates prime numbers intensively. Try both buttons and see how the counter and animation behave differently when the calculation runs on the main thread versus a worker.',
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
          methodLabels: {
            worker: 'Worker',
            main: 'Main Thread'
          },
          warningTitle: '⚠️ Note:',
          warningDescription: 'During this calculation the UI was completely frozen. The counter stopped and animations paused.'
        },
        uiTest: {
          title: '🎯 UI Responsiveness Test',
          info: 'If the UI is blocked, this counter will freeze',
          note: 'The square should keep bouncing smoothly'
        },
        alerts: {
          unsupported: 'Web Workers are not supported in this browser'
        },
        logs: {
          workerStart: '🚀 Starting calculation of {{count}} prime numbers in the worker...',
          workerComplete: '✅ Worker finished the calculation',
          workerError: '❌ Worker error',
          mainStart: '🐌 Starting calculation of {{count}} prime numbers on the main thread...',
          mainWarning: '⚠️ The UI will freeze during this calculation',
          mainComplete: '✅ Main thread calculation completed'
        }
      },
      transferableObjects: {
        title: '🚀 Transferable Objects',
        subtitle: 'Example 05: Transferring vs. cloning data',
        infoTitle: '💡 What does this example demonstrate?',
        infoDescription: 'Transferable objects (like ArrayBuffer) can transfer their ownership to the worker instead of being cloned. This is far faster for large data volumes.',
        codeSummary: '📖 View Code - How does it work?',
        codeSections: {
          createBuffer: '1️⃣ Create ArrayBuffer',
          methodClone: '2️⃣ Method 1: Cloning (Slow)',
          methodTransfer: '3️⃣ Method 2: Transferable (Fast)'
        },
        demo: {
          title: '🖼️ Image Processing',
          sizeLabel: 'Data size:',
          sizeOptions: [
            { value: 1, label: '1 MB (256x256 image)' },
            { value: 4, label: '4 MB (512x512 image)' },
            { value: 16, label: '16 MB (1024x1024 image)' },
            { value: 64, label: '64 MB (2048x2048 image)' }
          ],
          transferButton: '⚡ With Transfer',
          transferNote: '(Transfer ownership)',
          cloneButton: '📋 With Cloning',
          cloneNote: '(Structured clone)'
        },
        comparison: {
          transferLabel: 'With Transfer',
          cloneLabel: 'With Cloning',
          unit: 'milliseconds'
        },
        result: {
          title: '📊 Performance Analysis',
          improvementLabel: 'Transfer improvement:',
          improvementSuffix: '% faster',
          differenceLabel: 'Difference:',
          differenceSuffix: 'ms saved'
        },
        canvasLabels: {
          original: 'Original',
          transfer: 'With Transfer',
          clone: 'With Cloning'
        },
        logs: {
          workerError: 'Worker error'
        }
      },
      errorHandling: {
        title: '⚠️ Error Handling in Workers',
        subtitle: 'Example 06: Capturing and managing errors',
        infoTitle: '💡 What does this example show?',
        infoDescription: 'Errors thrown inside a Web Worker must be handled correctly to keep the app stable. This example walks through different error types and how to capture them.',
        codeSummary: '📖 View Code - How does it work?',
        codeSections: {
          configureHandler: '1️⃣ Set up the error handler',
          throwError: '2️⃣ Throw an error from the Worker'
        },
        errorTypes: {
          reference: {
            title: '❌ 1. Reference Error',
            description: 'Trying to use a function or variable that does not exist.',
            button: 'Trigger ReferenceError',
            logLabel: 'ReferenceError'
          },
          type: {
            title: '🔢 2. Type Error',
            description: 'Running an operation with the wrong data type.',
            button: 'Trigger TypeError',
            logLabel: 'TypeError'
          },
          math: {
            title: '➗ 3. Math Error',
            description: 'Invalid math operations or corrupted data.',
            button: 'Trigger Math Error',
            logLabel: 'Math Error'
          },
          custom: {
            title: '🎯 4. Custom Error',
            description: 'Throw an error with a custom message.',
            button: 'Throw Custom Error',
            logLabel: 'Custom Error'
          },
          success: {
            title: '✅ 5. Successful Operation',
            description: 'Executes an operation that finishes without errors.',
            button: 'Execute without Errors',
            logLabel: 'Success'
          }
        },
        logPanel: {
          title: '📋 Event Console',
          empty: 'System ready. Waiting for actions...'
        },
        logs: {
          workerCreated: '🔧 Worker created successfully',
          systemReady: '✨ Error handling system ready',
          messageReceived: '📨 {{message}}',
          resultReceived: '   └─ Result: {{result}}',
          errorCaptured: '❌ ERROR CAPTURED IN WORKER:',
          errorMessage: '   └─ Message: {{message}}',
          errorFile: '   └─ File: {{file}}',
          errorLine: '   └─ Line: {{line}}, Column: {{column}}',
          recreatingWorker: '🔄 Recreating worker...',
          triggerError: '🎯 Triggering error type: "{{type}}"',
          consoleCleared: 'Console cleared'
        },
        alerts: {
          unsupported: 'Your browser does not support Web Workers'
        }
      },
      sharedWorker: {
        title: '🌐 Shared Worker',
        subtitle: 'Example 07: Communication across multiple tabs',
        infoTitle: '💡 What does this example demonstrate?',
        infoDescription: 'A Shared Worker can be used by multiple tabs, iframes, or windows. It is perfect for keeping shared state or maintaining a single connection to external services.',
        compatibilityNote: {
          title: '⚠️ Compatibility note:',
          details: 'Shared Workers are not available in every browser. Safari does not support them. Firefox and Chrome do.'
        },
        codeSummary: '📖 View Code - How does it work?',
        codeSections: {
          createSharedWorker: '1️⃣ Create Shared Worker',
          connectAndSend: '2️⃣ Connect and send messages'
        },
        statusPanel: {
          title: '📊 Connection Status',
          statusLabel: 'Worker status:',
          tabIdLabel: 'Your tab ID:',
          connectedLabel: 'Connected tabs:',
          statuses: {
            disconnected: 'Disconnected',
            connected: 'Connected',
            unsupported: 'Unsupported'
          }
        },
        chatPanel: {
          title: '💬 Cross-Tab Chat',
          placeholder: 'Type a message...',
          sendButton: 'Send',
          instructions: '💡 Open this same page in another tab to watch messages being shared.',
          emptyState: 'Messages will appear here. Open another tab to try the communication.',
          systemSender: '🤖 System',
          systemMessages: {
            connected: 'Connected as {{tabId}}',
            tabConnected: 'Tab connected',
            tabDisconnected: 'Tab disconnected'
          }
        },
        alerts: {
          unsupported: 'SharedWorker is not supported in this browser'
        }
      },
      lifecycleTermination: {
        title: '♻️ Worker Lifecycle & Termination',
        subtitle: "Example 08: Managing a worker's lifecycle",
        infoTitle: '💡 What does this example cover?',
        infoDescription: 'Managing a Worker correctly prevents memory leaks and zombie processes. This example illustrates how to create, use, and terminate a Worker in a controlled manner.',
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
        statsPanel: {
          title: '📊 Statistics',
          created: 'Workers Created',
          completed: 'Tasks Completed',
          terminated: 'Terminations'
        },
        logPanel: {
          title: '📋 Event Log',
          empty: 'System ready. Waiting for actions...'
        },
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
      workerLimits: {
        title: '⚠️ Worker Limits',
        subtitle: 'Example 09: Maximum counts and resource management',
        infoTitle: '💡 What does this example show?',
        infoDescription: 'Browsers enforce a limit on how many workers can run at once. This example lets you create many workers, detect limits, and monitor resource usage.',
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
          result: {
            limitLabel: 'Detected limit:',
            timeLabel: 'Total time:',
            comparisonLabel: 'vs Recommended:'
          }
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
        statsPanel: {
          title: '📊 Current Status',
          active: 'Active Workers',
          totalCreated: 'Total Created',
          errors: 'Errors',
          memory: 'Memory Used'
        },
        logPanel: {
          title: '📋 Event Log',
          empty: 'System ready. Ready to create workers.'
        },
        logs: {
          systemStarted: 'System started. Detected CPU cores: {{cores}}',
          browserInfo: 'Browser: {{browser}}',
          recommendedMax: 'Recommended max workers: {{recommended}}',
          autodetectSuggestion: 'Use auto-detect to find your browser’s real limit',
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
      workerPool: {
        title: '🏊 Worker Pool Pattern',
        subtitle: 'Example 10: Process many tasks with few workers',
        infoTitle: '💡 What does this example illustrate?',
        infoDescription: 'Instead of creating one worker per task, a Worker Pool reuses a fixed number of workers to process a queue of tasks. This is the production-ready pattern.',
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
        logPanel: {
          title: '📝 Activity Log',
          empty: 'System ready. Initialize the pool to get started.'
        },
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
      }
    }
  },
  pt: {
    common: {
      appTitle: '🚀 Padrões de Web Workers',
      appSubtitle: 'Aprenda a usar Web Workers com exemplos práticos e interativos',
      footerMadeWithLove: 'Feito com ❤️ para a comunidade de desenvolvedores',
      footerMdnLink: 'Documentação da MDN'
    },
    language: {
      selectorTitle: 'Selecione seu idioma',
      selectorDescription: 'Escolha o idioma para aproveitar toda a experiência do aplicativo.',
      spanish: 'Espanhol',
      english: 'Inglês',
      portuguese: 'Português',
      changeButton: 'Alterar idioma',
      closeButton: 'Manter idioma atual'
    },
    codeExplanation: {
      angularButton: 'Angular',
      javascriptButton: 'JavaScript',
      emptyState: {
        angular: 'Ainda não há código Angular disponível para este exemplo.',
        javascript: 'Ainda não há código JavaScript disponível para este exemplo.'
      }
    },
    sidebar: {
      title: '📚 Exemplos'
    },
    examplesMeta: {
      setIntervalCounter: {
        title: 'Contador com setInterval',
        description: 'Aprenda os fundamentos de JavaScript: como usar setInterval para executar código periodicamente. Essencial antes de entender Web Workers.',
        tags: ['Fundamentos', 'JavaScript']
      },
      mainThread: {
        title: 'Bloqueio da Thread Principal',
        description: 'Entenda o problema que os Web Workers resolvem. Veja como o cálculo de números primos bloqueia completamente a thread principal e congela a interface.',
        tags: ['Problema', 'Fundamentos']
      },
      basicCommunication: {
        title: 'Comunicação Básica',
        description: 'O "Olá Mundo" dos Web Workers. Aprenda como a thread principal e o worker se comunicam usando postMessage e onmessage.',
        tags: ['Básico', 'Fundamentos']
      },
      offloadingComputation: {
        title: 'Descarga de Cálculo',
        description: 'Descubra como evitar que a interface congele executando cálculos pesados (como números primos) em um worker separado da thread principal.',
        tags: ['Performance', 'Cálculo']
      },
      transferableObjects: {
        title: 'Objetos Transferíveis',
        description: 'Otimize o desempenho transferindo a propriedade de objetos grandes como ArrayBuffer em vez de cloná-los. Perfeito para imagens e dados binários.',
        tags: ['Otimização', 'ArrayBuffer']
      },
      errorHandling: {
        title: 'Tratamento de Erros',
        description: 'Aprenda a capturar e tratar erros que ocorrem dentro de um worker usando o evento onerror. Inclui exemplos de diferentes tipos de erro.',
        tags: ['Depuração', 'Erros']
      },
      sharedWorker: {
        title: 'Shared Worker',
        description: 'Explore como um Shared Worker pode ser compartilhado entre vários contextos de navegação. Ideal para sincronizar estado ou gerenciar conexões WebSocket.',
        tags: ['Avançado', 'Multi-abas']
      },
      lifecycleTermination: {
        title: 'Ciclo de Vida',
        description: 'Gerencie corretamente o ciclo de vida dos workers: criação, uso e término. Aprenda a liberar recursos e memória de forma adequada.',
        tags: ['Gestão', 'Recursos']
      },
      workerLimits: {
        title: 'Limites de Workers',
        description: 'Descubra quantos workers seu navegador pode suportar e o que acontece quando esses limites são alcançados. Inclui testes de estresse e boas práticas.',
        tags: ['Limites', 'Escalabilidade']
      },
      workerPool: {
        title: 'Worker Pool',
        description: 'Implemente um pool reutilizável de workers para processar centenas de tarefas com apenas 4-8 workers. O padrão usado em produção.',
        tags: ['Padrão', 'Produção']
      }
    },
    home: {
      learnTitle: '💡 O que você vai aprender?',
      learnItems: [
        'Como executar código JavaScript em threads de fundo',
        'Evitar que a interface congele em tarefas pesadas',
        'Otimizar o desempenho com transferência eficiente de dados',
        'Tratar erros corretamente dentro dos workers',
        'Compartilhar workers entre várias abas',
        'Gerenciar o ciclo de vida dos workers',
        'Entender limites e escalabilidade em produção'
      ],
      orderTitle: '📖 Ordem Recomendada',
      orderItems: [
        'Comece com Comunicação Básica para entender os fundamentos',
        'Continue com Descarga de Cálculo para ver o principal caso de uso',
        'Aprenda Tratamento de Erros para tornar seu código mais robusto',
        'Explore Objetos Transferíveis para otimizações de desempenho',
        'Experimente Ciclo de Vida para gerenciar recursos',
        'Entenda os Limites de Workers para aplicações escaláveis',
        'Aprenda o padrão Worker Pool para escalar para muitas tarefas',
        'Por fim, experimente Shared Worker para cenários avançados'
      ]
    },
    examplesContent: {
      setIntervalCounter: {
        title: '⏱️ Contador com setInterval',
        subtitle: 'Exemplo 01: Fundamentos de JavaScript - Execução Periódica',
        infoTitle: '💡 O que este exemplo ensina?',
        infoDescription: 'Este exemplo mostra como usar setInterval para executar código periodicamente. É fundamental entender isso antes de aprender sobre Web Workers, pois os contadores são uma forma comum de demonstrar como a thread principal pode ser bloqueada.',
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
          description: 'Observe como as tarefas são adicionadas à fila, processadas na thread principal e concluídas. Isso ajudará você a entender o que acontece quando a thread é bloqueada.',
          queueLabel: 'Fila de Tarefas',
          queueEmpty: 'Sem tarefas pendentes',
          mainThreadLabel: 'Thread Principal',
          idleLabel: 'Em repouso',
          resultLabel: 'Resultado',
          resultText: 'Contador atualizado',
          taskTypes: {
            interval: 'setInterval',
            render: 'Renderização'
          }
        },
        noteTitle: '📝 Nota',
        noteDescription: 'Este contador funciona perfeitamente porque a thread principal está livre. No próximo exemplo (Bloqueio da Thread Principal) você verá o que acontece quando a thread principal está ocupada com cálculos pesados.'
      },
      mainThread: {
        title: '🔒 Bloqueio da Thread Principal',
        subtitle: 'Exemplo 02: O problema que os Web Workers resolvem',
        infoTitle: '⚠️ O que este exemplo mostra?',
        infoDescription: 'Este exemplo mostra o que acontece quando executamos cálculos pesados diretamente na thread principal. Observe como a interface congela completamente durante o cálculo de números primos.',
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
          warningDescription: 'Durante este cálculo, a interface ficou completamente congelada. O contador parou e as animações foram interrompidas. Este é o problema que os Web Workers resolvem.'
        },
        processorView: {
          title: '💻 O que acontece dentro do processador',
          description: 'Observe como o processador avalia cada número em tempo real. Os números verdes são primos e os vermelhos não são. Note como eles são adicionados enquanto a thread principal está bloqueada.',
          processing: 'Processando...',
          numbersEvaluated: 'números avaliados'
        },
        uiTest: {
          title: '🎯 Teste de Responsividade da Interface',
          info: 'Se a interface estiver bloqueada, este contador vai congelar',
          note: 'O quadrado deve continuar se movendo suavemente',
          testTitle: '⚠️ Experimente isto:',
          testDescription: 'Clique em "Calcular" e observe como o contador congela completamente. Este é exatamente o problema que os Web Workers resolvem.'
        },
        logs: {
          mainStart: '🔒 Iniciando o cálculo de {{count}} números primos na Thread Principal...',
          mainWarning: '⚠️ AVISO: A interface ficará congelada durante o cálculo',
          mainComplete: '✅ Cálculo na Thread Principal concluído'
        }
      },
      basicCommunication: {
        title: '🚀 Comunicação Básica com Web Workers',
        subtitle: 'Exemplo 03: Enviando e recebendo mensagens',
        infoTitle: '💡 O que este exemplo faz?',
        infoDescription: 'Este é o "Olá Mundo" dos Web Workers. Escreva uma mensagem e envie para o worker. O worker a recebe, processa e responde de volta.',
        codeSummary: '📖 Ver Código - Como funciona?',
        codeSections: {
          createWorker: '1️⃣ Criar o Worker',
          sendToWorker: '2️⃣ Enviar mensagem para o Worker',
          receiveInWorker: '3️⃣ Receber mensagem no Worker',
          receiveInMain: '4️⃣ Receber resposta do Worker'
        },
        flowTitle: '🔄 Fluxo de Comunicação',
        flowSteps: ['Thread Principal', 'postMessage() ↓', 'Worker', '↑ postMessage()', 'Thread Principal'],
        messageLabel: 'Mensagem para o Worker:',
        messagePlaceholder: 'Escreva sua mensagem aqui...',
        defaultMessage: 'Olá Worker!',
        sendButton: 'Enviar Mensagem para o Worker',
        emptyState: 'As mensagens aparecerão aqui...',
        senderMain: '📤 Thread Principal',
        senderWorker: '📥 Worker'
      },
      offloadingComputation: {
        title: '⚡ Descarga de Cálculo Pesado',
        subtitle: 'Exemplo 04: Evitando travamentos na UI',
        infoTitle: '💡 O que este exemplo demonstra?',
        infoDescription: 'Calcula números primos de forma intensiva. Experimente ambos os botões e observe como o contador e a animação se comportam de maneira diferente quando o cálculo ocorre na thread principal ou em um worker.',
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
          methodLabels: {
            worker: 'Worker',
            main: 'Thread Principal'
          },
          warningTitle: '⚠️ Nota:',
          warningDescription: 'Durante este cálculo a UI ficou completamente congelada. O contador parou e as animações foram interrompidas.'
        },
        uiTest: {
          title: '🎯 Teste de Responsividade da UI',
          info: 'Se a UI estiver bloqueada, este contador vai congelar',
          note: 'O quadrado deve continuar se movendo suavemente'
        },
        alerts: {
          unsupported: 'Web Workers não são suportados neste navegador'
        },
        logs: {
          workerStart: '🚀 Iniciando o cálculo de {{count}} números primos no worker...',
          workerComplete: '✅ Worker concluiu o cálculo',
          workerError: '❌ Erro no worker',
          mainStart: '🐌 Iniciando o cálculo de {{count}} números primos na thread principal...',
          mainWarning: '⚠️ A UI ficará congelada durante o cálculo',
          mainComplete: '✅ Cálculo na thread principal concluído'
        }
      },
      transferableObjects: {
        title: '🚀 Objetos Transferíveis',
        subtitle: 'Exemplo 05: Transferência vs. clonagem de dados',
        infoTitle: '💡 O que este exemplo demonstra?',
        infoDescription: 'Objetos transferíveis (como ArrayBuffer) podem transferir sua propriedade para o worker em vez de serem clonados. Isso é muito mais rápido para grandes volumes de dados.',
        codeSummary: '📖 Ver Código - Como funciona?',
        codeSections: {
          createBuffer: '1️⃣ Criar ArrayBuffer',
          methodClone: '2️⃣ Método 1: Clonagem (Lenta)',
          methodTransfer: '3️⃣ Método 2: Transferência (Rápida)'
        },
        demo: {
          title: '🖼️ Processamento de Imagem',
          sizeLabel: 'Tamanho dos dados:',
          sizeOptions: [
            { value: 1, label: '1 MB (imagem 256x256)' },
            { value: 4, label: '4 MB (imagem 512x512)' },
            { value: 16, label: '16 MB (imagem 1024x1024)' },
            { value: 64, label: '64 MB (imagem 2048x2048)' }
          ],
          transferButton: '⚡ Com Transferência',
          transferNote: '(Transferir propriedade)',
          cloneButton: '📋 Com Clonagem',
          cloneNote: '(Clonagem estruturada)'
        },
        comparison: {
          transferLabel: 'Com Transferência',
          cloneLabel: 'Com Clonagem',
          unit: 'milissegundos'
        },
        result: {
          title: '📊 Análise de Desempenho',
          improvementLabel: 'Ganho com transferência:',
          improvementSuffix: '% mais rápido',
          differenceLabel: 'Diferença:',
          differenceSuffix: 'ms economizados'
        },
        canvasLabels: {
          original: 'Original',
          transfer: 'Com Transferência',
          clone: 'Com Clonagem'
        },
        logs: {
          workerError: 'Erro no worker'
        }
      },
      errorHandling: {
        title: '⚠️ Tratamento de Erros em Workers',
        subtitle: 'Exemplo 06: Capturando e tratando erros',
        infoTitle: '💡 O que este exemplo mostra?',
        infoDescription: 'Erros lançados dentro de um Web Worker precisam ser tratados corretamente para manter a aplicação estável. Este exemplo apresenta diferentes tipos de erro e como capturá-los.',
        codeSummary: '📖 Ver Código - Como funciona?',
        codeSections: {
          configureHandler: '1️⃣ Configurar o handler de erros',
          throwError: '2️⃣ Lançar um erro a partir do Worker'
        },
        errorTypes: {
          reference: {
            title: '❌ 1. Reference Error',
            description: 'Tentar usar uma função ou variável inexistente.',
            button: 'Provocar ReferenceError',
            logLabel: 'ReferenceError'
          },
          type: {
            title: '🔢 2. Type Error',
            description: 'Operação usando tipo de dado incorreto.',
            button: 'Provocar TypeError',
            logLabel: 'TypeError'
          },
          math: {
            title: '➗ 3. Erro Matemático',
            description: 'Operações matemáticas inválidas ou dados corrompidos.',
            button: 'Provocar Erro Matemático',
            logLabel: 'Erro Matemático'
          },
          custom: {
            title: '🎯 4. Erro Personalizado',
            description: 'Lançar um erro com mensagem própria.',
            button: 'Lançar Erro Personalizado',
            logLabel: 'Erro Personalizado'
          },
          success: {
            title: '✅ 5. Operação Bem-sucedida',
            description: 'Executa uma operação que termina sem erros.',
            button: 'Executar sem Erros',
            logLabel: 'Sucesso'
          }
        },
        logPanel: {
          title: '📋 Console de Eventos',
          empty: 'Sistema iniciado. Aguardando ações...'
        },
        logs: {
          workerCreated: '🔧 Worker criado com sucesso',
          systemReady: '✨ Sistema de tratamento de erros pronto',
          messageReceived: '📨 {{message}}',
          resultReceived: '   └─ Resultado: {{result}}',
          errorCaptured: '❌ ERRO CAPTURADO NO WORKER:',
          errorMessage: '   └─ Mensagem: {{message}}',
          errorFile: '   └─ Arquivo: {{file}}',
          errorLine: '   └─ Linha: {{line}}, Coluna: {{column}}',
          recreatingWorker: '🔄 Recriando worker...',
          triggerError: '🎯 Provocando erro do tipo: "{{type}}"',
          consoleCleared: 'Console limpo'
        },
        alerts: {
          unsupported: 'Seu navegador não suporta Web Workers'
        }
      },
      sharedWorker: {
        title: '🌐 Shared Worker',
        subtitle: 'Exemplo 07: Comunicação entre várias abas',
        infoTitle: '💡 O que este exemplo demonstra?',
        infoDescription: 'Um Shared Worker pode ser compartilhado por várias abas, iframes ou janelas. Ideal para coordenar estado ou manter uma única conexão com serviços externos.',
        compatibilityNote: {
          title: '⚠️ Nota de compatibilidade:',
          details: 'Shared Workers não estão disponíveis em todos os navegadores. O Safari não suporta. Firefox e Chrome suportam.'
        },
        codeSummary: '📖 Ver Código - Como funciona?',
        codeSections: {
          createSharedWorker: '1️⃣ Criar Shared Worker',
          connectAndSend: '2️⃣ Conectar e enviar mensagens'
        },
        statusPanel: {
          title: '📊 Status da Conexão',
          statusLabel: 'Status do Worker:',
          tabIdLabel: 'ID da sua aba:',
          connectedLabel: 'Abas conectadas:',
          statuses: {
            disconnected: 'Desconectado',
            connected: 'Conectado',
            unsupported: 'Não suportado'
          }
        },
        chatPanel: {
          title: '💬 Chat entre Abas',
          placeholder: 'Escreva uma mensagem...',
          sendButton: 'Enviar',
          instructions: '💡 Abra esta mesma página em outra aba para ver as mensagens sendo compartilhadas.',
          emptyState: 'As mensagens aparecerão aqui. Abra outra aba para testar a comunicação.',
          systemSender: '🤖 Sistema',
          systemMessages: {
            connected: 'Conectado como {{tabId}}',
            tabConnected: 'Aba conectada',
            tabDisconnected: 'Aba desconectada'
          }
        },
        alerts: {
          unsupported: 'SharedWorker não é suportado neste navegador'
        }
      },
      lifecycleTermination: {
        title: '♻️ Ciclo de Vida e Término',
        subtitle: 'Exemplo 08: Gerenciando o ciclo de vida de um Worker',
        infoTitle: '💡 O que este exemplo aborda?',
        infoDescription: 'Gerenciar corretamente um Worker evita vazamentos de memória e processos presos. Este exemplo mostra como criar, usar e terminar um Worker de maneira controlada.',
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
        statsPanel: {
          title: '📊 Estatísticas',
          created: 'Workers Criados',
          completed: 'Tarefas Concluídas',
          terminated: 'Terminações'
        },
        logPanel: {
          title: '📋 Log de Eventos',
          empty: 'Sistema iniciado. Aguardando ações...'
        },
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
      },
      workerLimits: {
        title: '⚠️ Limites de Workers',
        subtitle: 'Exemplo 09: Quantidade máxima e gestão de recursos',
        infoTitle: '💡 O que este exemplo mostra?',
        infoDescription: 'Os navegadores limitam a quantidade de workers simultâneos. Este exemplo permite criar muitos workers, detectar limites e monitorar recursos.',
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
          result: {
            limitLabel: 'Limite Detectado:',
            timeLabel: 'Tempo Total:',
            comparisonLabel: 'vs Recomendado:'
          }
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
        statsPanel: {
          title: '📊 Status Atual',
          active: 'Workers Ativos',
          totalCreated: 'Total Criados',
          errors: 'Erros',
          memory: 'Memória Usada'
        },
        logPanel: {
          title: '📋 Log de Eventos',
          empty: 'Sistema iniciado. Pronto para criar workers.'
        },
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
      },
      workerPool: {
        title: '🏊 Worker Pool Pattern',
        subtitle: 'Exemplo 10: Processar muitas tarefas com poucos workers',
        infoTitle: '💡 O que este exemplo ilustra?',
        infoDescription: 'Em vez de criar um worker por tarefa, um Worker Pool reutiliza um número fixo de workers para processar uma fila de tarefas. Este é o padrão usado em produção.',
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
        logPanel: {
          title: '📝 Log de Atividade',
          empty: 'Sistema pronto. Inicialize o pool para começar.'
        },
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
    }
  }
};

