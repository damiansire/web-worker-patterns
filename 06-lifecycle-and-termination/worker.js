// worker.js - Worker con tarea larga para demostrar ciclo de vida

console.log('🔧 Worker iniciado y listo');

// Estado interno del worker
let taskCount = 0;

// Simular una tarea larga con reportes de progreso
function performLongTask(duration) {
    const startTime = Date.now();
    const steps = 100;
    const stepDuration = duration / steps;
    
    taskCount++;
    const currentTask = taskCount;
    
    console.log(`📊 Iniciando tarea #${currentTask} (duración: ${duration}ms)`);
    
    self.postMessage({
        type: 'log',
        message: `Iniciando tarea #${currentTask}`
    });
    
    let currentStep = 0;
    
    // Usar setInterval para simular trabajo y reportar progreso
    const interval = setInterval(() => {
        currentStep++;
        const progress = Math.round((currentStep / steps) * 100);
        
        // Reportar progreso
        self.postMessage({
            type: 'progress',
            progress: progress
        });
        
        // Simular algo de trabajo
        // (En un caso real, aquí harías cálculos reales)
        let dummy = 0;
        for (let i = 0; i < 100000; i++) {
            dummy += Math.sqrt(i);
        }
        
        // Si completamos todos los pasos
        if (currentStep >= steps) {
            clearInterval(interval);
            
            const elapsed = Date.now() - startTime;
            console.log(`✅ Tarea #${currentTask} completada en ${elapsed}ms`);
            
            // Reportar finalización
            self.postMessage({
                type: 'complete',
                result: `Tarea #${currentTask} completada en ${elapsed}ms`,
                taskNumber: currentTask
            });
        }
    }, stepDuration);
}

// Escuchar mensajes del hilo principal
self.onmessage = function(e) {
    const { action, duration } = e.data;
    
    console.log('📨 Worker recibió comando:', action);
    
    switch (action) {
        case 'startLongTask':
            performLongTask(duration || 5000);
            break;
            
        case 'ping':
            // Responder a un ping (útil para verificar si el worker está activo)
            self.postMessage({
                type: 'pong',
                timestamp: Date.now()
            });
            break;
            
        default:
            console.warn('⚠️ Acción desconocida:', action);
            self.postMessage({
                type: 'error',
                message: `Acción desconocida: ${action}`
            });
    }
};

// Manejo de errores dentro del worker
self.onerror = function(error) {
    console.error('❌ Error en el worker:', error);
    
    // Intentar notificar al hilo principal
    try {
        self.postMessage({
            type: 'error',
            message: error.message || 'Error desconocido en el worker'
        });
    } catch (e) {
        console.error('No se pudo enviar mensaje de error al hilo principal');
    }
};

// Log de inicio
self.postMessage({
    type: 'log',
    message: 'Worker inicializado y esperando comandos'
});

// NOTAS SOBRE EL CICLO DE VIDA DESDE EL WORKER:
//
// 1. El worker empieza a ejecutarse en cuanto es creado
// 2. El worker mantiene su estado (variables) entre mensajes
// 3. No hay forma de saber desde el worker cuándo será terminado
// 4. Cuando se llama a terminate() desde el hilo principal:
//    - El worker se detiene INMEDIATAMENTE
//    - Cualquier código en ejecución se interrumpe
//    - No hay callback de "limpieza"
//    - Los setInterval/setTimeout se cancelan automáticamente
//
// MEJORES PRÁCTICAS:
// - Diseña tareas que puedan ser interrumpidas de forma segura
// - No dependas de operaciones de "cleanup" en el worker
// - Guarda estado importante en el hilo principal, no en el worker
// - Para tareas críticas, usa mensajes de confirmación

