import { code } from '../../core/utils/code-snippet.helper';

export const LIFECYCLE_TERMINATION_SNIPPETS = {
  basicCreate: code`
let worker = null;

function createWorker() {
  worker = new Worker('worker.js');
  worker.onmessage = handleMessage;
  worker.onerror = handleError;
}
`,
  basicTerminate: code`
function terminateWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
`,
  angularComponent: code`
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
