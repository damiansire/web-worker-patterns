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
}

@Component({
  selector: 'app-main-thread',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './main-thread.component.html',
  styleUrl: './main-thread.component.scss',
  standalone: true
})
export class MainThreadComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.mainThread'));
  readonly codeSnippets = {
    vanillaCalculatePrimes: block(
      'function calculatePrimes(max) {',
      '  const primes = [];',
      '  ',
      '  for (let i = 2; primes.length < max; i++) {',
      '    let isPrime = true;',
      '    ',
      '    for (let j = 2; j <= Math.sqrt(i); j++) {',
      '      if (i % j === 0) {',
      '        isPrime = false;',
      '        break;',
      '      }',
      '    }',
      '    ',
      '    if (isPrime) {',
      '      primes.push(i);',
      '    }',
      '  }',
      '  ',
      '  return primes;',
      '}'
    ),
    vanillaExecuteInMain: block(
      "calculateButton.addEventListener('click', () => {",
      '  // El cálculo se ejecuta directamente en el hilo principal',
      '  const primes = calculatePrimes(50000);',
      '  ',
      '  // ⚠️ Durante este cálculo, TODO se congela:',
      '  // - La UI no responde',
      '  // - Los contadores se detienen',
      '  // - Las animaciones se pausan',
      '});'
    ),
    vanillaProblem: block(
      '// JavaScript es single-threaded',
      '// Solo hay UN hilo principal que ejecuta:',
      '// 1. Código JavaScript',
      '// 2. Renderizado de la UI',
      '// 3. Eventos del usuario',
      '// 4. Animaciones',
      '',
      '// Si el hilo está ocupado calculando,',
      '// NADA MÁS puede ejecutarse',
      '',
      '// 💡 Solución: Web Workers',
      '// Los Web Workers ejecutan código en un hilo separado',
      '// y permiten que el main thread siga respondiendo'
    ),
    angularComponent: block(
      'calculateInMainThread() {',
      '  const count = this.count();',
      '  this.isLoading.set(true);',
      '  ',
      '  // ⚠️ Este cálculo bloquea el hilo principal',
      '  setTimeout(() => {',
      '    const startTime = performance.now();',
      '    const primes = this.calculatePrimes(count);',
      '    const endTime = performance.now();',
      '    ',
      '    this.isLoading.set(false);',
      '    this.result.set({',
      '      primes,',
      '      duration: Math.round(endTime - startTime)',
      '    });',
      '  }, 100);',
      '}',
      '',
      'private calculatePrimes(max: number): number[] {',
      '  const primes: number[] = [];',
      '  ',
      '  for (let i = 2; primes.length < max; i++) {',
      '    let isPrime = true;',
      '    ',
      '    for (let j = 2; j <= Math.sqrt(i); j++) {',
      '      if (i % j === 0) {',
      '        isPrime = false;',
      '        break;',
      '      }',
      '    }',
      '    ',
      '    if (isPrime) {',
      '      primes.push(i);',
      '    }',
      '  }',
      '  ',
      '  return primes;',
      '}'
    )
  };

  count = signal(50000);
  isLoading = signal(false);
  result = signal<PrimeResult | null>(null);
  counter = signal(0);
  private counterInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
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

    this.isLoading.set(true);
    this.result.set(null);

    // Dar tiempo a que se actualice la UI antes de bloquear
    setTimeout(() => {
      const startTime = performance.now();
      const primes = this.calculatePrimes(count);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log(this.texts().logs.mainComplete);
      console.log(`Tiempo total: ${duration}ms`);
      console.warn('⚠️ Durante ese tiempo, la UI estuvo congelada');

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

  private format(template: string, params: Record<string, string | number>): string {
    return Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value)),
      template
    );
  }
}

