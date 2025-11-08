import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { StatsPanelComponent, StatCard } from '../../core/components/stats-panel/stats-panel.component';
import { LanguageService } from '../../core/services/language.service';

interface Task {
  id: string;
  data: any;
  duration: number;
  addedAt: number;
  startedAt?: number;
}

interface WorkerData {
  id: number;
  instance: Worker;
  busy: boolean;
  currentTask: Task | null;
}

interface PoolStats {
  poolSize: number;
  queueSize: number;
  processing: number;
  completed: number;
  avgTime: number;
  throughput: number;
}

@Component({
  selector: 'app-worker-pool',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, StatsPanelComponent],
  templateUrl: './worker-pool.component.html',
  styleUrl: './worker-pool.component.scss',
  standalone: true
})
export class WorkerPoolComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.workerPool'));

  poolSizeInput = signal(4);
  taskCount = signal(20);
  taskDuration = signal(1000);
  
  poolSize = signal(0);
  queueSize = signal(0);
  processing = signal(0);
  completed = signal(0);
  avgTime = signal(0);
  throughput = signal(0);
  
  logs = signal<LogEntry[]>([]);
  
  poolInitialized = signal(false);
  
  private workerPool: WorkerPool | null = null;
  private statsInterval?: any;

  ngOnInit() {
    this.addLog(this.texts().logs?.systemReady ?? 'System ready', 'info');
    this.addLog(
      this.format(this.texts().logs?.cpuInfo, { cores: navigator.hardwareConcurrency || '—' }),
      'info'
    );
    this.updateStats();
  }

  ngOnDestroy() {
    if (this.workerPool) {
      this.workerPool.shutdown();
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  initializePool() {
    const size = this.poolSizeInput();
    if (size < 1 || size > 16) {
      this.addLog(this.texts().logs?.invalidPoolSize ?? 'Invalid pool size', 'warning');
      return;
    }

    if (this.workerPool) {
      this.workerPool.shutdown();
    }

    this.workerPool = new WorkerPool(size, this, () => {
      const stats = this.workerPool!.getStats();
      this.poolSize.set(stats.poolSize);
      this.queueSize.set(stats.queueSize);
      this.processing.set(stats.processing);
      this.completed.set(stats.completed);
      this.avgTime.set(stats.avgTime);
      this.throughput.set(stats.throughput);
    });

    this.poolInitialized.set(true);
    this.addLog(
      this.format(this.texts().logs?.poolInitialized, { size }),
      'success'
    );
    this.addLog(
      this.format(this.texts().logs?.recommendation, { cores: navigator.hardwareConcurrency || 4 }),
      'info'
    );
    
    this.statsInterval = setInterval(() => {
      if (this.workerPool) {
        const stats = this.workerPool.getStats();
        this.updateStatsDisplay(stats);
      }
    }, 1000);
  }

  addTasks() {
    if (!this.workerPool) {
      this.addLog(this.texts().logs?.initializeFirst ?? 'Initialize the pool first', 'warning');
      return;
    }

    const count = this.taskCount();
    const duration = this.taskDuration();
    
    const tasks: Task[] = [];
    for (let i = 0; i < count; i++) {
      tasks.push({
        id: `${Date.now()}-${i}`,
        data: `Tarea ${i + 1}`,
        duration,
        addedAt: Date.now()
      });
    }

    this.workerPool.addTasks(tasks);
    this.updateStatsDisplay(this.workerPool.getStats());
  }

  stressTest() {
    if (!this.workerPool) {
      this.addLog(this.texts().logs?.initializeFirst ?? 'Initialize the pool first', 'warning');
      return;
    }

    this.addLog(this.texts().logs?.stressStart ?? 'Starting stress test...', 'warning');
    
    const tasks: Task[] = [];
    for (let i = 0; i < 100; i++) {
      tasks.push({
        id: `${Date.now()}-${i}`,
        data: `Stress Task ${i + 1}`,
        duration: 500,
        addedAt: Date.now()
      });
    }

    this.workerPool.addTasks(tasks);
    this.updateStatsDisplay(this.workerPool.getStats());
  }

  clearQueue() {
    if (!this.workerPool) return;
    this.workerPool.clearQueue();
    this.updateStatsDisplay(this.workerPool.getStats());
  }

  shutdownPool() {
    if (!this.workerPool) return;
    
    this.workerPool.shutdown();
    this.workerPool = null;
    this.poolInitialized.set(false);
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = undefined;
    }
    
    this.updateStats();
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.logsCleared ?? 'Logs cleared', 'info');
  }

  getStats(): StatCard[] {
    const statsTexts = this.texts().statsPanel ?? {};
    return [
      { label: statsTexts.poolSize ?? 'Workers', value: this.poolSize() },
      { label: statsTexts.queue ?? 'Queue', value: this.queueSize() },
      { label: statsTexts.processing ?? 'Processing', value: this.processing() },
      { label: statsTexts.completed ?? 'Completed', value: this.completed(), type: 'success' },
      { label: statsTexts.throughput ?? 'Tasks/sec', value: this.throughput().toFixed(1) },
      { label: statsTexts.avgTime ?? 'Avg time', value: this.avgTime() > 0 ? `${this.avgTime()}ms` : '-' }
    ];
  }

  updateStats() {
    this.poolSize.set(0);
    this.queueSize.set(0);
    this.processing.set(0);
    this.completed.set(0);
    this.avgTime.set(0);
    this.throughput.set(0);
  }

  private updateStatsDisplay(stats: PoolStats) {
    this.poolSize.set(stats.poolSize);
    this.queueSize.set(stats.queueSize);
    this.processing.set(stats.processing);
    this.completed.set(stats.completed);
    this.avgTime.set(stats.avgTime);
    this.throughput.set(stats.throughput);
  }

  format(template: string | undefined, params: Record<string, string | number>): string {
    if (!template) {
      return Object.values(params).join(' ');
    }
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}

