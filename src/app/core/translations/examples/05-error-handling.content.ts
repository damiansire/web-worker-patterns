export const errorHandlingContent = {
  es: {
    title: '⚠️ Manejo de Errores en Workers',
    subtitle: 'Ejemplo 06: Capturando y manejando errores',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Los errores que ocurren dentro de un Web Worker deben manejarse correctamente para evitar que la aplicación falle. Este ejemplo muestra distintos tipos de errores y cómo capturarlos.',
    prerequisite:
      '💡 Ya sabes crear workers y enviar mensajes. Ahora aprenderás qué pasa cuando algo sale mal dentro de un worker.',
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
    logPanel: { title: '📋 Consola de Eventos', empty: 'Sistema iniciado. Esperando acciones...' },
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
    alerts: { unsupported: 'Tu navegador no soporta Web Workers' },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Los errores en workers no crashean la aplicación principal',
        'El evento onerror proporciona mensaje, archivo y número de línea',
        'Siempre recrea el worker después de un error fatal'
      ],
      tip: 'Usa e.preventDefault() en onerror para evitar que el error se propague a la consola.'
    }
  },
  en: {
    title: '⚠️ Error Handling in Workers',
    subtitle: 'Example 06: Capturing and managing errors',
    infoTitle: '💡 What does this example show?',
    infoDescription:
      'Errors thrown inside a Web Worker must be handled correctly to keep the app stable. This example walks through different error types and how to capture them.',
    prerequisite:
      '💡 You already know how to create workers and send messages. Now you\'ll learn what happens when something goes wrong inside a worker.',
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
    logPanel: { title: '📋 Event Console', empty: 'System ready. Waiting for actions...' },
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
    alerts: { unsupported: 'Your browser does not support Web Workers' },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'Errors in workers don\'t crash the main application',
        'The onerror event provides message, file, and line number',
        'Always recreate the worker after a fatal error'
      ],
      tip: 'Use e.preventDefault() in onerror to prevent the error from propagating to the console.'
    }
  },
  pt: {
    title: '⚠️ Tratamento de Erros em Workers',
    subtitle: 'Exemplo 06: Capturando e tratando erros',
    infoTitle: '💡 O que este exemplo mostra?',
    infoDescription:
      'Erros lançados dentro de um Web Worker precisam ser tratados corretamente para manter a aplicação estável. Este exemplo apresenta diferentes tipos de erro e como capturá-los.',
    prerequisite:
      '💡 Você já sabe criar workers e enviar mensagens. Agora aprenderá o que acontece quando algo dá errado dentro de um worker.',
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
    logPanel: { title: '📋 Console de Eventos', empty: 'Sistema iniciado. Aguardando ações...' },
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
    alerts: { unsupported: 'Seu navegador não suporta Web Workers' },
    takeaways: {
      title: 'Pontos-Chave',
      items: [
        'Erros nos workers não crasham a aplicação principal',
        'O evento onerror fornece mensagem, arquivo e número de linha',
        'Sempre recrie o worker após um erro fatal'
      ],
      tip: 'Use e.preventDefault() em onerror para evitar que o erro se propague ao console.'
    }
  }
};
