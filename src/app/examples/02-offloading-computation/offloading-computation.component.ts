import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';

interface PrimeResult {
  primes: number[];
  duration: number;
  method: 'Worker' | 'Hilo Principal';
}

@Component({
  selector: 'app-offloading-computation',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './offloading-computation.component.html',
  styleUrl: './offloading-computation.component.scss',
  standalone: true
})
export class OffloadingComputationComponent implements OnInit, OnDestroy {
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
        
        console.log('✅ Worker completó el cálculo');
        
        this.isLoading.set(false);
        this.result.set({
          primes: e.data.primes,
          duration,
          method: 'Worker'
        });
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('❌ Error en el worker:', error);
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
      alert('Web Workers no soportados en este navegador');
      return;
    }

    const count = this.count();
    console.log(`🚀 Iniciando cálculo de ${count} números primos en Worker...`);
    this.isLoading.set(true);
    this.result.set(null);
    this.startTime = performance.now();

    this.worker.postMessage({ count });
  }

  calculateInMainThread() {
    const count = this.count();
    console.log(`🐌 Iniciando cálculo de ${count} números primos en el hilo principal...`);
    console.warn('⚠️ La UI se congelará durante el cálculo');

    this.isLoading.set(true);
    this.result.set(null);

    // Dar tiempo a que se actualice la UI antes de bloquear
    setTimeout(() => {
      const startTime = performance.now();
      const primes = this.calculatePrimes(count);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      console.log('✅ Cálculo en hilo principal completado');
      
      this.isLoading.set(false);
      this.result.set({
        primes,
        duration,
        method: 'Hilo Principal'
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
}

