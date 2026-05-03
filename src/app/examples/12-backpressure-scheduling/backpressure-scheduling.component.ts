import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { StatsPanelComponent, StatCard } from '../../core/components/stats-panel/stats-panel.component';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { BACKPRESSURE_SNIPPETS } from './backpressure-scheduling.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';
import { ThreadDiagramComponent, ThreadDiagramConfig } from '../../core/components/thread-diagram/thread-diagram.component';

interface ScheduledTask {
  id: string;
  complexity: number;
  submittedAt: number;
  startedAt?: number;
  completedAt?: number;
  executedOn: 'worker' | 'main-thread' | 'pending';
}

interface WorkerSlot {
  id: number;
  instance: Worker;
  busy: boolean;
  currentTaskId: string | null;
}

/**
 * Backpressure Scheduler.
 *
 * When the pool is saturated (activeTaskCount >= MAX_TASKS), new tasks are
 * executed synchronously on the main thread instead of being queued forever.
 * This prevents unbounded queue growth and guarantees progress.
 */
@Component({
  selector: 'app-backpressure-scheduling',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, StatsPanelComponent, ExampleNavComponent, KeyTakeawaysComponent, ThreadDiagramComponent],
  templateUrl: './backpressure-scheduling.component.html',
  styleUrl: './backpressure-scheduling.component.scss',
  standalone: true
})
export class BackpressureSchedulingComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.backpressureScheduling'));
  readonly codeSnippets = computed(() =>
    BACKPRESSURE_SNIPPETS[this.language.currentLanguage()] ?? BACKPRESSURE_SNIPPETS['en']
  );

  readonly threadDiagramConfig = computed<ThreadDiagramConfig>(() => ({
    workers: this.maxWorkers(),
    showQueue: true,
    messageFlow: 'parallel' as const
  }));

  // Config
  maxWorkers = signal(4);
  maxTasks = signal(6);
  burstSize = signal(20);
  taskComplexity = signal(5);

  // State
  offloadedCount = signal(0);
  fallbackCount = signal(0);
  completedCount = signal(0);
  droppedCount = signal(0);
  logs = signal<LogEntry[]>([]);
  isRunning = signal(false);

  private workers: WorkerSlot[] = [];
  private activeTasks = new Map<string, ScheduledTask>();
  private taskCounter = 0;

  ngOnInit() {
    this.progress.markVisited('12');
    this.addLog(this.texts().logs?.systemReady ?? 'System ready — Configure MAX_TASKS and burst size, then fire a burst.', 'info');
    this.addLog(
      this.format(this.texts().logs?.cpuInfo, { cores: navigator.hardwareConcurrency || '—' }),
      'info'
    );
  }

  ngOnDestroy() {
    this.shutdownWorkers();
  }

  initializeScheduler() {
    this.shutdownWorkers();
    this.resetCounters();

    const count = this.maxWorkers();
    for (let i = 0; i < count; i++) {
      const instance = new Worker(new URL('./backpressure-scheduling.worker', import.meta.url), { type: 'module' });
      const slot: WorkerSlot = { id: i + 1, instance, busy: false, currentTaskId: null };

      instance.onmessage = (e: MessageEvent) => {
        this.handleWorkerResult(slot, e.data);
      };
      instance.onerror = () => {
        this.addLog(this.format(this.texts().logs?.workerError, { id: slot.id }), 'error');
        slot.busy = false;
        slot.currentTaskId = null;
      };

      this.workers.push(slot);
    }

    this.isRunning.set(true);
    this.addLog(
      this.format(this.texts().logs?.schedulerReady, { workers: count, maxTasks: this.maxTasks() }),
      'success'
    );
  }

  /**
   * Core scheduling function:
   * if activeTaskCount < MAX_TASKS → offload to worker
   * else → execute synchronously on main thread (backpressure fallback)
   */
  scheduleTask(complexity: number): void {
    const taskId = `T-${++this.taskCounter}`;
    const task: ScheduledTask = {
      id: taskId,
      complexity,
      submittedAt: performance.now(),
      executedOn: 'pending'
    };

    if (this.activeTasks.size < this.maxTasks()) {
      // Happy path: offload to a worker
      const freeWorker = this.workers.find(w => !w.busy);
      if (freeWorker) {
        this.activeTasks.set(taskId, task);
        task.executedOn = 'worker';
        task.startedAt = performance.now();
        freeWorker.busy = true;
        freeWorker.currentTaskId = taskId;

        freeWorker.instance.postMessage({ taskId, complexity });
        this.offloadedCount.update(c => c + 1);
        this.addLog(
          this.format(this.texts().logs?.offloaded, { id: taskId, worker: freeWorker.id }),
          'success'
        );
        return;
      }
    }

    // BACKPRESSURE: all workers busy AND active tasks >= MAX_TASKS
    // Execute synchronously on main thread instead of queueing forever
    task.executedOn = 'main-thread';
    task.startedAt = performance.now();
    this.addLog(
      this.format(this.texts().logs?.fallback, { id: taskId, active: this.activeTasks.size, max: this.maxTasks() }),
      'warning'
    );

    // Synchronous execution on main thread (will block UI briefly)
    const start = performance.now();
    let result = 0;
    const iterations = complexity * 100000;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    const duration = Math.round(performance.now() - start);

    this.fallbackCount.update(c => c + 1);
    this.completedCount.update(c => c + 1);
    this.addLog(
      this.format(this.texts().logs?.fallbackDone, { id: taskId, time: duration }),
      'warning'
    );
  }

  fireBurst() {
    if (!this.isRunning()) {
      this.addLog(this.texts().logs?.initFirst ?? 'Initialize the scheduler first', 'warning');
      return;
    }

    const count = this.burstSize();
    const complexity = this.taskComplexity();
    this.addLog(
      this.format(this.texts().logs?.burstStart, { count, maxTasks: this.maxTasks() }),
      'info'
    );

    for (let i = 0; i < count; i++) {
      this.scheduleTask(complexity);
    }
  }

  fireGradualBurst() {
    if (!this.isRunning()) {
      this.addLog(this.texts().logs?.initFirst ?? 'Initialize the scheduler first', 'warning');
      return;
    }

    const count = this.burstSize();
    const complexity = this.taskComplexity();
    let i = 0;
    this.addLog(
      this.format(this.texts().logs?.gradualStart, { count }),
      'info'
    );

    const interval = setInterval(() => {
      if (i >= count) {
        clearInterval(interval);
        return;
      }
      this.scheduleTask(complexity);
      i++;
    }, 100);
  }

  shutdown() {
    this.shutdownWorkers();
    this.isRunning.set(false);
    this.addLog(this.texts().logs?.shutdown ?? 'Scheduler shut down', 'warning');
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.logsCleared ?? 'Logs cleared', 'info');
  }

  getStats(): StatCard[] {
    const t = this.texts().statsPanel ?? {};
    return [
      { label: t.workers ?? 'Workers', value: this.workers.filter(w => w.busy).length + '/' + this.workers.length },
      { label: t.activeTasks ?? 'Active Tasks', value: this.activeTasks.size + '/' + this.maxTasks() },
      { label: t.offloaded ?? 'Offloaded', value: this.offloadedCount(), type: 'success' },
      { label: t.fallback ?? 'Fallback (sync)', value: this.fallbackCount(), type: 'error' },
      { label: t.completed ?? 'Completed', value: this.completedCount() },
    ];
  }

  private handleWorkerResult(slot: WorkerSlot, result: { taskId: string; duration: number }) {
    const task = this.activeTasks.get(result.taskId);
    this.activeTasks.delete(result.taskId);
    slot.busy = false;
    slot.currentTaskId = null;
    this.completedCount.update(c => c + 1);

    this.addLog(
      this.format(this.texts().logs?.workerDone, {
        id: result.taskId,
        worker: slot.id,
        time: result.duration
      }),
      'success'
    );
  }

  private shutdownWorkers() {
    this.workers.forEach(w => w.instance.terminate());
    this.workers = [];
    this.activeTasks.clear();
  }

  private resetCounters() {
    this.offloadedCount.set(0);
    this.fallbackCount.set(0);
    this.completedCount.set(0);
    this.droppedCount.set(0);
    this.taskCounter = 0;
  }

  private addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  format(template: string | undefined, params: Record<string, string | number>): string {
    if (!template) return Object.values(params).join(' ');
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}
