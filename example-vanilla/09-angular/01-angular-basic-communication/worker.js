// worker.js - Este código se ejecuta en un hilo separado

console.log('🔧 Worker iniciado y esperando mensajes...');

// Escuchar mensajes del hilo principal
self.onmessage = function(e) {
    console.log('📨 Worker recibió mensaje:', e.data);
    
    // Procesar el mensaje recibido
    const receivedMessage = e.data;
    
    // Crear una respuesta
    const response = `¡Hola desde el Worker! Recibí tu mensaje: "${receivedMessage}"`;
    
    // Simular un pequeño retraso para hacer la comunicación más visible
    setTimeout(() => {
        // Enviar la respuesta de vuelta al hilo principal
        self.postMessage(response);
        console.log('✉️ Worker envió respuesta:', response);
    }, 500);
};

// También podemos escuchar errores que ocurran en el worker
self.onerror = function(error) {
    console.error('❌ Error en el worker:', error);
};

// Nota: En el contexto de un worker:
// - 'self' se refiere al alcance global del worker
// - No hay acceso al DOM (document, window, etc.)
// - No podemos manipular la interfaz de usuario directamente
// - La única forma de comunicarnos con el hilo principal es mediante postMessage

