import { Component, OnInit, OnDestroy, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface WorkerData {
  id: number;
  worker: Worker;
  createdAt: number;
  status: string;
}

@Component({
  selector: 'app-worker-limits',
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-limits.component.html',
  styleUrl: './worker-limits.component.scss',
  standalone: true
})
export class WorkerLimitsComponent implements OnInit, OnDestroy {
  @ViewChild('logContainer', { static: false }) logContainer!: ElementRef<HTMLDivElement>;
  
  workerCount = signal(10);
  activeCount = signal(0);
  totalCreated = signal(0);
  errorCount = signal(0);
  logs = signal<LogEntry[]>([]);
  detectedLimit = signal<string>('No detectado');
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
    effect(() => {
      this.logs();
      setTimeout(() => {
        if (this.logContainer) {
          this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
        }
      }, 0);
    });
  }

  ngOnInit() {
    this.addLog(`Sistema iniciado. CPU cores detectados: ${this.getCPUCores()}`, 'info');
    this.addLog(`Navegador: ${this.getBrowserInfo()}`, 'info');
    this.addLog(`Máximo recomendado de workers: ${this.getRecommendedMax()}`, 'info');
    this.addLog(`Usa la auto-detección para encontrar el límite real de tu navegador`, 'info');
    
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
        this.addLog(`Error en Worker #${workerId}`, 'error');
        this.updateStats();
      };
      
      this.workers.push(workerData);
      this.totalCreated.update(c => c + 1);
      this.addLog(`Worker #${workerId} creado exitosamente`, 'success');
      
      worker.postMessage({ action: 'init', workerId });
      this.updateStats();
      
      return true;
    } catch (error: any) {
      this.errorCount.update(c => c + 1);
      this.addLog(`Error al crear worker: ${error.message}`, 'error');
      this.addLog(`Posiblemente has alcanzado el límite del navegador`, 'warning');
      this.updateStats();
      return false;
    }
  }

  async createMultipleWorkers() {
    const count = this.workerCount();
    this.addLog(`Intentando crear ${count} workers...`, 'info');
    
    if (count > this.getRecommendedMax()) {
      this.addLog(`Advertencia: Estás creando más workers (${count}) que el recomendado (${this.getRecommendedMax()}) para tu sistema (${this.getCPUCores()} cores)`, 'warning');
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
    
    this.addLog(`Creación completada: ${successCount} exitosos, ${failCount} fallidos`, 
      failCount > 0 ? 'warning' : 'success');
  }

  async stressTest() {
    const stressCount = 50;
    this.addLog(`🔥 Iniciando test de estrés: intentando crear ${stressCount} workers...`, 'warning');
    this.addLog(`💻 Tu sistema tiene ${this.getCPUCores()} núcleos CPU. Máximo recomendado: ${this.getRecommendedMax()} workers`, 'info');
    
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
    
    this.addLog(`🔥 Test de estrés completado:`, 'warning');
    this.addLog(`   ✅ ${successCount} workers creados exitosamente`, 'success');
    this.addLog(`   ❌ ${failCount} workers fallaron (límite alcanzado)`, 'error');
    this.addLog(`   📊 Límite práctico detectado: ~${successCount} workers`, 'info');
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
    
    this.addLog('Iniciando auto-detección de límites...', 'info');
    
    let currentWorker = 1;
    let consecutiveFailures = 0;
    let lastSuccessful = 0;
    
    while (currentWorker <= 100 && !this.detectionStopped()) {
      this.detectProgress.set(`Creando worker #${currentWorker}...`);
      this.detectProgressPercent.set(Math.min(currentWorker, 99));
      
      const success = this.createWorker();
      
      if (success) {
        consecutiveFailures = 0;
        lastSuccessful = currentWorker;
        this.addLog(`Worker #${currentWorker} creado exitosamente`, 'success');
      } else {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          this.addLog(`Límite detectado: ${lastSuccessful} workers`, 'warning');
          break;
        }
      }
      
      currentWorker++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.detectionInProgress.set(false);
    const detectionDuration = ((Date.now() - startDetectionTime) / 1000).toFixed(1);
    
    this.detectProgressPercent.set(100);
    this.detectProgress.set('Detección completada');
    
    setTimeout(() => {
      this.detectStatusVisible.set(false);
      this.detectResultVisible.set(true);
      
      this.detectedLimit.set(`${lastSuccessful} workers`);
      
      const recommended = this.getRecommendedMax();
      const comparison = lastSuccessful > recommended 
        ? `+${lastSuccessful - recommended} sobre recomendado`
        : `${recommended - lastSuccessful} bajo recomendado`;
      
      this.detectResult.set({
        finalLimit: lastSuccessful,
        detectionTime: `${detectionDuration}s`,
        vsRecommended: comparison
      });
      
      this.addLog(`Detección completada en ${detectionDuration}s`, 'success');
      this.addLog(`Tu navegador soporta hasta ${lastSuccessful} workers`, 'info');
    }, 500);
  }

  stopDetection() {
    this.detectionStopped.set(true);
    this.addLog('Detección detenida por el usuario', 'warning');
    this.detectionInProgress.set(false);
    this.detectStatusVisible.set(false);
  }

  terminateAll() {
    const count = this.workers.length;
    this.workers.forEach(w => w.worker.terminate());
    this.workers = [];
    this.addLog(`Todos los workers terminados (${count} workers)`, 'warning');
    this.updateStats();
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog('Logs limpiados', 'info');
  }

  getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.indexOf("Firefox") > -1) return "Firefox";
    if (ua.indexOf("Edg") > -1) return "Edge";
    if (ua.indexOf("Chrome") > -1) return "Chrome";
    if (ua.indexOf("Safari") > -1) return "Safari";
    return "Desconocido";
  }

  getCPUCores(): number {
    return navigator.hardwareConcurrency || 4;
  }

  getRecommendedMax(): number {
    return this.getCPUCores() * 2;
  }
}
