import { code } from '../../core/utils/code-snippet.helper';

const S_es = {
  vanillaCreatePool: code`
class WorkerPool {
  constructor(poolSize, workerScript) {
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    // Crear un Worker por tarea es costoso; el pool reutiliza un conjunto fijo
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push({ id: i, instance: worker, busy: false });
    }
  }
}
`,
  vanillaAddTask: code`
// La cola de tareas amortigua trabajo cuando todos los workers están ocupados
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  vanillaProcessQueue: code`
// Reutiliza workers libres: asigna tareas encoladas a workers disponibles
processQueue() {
  const available = this.workers.filter(worker => !worker.busy);

  available.forEach(worker => {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      worker.busy = true;
      worker.instance.postMessage(task);
    }
  });
}
`,
  vanillaHandleResult: code`
// Cuando el worker termina, lo marcas libre y procesas la siguiente tarea encolada
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`,
  angularPoolClass: code`
// El pool evita el coste de crear Worker por tarea reutilizando un conjunto fijo
class WorkerPool {
  constructor(
    private size: number,
    private component: WorkerPoolComponent,
    private statsCallback: () => void
  ) {
    this.startTime = Date.now();
    this.initializeWorkers();
  }

  // La cola reparte tareas entre workers; ninguna espera si hay uno libre
  addTasks(tasks: Task[]) {
    this.component.addLog(
      this.component.format(
        this.component.texts().logs?.tasksAdded ?? '',
        { count: tasks.length }
      ),
      'info'
    );

    this.taskQueue.push(...tasks);
    this.processQueue();
  }

  // Crear workers una vez; siguen vivos y procesan tareas de la cola
  private initializeWorkers() {
    for (let i = 0; i < this.size; i++) {
      const worker: WorkerData = {
        id: i + 1,
        instance: new Worker(
          new URL('./worker-pool.worker', import.meta.url),
          { type: 'module' }
        ),
        busy: false,
        currentTask: null
      };

      worker.instance.onmessage = (event: MessageEvent) => {
        this.handleWorkerComplete(worker, event.data);
      };

      this.workers.push(worker);
    }
  }

  // Asignar tareas encoladas a workers libres; reutiliza workers en vez de crear nuevos
  private processQueue() {
    const available = this.workers.filter(worker => !worker.busy);

    available.forEach(worker => {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(worker, task);
      }
    });

    this.statsCallback();
  }

  private assignTaskToWorker(worker: WorkerData, task: Task) {
    worker.busy = true;
    worker.currentTask = task;
    task.startedAt = Date.now();

    worker.instance.postMessage({
      taskId: task.id,
      data: task.data,
      duration: task.duration
    });
  }

  private handleWorkerComplete(worker: WorkerData, result: any) {
    worker.busy = false;
    worker.currentTask = null;
    this.processQueue();
    this.statsCallback();
  }

  private startTime = Date.now();
  private workers: WorkerData[] = [];
  private taskQueue: Task[] = [];
}
`,
  angularAddTask: code`
// La cola retiene el exceso cuando el pool está saturado; processQueue asigna a libres
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  angularProcessQueue: code`
// Balanceo de carga: emparejar tareas encoladas con workers disponibles
processQueue() {
  const available = this.workers.filter(worker => !worker.busy);

  available.forEach(worker => {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(worker, task);
      }
    }
  });

  this.statsCallback();
}
`,
  angularHandleResult: code`
// El worker queda libre; processQueue toma la siguiente tarea de la cola
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`
};

const S_en = {
  vanillaCreatePool: code`
class WorkerPool {
  constructor(poolSize, workerScript) {
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    // Creating a new Worker per task is expensive—pool reuses a fixed set
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push({ id: i, instance: worker, busy: false });
    }
  }
}
`,
  vanillaAddTask: code`
// Task queue buffers work when all workers are busy—enables load balancing
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  vanillaProcessQueue: code`
// Recycles idle workers: assign queued tasks to free workers
processQueue() {
  const available = this.workers.filter(worker => !worker.busy);

  available.forEach(worker => {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      worker.busy = true;
      worker.instance.postMessage(task);
    }
  });
}
`,
  vanillaHandleResult: code`
// When worker finishes, mark idle and process next queued task
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`,
  angularPoolClass: code`
// Pool avoids per-task Worker creation cost by reusing a fixed set of workers
class WorkerPool {
  constructor(
    private size: number,
    private component: WorkerPoolComponent,
    private statsCallback: () => void
  ) {
    this.startTime = Date.now();
    this.initializeWorkers();
  }

  // Queue distributes tasks across workers—no task waits if a worker is free
  addTasks(tasks: Task[]) {
    this.component.addLog(
      this.component.format(
        this.component.texts().logs?.tasksAdded ?? '',
        { count: tasks.length }
      ),
      'info'
    );

    this.taskQueue.push(...tasks);
    this.processQueue();
  }

