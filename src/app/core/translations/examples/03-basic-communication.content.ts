export const basicCommunicationContent = {
  es: {
    title: '🚀 Comunicación Básica con Web Workers',
    subtitle: 'Ejemplo 03: Enviando y recibiendo mensajes',
    infoTitle: '💡 ¿Qué hace este ejemplo?',
    infoDescription:
      'Este es el "Hola Mundo" de los Web Workers. Escribe un mensaje y envíalo al worker. El worker lo recibirá, lo procesará y te responderá de vuelta.',
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
  en: {
    title: '🚀 Basic Communication with Web Workers',
    subtitle: 'Example 03: Sending and receiving messages',
    infoTitle: '💡 What does this example do?',
    infoDescription:
      'This is the "Hello World" of Web Workers. Type a message and send it to the worker. The worker receives it, processes it, and sends a response back.',
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
  pt: {
    title: '🚀 Comunicação Básica com Web Workers',
    subtitle: 'Exemplo 03: Enviando e recebendo mensagens',
    infoTitle: '💡 O que este exemplo faz?',
    infoDescription:
      'Este é o "Olá Mundo" dos Web Workers. Escreva uma mensagem e envie para o worker. O worker a recebe, processa e responde de volta.',
    codeSummary: '📖 Ver Código - Como funciona?',
    codeSections: {
      createWorker: '1️⃣ Criar o Worker',
      sendToWorker: '2️⃣ Enviar mensagem para o Worker',
      receiveInWorker: '3️⃣ Receber mensagem no Worker',
      receiveInMain: '4️⃣ Receber resposta do Worker'
    },
    flowTitle: '🔄 Fluxo de Comunicação',
    flowSteps: [
      'Thread Principal',
      'postMessage() ↓',
      'Worker',
      '↑ postMessage()',
      'Thread Principal'
    ],
    messageLabel: 'Mensagem para o Worker:',
    messagePlaceholder: 'Escreva sua mensagem aqui...',
    defaultMessage: 'Olá Worker!',
    sendButton: 'Enviar Mensagem para o Worker',
    emptyState: 'As mensagens aparecerão aqui...',
    senderMain: '📤 Thread Principal',
    senderWorker: '📥 Worker'
  }
};
