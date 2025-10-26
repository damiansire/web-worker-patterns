// worker.js - Worker con lifecycle management

console.log('🔧 Worker iniciado');

self.onmessage = function(e) {
    const { action } = e.data;
    
    if (action === 'ping') {
        self.postMessage({ status: 'alive', timestamp: Date.now() });
    } else if (action === 'work') {
        const start = Date.now();
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i);
        }
        self.postMessage({ 
            status: 'complete', 
            result,
            duration: Date.now() - start 
        });
    } else if (action === 'close') {
        console.log('Worker cerrando...');
        self.close();
    }
};

self.onerror = function(error) {
    console.error('Error en worker:', error);
};

