import { code } from '../../core/utils/code-snippet.helper';

export const WORKER_LIMITS_SNIPPETS = {
  vanillaSystemInfo: code`
const cpuCores = navigator.hardwareConcurrency || 4;
`,
  vanillaCreateMultiple: code`
const workers = [];

for (let i = 0; i < count; i++) {
  try {
    const worker = new Worker('worker.js');
    workers.push(worker);
  } catch (error) {
    console.error('Error:', error);
  }
}
`,
  angularComponent: code`
getCPUCores(): number {
  return navigator.hardwareConcurrency || 4;
}

getRecommendedMax(): number {
  return this.getCPUCores() * 2;
}

async createMultipleWorkers() {
  const count = this.workerCount();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < count; i++) {
    await new Promise(resolve => setTimeout(resolve, 50));
    if (this.createWorker()) {
      successCount++;
    } else {
      failCount++;
    }
  }

  this.addLog(
    this.format(this.texts().logs?.multipleResult, {
      success: successCount,
      fail: failCount
    }),
    failCount > 0 ? 'warning' : 'success'
  );
}
`
};
