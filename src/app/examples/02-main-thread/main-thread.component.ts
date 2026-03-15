import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LogPanelComponent, LogEntry } from '../../core/components/log-panel/log-panel.component';
import { ProcessorNumbersViewComponent } from '../../core/components/processor-numbers-view/processor-numbers-view.component';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { MAIN_THREAD_SNIPPETS } from './main-thread.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';

interface PrimeResult {
  primes: number[];
  duration: number;
}

export interface NumberEvaluation {
  number: number;
  isPrime: boolean;
}

@Component({
  selector: 'app-main-thread',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, LogPanelComponent, ProcessorNumbersViewComponent, ExampleNavComponent, KeyTakeawaysComponent],
  templateUrl: './main-thread.component.html',
  styleUrl: './main-thread.component.scss',
  standalone: true
})
export class MainThreadComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.mainThread'));
  readonly codeSnippets = computed(() =>
    MAIN_THREAD_SNIPPETS[this.language.currentLanguage()] ?? MAIN_THREAD_SNIPPETS.en
  );

  readonly logs = signal<LogEntry[]>([]);

  count = signal(50000);
  isLoading = signal(false);
  result = signal<PrimeResult | null>(null);
  counter = signal(0);
  evaluatedNumbers = signal<NumberEvaluation[]>([]);
  showProcessorView = signal(false);
  processingIndex = signal(-1);
  private counterInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.progress.markVisited('02');
    // Contador para demostrar que la UI se congela
    this.counterInterval = setInterval(() => {
      this.counter.update(c => c + 1);
    }, 100);
  }

  ngOnDestroy() {
    if (this.counterInterval) {
      clearInterval(this.counterInterval);
    }
  }

  calculateInMainThread() {
    const count = this.count();
    console.log(this.format(this.texts().logs.mainStart, { count }));
    console.warn(this.texts().logs.mainWarning);

    this.addLog('Starting prime calculation...', 'info');
    this.addLog('Warning: Running on main thread - UI will freeze', 'warning');

    this.isLoading.set(true);
    this.result.set(null);
    this.showProcessorView.set(true);
    this.evaluatedNumbers.set([]);
    this.processingIndex.set(-1);

    setTimeout(async () => {
      const startTime = performance.now();
      const primes = await this.calculatePrimesWithProgress(count);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log(this.texts().logs.mainComplete);
      console.log(`Tiempo total: ${duration}ms`);
      console.warn('⚠️ Durante ese tiempo, la UI estuvo congelada');

      this.addLog(`Found ${primes.length} primes in ${duration}ms`, 'success');

      this.isLoading.set(false);
      this.result.set({
        primes,
        duration
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

  private async calculatePrimesWithProgress(max: number): Promise<number[]> {
    const primes: number[] = [];
    const maxNumbersToShow = Math.min(max, 2500); // 0..count, cap 2500 para rendimiento

    const initialNumbers: NumberEvaluation[] = [];
    for (let i = 0; i <= maxNumbersToShow; i++) {
      initialNumbers.push({ number: i, isPrime: false });
    }
    this.evaluatedNumbers.set(initialNumbers);

    for (let i = 0; primes.length < max; i++) {
      let isPrime = false;
      if (i >= 2) {
        isPrime = true;
        for (let j = 2; j <= Math.sqrt(i); j++) {
          if (i % j === 0) {
            isPrime = false;
            break;
          }
        }
      }

      if (i <= maxNumbersToShow) {
        this.processingIndex.set(i);

        await new Promise(resolve => setTimeout(resolve, 40));

        const current = this.evaluatedNumbers();
        if (current[i]) {
          current[i] = { number: i, isPrime };
          this.evaluatedNumbers.set([...current]);
        }

        await new Promise(resolve => setTimeout(resolve, 15));

        this.processingIndex.set(-1);
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

