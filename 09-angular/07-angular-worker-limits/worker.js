// worker.js - Worker simple para testing de límites

console.log('🔧 Worker iniciado');

self.onmessage = function(e) {
    const { action, workerId } = e.data;
    
    if (action === 'init') {
        console.log(`Worker #${workerId} inicializado`);
        self.postMessage({ message: `Inicializado correctamente`, workerId });
    }
};

self.onerror = function(error) {
    console.error('❌ Error en worker:', error);
};

