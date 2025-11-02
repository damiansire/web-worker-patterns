// main.js - Gestión del ciclo de vida de Workers

// Referencias al DOM
const createBtn = document.getElementById('createBtn');
const startBtn = document.getElementById('startBtn');
const terminateBtn = document.getElementById('terminateBtn');
const restartBtn = document.getElementById('restartBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const logContainer = document.getElementById('logContainer');
const createdCountEl = document.getElementById('createdCount');
const completedCountEl = document.getElementById('completedCount');
const terminatedCountEl = document.getElementById('terminatedCount');
const progressBarContainer = document.getElementById('progressBarContainer');
const progressFill = document.getElementById('progressFill');

// Variables de estado
let worker = null;
let createdCount = 0;
let completedCount = 0;
let terminatedCount = 0;
let isWorking = false;

// Función para agregar log
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;
    
    logContainer.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // También log en consola
    const emoji = {
        'info': '📘',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    };
    console.log(`${emoji[type] || '📘'} ${message}`);
}

// Función para limpiar log
window.clearLog = function() {
    logContainer.innerHTML = '';
    addLog('Log limpiado', 'info');
};

// Función para actualizar el estado visual
function updateStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
}

// Función para actualizar botones
function updateButtons() {
    createBtn.disabled = worker !== null;
    startBtn.disabled = worker === null || isWorking;
    terminateBtn.disabled = worker === null;
    restartBtn.disabled = worker === null && !isWorking;
}

// Función para actualizar estadísticas
function updateStats() {
    createdCountEl.textContent = createdCount;
    completedCountEl.textContent = completedCount;
    terminatedCountEl.textContent = terminatedCount;
}

// Función para actualizar la barra de progreso
function updateProgress(progress) {
    progressFill.style.width = progress + '%';
    progressFill.textContent = progress + '%';
}

// CREAR WORKER
createBtn.addEventListener('click', function() {
    addLog('Creando nuevo Worker...', 'info');
    
    try {
        // Crear nueva instancia del worker
        worker = new Worker('worker.js');
        
        createdCount++;
        updateStats();
        
        addLog('Worker creado exitosamente', 'success');
        updateStatus('active', 'Worker activo (esperando)');
        updateButtons();
        
        // Configurar listeners para el worker
        worker.onmessage = function(e) {
            const { type, progress, result, message } = e.data;
            
            switch (type) {
                case 'progress':
                    // Actualizar progreso
                    updateProgress(progress);
                    addLog(`Progreso: ${progress}%`, 'info');
                    break;
                    
                case 'complete':
                    // Tarea completada
                    isWorking = false;
                    completedCount++;
                    updateStats();
                    updateProgress(100);
                    
                    addLog(`Tarea completada: ${result}`, 'success');
                    updateStatus('active', 'Worker activo (esperando)');
                    updateButtons();
                    
                    // Ocultar barra de progreso después de 2 segundos
                    setTimeout(() => {
                        progressBarContainer.style.display = 'none';
                        updateProgress(0);
                    }, 2000);
                    break;
                    
                case 'log':
                    addLog(`Worker: ${message}`, 'info');
                    break;
            }
        };
        
        worker.onerror = function(error) {
            addLog(`Error en el Worker: ${error.message}`, 'error');
            updateStatus('inactive', 'Worker con error');
            isWorking = false;
            updateButtons();
        };
        
    } catch (error) {
        addLog(`Error al crear Worker: ${error.message}`, 'error');
    }
});

// INICIAR TAREA
startBtn.addEventListener('click', function() {
    if (worker && !isWorking) {
        addLog('Iniciando tarea larga en el Worker...', 'info');
        
        isWorking = true;
        updateStatus('working', 'Worker trabajando...');
        updateButtons();
        
        // Mostrar barra de progreso
        progressBarContainer.style.display = 'block';
        updateProgress(0);
        
        // Enviar comando al worker para iniciar tarea
        worker.postMessage({
            action: 'startLongTask',
            duration: 5000 // 5 segundos
        });
    }
});

// TERMINAR WORKER
terminateBtn.addEventListener('click', function() {
    if (worker) {
        addLog('Terminando Worker...', 'warning');
        
        // Terminar el worker inmediatamente
        worker.terminate();
        
        worker = null;
        isWorking = false;
        terminatedCount++;
        
        updateStats();
        updateStatus('inactive', 'Worker terminado');
        updateButtons();
        
        // Ocultar barra de progreso
        progressBarContainer.style.display = 'none';
        updateProgress(0);
        
        addLog('Worker terminado exitosamente', 'success');
        addLog('El Worker ha sido destruido y sus recursos liberados', 'info');
    }
});

// REINICIAR WORKER
restartBtn.addEventListener('click', function() {
    addLog('Reiniciando Worker...', 'info');
    
    // Terminar worker actual si existe
    if (worker) {
        worker.terminate();
        terminatedCount++;
        addLog('Worker anterior terminado', 'warning');
    }
    
    // Resetear estado
    worker = null;
    isWorking = false;
    progressBarContainer.style.display = 'none';
    updateProgress(0);
    
    // Crear nuevo worker
    setTimeout(() => {
        createBtn.click();
    }, 500);
});

// Inicialización
updateStatus('inactive', 'Worker no creado');
updateButtons();
updateStats();
addLog('Sistema de gestión de Workers listo', 'success');
addLog('Haz clic en "Crear Worker" para comenzar', 'info');

// Limpiar al cerrar la página
window.addEventListener('beforeunload', function() {
    if (worker) {
        addLog('Limpiando recursos antes de cerrar...', 'warning');
        worker.terminate();
    }
});

// NOTAS IMPORTANTES SOBRE EL CICLO DE VIDA:
//
// 1. CREACIÓN:
//    - new Worker() crea una nueva instancia
//    - El worker empieza a ejecutarse inmediatamente
//    - Cada Worker tiene su propio contexto global
//
// 2. USO:
//    - Comunicación mediante postMessage/onmessage
//    - El worker puede realizar múltiples tareas
//    - Mantiene su estado entre mensajes
//
// 3. TERMINACIÓN:
//    - worker.terminate() termina el worker inmediatamente
//    - No hay forma de pausar un worker, solo terminarlo
//    - Después de terminate(), el worker no puede ser reutilizado
//    - Los recursos son liberados por el garbage collector
//
// 4. MEJORES PRÁCTICAS:
//    - Siempre termina workers cuando no los necesites
//    - No crees workers innecesariamente (son costosos)
//    - Considera reutilizar workers para múltiples tareas
//    - Limpia workers en beforeunload/unload
//    - Maneja errores apropiadamente
//
// 5. CUÁNDO TERMINAR:
//    - Cuando la página se cierra
//    - Cuando el worker ya no es necesario
//    - Cuando hay un error irrecuperable
//    - Para liberar memoria en aplicaciones de larga duración

