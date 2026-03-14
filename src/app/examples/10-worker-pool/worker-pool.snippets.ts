import { code } from '../../core/utils/code-snippet.helper';

export const WORKER_POOL_SNIPPETS = {
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
