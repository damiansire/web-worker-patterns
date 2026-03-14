import { code } from '../../core/utils/code-snippet.helper';

export const SHARED_WORKER_SNIPPETS = {
  createSharedWorker: code`
const sharedWorker = new SharedWorker('shared_worker.js');
const port = sharedWorker.port;
port.start();
`,
  basicMessage: code`
port.postMessage({
  type: 'message',
  tabId: 'tab-123',
  message: 'Hola desde pestaña 1'
});
`,
  angularComponent: code`
ngOnInit() {
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
