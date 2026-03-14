import { code } from '../../core/utils/code-snippet.helper';

const S_es = {
  basicCreate: code`
let worker = null;

// Los workers consumen memoria; no terminarlos provoca fugas al desmontar el componente
function createWorker() {
  worker = new Worker('worker.js');
  worker.onmessage = handleMessage;
  worker.onerror = handleError;
}
`,
  basicTerminate: code`
// terminate() detiene el worker de inmediato; los mensajes en curso se pierden, no hay limpieza
function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
`,
  angularComponent: code`
// Buena práctica: crear workers solo cuando hagan falta y terminarlos al terminar
createWorker() {
  if (this.worker) {
    return;
  }

  this.addLog(this.texts().logs?.creating ?? 'Creando worker...', 'info');

  this.worker = new Worker(
    new URL('./lifecycle-termination.worker', import.meta.url),
    { type: 'module' }
  );

  this.worker.onmessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'progress') {
      this.progress.set(event.data.progress);
    } else if (event.data.type === 'complete') {
      this.workerStatus.set('completed');
      this.completedCount.update(c => c + 1);
      this.progress.set(0);
    }
  };

  this.worker.onerror = (error: ErrorEvent) => {
    this.addLog(error.message, 'error');
  };

  this.workerStatus.set('created');
  this.createdCount.update(c => c + 1);
}

// Siempre terminar en cleanup/destroy; workers huérfanos fugan memoria y siguen ejecutándose
terminateWorker() {
  if (!this.worker) {
    return;
  }

  this.worker.terminate();
  this.worker = undefined;
  this.workerStatus.set('none');
  this.terminatedCount.update(c => c + 1);
  this.addLog(this.texts().logs?.workerTerminated ?? 'Worker terminado', 'warning');
}
`
};

const S_en = {
  basicCreate: code`
let worker = null;

// Workers consume memory; not terminating them causes leaks when components unmount
function createWorker() {
  worker = new Worker('worker.js');
  worker.onmessage = handleMessage;
  worker.onerror = handleError;
}
`,
  basicTerminate: code`
// terminate() stops the worker immediately—in-flight messages are dropped, no cleanup runs
function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
`,
  angularComponent: code`
// Best practice: create workers only when needed, terminate when done
createWorker() {
  if (this.worker) {
    return;
  }

  this.addLog(this.texts().logs?.creating ?? 'Creating worker...', 'info');

  this.worker = new Worker(
    new URL('./lifecycle-termination.worker', import.meta.url),
    { type: 'module' }
  );

  this.worker.onmessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'progress') {
      this.progress.set(event.data.progress);
    } else if (event.data.type === 'complete') {
      this.workerStatus.set('completed');
      this.completedCount.update(c => c + 1);
      this.progress.set(0);
    }
  };

  this.worker.onerror = (error: ErrorEvent) => {
    this.addLog(error.message, 'error');
  };

  this.workerStatus.set('created');
  this.createdCount.update(c => c + 1);
}

// Always terminate in cleanup/destroy—orphaned workers leak memory and keep running
terminateWorker() {
  if (!this.worker) {
    return;
  }

  this.worker.terminate();
  this.worker = undefined;
  this.workerStatus.set('none');
  this.terminatedCount.update(c => c + 1);
  this.addLog(this.texts().logs?.workerTerminated ?? 'Worker terminated', 'warning');
}
`
};

const S_pt = {
  basicCreate: code`
let worker = null;

// Workers consomem memória; não terminá-los causa vazamentos ao desmontar o componente
function createWorker() {
  worker = new Worker('worker.js');
  worker.onmessage = handleMessage;
  worker.onerror = handleError;
}
`,
  basicTerminate: code`
// terminate() interrompe o worker imediatamente; mensagens em trânsito são descartadas
function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
`,
  angularComponent: code`
// Boas práticas: criar workers só quando necessário e terminá-los ao concluir
createWorker() {
  if (this.worker) {
    return;
  }

  this.addLog(this.texts().logs?.creating ?? 'Criando worker...', 'info');

  this.worker = new Worker(
    new URL('./lifecycle-termination.worker', import.meta.url),
    { type: 'module' }
  );

  this.worker.onmessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'progress') {
      this.progress.set(event.data.progress);
    } else if (event.data.type === 'complete') {
      this.workerStatus.set('completed');
      this.completedCount.update(c => c + 1);
      this.progress.set(0);
    }
  };

  this.worker.onerror = (error: ErrorEvent) => {
    this.addLog(error.message, 'error');
  };

  this.workerStatus.set('created');
  this.createdCount.update(c => c + 1);
}

// Sempre terminar no cleanup/destroy; workers órfãos vazam memória e continuam rodando
terminateWorker() {
  if (!this.worker) {
    return;
  }

  this.worker.terminate();
  this.worker = undefined;
  this.workerStatus.set('none');
  this.terminatedCount.update(c => c + 1);
  this.addLog(this.texts().logs?.workerTerminated ?? 'Worker terminado', 'warning');
}
`
};

export const LIFECYCLE_TERMINATION_SNIPPETS = { es: S_es, en: S_en, pt: S_pt };
