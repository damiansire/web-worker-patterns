console.log('🔧 Backpressure worker started');

function heavyComputation(data: { taskId: string; complexity: number }): { taskId: string; result: number; duration: number } {
  const startTime = performance.now();
  let result = 0;

  // Simulate CPU-intensive work proportional to complexity
  const iterations = data.complexity * 100000;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
  }

  return {
    taskId: data.taskId,
    result,
    duration: Math.round(performance.now() - startTime)
  };
}

self.onmessage = function(e: MessageEvent<{ taskId: string; complexity: number }>) {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
