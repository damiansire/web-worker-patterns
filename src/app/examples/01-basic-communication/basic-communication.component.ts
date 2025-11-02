import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  text: string;
  sender: 'main' | 'worker';
}

@Component({
  selector: 'app-basic-communication',
  imports: [CommonModule, FormsModule],
  templateUrl: './basic-communication.component.html',
  styleUrl: './basic-communication.component.scss',
  standalone: true
})
export class BasicCommunicationComponent implements OnInit, OnDestroy {
  messageText = signal('¡Hola Worker!');
  messages = signal<Message[]>([]);
  private worker?: Worker;

  ngOnInit() {
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

