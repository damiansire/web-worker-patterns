import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from '../../core/components/info-box/info-box.component';
import { CodeExplanationComponent } from '../../core/components/code-explanation/code-explanation.component';
import { CodeSectionComponent } from '../../core/components/code-section/code-section.component';
import { LanguageService } from '../../core/services/language.service';
import { ProgressService } from '../../core/services/progress.service';
import { SETINTERVAL_COUNTER_SNIPPETS } from './setinterval-counter.snippets';
import { ExampleNavComponent } from '../../core/components/example-nav/example-nav.component';
import { KeyTakeawaysComponent } from '../../core/components/key-takeaways/key-takeaways.component';

@Component({
  selector: 'app-setinterval-counter',
  imports: [CommonModule, FormsModule, InfoBoxComponent, CodeExplanationComponent, CodeSectionComponent, ExampleNavComponent, KeyTakeawaysComponent],
  templateUrl: './setinterval-counter.component.html',
  styleUrl: './setinterval-counter.component.scss',
  standalone: true
})
export class SetIntervalCounterComponent implements OnInit, OnDestroy {
  protected readonly language = inject(LanguageService);
  private readonly progress = inject(ProgressService);

  readonly texts = computed(() => this.language.t<any>('examplesContent.setIntervalCounter'));
  readonly codeSnippets = computed(() =>
    SETINTERVAL_COUNTER_SNIPPETS[this.language.currentLanguage()] ?? SETINTERVAL_COUNTER_SNIPPETS.en
  );

  counter = signal(0);
  speed = signal(1000);
  isRunning = signal(false);
  visualizationMode = signal<'real' | 'slow'>('real');
  taskQueue = signal<Array<{ id: number; type: 'interval' | 'render'; timestamp: number }>>([]);
  processingTask = signal<{ id: number; type: string } | null>(null);
  private intervalId?: ReturnType<typeof setInterval>;
  private taskIdCounter = 0;
  private queueInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.progress.markVisited('01');
    // El contador no se inicia automáticamente
    // Iniciar visualización del hilo principal
    this.startThreadVisualization();
  }

  ngOnDestroy() {
    this.stopCounter();
    this.stopThreadVisualization();
  }

  startThreadVisualization() {
    // Obtener intervalos según el modo
    const getIntervals = () => {
      const mode = this.visualizationMode();
      return mode === 'real' 
        ? { queueCheck: 150, processing: 80 }
        : { queueCheck: 500, processing: 300 };
    };

    // Función para procesar una iteración
    const processQueue = () => {
      const queue = this.taskQueue();
      const processing = this.processingTask();
      const intervals = getIntervals();
      
      if (queue.length > 0 && !processing) {
        // Tomar la primera tarea de la cola
        const task = queue[0];
        this.processingTask.set(task);
        this.taskQueue.set(queue.slice(1));
        
        // Simular procesamiento de la tarea
        setTimeout(() => {
          this.processingTask.set(null);
          
          // Después de procesar el intervalo, agregar una tarea de renderizado
          if (task.type === 'interval') {
            const renderTaskId = ++this.taskIdCounter;
            this.taskQueue.update(q => [...q, { 
              id: renderTaskId, 
              type: 'render', 
              timestamp: Date.now() 
            }]);
          }
        }, intervals.processing);
      }
    };

    // Ejecutar la primera iteración
    processQueue();
    
    // Crear intervalo recursivo que se ajusta al modo
    const scheduleNext = () => {
      const intervals = getIntervals();
      this.queueInterval = setTimeout(() => {
        processQueue();
        scheduleNext();
      }, intervals.queueCheck) as any;
    };

    scheduleNext();
  }

  stopThreadVisualization() {
    if (this.queueInterval) {
      clearTimeout(this.queueInterval);
      this.queueInterval = undefined;
    }
    this.taskQueue.set([]);
    this.processingTask.set(null);
  }

  onModeChange(mode: 'real' | 'slow') {
    this.visualizationMode.set(mode);
    // Reiniciar la visualización con el nuevo modo
    this.stopThreadVisualization();
    this.startThreadVisualization();
  }

  startCounter() {
    if (this.intervalId) {
      return; // Ya está corriendo
    }

    this.counter.update(c => c + 1); // Actualizar inmediatamente
    this.intervalId = setInterval(() => {
      // Agregar tarea de intervalo a la cola
      const taskId = ++this.taskIdCounter;
      this.taskQueue.update(queue => [...queue, { 
        id: taskId, 
        type: 'interval', 
        timestamp: Date.now() 
      }]);
      
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
      // Limpiar tareas pendientes de intervalo y renderizado relacionadas
      this.taskQueue.update(queue => queue.filter(task => task.type !== 'interval'));
      // Si hay una tarea procesando que es de intervalo, también limpiarla
      const processing = this.processingTask();
      if (processing && processing.type === 'interval') {
        this.processingTask.set(null);
      }
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

