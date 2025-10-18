// main.js - Manejo de errores en Web Workers

const logContainer = document.getElementById('logContainer');
let startTime = Date.now();

// Función para agregar log a la consola visual
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date(Date.now()).toLocaleTimeString();
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'timestamp';
    timestampSpan.textContent = `[${timestamp}]`;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    entry.appendChild(timestampSpan);
    entry.appendChild(messageSpan);
    
    logContainer.appendChild(entry);
    
    // Auto scroll
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // También log en la consola del navegador
    if (type === 'error') {
        console.error(message);
    } else if (type === 'success') {
        console.log('✅', message);
    } else {
        console.log(message);
    }
}

// Función para limpiar la consola
window.clearConsole = function() {
    logContainer.innerHTML = '';
    addLog('Consola limpiada', 'info');
};

// Verificar soporte de Web Workers
if (window.Worker) {
    // Crear el worker
    const worker = new Worker('worker.js');
    
    addLog('🔧 Worker creado exitosamente', 'success');
    
    // ===== MANEJO DE MENSAJES EXITOSOS =====
    worker.onmessage = function(e) {
        addLog(`📨 Mensaje del worker: ${e.data.message}`, 'success');
        
        if (e.data.result) {
            addLog(`   └─ Resultado: ${e.data.result}`, 'info');
        }
    };
    
    // ===== MANEJO DE ERRORES =====
    // Este es el evento clave para capturar errores en workers
    worker.onerror = function(event) {
        // Prevenir que el error se propague y cause problemas
        event.preventDefault();
        
        // Extraer información del error
        const errorInfo = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        };
        
        addLog('❌ ERROR CAPTURADO EN EL WORKER:', 'error');
        addLog(`   └─ Mensaje: ${errorInfo.message}`, 'error');
        addLog(`   └─ Archivo: ${errorInfo.filename}`, 'error');
        addLog(`   └─ Línea: ${errorInfo.lineno}, Columna: ${errorInfo.colno}`, 'error');
        
        console.error('Error completo:', errorInfo);
    };
    
    // ===== FUNCIÓN PARA PROVOCAR DIFERENTES ERRORES =====
    window.triggerError = function(errorType) {
        addLog(`🎯 Provocando error de tipo: "${errorType}"`, 'info');
        
        // Enviar mensaje al worker indicando qué tipo de error provocar
        worker.postMessage({
            action: 'triggerError',
            errorType: errorType
        });
    };
    
    // Log inicial
    addLog('✨ Sistema de manejo de errores listo', 'success');
    addLog('Haz clic en cualquier botón para probar', 'info');
    
} else {
    addLog('❌ Tu navegador no soporta Web Workers', 'error');
    alert('❌ Tu navegador no soporta Web Workers');
}

// Notas sobre el manejo de errores:
// 
// 1. El evento 'onerror' captura errores NO manejados en el worker
// 2. event.preventDefault() evita que el error se propague al hilo principal
// 3. Puedes obtener información detallada: mensaje, archivo, línea, columna
// 4. Los errores capturados con try-catch en el worker NO disparan 'onerror'
// 5. Es una buena práctica siempre definir 'onerror' para debugging

