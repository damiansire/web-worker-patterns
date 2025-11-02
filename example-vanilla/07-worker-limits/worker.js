// worker.js - Worker simple para testing de límites

console.log('🔧 Worker iniciado');

// Escuchar mensajes del hilo principal
self.onmessage = function(e) {
    const { action, workerId } = e.data;
    
    if (action === 'init') {
        console.log(`Worker #${workerId} inicializado`);
        
        // Enviar confirmación
        self.postMessage({
            message: `Inicializado correctamente`,
            workerId: workerId
        });
        
        // Simular trabajo periódico (opcional)
        // Esto ayuda a mantener el worker "vivo" y visible en las herramientas de desarrollo
        let counter = 0;
        const interval = setInterval(() => {
            counter++;
            
            // Enviar heartbeat cada 5 segundos
            if (counter % 50 === 0) {
                self.postMessage({
                    message: `Heartbeat - Sigo activo (${counter / 10}s)`,
                    workerId: workerId
                });
            }
        }, 100);
        
        // Limpiar intervalo si el worker es terminado
        self.addEventListener('error', () => {
            clearInterval(interval);
        });
    }
};

// Manejo de errores
self.onerror = function(error) {
    console.error('❌ Error en worker:', error);
};

// NOTAS SOBRE LÍMITES DE WORKERS:
//
// 1. LÍMITES DEL NAVEGADOR:
//    - Chrome/Edge: ~20-50 workers (depende de núcleos CPU y memoria)
//    - Firefox: ~20-30 workers
//    - Safari: ~10-20 workers
//    - Los límites exactos varían según la configuración del sistema
//
// 2. FACTORES QUE AFECTAN EL LÍMITE:
//    - Número de núcleos CPU (navigator.hardwareConcurrency)
//    - Memoria RAM disponible
//    - Otros procesos del navegador
//    - Configuración del SO
//
// 3. QUÉ SUCEDE AL EXCEDER EL LÍMITE:
//    - El constructor Worker() puede lanzar una excepción
//    - Puede fallar silenciosamente (el worker no se crea)
//    - El navegador puede volverse lento o no responsivo
//    - Puede afectar otras pestañas del navegador
//
// 4. MEJORES PRÁCTICAS:
//    - Usa un "pool" de workers reutilizables
//    - Límite recomendado: navigator.hardwareConcurrency * 2
//    - Siempre termina workers que no necesitas
//    - Implementa monitoreo y limpieza automática
//    - Para tareas paralelas masivas, considera usar un worker que procese
//      tareas en cola en lugar de crear un worker por tarea
//
// 5. PATRÓN WORKER POOL:
//    En lugar de crear muchos workers, crea un número fijo (ej: 4-8)
//    y reutilízalos para procesar múltiples tareas en cola.

