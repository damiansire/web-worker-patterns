// worker.js - Worker para procesar tareas del pool

console.log('🔧 Worker del pool iniciado');

// Función para simular procesamiento
function processTask(data, duration) {
    // Simular trabajo con un cálculo
    const startTime = Date.now();
    let result = 0;
    
    // Realizar algún trabajo mientras pasa el tiempo
    while (Date.now() - startTime < duration) {
        // Simular cálculo intensivo
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

// Escuchar mensajes del pool
self.onmessage = function(e) {
    const { taskId, data, duration } = e.data;
    
    console.log(`Worker procesando tarea ${taskId}`);
    
    // Procesar la tarea
    const result = processTask(data, duration);
    
    // Enviar resultado de vuelta
    self.postMessage({
        taskId: taskId,
        data: result.processed,
        result: result.result,
        duration: result.duration
    });
    
    console.log(`Worker completó tarea ${taskId}`);
};

// Manejo de errores
self.onerror = function(error) {
    console.error('❌ Error en worker:', error);
};

// NOTAS SOBRE WORKER POOL:
//
// 1. REUTILIZACIÓN:
//    Este worker será reutilizado múltiples veces para procesar diferentes tareas.
//    No se crea un worker nuevo por cada tarea.
//
// 2. ESTADO:
//    Los workers en el pool no mantienen estado entre tareas.
//    Cada tarea debe ser independiente.
//
// 3. SIMPLICIDAD:
//    El worker solo necesita:
//    - Recibir datos de la tarea
//    - Procesarla
//    - Devolver el resultado
//    
//    El pool se encarga de toda la gestión de cola y asignación.
//
// 4. ESCALABILIDAD:
//    Con un pool de 4 workers, puedes procesar 1000 tareas.
//    Los workers se turnan procesando de la cola hasta que se vacía.
//
// 5. VENTAJAS:
//    - Sin límites de cantidad de tareas
//    - Uso eficiente de recursos
//    - Predecible y controlable
//    - Fácil de mantener y debuggear

