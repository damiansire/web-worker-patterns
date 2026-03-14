import { code } from '../../core/utils/code-snippet.helper';

const S_es = {
  createSharedWorker: code`
// SharedWorker: una instancia compartida entre pestañas; Worker dedicado = uno por pestaña
const sharedWorker = new SharedWorker('shared_worker.js');
// MessagePort: cada pestaña tiene un puerto para comunicarse; hay que llamar start() para recibir
const port = sharedWorker.port;
port.start();
`,
  basicMessage: code`
// Toda la comunicación va por el puerto, no por el SharedWorker directamente
port.postMessage({
  type: 'message',
  tabId: 'tab-123',
  message: 'Hola desde pestaña 1'
});
`,
  angularComponent: code`
ngOnInit() {
  // El SharedWorker persiste hasta que se cierren TODAS las pestañas que lo usan
  if (typeof SharedWorker === 'undefined') {
    this.workerStatus.set('unsupported');
    alert(this.texts().alerts?.unsupported ?? 'SharedWorker no soportado');
    return;
  }

  const tabId = 'Tab-' + Math.random().toString(36).slice(2, 11);
  this.tabId.set(tabId);

  this.worker = new SharedWorker(
    new URL('./shared-worker.worker', import.meta.url),
    { type: 'module' }
  );
  this.worker.port.start();

  // MessagePort conecta esta pestaña con el contexto compartido
  this.worker.port.postMessage({
    type: 'connect',
    tabId
  });

  this.worker.port.onmessage = (event: MessageEvent<any>) => {
    const { type, tabId: senderTabId, message, connectedCount } = event.data;

    if (type === 'connected') {
      this.workerStatus.set('connected');
      this.connectedTabs.set(connectedCount);
    } else if (type === 'broadcast') {
      this.addMessage(senderTabId, message, senderTabId === tabId ? 'self' : 'other');
    }
  };
}

sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) {
    return;
  }

  this.worker.port.postMessage({
    type: 'message',
    tabId: this.tabId(),
    message
  });

  this.messageText.set('');
}
`
};

const S_en = {
  createSharedWorker: code`
// SharedWorker: one instance shared across tabs; dedicated Worker = one per tab
const sharedWorker = new SharedWorker('shared_worker.js');
// MessagePort: each tab gets a port to communicate; must call start() to receive
const port = sharedWorker.port;
port.start();
`,
  basicMessage: code`
// All communication goes through the port, not the SharedWorker directly
port.postMessage({
  type: 'message',
  tabId: 'tab-123',
  message: 'Hello from tab 1'
});
`,
  angularComponent: code`
ngOnInit() {
  // SharedWorker persists until ALL tabs using it are closed
  if (typeof SharedWorker === 'undefined') {
    this.workerStatus.set('unsupported');
    alert(this.texts().alerts?.unsupported ?? 'SharedWorker not supported');
    return;
  }

  const tabId = 'Tab-' + Math.random().toString(36).slice(2, 11);
  this.tabId.set(tabId);

  this.worker = new SharedWorker(
    new URL('./shared-worker.worker', import.meta.url),
    { type: 'module' }
  );
  this.worker.port.start();

  // MessagePort connects this tab to the shared worker context
  this.worker.port.postMessage({
    type: 'connect',
    tabId
  });

  this.worker.port.onmessage = (event: MessageEvent<any>) => {
    const { type, tabId: senderTabId, message, connectedCount } = event.data;

    if (type === 'connected') {
      this.workerStatus.set('connected');
      this.connectedTabs.set(connectedCount);
    } else if (type === 'broadcast') {
      this.addMessage(senderTabId, message, senderTabId === tabId ? 'self' : 'other');
    }
  };
}

sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) {
    return;
  }

  this.worker.port.postMessage({
    type: 'message',
    tabId: this.tabId(),
    message
  });

  this.messageText.set('');
}
`
};

const S_pt = {
  createSharedWorker: code`
// SharedWorker: uma instância compartilhada entre abas; Worker dedicado = um por aba
const sharedWorker = new SharedWorker('shared_worker.js');
// MessagePort: cada aba tem uma porta para comunicar; é preciso chamar start() para receber
const port = sharedWorker.port;
port.start();
`,
  basicMessage: code`
// Toda a comunicação passa pela porta, não pelo SharedWorker diretamente
port.postMessage({
  type: 'message',
  tabId: 'tab-123',
  message: 'Olá da aba 1'
});
`,
  angularComponent: code`
ngOnInit() {
  // O SharedWorker persiste até que TODAS as abas que o usam sejam fechadas
  if (typeof SharedWorker === 'undefined') {
    this.workerStatus.set('unsupported');
    alert(this.texts().alerts?.unsupported ?? 'SharedWorker não suportado');
    return;
  }

  const tabId = 'Tab-' + Math.random().toString(36).slice(2, 11);
  this.tabId.set(tabId);

  this.worker = new SharedWorker(
    new URL('./shared-worker.worker', import.meta.url),
    { type: 'module' }
  );
  this.worker.port.start();

  // MessagePort conecta esta aba ao contexto compartilhado
  this.worker.port.postMessage({
    type: 'connect',
    tabId
  });

  this.worker.port.onmessage = (event: MessageEvent<any>) => {
    const { type, tabId: senderTabId, message, connectedCount } = event.data;

    if (type === 'connected') {
      this.workerStatus.set('connected');
      this.connectedTabs.set(connectedCount);
    } else if (type === 'broadcast') {
      this.addMessage(senderTabId, message, senderTabId === tabId ? 'self' : 'other');
    }
  };
}

sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) {
    return;
  }

  this.worker.port.postMessage({
    type: 'message',
    tabId: this.tabId(),
    message
  });

  this.messageText.set('');
}
`
};

export const SHARED_WORKER_SNIPPETS = { es: S_es, en: S_en, pt: S_pt };
