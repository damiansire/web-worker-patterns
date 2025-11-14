import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LanguageService } from '../../core/services/language.service';

const block = (...lines: string[]) => lines.join('\n') + '\n';

interface PrimeResult {
  primes: number[];
  duration: number;
  method: 'worker' | 'main';
}

@Component({
  selector: 'app-offloading-computation',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './offloading-computation.component.html',
  styleUrl: './offloading-computation.component.scss',
  standalone: true
})
export class OffloadingComputationComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.offloadingComputation'));
  readonly codeSnippets = {
    vanillaCreateWorker: block(
      "const worker = new Worker('worker.js');"
    ),
    vanillaSendTask: block(
      'const count = 50000;',
      'worker.postMessage({ count });'
    ),
    vanillaProcessInWorker: block(
      'self.onmessage = function (e) {',
      '  const { count } = e.data;',
      '  const primes = calculatePrimes(count);',
      '  self.postMessage({ primes });',
      '};'
    ),
    vanillaReceiveResult: block(
      'worker.onmessage = function (e) {',
      '  const primes = e.data.primes;',
      "  console.log('Cálculo completo:', primes);",
      '};'
    ),
    angularComponent: block(
      'ngOnInit() {',
      "  if (typeof Worker !== 'undefined') {",
      '    this.worker = new Worker(',
      "      new URL('./offloading-computation.worker', import.meta.url),",
      "      { type: 'module' }",
      '    );',
      '',
      '    this.worker.onmessage = (event: MessageEvent<{ primes: number[]; count: number }>) => {',
      '      const endTime = performance.now();',
      '      const duration = Math.round(endTime - (this.startTime || 0));',
      '',
      '      this.isLoading.set(false);',
      '      this.result.set({',
      '        primes: event.data.primes,',
      '        duration,',
      "        method: 'worker'",
      '      });',
      '    };',
      '',
      '    this.worker.onerror = (error: ErrorEvent) => {',
      '      console.error(error);',
      '      this.isLoading.set(false);',
      '    };',
      '  } else {',
      "    alert(this.texts().alerts.unsupported);",
      '  }',
      '}',
      '',
      'calculateWithWorker() {',
      '  if (!this.worker) {',
      "    alert(this.texts().alerts.unsupported);",
      '    return;',
      '  }',
      '',
      '  const count = this.count();',
      '  this.isLoading.set(true);',
      '  this.result.set(null);',
      '  this.startTime = performance.now();',
      '',
      '  this.worker.postMessage({ count });',
      '}'
    ),
    workerTsFile: block(
      '/// offloading-computation.worker.ts',
      "addEventListener('message', (event: MessageEvent<{ count: number }>) => {",
      '  const primes = calculatePrimes(event.data.count);',
      '',
      '  postMessage({',
      '    primes,',
      '    count: primes.length',
      '  });',
      '});'
    )
  };

  count = signal(50000);
  isLoading = signal(false);
  result = signal<PrimeResult | null>(null);
  counter = signal(0);
  private worker?: Worker;
  private counterInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./offloading-computation.worker', import.meta.url), { type: 'module' });

      this.worker.onmessage = (e: MessageEvent<{ primes: number[]; count: number }>) => {
        const endTime = performance.now();
        const duration = Math.round(endTime - (this.startTime || 0));

        console.log(this.texts().logs.workerComplete);

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
    this.isLoading.set(true);
    this.result.set(null);
    this.startTime = performance.now();

    this.worker.postMessage({ count });
  }

  calculateInMainThread() {
    const count = this.count();
    console.log(this.format(this.texts().logs.mainStart, { count }));
    console.warn(this.texts().logs.mainWarning);

    this.isLoading.set(true);
    this.result.set(null);

    // Dar tiempo a que se actualice la UI antes de bloquear
    setTimeout(() => {
      const startTime = performance.now();
      const primes = this.calculatePrimes(count);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log(this.texts().logs.mainComplete);

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

  private format(template: string, params: Record<string, string | number>): string {
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}

