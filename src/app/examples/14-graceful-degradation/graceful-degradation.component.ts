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
import { DEGRADATION_SNIPPETS } from './graceful-degradation.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';

type ExecutionMode = 'auto' | 'worker-file' | 'blob-worker' | 'main-thread';

interface CapabilityReport {
  workers: boolean;
  sharedArrayBuffer: boolean;
  atomics: boolean;
  hardwareConcurrency: number;
  wasmSupport: boolean;
  moduleWorkers: boolean;
}

@Component({
  selector: 'app-graceful-degradation',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, StatsPanelComponent, ExampleNavComponent, KeyTakeawaysComponent],
  templateUrl: './graceful-degradation.component.html',
  styleUrl: './graceful-degradation.component.scss',
  standalone: true
})
export class GracefulDegradationComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.gracefulDegradation'));
  readonly codeSnippets = computed(() =>
    DEGRADATION_SNIPPETS[this.language.currentLanguage()] ?? DEGRADATION_SNIPPETS['en']
  );

  // Feature detection results
  capabilities = signal<CapabilityReport>({
    workers: false,
    sharedArrayBuffer: false,
    atomics: false,
    hardwareConcurrency: 0,
    wasmSupport: false,
    moduleWorkers: false
  });

  // State
  executionMode = signal<ExecutionMode>('auto');
  resolvedMode = signal<string>('—');
  lastResult = signal<number | null>(null);
  lastDuration = signal<number | null>(null);
  isRunning = signal(false);
  logs = signal<LogEntry[]>([]);

  private activeWorker: Worker | null = null;

  ngOnInit() {
    this.progress.markVisited('14');
    this.detectCapabilities();
  }

  ngOnDestroy() {
    this.activeWorker?.terminate();
  }

  detectCapabilities() {
    const report: CapabilityReport = {
      workers: typeof Worker !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      atomics: typeof Atomics !== 'undefined',
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      wasmSupport: typeof WebAssembly !== 'undefined',
      moduleWorkers: false
    };

    // Test module worker support
    try {
      const blob = new Blob([''], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const testWorker = new Worker(url, { type: 'module' });
      testWorker.terminate();
      URL.revokeObjectURL(url);
      report.moduleWorkers = true;
    } catch {
      report.moduleWorkers = false;
    }

    this.capabilities.set(report);

    this.addLog(this.texts().logs?.detecting ?? 'Detecting browser capabilities...', 'info');

    const checks = [
      { name: 'Web Workers', supported: report.workers },
      { name: 'SharedArrayBuffer', supported: report.sharedArrayBuffer },
      { name: 'Atomics', supported: report.atomics },
      { name: 'WebAssembly', supported: report.wasmSupport },
      { name: 'Module Workers', supported: report.moduleWorkers },
    ];

    checks.forEach(c => {
      this.addLog(`  ${c.supported ? '✅' : '❌'} ${c.name}`, c.supported ? 'success' : 'warning');
    });

    this.addLog(
      this.format(this.texts().logs?.cores, { count: report.hardwareConcurrency || '?' }),
      'info'
    );

    // Determine best execution mode
    if (report.sharedArrayBuffer && report.atomics && report.workers) {
      this.addLog(this.texts().logs?.tierFull ?? '🏆 Full threading available', 'success');
    } else if (report.workers) {
      this.addLog(this.texts().logs?.tierWorkers ?? '⚡ Workers available (no shared memory)', 'info');
    } else {
      this.addLog(this.texts().logs?.tierNone ?? '🐌 No worker support — main thread only', 'warning');
    }
  }

  async runComputation() {
    this.isRunning.set(true);
    this.lastResult.set(null);
    this.lastDuration.set(null);
    const mode = this.executionMode();
    const caps = this.capabilities();

    let resolvedMode: ExecutionMode;

    if (mode === 'auto') {
      // Auto-resolve: use the best available mode
      if (caps.workers) {
        resolvedMode = 'blob-worker'; // Prefer blob worker to demo the pattern
      } else {
        resolvedMode = 'main-thread';
      }
    } else {
      resolvedMode = mode;
    }

    this.resolvedMode.set(resolvedMode);
    this.addLog(this.format(this.texts().logs?.modeSelected, { mode: resolvedMode }), 'info');

    const start = performance.now();

    try {
      let result: number;

      switch (resolvedMode) {
        case 'worker-file':
          result = await this.runWithFileWorker();
          break;
        case 'blob-worker':
          result = await this.runWithBlobWorker();
          break;
        case 'main-thread':
        default:
          result = this.runOnMainThread();
          break;
      }

      const duration = Math.round(performance.now() - start);
      this.lastResult.set(result);
      this.lastDuration.set(duration);
      this.addLog(
        this.format(this.texts().logs?.completed, { mode: resolvedMode, time: duration }),
        'success'
      );
    } catch (err: any) {
      this.addLog(
        this.format(this.texts().logs?.error, { mode: resolvedMode, message: err.message }),
        'error'
      );
      // Automatic fallback
      if (resolvedMode !== 'main-thread') {
        this.addLog(this.texts().logs?.fallbackToMain ?? 'Falling back to main thread...', 'warning');
        const result = this.runOnMainThread();
        const duration = Math.round(performance.now() - start);
        this.lastResult.set(result);
        this.lastDuration.set(duration);
        this.resolvedMode.set('main-thread (fallback)');
      }
    }

    this.isRunning.set(false);
  }

  /**
   * Blob URL Worker — creates a worker from inline code without needing a separate file.
   * Useful when the worker source can't be served separately (CORS, CDN, etc.)
   */
  private runWithBlobWorker(): Promise<number> {
    const workerCode = `
      self.onmessage = function(e) {
        const iterations = e.data.iterations;
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += Math.sqrt(i) * Math.sin(i);
        }
        self.postMessage({ result });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    this.addLog(this.texts().logs?.blobCreated ?? 'Blob URL worker created from inline code', 'info');

    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(blobUrl);
        this.activeWorker = worker;

        worker.onmessage = (e) => {
          URL.revokeObjectURL(blobUrl); // Cleanup
          worker.terminate();
          this.activeWorker = null;
          this.addLog(this.texts().logs?.blobCleanup ?? 'Blob URL revoked, worker terminated', 'info');
          resolve(e.data.result);
        };

        worker.onerror = (err) => {
          URL.revokeObjectURL(blobUrl);
          worker.terminate();
          this.activeWorker = null;
          reject(new Error(err.message));
        };

        worker.postMessage({ iterations: 5_000_000 });
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    });
  }

  private runWithFileWorker(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('./graceful-degradation.worker', import.meta.url),
          { type: 'module' }
        );
        this.activeWorker = worker;

        worker.onmessage = (e) => {
          worker.terminate();
          this.activeWorker = null;
          resolve(e.data.result);
        };

        worker.onerror = (err) => {
          worker.terminate();
          this.activeWorker = null;
          reject(new Error(err.message));
        };

        worker.postMessage({ iterations: 5_000_000 });
      } catch (err) {
        reject(err);
      }
    });
  }

  private runOnMainThread(): number {
    this.addLog(this.texts().logs?.mainThreadStart ?? '🐌 Running on main thread (will block UI)...', 'warning');
    let result = 0;
    for (let i = 0; i < 5_000_000; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    return result;
  }

  clearLogs() {
    this.logs.set([]);
    this.addLog(this.texts().logs?.logsCleared ?? 'Logs cleared', 'info');
  }

  getStats(): StatCard[] {
    const t = this.texts().statsPanel ?? {};
    const caps = this.capabilities();
    return [
      { label: t.mode ?? 'Mode', value: this.resolvedMode() },
      { label: t.workers ?? 'Workers', value: caps.workers ? '✅' : '❌' },
      { label: t.sab ?? 'SharedArrayBuffer', value: caps.sharedArrayBuffer ? '✅' : '❌' },
      { label: t.wasm ?? 'WebAssembly', value: caps.wasmSupport ? '✅' : '❌' },
      { label: t.result ?? 'Result', value: this.lastDuration() !== null ? `${this.lastDuration()}ms` : '—' },
    ];
  }

  getCapabilityList(): { name: string; supported: boolean }[] {
    const caps = this.capabilities();
    const t = this.texts().capabilityNames ?? {};
    return [
      { name: t.workers ?? 'Web Workers', supported: caps.workers },
      { name: t.sab ?? 'SharedArrayBuffer', supported: caps.sharedArrayBuffer },
      { name: t.atomics ?? 'Atomics', supported: caps.atomics },
      { name: t.wasm ?? 'WebAssembly', supported: caps.wasmSupport },
      { name: t.moduleWorkers ?? 'Module Workers', supported: caps.moduleWorkers },
    ];
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
