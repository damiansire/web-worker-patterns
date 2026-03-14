import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { BASIC_COMMUNICATION_SNIPPETS } from './basic-communication.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';
import { ThreadDiagramComponent, ThreadDiagramConfig } from '../../core/components/thread-diagram/thread-diagram.component';

interface Message {
  text: string;
  sender: 'main' | 'worker';
}

@Component({
  selector: 'app-basic-communication',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, ExampleNavComponent, KeyTakeawaysComponent, ThreadDiagramComponent],
  templateUrl: './basic-communication.component.html',
  styleUrl: './basic-communication.component.scss',
  standalone: true
})
export class BasicCommunicationComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.basicCommunication'));
  readonly codeSnippets = computed(() =>
    BASIC_COMMUNICATION_SNIPPETS[this.language.currentLanguage()] ?? BASIC_COMMUNICATION_SNIPPETS.en
  );

  readonly threadDiagramConfig: ThreadDiagramConfig = {
    workers: 1,
    messageFlow: 'sequential'
  };

  readonly logs = signal<LogEntry[]>([]);

  messageText = signal('');
  messages = signal<Message[]>([]);
  private worker?: Worker;

  ngOnInit() {
    this.progress.markVisited('03');
    this.messageText.set(this.texts().defaultMessage);

    if (typeof Worker !== 'undefined') {
      // Crear una nueva instancia del worker
      this.worker = new Worker(new URL('./basic-communication.worker', import.meta.url), { type: 'module' });

      this.worker.onmessage = (e: MessageEvent) => {
        console.log('✅ Mensaje recibido del worker:', e.data);
        this.addMessage(e.data, 'worker');
        this.addLog(`Received: ${e.data}`, 'success');
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('❌ Error en el worker:', error);
        this.addMessage(`Error: ${error.message}`, 'worker');
        this.addLog(`Error: ${error.message}`, 'error');
      };

      this.addLog('Worker created successfully', 'info');
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

      this.addMessage(message, 'main');
      this.addLog(`Sent: ${message}`, 'info');

      this.worker.postMessage(message);

      this.messageText.set('');
    }
  }

  private addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
    this.logs.update(l => [{ timestamp, message, type }, ...l]);
  }

  clearLogs() {
    this.logs.set([]);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}

