import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { OFFLOADING_COMPUTATION_SNIPPETS } from './offloading-computation.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';
import { ThreadDiagramComponent, ThreadDiagramConfig } from '../../core/components/thread-diagram/thread-diagram.component';

interface PrimeResult {
  primes: number[];
  duration: number;
  method: 'worker' | 'main';
}

@Component({
  selector: 'app-offloading-computation',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, ExampleNavComponent, KeyTakeawaysComponent, ThreadDiagramComponent],
  templateUrl: './offloading-computation.component.html',
  styleUrl: './offloading-computation.component.scss',
  standalone: true
})
export class OffloadingComputationComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.offloadingComputation'));
  readonly codeSnippets = computed(() =>
    OFFLOADING_COMPUTATION_SNIPPETS[this.language.currentLanguage()] ?? OFFLOADING_COMPUTATION_SNIPPETS.en
  );

  readonly threadDiagramConfig: ThreadDiagramConfig = {
    workers: 1,
    messageFlow: 'sequential'
  };

  readonly logs = signal<LogEntry[]>([]);

  count = signal(50000);
  isLoading = signal(false);
  result = signal<PrimeResult | null>(null);
  counter = signal(0);
  private worker?: Worker;
  private counterInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.progress.markVisited('04');
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./offloading-computation.worker', import.meta.url), { type: 'module' });

      this.worker.onmessage = (e: MessageEvent<{ primes: number[]; count: number }>) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - (this.startTime || 0));

        console.log(this.texts().logs.workerComplete);
        this.addLog(`Worker completed: ${e.data.primes.length} primes in ${duration}ms`, 'success');

        this.isLoading.set(false);
        this.result.set({
          primes: e.data.primes,
          duration,
          method: 'worker'
        });
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error(`${this.texts().logs.workerError}:`, error);
        this.isLoading.set(false);
      };
    }

    // Contador para demostrar que la UI sigue respondiendo
    this.counterInterval = setInterval(() => {
      this.counter.update(c => c + 1);
    }, 100);
  }

  ngOnDestroy() {
    if (this.worker) {
      this.worker.terminate();
    }
    if (this.counterInterval) {
      clearInterval(this.counterInterval);
    }
  }

  private startTime?: number;

  calculateWithWorker() {
    if (!this.worker) {
      alert(this.texts().alerts.unsupported);
      return;
    }

    const count = this.count();
    console.log(this.format(this.texts().logs.workerStart, { count }));
    this.addLog('Delegating computation to worker...', 'info');
    this.isLoading.set(true);
    this.result.set(null);
    this.startTime = performance.now();

    this.worker.postMessage({ count });
  }

  calculateInMainThread() {
    const count = this.count();
    console.log(this.format(this.texts().logs.mainStart, { count }));
    console.warn(this.texts().logs.mainWarning);

    this.addLog('Running on main thread...', 'warning');
    this.isLoading.set(true);
    this.result.set(null);

    setTimeout(() => {
      const startTime = performance.now();
      const primes = this.calculatePrimes(count);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log(this.texts().logs.mainComplete);
      this.addLog(`Main thread completed: ${primes.length} primes in ${duration}ms`, 'info');

      this.isLoading.set(false);
      this.result.set({
        primes,
        duration,
        method: 'main'
      });
    }, 100);
  }

  private calculatePrimes(max: number): number[] {
    const primes: number[] = [];
    
    for (let i = 2; primes.length < max; i++) {
      let isPrime = true;
      
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      
      if (isPrime) {
        primes.push(i);
      }
    }
    
    return primes;
  }

  private addLog(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString('es-ES', { hour12: false });
    this.logs.update(l => [{ timestamp, message, type }, ...l]);
  }

  clearLogs() {
    this.logs.set([]);
  }

  private format(template: string, params: Record<string, string | number>): string {
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}

