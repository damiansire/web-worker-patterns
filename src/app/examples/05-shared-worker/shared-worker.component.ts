import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  sender: string;
  text: string;
  timestamp: string;
  type: 'system' | 'self' | 'other';
}

@Component({
  selector: 'app-shared-worker',
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-worker.component.html',
  styleUrl: './shared-worker.component.scss',
  standalone: true
})
export class SharedWorkerComponent implements OnInit, OnDestroy {
  tabId = signal('');
  messageText = signal('');
  messages = signal<Message[]>([]);
  connectedTabs = signal(0);
  workerStatus = signal('Desconectado');
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
        const { type, tabId: senderTabId, message, connectedCount } = e.data;
        
        if (type === 'connected') {
          this.workerStatus.set('Conectado');
          this.addMessage('🤖 Sistema', `Conectado como ${uniqueId}`, 'system');
          this.connectedTabs.set(connectedCount);
        } else if (type === 'broadcast') {
          this.addMessage(senderTabId, message, senderTabId === uniqueId ? 'self' : 'other');
        } else if (type === 'tabConnected' || type === 'tabDisconnected') {
          this.connectedTabs.set(connectedCount);
          this.addMessage('🤖 Sistema', `Pestaña ${type === 'tabConnected' ? 'conectada' : 'desconectada'}`, 'system');
        }
      };
    } else {
      this.workerStatus.set('No soportado');
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
}
