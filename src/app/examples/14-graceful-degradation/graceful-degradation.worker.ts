console.log('🔧 Graceful degradation file worker started');

self.onmessage = function(e: MessageEvent<{ iterations: number }>) {
  const { iterations } = e.data;
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  self.postMessage({ result });
};
