import { code } from '../../core/utils/code-snippet.helper';

const SNIPPETS_ES = {
  vanillaCreateWorker: code`
// Worker() requiere una URL: carga y ejecuta el script en un hilo separado
const myWorker = new Worker('worker.js');
`,
  vanillaSendMessage: code`
// postMessage usa structured clone: los datos se serializan y copian al worker
myWorker.postMessage('¡Hola Worker!');
`,
  vanillaReceiveInWorker: code`
// onmessage es asíncrono: el worker no se bloquea
self.onmessage = function (e) {
  const mensaje = e.data;
  const respuesta = 'Procesé tu mensaje: ' + mensaje;
  self.postMessage(respuesta);
};
`,
  vanillaReceiveInMain: code`
// El hilo principal recibe de forma asíncrona
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
    this.worker.onmessage = (event: MessageEvent) => this.addMessage(event.data, 'worker');
    this.worker.onerror = (error: ErrorEvent) => this.addMessage('Error: ' + error.message, 'worker');
  } else {
    alert('❌ Tu navegador no soporta Web Workers.');
  }
}
sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) return;
  this.addMessage(message, 'main');
  this.worker.postMessage(message);
  this.messageText.set('');
}
`,
  workerTsFile: code`
// Worker: no DOM, solo self y postMessage
addEventListener('message', ({ data }) => {
  const response = 'Procesé tu mensaje: ' + data;
  postMessage(response);
});
`
};

const SNIPPETS_EN = {
  vanillaCreateWorker: code`
// Worker() requires a URL—loads and runs the script in a separate thread
const myWorker = new Worker('worker.js');
`,
  vanillaSendMessage: code`
// postMessage uses structured clone—data is serialized and copied to the worker
myWorker.postMessage('Hello Worker!');
`,
  vanillaReceiveInWorker: code`
// onmessage is event-driven: the worker stays non-blocking
self.onmessage = function (e) {
  const message = e.data;
  const response = 'I processed your message: ' + message;
  self.postMessage(response);
};
`,
  vanillaReceiveInMain: code`
// Main thread receives async—no blocking
myWorker.onmessage = function (e) {
  const response = e.data;
  console.log('Main thread received:', response);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    this.worker = new Worker(
      new URL('./basic-communication.worker', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = (event: MessageEvent) => this.addMessage(event.data, 'worker');
    this.worker.onerror = (error: ErrorEvent) => this.addMessage('Error: ' + error.message, 'worker');
  } else {
    alert('Your browser does not support Web Workers.');
  }
}
sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) return;
  this.addMessage(message, 'main');
  this.worker.postMessage(message);
  this.messageText.set('');
}
`,
  workerTsFile: code`
// Worker context: no DOM, only self and postMessage
addEventListener('message', ({ data }) => {
  const response = 'I processed your message: ' + data;
  postMessage(response);
});
`
};

const SNIPPETS_PT = {
  vanillaCreateWorker: code`
// Worker() requer uma URL: carrega e executa o script em uma thread separada
const myWorker = new Worker('worker.js');
`,
  vanillaSendMessage: code`
// postMessage usa structured clone: os dados são serializados e copiados para o worker
myWorker.postMessage('Olá Worker!');
`,
  vanillaReceiveInWorker: code`
// onmessage é assíncrono: o worker não bloqueia
self.onmessage = function (e) {
  const mensagem = e.data;
  const resposta = 'Processei sua mensagem: ' + mensagem;
  self.postMessage(resposta);
};
`,
  vanillaReceiveInMain: code`
// A thread principal recebe de forma assíncrona
myWorker.onmessage = function (e) {
  const resposta = e.data;
  console.log('Thread principal recebeu:', resposta);
};
`,
  angularComponent: code`
ngOnInit() {
  if (typeof Worker !== 'undefined') {
    this.worker = new Worker(
      new URL('./basic-communication.worker', import.meta.url),
      { type: 'module' }
    );
    this.worker.onmessage = (event: MessageEvent) => this.addMessage(event.data, 'worker');
    this.worker.onerror = (error: ErrorEvent) => this.addMessage('Error: ' + error.message, 'worker');
  } else {
    alert('Seu navegador não suporta Web Workers.');
  }
}
sendMessage() {
  const message = this.messageText().trim();
  if (!message || !this.worker) return;
  this.addMessage(message, 'main');
  this.worker.postMessage(message);
  this.messageText.set('');
}
`,
  workerTsFile: code`
// Worker: sem DOM, apenas self e postMessage
addEventListener('message', ({ data }) => {
  const response = 'Processei sua mensagem: ' + data;
  postMessage(response);
});
`
};

export const BASIC_COMMUNICATION_SNIPPETS = { es: SNIPPETS_ES, en: SNIPPETS_EN, pt: SNIPPETS_PT };
