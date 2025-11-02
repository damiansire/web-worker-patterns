// worker.js - Manejo de errores

console.log('🔧 Worker con manejo de errores iniciado');

self.onmessage = function(e) {
    const { type } = e.data;
    
    console.log('Worker recibió tipo de error:', type);
    
    try {
        if (type === 'reference-error') {
            funcionQueNoExiste();
        } else if (type === 'type-error') {
            null.property;
        } else if (type === 'custom') {
            throw new Error('Error personalizado del worker');
        } else {
            self.postMessage({
                success: true,
                result: 'Procesado exitosamente'
            });
        }
    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message
        });
    }
};

self.onerror = function(error) {
    console.error('❌ Error no capturado en worker:', error);
};

