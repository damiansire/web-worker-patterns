import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LanguageService } from '../../core/services/language.service';

interface Message {
  sender: string;
  text: string;
  timestamp: string;
  type: 'system' | 'self' | 'other';
}

type WorkerStatus = 'disconnected' | 'connected' | 'unsupported';
type SharedWorkerEvent = 'connected' | 'broadcast' | 'tabConnected' | 'tabDisconnected';

@Component({
  selector: 'app-shared-worker',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './shared-worker.component.html',
  styleUrl: './shared-worker.component.scss',
  standalone: true
})
export class SharedWorkerComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.sharedWorker'));

  tabId = signal('');
  messageText = signal('');
  messages = signal<Message[]>([]);
  connectedTabs = signal(0);
  workerStatus = signal<WorkerStatus>('disconnected');
  private worker?: any;

  ngOnInit() {
    if (typeof SharedWorker !== 'undefined') {
      const uniqueId = 'Tab-' + Math.random().toString(36).substr(2, 9);
      this.tabId.set(uniqueId);
      
      this.worker = new SharedWorker(new URL('./shared-worker.worker', import.meta.url), { type: 'module' });
      this.worker.port.start();
      
      this.worker.port.postMessage({
        type: 'connect',
        tabId: uniqueId
      });
      
      this.worker.port.onmessage = (e: MessageEvent<any>) => {
        const { type, tabId: senderTabId, message, connectedCount } = e.data as {
          type: SharedWorkerEvent;
          tabId: string;
          message: string;
          connectedCount: number;
        };
        
        if (type === 'connected') {
          this.workerStatus.set('connected');
          this.addMessage(
            this.systemSender(),
            this.format(this.texts().chatPanel?.systemMessages?.connected, { tabId: uniqueId }),
            'system'
          );
          this.connectedTabs.set(connectedCount);
        } else if (type === 'broadcast') {
          this.addMessage(senderTabId, message, senderTabId === uniqueId ? 'self' : 'other');
        } else if (type === 'tabConnected' || type === 'tabDisconnected') {
          this.connectedTabs.set(connectedCount);
          const key = type === 'tabConnected' ? 'tabConnected' : 'tabDisconnected';
          this.addMessage(
            this.systemSender(),
            this.texts().chatPanel?.systemMessages?.[key] ?? key,
            'system'
          );
        }
      };
    } else {
      this.workerStatus.set('unsupported');
      const message = this.texts().alerts?.unsupported ?? 'SharedWorker not supported';
      alert(message);
      this.addMessage(this.systemSender(), message, 'system');
    }
  }

  ngOnDestroy() {
    this.worker?.port?.close();
  }

  addMessage(sender: string, text: string, type: Message['type']) {
    const timestamp = new Date().toLocaleTimeString();
    this.messages.update(m => [...m, { sender, text, timestamp, type }]);
  }

  sendMessage() {
    const message = this.messageText().trim();
    if (message && this.worker) {
      this.worker.port.postMessage({
        type: 'message',
        tabId: this.tabId(),
        message
      });
      this.messageText.set('');
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  private systemSender(): string {
    return this.texts().chatPanel?.systemSender ?? 'System';
  }

  private format(template: string | undefined, params: Record<string, string | number>): string {
    if (!template) {
      return Object.values(params).join(' ');
    }
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}
