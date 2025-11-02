console.log('🔧 Worker iniciado y listo');

let taskCount = 0;

function performLongTask(duration: number) {
  const steps = 100;
  const stepDuration = duration / steps;
  taskCount++;
  const currentTask = taskCount;
  
  self.postMessage({ type: 'log', message: `Iniciando tarea #${currentTask}` });
  
  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    self.postMessage({ type: 'progress', progress: Math.round((currentStep / steps) * 100) });
    
    for (let i = 0; i < 100000; i++) {
      Math.sqrt(i);
    }
    
    if (currentStep >= steps) {
      clearInterval(interval);
      const elapsed = Date.now();
      self.postMessage({
        type: 'complete',
        result: `Tarea #${currentTask} completada`,
        taskNumber: currentTask
      });
    }
  }, stepDuration);
}

self.onmessage = function(e: MessageEvent<{ action: string; duration?: number }>) {
  const { action, duration } = e.data;
  
  if (action === 'startLongTask') {
    performLongTask(duration || 5000);
  } else if (action === 'ping') {
    self.postMessage({ type: 'pong', timestamp: Date.now() });
  }
};

