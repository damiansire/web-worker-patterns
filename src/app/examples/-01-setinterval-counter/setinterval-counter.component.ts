import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LanguageService } from '../../core/services/language.service';

const block = (...lines: string[]) => lines.join('\n') + '\n';

@Component({
  selector: 'app-setinterval-counter',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent],
  templateUrl: './setinterval-counter.component.html',
  styleUrl: './setinterval-counter.component.scss',
  standalone: true
})
export class SetIntervalCounterComponent implements OnInit, OnDestroy {
  private readonly language = inject(LanguageService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.setIntervalCounter'));
  readonly codeSnippets = {
    vanillaCreateCounter: block(
      '// Variable para almacenar el valor del contador',
      'let contador = 0;'
    ),
    vanillaSetInterval: block(
      '// setInterval ejecuta una función cada cierto tiempo (en milisegundos)',
      'const intervalId = setInterval(function() {',
      '  contador++;',
      '  document.getElementById(\'contador\').textContent = contador;',
      '}, 1000); // Cada 1000ms (1 segundo)'
    ),
    vanillaClearInterval: block(
      '// Para detener el intervalo, usamos clearInterval',
      'clearInterval(intervalId);'
    ),
    vanillaWhyImportant: block(
      '// setInterval ejecuta código en el HILO PRINCIPAL',
      '// Si el hilo principal está ocupado con cálculos pesados,',
      '// el contador se congelará y no se actualizará.',
      '// Esto es exactamente el problema que resuelven los Web Workers.'
    ),
    angularComponent: block(
      'counter = signal(0);',
      'intervalId?: ReturnType<typeof setInterval>;',
      '',
      'ngOnInit() {',
      '  // Iniciar contador automáticamente',
      '  this.startCounter();',
      '}',
      '',
      'startCounter() {',
      '  if (this.intervalId) return;',
      '  ',
      '  this.intervalId = setInterval(() => {',
      '    this.counter.update(c => c + 1);',
      '  }, this.speed());',
      '}',
      '',
      'stopCounter() {',
      '  if (this.intervalId) {',
      '    clearInterval(this.intervalId);',
      '    this.intervalId = undefined;',
      '  }',
      '}',
      '',
      'ngOnDestroy() {',
      '  this.stopCounter();',
      '}'
    )
  };

  counter = signal(0);
  speed = signal(1000);
  isRunning = signal(false);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit() {
    // El contador no se inicia automáticamente
  }

  ngOnDestroy() {
    this.stopCounter();
  }

  startCounter() {
    if (this.intervalId) {
      return; // Ya está corriendo
    }

    this.counter.update(c => c + 1); // Actualizar inmediatamente
    this.intervalId = setInterval(() => {
      this.counter.update(c => c + 1);
    }, this.speed());

    this.isRunning.set(true);
    console.log(`✅ Contador iniciado (cada ${this.speed()}ms)`);
  }

  stopCounter() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isRunning.set(false);
      console.log('⏸️ Contador pausado');
    }
  }

  resetCounter() {
    this.stopCounter();
    this.counter.set(0);
    console.log('🔄 Contador reiniciado');
  }

  onSpeedChange(newSpeed: number) {
    this.speed.set(newSpeed);
    
    // Si el contador está corriendo, reiniciarlo con la nueva velocidad
    if (this.intervalId) {
      this.stopCounter();
      this.startCounter();
    }
    
    console.log(`⚙️ Velocidad cambiada a ${newSpeed}ms`);
  }
}

