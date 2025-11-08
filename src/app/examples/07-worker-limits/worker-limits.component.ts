import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { StatsPanelComponent, StatCard } from '../../core/components/stats-panel/stats-panel.component';
import { LanguageService } from '../../core/services/language.service';

interface WorkerData {
  id: number;
  worker: Worker;
  createdAt: number;
  status: string;
}

@Component({
  selector: 'app-worker-limits',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, StatsPanelComponent],
  templateUrl: './worker-limits.component.html',
  styleUrl: './worker-limits.component.scss',
  standalone: true
})
export class WorkerLimitsComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.workerLimits'));

  workerCount = signal(10);
  activeCount = signal(0);
  totalCreated = signal(0);
  errorCount = signal(0);
  logs = signal<LogEntry[]>([]);
  detectedLimit = signal<string>('-');
  memoryUsed = signal<string>('-');
  
  // Detección automática
  detectionInProgress = signal(false);
  detectionStopped = signal(false);
  detectProgress = signal('Listo');
  detectProgressPercent = signal(0);
  detectStatusVisible = signal(false);
  detectResultVisible = signal(false);
  detectResult = signal({
    finalLimit: 0,
    detectionTime: '0s',
    vsRecommended: '-'
  });

  private workers: WorkerData[] = [];
  private cleanupInterval?: any;
  private memoryInterval?: any;

  constructor() {
  }

  ngOnInit() {
    this.addLog(
      this.format(this.texts().logs?.systemStarted, { cores: this.getCPUCores() }),
      'info'
    );
    this.addLog(
      this.format(this.texts().logs?.browserInfo, { browser: this.getBrowserInfo() }),
      'info'
    );
    this.addLog(
      this.format(this.texts().logs?.recommendedMax, { recommended: this.getRecommendedMax() }),
      'info'
    );
    this.addLog(this.texts().logs?.autodetectSuggestion ?? '', 'info');
    
    // Actualizar memoria periódicamente
    this.memoryInterval = setInterval(() => {
      this.updateMemory();
    }, 2000);
    
    this.updateStats();
  }

  ngOnDestroy() {
    this.terminateAll();
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.memoryInterval) clearInterval(this.memoryInterval);
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.update(l => [...l, { timestamp, message, type }]);
  }

  updateStats() {
    this.activeCount.set(this.workers.length);
    this.updateMemory();
  }

  updateMemory() {
    if ((performance as any).memory) {
      const usedMB = ((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      this.memoryUsed.set(`${usedMB} MB`);
    }
  }

  createWorker(): boolean {
    try {
      const workerId = this.totalCreated() + 1;
      const worker = new Worker(new URL('./worker-limits.worker', import.meta.url), { type: 'module' });
      
      const workerData: WorkerData = {
        id: workerId,
        worker,
        createdAt: Date.now(),
        status: 'active'
      };
      
      worker.onmessage = () => {
        const w = this.workers.find(w => w.id === workerId);
        if (w) {
          w.status = 'active';
        }
      };
      
      worker.onerror = () => {
        this.errorCount.update(c => c + 1);
        this.addLog(this.format(this.texts().logs?.workerError, { id: workerId }), 'error');
        this.updateStats();
      };
      
      this.workers.push(workerData);
      this.totalCreated.update(c => c + 1);
      this.addLog(this.format(this.texts().logs?.workerCreated, { id: workerId }), 'success');
      
      worker.postMessage({ action: 'init', workerId });
      this.updateStats();
      
      return true;
    } catch (error: any) {
      this.errorCount.update(c => c + 1);
      this.addLog(this.format(this.texts().logs?.errorCreatingWorker, { message: error.message }), 'error');
      this.addLog(this.texts().logs?.limitReachedWarning ?? '', 'warning');
      this.updateStats();
      return false;
    }
  }

  async createMultipleWorkers() {
    const count = this.workerCount();
    this.addLog(this.format(this.texts().logs?.creatingMultiple, { count }), 'info');
    
    if (count > this.getRecommendedMax()) {
      this.addLog(
        this.format(this.texts().logs?.overRecommendedWarning, {
          count,
          recommended: this.getRecommendedMax(),
          cores: this.getCPUCores()
        }),
        'warning'
      );
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < count; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (this.createWorker()) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    this.addLog(
      this.format(this.texts().logs?.multipleResult, { success: successCount, fail: failCount }),
      failCount > 0 ? 'warning' : 'success'
    );
  }

  async stressTest() {
    const stressCount = 50;
    this.addLog(this.format(this.texts().logs?.stressStart, { count: stressCount }), 'warning');
    this.addLog(
      this.format(this.texts().logs?.stressInfo, {
        cores: this.getCPUCores(),
        recommended: this.getRecommendedMax()
      }),
      'info'
    );
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < stressCount; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (this.createWorker()) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    this.addLog(this.texts().logs?.stressSummary ?? '', 'warning');
    this.addLog(this.format(this.texts().logs?.stressSuccess, { count: successCount }), 'success');
    this.addLog(this.format(this.texts().logs?.stressFail, { count: failCount }), 'error');
    this.addLog(this.format(this.texts().logs?.stressDetected, { limit: successCount }), 'info');
  }

  async autoDetectLimit() {
    this.detectionInProgress.set(true);
    this.detectionStopped.set(false);
    const startDetectionTime = Date.now();
    
    // Limpiar workers existentes
    if (this.workers.length > 0) {
      this.terminateAll();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    this.detectStatusVisible.set(true);
    this.detectResultVisible.set(false);
    
    this.addLog(this.texts().logs?.autodetectStart ?? '', 'info');
    
    let currentWorker = 1;
    let consecutiveFailures = 0;
    let lastSuccessful = 0;
    
    while (currentWorker <= 100 && !this.detectionStopped()) {
      this.detectProgress.set(
        this.format(this.texts().logs?.autodetectProgress, { number: currentWorker })
      );
      this.detectProgressPercent.set(Math.min(currentWorker, 99));
      
      const success = this.createWorker();
      
      if (success) {
        consecutiveFailures = 0;
        lastSuccessful = currentWorker;
        this.addLog(this.format(this.texts().logs?.workerCreated, { id: currentWorker }), 'success');
      } else {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          this.addLog(this.format(this.texts().logs?.autodetectDetected, { limit: lastSuccessful }), 'warning');
          break;
        }
      }
      
      currentWorker++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.detectionInProgress.set(false);
    const detectionDuration = ((Date.now() - startDetectionTime) / 1000).toFixed(1);
    
    this.detectProgressPercent.set(100);
    this.detectProgress.set(this.texts().autoDetect?.completedLabel ?? 'Detection completed');
    
    setTimeout(() => {
      this.detectStatusVisible.set(false);
      this.detectResultVisible.set(true);
      
      this.detectedLimit.set(`${lastSuccessful} workers`);
      
      const recommended = this.getRecommendedMax();
      const diff = lastSuccessful - recommended;
      const comparison = diff > 0 ? `+${diff}` : `${diff}`;
      
      this.detectResult.set({
        finalLimit: lastSuccessful,
        detectionTime: `${detectionDuration}s`,
        vsRecommended: comparison
      });
      
      this.addLog(this.format(this.texts().logs?.autodetectComplete, { seconds: detectionDuration }), 'success');
      this.addLog(this.format(this.texts().logs?.autodetectSupport, { limit: lastSuccessful }), 'info');
    }, 500);
  }

  stopDetection() {
    this.detectionStopped.set(true);
    this.addLog(this.texts().logs?.autodetectStopped ?? '', 'warning');
    this.detectionInProgress.set(false);
    this.detectStatusVisible.set(false);
  }

  terminateAll() {
    const count = this.workers.length;
    this.workers.forEach(w => w.worker.terminate());
    this.workers = [];
    this.addLog(this.format(this.texts().logs?.terminateAll, { count }), 'warning');
    this.updateStats();
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.logsCleared ?? 'Logs cleared', 'info');
  }

  getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Edg") > -1) return "Edge";
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    return "Unknown";
  }

  getCPUCores(): number {
    return navigator.hardwareConcurrency || 4;
  }

  getRecommendedMax(): number {
    return this.getCPUCores() * 2;
  }

  getStats(): StatCard[] {
    const statsTexts = this.texts().statsPanel ?? {};
    return [
      { label: statsTexts.active ?? 'Active workers', value: this.activeCount(), type: 'active' },
      { label: statsTexts.totalCreated ?? 'Total created', value: this.totalCreated() },
      { label: statsTexts.errors ?? 'Errors', value: this.errorCount(), type: 'error' },
      { label: statsTexts.memory ?? 'Memory used', value: this.memoryUsed() }
    ];
  }

  createMultipleLabel(): string {
    return this.format(this.texts().manualControls?.buttons?.createMultiple, {
      count: this.workerCount()
    });
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
