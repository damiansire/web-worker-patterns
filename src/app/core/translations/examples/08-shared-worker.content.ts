export const sharedWorkerContent = {
  es: {
    title: '🌐 Shared Worker',
    subtitle: 'Ejemplo 07: Comunicación entre múltiples pestañas',
    infoTitle: '💡 ¿Qué demuestra este ejemplo?',
    infoDescription:
      'Un Shared Worker puede compartirse entre pestañas, iframes o ventanas. Es ideal para coordinar estado compartido o mantener una sola conexión a recursos externos.',
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
      statuses: { disconnected: 'Desconectado', connected: 'Conectado', unsupported: 'No soportado' }
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
    alerts: { unsupported: 'SharedWorker no está soportado en este navegador' },
    takeaways: {
      title: 'Puntos Clave',
      items: [
        'Un Shared Worker es compartido entre todas las pestañas del mismo origen',
        'Usa MessagePort para la comunicación con cada cliente',
        'Ideal para sincronizar estado o mantener una sola conexión WebSocket'
      ],
      tip: 'Verifica la compatibilidad del navegador: Safari no soporta Shared Workers.'
    }
  },
  en: {
    title: '🌐 Shared Worker',
    subtitle: 'Example 07: Communication across multiple tabs',
    infoTitle: '💡 What does this example demonstrate?',
    infoDescription:
      'A Shared Worker can be used by multiple tabs, iframes, or windows. It is perfect for keeping shared state or maintaining a single connection to external services.',
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
      statuses: { disconnected: 'Disconnected', connected: 'Connected', unsupported: 'Unsupported' }
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
    alerts: { unsupported: 'SharedWorker is not supported in this browser' },
    takeaways: {
      title: 'Key Takeaways',
      items: [
        'A Shared Worker is shared across all tabs from the same origin',
        'Uses MessagePort for communication with each client',
        'Ideal for syncing state or maintaining a single WebSocket connection'
      ],
      tip: 'Check browser compatibility: Safari does not support Shared Workers.'
    }
  },
  pt: {
    title: '🌐 Shared Worker',
    subtitle: 'Exemplo 07: Comunicação entre várias abas',
    infoTitle: '💡 O que este exemplo demonstra?',
    infoDescription:
      'Um Shared Worker pode ser compartilhado por várias abas, iframes ou janelas. Ideal para coordenar estado ou manter uma única conexão com serviços externos.',
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
      statuses: { disconnected: 'Desconectado', connected: 'Conectado', unsupported: 'Não suportado' }
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
    alerts: { unsupported: 'SharedWorker não é suportado neste navegador' },
    takeaways: {
      title: 'Pontos-Chave',
      items: [
        'Um Shared Worker é compartilhado entre todas as abas da mesma origem',
        'Usa MessagePort para comunicação com cada cliente',
        'Ideal para sincronizar estado ou manter uma única conexão WebSocket'
      ],
      tip: 'Verifique a compatibilidade do navegador: Safari não suporta Shared Workers.'
    }
  }
};
