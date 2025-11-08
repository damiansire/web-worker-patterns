import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { StatsPanelComponent, StatCard } from '../../core/components/stats-panel/stats-panel.component';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-lifecycle-termination',
  imports: [CommonModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, StatsPanelComponent],
  templateUrl: './lifecycle-termination.component.html',
  styleUrl: './lifecycle-termination.component.scss',
  standalone: true
})
export class LifecycleTerminationComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.lifecycleTermination'));

  logs = signal<LogEntry[]>([]);
  workerStatus = signal<'none' | 'created' | 'working' | 'completed'>('none');
  progress = signal(0);
  createdCount = signal(0);
  completedCount = signal(0);
  terminatedCount = signal(0);
  private worker?: Worker;

  ngOnInit() {
    this.addLog(this.texts().logs?.systemReady ?? 'System ready', 'info');
  }

  ngOnDestroy() {
    this.terminateWorker();
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  createWorker() {
    if (this.worker) return;
    
    this.addLog(this.texts().logs?.creating ?? 'Creating worker...', 'info');
    
    this.worker = new Worker(new URL('./lifecycle-termination.worker', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e: MessageEvent<any>) => {
      if (e.data.type === 'progress') {
        this.progress.set(e.data.progress);
      } else if (e.data.type === 'complete') {
        this.addLog(this.format(this.texts().logs?.taskCompleted, { result: e.data.result }), 'success');
        this.workerStatus.set('completed');
        this.completedCount.update(c => c + 1);
        this.progress.set(0);
      }
    };

    this.worker.onerror = (e: ErrorEvent) => {
      this.addLog(this.format(this.texts().logs?.workerError, { message: e.message }), 'error');
    };

    this.workerStatus.set('created');
    this.createdCount.update(c => c + 1);
    this.addLog(this.texts().logs?.workerCreated ?? 'Worker created', 'success');
  }

  startTask() {
    if (!this.worker) return;
    
    this.addLog(this.texts().logs?.startTask ?? 'Starting task...', 'info');
    this.workerStatus.set('working');
    this.progress.set(0);
    this.worker.postMessage({ action: 'startLongTask', duration: 5000 });
  }

  terminateWorker() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
      this.workerStatus.set('none');
      this.addLog(this.texts().logs?.workerTerminated ?? 'Worker terminated', 'warning');
      this.terminatedCount.update(c => c + 1);
    }
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.logsCleared ?? 'Logs cleared', 'info');
  }

  getStats(): StatCard[] {
    const statsTexts = this.texts().statsPanel ?? {};
    return [
      { label: statsTexts.created ?? 'Workers created', value: this.createdCount() },
      { label: statsTexts.completed ?? 'Tasks completed', value: this.completedCount() },
      { label: statsTexts.terminated ?? 'Terminations', value: this.terminatedCount() }
    ];
  }

  statusLabel(): string {
    return this.texts().controlPanel?.status?.[this.workerStatus()] ?? this.workerStatus();
  }

  formatProgress(): string {
    return this.format(this.texts().controlPanel?.progressLabel, { progress: this.progress() });
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
