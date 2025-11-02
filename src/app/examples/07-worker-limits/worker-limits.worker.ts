console.log('🔧 Worker iniciado');

self.onmessage = function(e: MessageEvent<{ action: string; workerId: number }>) {
  const { action, workerId } = e.data;
  
  if (action === 'init') {
    console.log(`Worker #${workerId} inicializado`);
    self.postMessage({ message: `Inicializado correctamente`, workerId });
    
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (counter % 50 === 0) {
        self.postMessage({
          message: `Heartbeat - Sigo activo (${counter / 10}s)`,
          workerId
        });
      }
    }, 100);
  }
};

