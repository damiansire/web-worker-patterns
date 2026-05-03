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
import { SHARED_BUFFER_SNIPPETS } from './shared-array-buffer.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';

@Component({
  selector: 'app-shared-array-buffer',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, StatsPanelComponent, ExampleNavComponent, KeyTakeawaysComponent],
  templateUrl: './shared-array-buffer.component.html',
  styleUrl: './shared-array-buffer.component.scss',
  standalone: true
})
export class SharedArrayBufferComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.sharedArrayBuffer'));
  readonly codeSnippets = computed(() =>
    SHARED_BUFFER_SNIPPETS[this.language.currentLanguage()] ?? SHARED_BUFFER_SNIPPETS['en']
  );

  // Config
  workerCount = signal(4);
  iterationsPerWorker = signal(100000);

  // State
  sabSupported = signal(false);
  expectedTotal = signal(0);
  atomicResult = signal<number | null>(null);
  unsafeResult = signal<number | null>(null);
  lostUpdates = signal<number | null>(null);
  isRunning = signal(false);
  logs = signal<LogEntry[]>([]);

  private workers: Worker[] = [];

  ngOnInit() {
    this.progress.markVisited('13');
    const supported = typeof SharedArrayBuffer !== 'undefined';
    this.sabSupported.set(supported);

    if (supported) {
      this.addLog(this.texts().logs?.sabAvailable ?? 'SharedArrayBuffer is available ✅', 'success');
    } else {
      this.addLog(this.texts().logs?.sabUnavailable ?? 'SharedArrayBuffer is NOT available. Your server needs COOP/COEP headers.', 'error');
    }
    this.addLog(
      this.format(this.texts().logs?.cpuInfo, { cores: navigator.hardwareConcurrency || '—' }),
      'info'
    );
  }

  ngOnDestroy() {
    this.terminateWorkers();
  }

  async runAtomicTest() {
    if (!this.sabSupported()) return;
    this.isRunning.set(true);
    this.atomicResult.set(null);
    const count = this.workerCount();
    const iterations = this.iterationsPerWorker();
    this.expectedTotal.set(count * iterations);

    this.addLog(
      this.format(this.texts().logs?.atomicStart, { workers: count, iterations }),
      'info'
    );

    const sharedBuffer = new SharedArrayBuffer((1 + count) * 4);
    const view = new Int32Array(sharedBuffer);
    view[0] = 0; // shared counter

    const workers = this.spawnWorkers(count);
    let completed = 0;
    const startTime = performance.now();

    await new Promise<void>(resolve => {
      workers.forEach((worker, i) => {
        worker.onmessage = (e) => {
          completed++;
          this.addLog(
            this.format(this.texts().logs?.workerDone, { id: i + 1, local: e.data.localCount }),
            'success'
          );
          if (completed === count) {
            const finalValue = Atomics.load(view, 0);
            const duration = Math.round(performance.now() - startTime);
            this.atomicResult.set(finalValue);
            this.addLog(
              this.format(this.texts().logs?.atomicResult, {
                result: finalValue,
                expected: count * iterations,
                time: duration
              }),
              finalValue === count * iterations ? 'success' : 'error'
            );
            this.terminateWorkers();
            this.isRunning.set(false);
            resolve();
          }
        };
        worker.postMessage({ action: 'increment', sharedBuffer, workerId: i, iterations });
      });
    });
  }

  async runUnsafeTest() {
    if (!this.sabSupported()) return;
    this.isRunning.set(true);
    this.unsafeResult.set(null);
    this.lostUpdates.set(null);
    const count = this.workerCount();
    const iterations = this.iterationsPerWorker();
    this.expectedTotal.set(count * iterations);

    this.addLog(
      this.format(this.texts().logs?.unsafeStart, { workers: count, iterations }),
      'warning'
    );

    const sharedBuffer = new SharedArrayBuffer((1 + count) * 4);
    const view = new Int32Array(sharedBuffer);
    view[0] = 0;

    const workers = this.spawnWorkers(count);
    let completed = 0;
    const startTime = performance.now();

    await new Promise<void>(resolve => {
      workers.forEach((worker, i) => {
        worker.onmessage = (e) => {
          completed++;
          if (completed === count) {
            const finalValue = view[0];
            const expected = count * iterations;
            const lost = expected - finalValue;
            const duration = Math.round(performance.now() - startTime);
            this.unsafeResult.set(finalValue);
            this.lostUpdates.set(lost);
            this.addLog(
              this.format(this.texts().logs?.unsafeResult, {
                result: finalValue,
                expected,
                lost,
                time: duration
              }),
              'error'
            );
            this.terminateWorkers();
            this.isRunning.set(false);
            resolve();
          }
        };
        worker.postMessage({ action: 'race-unsafe', sharedBuffer, workerId: i, iterations });
      });
    });
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.logsCleared ?? 'Logs cleared', 'info');
  }

  getStats(): StatCard[] {
    const t = this.texts().statsPanel ?? {};
    return [
      { label: t.sabSupport ?? 'SharedArrayBuffer', value: this.sabSupported() ? '✅' : '❌' },
      { label: t.expected ?? 'Expected', value: this.expectedTotal() || '-' },
      { label: t.atomicResult ?? 'Atomic Result', value: this.atomicResult() ?? '-', type: 'success' },
      { label: t.unsafeResult ?? 'Unsafe Result', value: this.unsafeResult() ?? '-', type: 'error' },
      { label: t.lostUpdates ?? 'Lost Updates', value: this.lostUpdates() ?? '-', type: 'error' },
    ];
  }

  private spawnWorkers(count: number): Worker[] {
    this.terminateWorkers();
    this.workers = [];
    for (let i = 0; i < count; i++) {
      this.workers.push(new Worker(new URL('./shared-array-buffer.worker', import.meta.url), { type: 'module' }));
    }
    return this.workers;
  }

  private terminateWorkers() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
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