  // Pre-create workers once; they stay alive and process tasks from the queue
  private initializeWorkers() {
    for (let i = 0; i < this.size; i++) {
      const worker: WorkerData = {
        id: i + 1,
        instance: new Worker(
          new URL('./worker-pool.worker', import.meta.url),
          { type: 'module' }
        ),
        busy: false,
        currentTask: null
      };

      worker.instance.onmessage = (event: MessageEvent) => {
        this.handleWorkerComplete(worker, event.data);
      };

      this.workers.push(worker);
    }
  }

  // Assign queued tasks to idle workers—recycles workers instead of creating new ones
  private processQueue() {
    const available = this.workers.filter(worker => !worker.busy);

    available.forEach(worker => {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(worker, task);
      }
    });

    this.statsCallback();
  }

  private assignTaskToWorker(worker: WorkerData, task: Task) {
    worker.busy = true;
    worker.currentTask = task;
    task.startedAt = Date.now();

    worker.instance.postMessage({
      taskId: task.id,
      data: task.data,
      duration: task.duration
    });
  }

  private handleWorkerComplete(worker: WorkerData, result: any) {
    worker.busy = false;
    worker.currentTask = null;
    this.processQueue();
    this.statsCallback();
  }

  private startTime = Date.now();
  private workers: WorkerData[] = [];
  private taskQueue: Task[] = [];
}
`,
  angularAddTask: code`
// Queue holds overflow when pool is saturated; processQueue assigns to free workers
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  angularProcessQueue: code`
// Load balancing: match queued tasks with available workers
processQueue() {
  const available = this.workers.filter(worker => !worker.busy);

  available.forEach(worker => {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(worker, task);
      }
    }
  });

  this.statsCallback();
}
`,
  angularHandleResult: code`
// Worker becomes idle; processQueue picks up next task from queue
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`
};

const S_pt = {
  vanillaCreatePool: code`
class WorkerPool {
  constructor(poolSize, workerScript) {
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    // Criar um Worker por tarefa é caro; o pool reutiliza um conjunto fixo
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push({ id: i, instance: worker, busy: false });
    }
  }
}
`,
  vanillaAddTask: code`
// A fila de tarefas absorve trabalho quando todos os workers estão ocupados
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  vanillaProcessQueue: code`
// Reutiliza workers livres: atribui tarefas enfileiradas a workers disponíveis
processQueue() {
  const available = this.workers.filter(worker => !worker.busy);

  available.forEach(worker => {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      worker.busy = true;
      worker.instance.postMessage(task);
    }
  });
}
`,
  vanillaHandleResult: code`
// Quando o worker termina, marca como livre e processa a próxima tarefa da fila
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`,
  angularPoolClass: code`
// O pool evita o custo de criar Worker por tarefa reutilizando um conjunto fixo
class WorkerPool {
  constructor(
    private size: number,
    private component: WorkerPoolComponent,
    private statsCallback: () => void
  ) {
    this.startTime = Date.now();
    this.initializeWorkers();
  }

  // A fila distribui tarefas entre workers; nenhuma espera se houver um livre
  addTasks(tasks: Task[]) {
    this.component.addLog(
      this.component.format(
        this.component.texts().logs?.tasksAdded ?? '',
        { count: tasks.length }
      ),
      'info'
    );

    this.taskQueue.push(...tasks);
    this.processQueue();
  }

  // Criar workers uma vez; permanecem vivos e processam tarefas da fila
  private initializeWorkers() {
    for (let i = 0; i < this.size; i++) {
      const worker: WorkerData = {
        id: i + 1,
        instance: new Worker(
          new URL('./worker-pool.worker', import.meta.url),
          { type: 'module' }
        ),
        busy: false,
        currentTask: null
      };

      worker.instance.onmessage = (event: MessageEvent) => {
        this.handleWorkerComplete(worker, event.data);
      };

      this.workers.push(worker);
    }
  }

  // Atribuir tarefas enfileiradas a workers livres; reutiliza workers em vez de criar novos
  private processQueue() {
    const available = this.workers.filter(worker => !worker.busy);

    available.forEach(worker => {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(worker, task);
      }
    });

    this.statsCallback();
  }

  private assignTaskToWorker(worker: WorkerData, task: Task) {
    worker.busy = true;
    worker.currentTask = task;
    task.startedAt = Date.now();

    worker.instance.postMessage({
      taskId: task.id,
      data: task.data,
      duration: task.duration
    });
  }

  private handleWorkerComplete(worker: WorkerData, result: any) {
    worker.busy = false;
    worker.currentTask = null;
    this.processQueue();
    this.statsCallback();
  }

  private startTime = Date.now();
  private workers: WorkerData[] = [];
  private taskQueue: Task[] = [];
}
`,
  angularAddTask: code`
// A fila retém o excesso quando o pool está saturado; processQueue atribui aos livres
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  angularProcessQueue: code`
// Balanceamento de carga: emparelhar tarefas enfileiradas com workers disponíveis
processQueue() {
  const available = this.workers.filter(worker => !worker.busy);

  available.forEach(worker => {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.assignTaskToWorker(worker, task);
      }
    }
  });

  this.statsCallback();
}
`,
  angularHandleResult: code`
// O worker fica livre; processQueue pega a próxima tarefa da fila
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`
};

export const WORKER_POOL_SNIPPETS = { es: S_es, en: S_en, pt: S_pt };
