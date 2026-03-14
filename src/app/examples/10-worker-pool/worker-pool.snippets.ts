import { code } from '../../core/utils/code-snippet.helper';

export const WORKER_POOL_SNIPPETS = {
  vanillaCreatePool: code`
class WorkerPool {
  constructor(poolSize, workerScript) {
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    // Crear workers fijos
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push({ id: i, instance: worker, busy: false });
    }
  }
}
`,
  vanillaAddTask: code`
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  vanillaProcessQueue: code`
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
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`,
  angularPoolClass: code`
class WorkerPool {
  constructor(
    private size: number,
    private component: WorkerPoolComponent,
    private statsCallback: () => void
  ) {
    this.startTime = Date.now();
    this.initializeWorkers();
  }

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
addTask(task) {
  this.taskQueue.push(task);
  this.processQueue();
}
`,
  angularProcessQueue: code`
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
worker.instance.onmessage = event => {
  worker.busy = false;
  this.processQueue();
  handleResult(event.data);
};
`
};
