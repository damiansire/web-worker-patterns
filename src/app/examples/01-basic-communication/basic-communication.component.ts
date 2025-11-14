import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LanguageService } from '../../core/services/language.service';

const code = (strings: TemplateStringsArray, ...values: unknown[]) =>
  `${String.raw(strings, ...values).trim()}` + '\n';

interface Message {
  text: string;
  sender: 'main' | 'worker';
}

@Component({
  selector: 'app-basic-communication',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './basic-communication.component.html',
  styleUrl: './basic-communication.component.scss',
  standalone: true
})
export class BasicCommunicationComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.basicCommunication'));
  readonly codeSnippets = {
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

  messageText = signal('');
  messages = signal<Message[]>([]);
  private worker?: Worker;

  ngOnInit() {
    this.messageText.set(this.texts().defaultMessage);

    if (typeof Worker !== 'undefined') {
      // Crear una nueva instancia del worker
      this.worker = new Worker(new URL('./basic-communication.worker', import.meta.url), { type: 'module' });

      // Escuchar mensajes del worker
      this.worker.onmessage = (e: MessageEvent) => {
        console.log('✅ Mensaje recibido del worker:', e.data);
        this.addMessage(e.data, 'worker');
      };

      // Manejar errores del worker
      this.worker.onerror = (error: ErrorEvent) => {
        console.error('❌ Error en el worker:', error);
        this.addMessage(`Error: ${error.message}`, 'worker');
      };

      console.log('🎬 Worker creado y listo para recibir mensajes');
    } else {
      alert('❌ Tu navegador no soporta Web Workers. Por favor, usa un navegador moderno.');
      console.error('Web Workers no están disponibles en este navegador');
    }
  }

  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
      console.log('🔚 Worker terminado');
    }
  }

  addMessage(text: string, sender: 'main' | 'worker') {
    this.messages.update(messages => [...messages, { text, sender }]);
  }

  sendMessage() {
    const message = this.messageText().trim();

    if (message && this.worker) {
      console.log('📤 Enviando mensaje al worker:', message);

      // Agregar el mensaje enviado a la interfaz
      this.addMessage(message, 'main');

      // Enviar el mensaje al worker usando postMessage
      this.worker.postMessage(message);

      // Limpiar el input
      this.messageText.set('');
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}

