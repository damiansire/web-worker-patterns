// worker.js - Diferentes tipos de errores para demostración

console.log('🔧 Worker de demostración de errores iniciado');

// Escuchar mensajes del hilo principal
self.onmessage = function(e) {
    const { action, errorType } = e.data;
    
    if (action === 'triggerError') {
        console.log(`⚠️ Worker: Provocando error tipo "${errorType}"`);
        
        switch (errorType) {
            case 'reference':
                // Error de referencia: usar una función que no existe
                funcionQueNoExiste(); // Esto lanzará un ReferenceError
                break;
                
            case 'type':
                // Error de tipo: intentar llamar algo que no es una función
                const notAFunction = "Soy un string";
                notAFunction(); // Esto lanzará un TypeError
                break;
                
            case 'math':
                // Error matemático / de rango
                const arr = new Array(-1); // Esto lanzará un RangeError
                break;
                
            case 'custom':
                // Lanzar un error personalizado
                throw new Error('Este es un error personalizado lanzado intencionalmente desde el worker');
                
            case 'success':
                // Operación exitosa (sin error)
                console.log('✅ Ejecutando operación sin errores...');
                
                // Realizar alguna operación exitosa
                const result = performSafeOperation();
                
                self.postMessage({
                    message: 'Operación completada exitosamente',
                    result: result
                });
                break;
                
            default:
                self.postMessage({
                    message: `Tipo de error desconocido: ${errorType}`
                });
        }
    }
};

// Función que se ejecuta sin errores
function performSafeOperation() {
    const numbers = [1, 2, 3, 4, 5];
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return `Suma de ${numbers.join(' + ')} = ${sum}`;
}

// También podemos manejar errores dentro del worker usando try-catch
function safeOperation() {
    try {
        // Código que podría fallar
        riskyOperation();
    } catch (error) {
        // Manejar el error dentro del worker
        console.error('Error manejado dentro del worker:', error);
        
        // Enviar información del error al hilo principal
        self.postMessage({
            error: true,
            message: error.message
        });
    }
}

// Nota importante:
// 
// DIFERENCIA ENTRE ERROR MANEJADO Y NO MANEJADO:
// 
// 1. Error NO manejado (sin try-catch):
//    - Dispara el evento 'onerror' en el hilo principal
//    - Puede detener la ejecución del worker
//    - Proporciona información de línea y columna
// 
// 2. Error MANEJADO (con try-catch):
//    - NO dispara 'onerror' en el hilo principal
//    - Puedes enviar información personalizada con postMessage
//    - Mayor control sobre el manejo del error
//    - El worker continúa funcionando
// 
// MEJORES PRÁCTICAS:
// - Siempre define 'onerror' en el hilo principal
// - Usa try-catch para errores esperados
// - Deja que 'onerror' capture errores inesperados
// - Proporciona mensajes de error descriptivos

