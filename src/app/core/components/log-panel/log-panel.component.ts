import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

@Component({
  selector: 'app-log-panel',
  imports: [CommonModule],
  templateUrl: './log-panel.component.html',
  styleUrl: './log-panel.component.scss',
  standalone: true
})
export class LogPanelComponent {
  @Input() logs: LogEntry[] = [];
  @Input() title: string = '📋 Log de Eventos';
  @Input() emptyMessage: string = 'Los logs aparecerán aquí';
  @Output() clear = new EventEmitter<void>();

  @ViewChild('logContainer', { static: false }) logContainer!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      this.logs;
      setTimeout(() => {
        if (this.logContainer) {
          this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
        }
      }, 0);
    });
  }

  onClear() {
    this.clear.emit();
  }
}

