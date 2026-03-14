import { code } from '../../core/utils/code-snippet.helper';

export const BASIC_COMMUNICATION_SNIPPETS = {
  vanillaCreateWorker: code`
const myWorker = new Worker('worker.js');
`,
  vanillaSendMessage: code`
myWorker.postMessage('¡Hola Worker!');
`,
  vanillaReceiveInWorker: code`
self.onmessage = function (e) {
  const mensaje = e.data;
  const respuesta = 'Procesé tu mensaje: ' + mensaje;
  self.postMessage(respuesta);
};
`,
  vanillaReceiveInMain: code`
myWorker.onmessage = function (e) {
  const respuesta = e.data;
  console.log('Hilo principal recibió:', respuesta);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    this.worker = new Worker(
      new URL('./basic-communication.worker', import.meta.url),
      { type: 'module' }
    );

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
  this.worker.postMessage(message);
  this.messageText.set('');
}
`,
  workerTsFile: code`
/// basic-communication.worker.ts
addEventListener('message', ({ data }) => {
  const response = 'Procesé tu mensaje: ' + data;
  postMessage(response);
});
`
};
