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

interface NumberEvaluation {
  number: number;
  isPrime: boolean;
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
  evaluatedNumbers = signal<NumberEvaluation[]>([]);
  showProcessorView = signal(false);
  processingIndex = signal(-1); // Índice del número actualmente siendo procesado
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
    this.showProcessorView.set(true);
    this.evaluatedNumbers.set([]);
    this.processingIndex.set(-1);

    // Dar tiempo a que se actualice la UI antes de bloquear
    setTimeout(async () => {
      const startTime = performance.now();
      const primes = await this.calculatePrimesWithProgress(count);
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

  private async calculatePrimesWithProgress(max: number): Promise<number[]> {
    const primes: number[] = [];
    const maxNumbersToShow = Math.min(max * 10, 1000); // Mostrar hasta 1000 números
    
    // Primero agregar todos los números como "no evaluados"
    const initialNumbers: NumberEvaluation[] = [];
    for (let i = 2; i <= maxNumbersToShow; i++) {
      initialNumbers.push({ number: i, isPrime: false });
    }
    this.evaluatedNumbers.set(initialNumbers);
    
    // Luego evaluar cada número uno por uno
    let index = 0;
    for (let i = 2; primes.length < max; i++) {
      let isPrime = true;
      
      // Verificar si es primo
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      
      // Actualizar el número en la lista si está dentro del rango a mostrar
      if (i <= maxNumbersToShow) {
        this.processingIndex.set(index);
        
        // Dar tiempo para que la animación sea visible
        await new Promise(resolve => setTimeout(resolve, 30));
        
        // Actualizar el número evaluado
        const current = this.evaluatedNumbers();
        if (current[index]) {
          current[index] = { number: i, isPrime };
          this.evaluatedNumbers.set([...current]);
        }
        
        // Dar un poco más de tiempo para ver el resultado
        await new Promise(resolve => setTimeout(resolve, 15));
        
        this.processingIndex.set(-1);
        index++;
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

  getScrollOffset(): number {
    const index = this.processingIndex();
    if (index < 0 || index < 5) {
      // Centrar los primeros números
      const numberWidth = 40;
      const firstNumberPosition = 0;
      const containerCenter = 400; // Centro aproximado del contenedor
      return containerCenter - firstNumberPosition - numberWidth / 2;
    }
    
    // Cada número tiene aproximadamente 40px de ancho (32px min-width + 4px gap + padding)
    const numberWidth = 40;
    
    // Calcular la posición del número actual
    const currentPosition = index * numberWidth + numberWidth / 2;
    
    // Desplazar para mantener el número procesado en el centro
    const containerCenter = 400; // Centro aproximado del contenedor
    
    return containerCenter - currentPosition;
  }
}

