import { code } from '../../core/utils/code-snippet.helper';

export const BASIC_COMMUNICATION_SNIPPETS = {
  vanillaCreateWorker: code`
// Worker() requires a URL—it loads and runs the script in a separate thread
const myWorker = new Worker('worker.js');
`,
  vanillaSendMessage: code`
// postMessage uses structured clone—data is serialized and copied to the worker thread
myWorker.postMessage('¡Hola Worker!');
`,
  vanillaReceiveInWorker: code`
// onmessage is event-driven: the worker thread stays non-blocking, handling messages as they arrive
self.onmessage = function (e) {
  const mensaje = e.data;
  const respuesta = 'Procesé tu mensaje: ' + mensaje;
  self.postMessage(respuesta);
};
`,
  vanillaReceiveInMain: code`
// Main thread receives async—no blocking; worker runs in a separate JS execution context
myWorker.onmessage = function (e) {
  const respuesta = e.data;
  console.log('Hilo principal recibió:', respuesta);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    // new URL(..., import.meta.url) resolves the worker path for bundlers (Vite, Webpack)
    this.worker = new Worker(
      new URL('./basic-communication.worker', import.meta.url),
      { type: 'module' }
    );

    // Event-driven: main thread stays responsive while waiting for worker replies
    this.worker.onmessage = (event: MessageEvent) => {
      this.addMessage(event.data, 'worker');
    };

    this.worker.onerror = (error: ErrorEvent) => {
      this.addMessage('Error: ' + error.message, 'worker');
    };
  } else {
    alert('❌ Tu navegador no soporta Web Workers.');
  }
}

sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) {
    return;
  }

  this.addMessage(message, 'main');
  // postMessage copies data via structured clone—no shared memory by default
  this.worker.postMessage(message);
  this.messageText.set('');
}
`,
  workerTsFile: code`
/// basic-communication.worker.ts
// Worker context: no DOM, no window—only self, postMessage, and imported scripts
addEventListener('message', ({ data }) => {
  const response = 'Procesé tu mensaje: ' + data;
  postMessage(response);
});
`
};
