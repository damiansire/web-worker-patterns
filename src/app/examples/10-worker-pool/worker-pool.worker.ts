console.log('🔧 Worker del pool iniciado');

function processTask(data: any, duration: number) {
  const startTime = Date.now();
  let result = 0;
  
  while (Date.now() - startTime < duration) {
    for (let i = 0; i < 10000; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
  }
  
  return {
    processed: data,
    result: result,
    duration: Date.now() - startTime
  };
}

self.onmessage = function(e: MessageEvent<{ taskId: string; data: any; duration: number }>) {
  const { taskId, data, duration } = e.data;
  
  console.log(`Worker procesando tarea ${taskId}`);
  const result = processTask(data, duration);
  
  self.postMessage({
    taskId,
    data: result.processed,
    result: result.result,
    duration: result.duration
  });
  
  console.log(`Worker completó tarea ${taskId}`);
};