// ===== CLASE WORKER POOL =====
class WorkerPool {
  private poolSize: number;
  private workers: WorkerData[] = [];
  private taskQueue: Task[] = [];
  private activeCount = 0;
  private completedCount = 0;
  private startTime: number;
  private completionTimes: number[] = [];
  private component: WorkerPoolComponent;
  private statsCallback: () => void;

  constructor(size: number, component: WorkerPoolComponent, statsCallback: () => void) {
    this.poolSize = size;
    this.component = component;
    this.statsCallback = statsCallback;
    this.startTime = Date.now();
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker: WorkerData = {
        id: i + 1,
        instance: new Worker(new URL('./worker-pool.worker', import.meta.url), { type: 'module' }),
        busy: false,
        currentTask: null
      };

      worker.instance.onmessage = (e: MessageEvent) => {
        this.handleWorkerComplete(worker, e.data);
      };

      worker.instance.onerror = (error: ErrorEvent) => {
        this.component.addLog(
          this.component.format(this.component.texts().logs?.workerError ?? '', {
            id: worker.id,
            message: error.message
          }),
          'error'
        );
      };

      this.workers.push(worker);
    }
  }

  addTasks(tasks: Task[]) {
    this.component.addLog(
      this.component.format(this.component.texts().logs?.tasksAdded ?? '', { count: tasks.length }),
      'info'
    );
    this.taskQueue.push(...tasks);
    this.processQueue();
  }

  private processQueue() {
    const availableWorkers = this.workers.filter(w => !w.busy);
    
    availableWorkers.forEach(worker => {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          this.assignTaskToWorker(worker, task);
        }
      }
    });
    
    this.statsCallback();
  }

  private assignTaskToWorker(worker: WorkerData, task: Task) {
    worker.busy = true;
    worker.currentTask = task;
    this.activeCount++;
    task.startedAt = Date.now();

    this.component.addLog(
      this.component.format(this.component.texts().logs?.workerProcessing ?? '', {
        id: worker.id,
        task: task.data
      }),
      'info'
    );

    worker.instance.postMessage({
      taskId: task.id,
      data: task.data,
      duration: task.duration
    });
  }

  private handleWorkerComplete(worker: WorkerData, result: any) {
    const task = worker.currentTask;
    if (!task) return;

    const completionTime = Date.now() - (task.startedAt || 0);
    this.completionTimes.push(completionTime);

    this.component.addLog(
      this.component.format(this.component.texts().logs?.workerCompleted ?? '', {
        id: worker.id,
        task: task.data,
        time: completionTime
      }),
      'success'
    );

    worker.busy = false;
    worker.currentTask = null;
    this.activeCount--;
    this.completedCount++;

    this.processQueue();
    this.statsCallback();
  }

  clearQueue() {
    const cleared = this.taskQueue.length;
    this.taskQueue = [];
    this.component.addLog(
      this.component.format(this.component.texts().logs?.queueCleared ?? '', { count: cleared }),
      'warning'
    );
    this.statsCallback();
  }

  shutdown() {
    this.workers.forEach(worker => {
      worker.instance.terminate();
    });
    this.workers = [];
    this.taskQueue = [];
    this.activeCount = 0;
    this.component.addLog(this.component.texts().logs?.poolShutdown ?? 'Pool shutdown', 'warning');
    this.statsCallback();
  }

  getStats(): PoolStats {
    const avgTime = this.completionTimes.length > 0
      ? Math.round(this.completionTimes.reduce((a, b) => a + b, 0) / this.completionTimes.length)
      : 0;

    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const throughput = elapsedSeconds > 0 
      ? parseFloat((this.completedCount / elapsedSeconds).toFixed(2))
      : 0;

    return {
      poolSize: this.workers.length,
      queueSize: this.taskQueue.length,
      processing: this.activeCount,
      completed: this.completedCount,
      avgTime,
      throughput
    };
  }
}

