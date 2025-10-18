// main.js - Demostración de límites de Workers

// Referencias al DOM
const createBtn = document.getElementById('createBtn');
const stressBtn = document.getElementById('stressBtn');
const terminateAllBtn = document.getElementById('terminateAllBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const workerCount = document.getElementById('workerCount');
const autoCleanup = document.getElementById('autoCleanup');
const activeCountEl = document.getElementById('activeCount');
const totalCreatedEl = document.getElementById('totalCreated');
const errorCountEl = document.getElementById('errorCount');
const memoryUsedEl = document.getElementById('memoryUsed');
const workersListEl = document.getElementById('workersList');
const logContainerEl = document.getElementById('logContainer');

// Referencias para auto-detección
const autoDetectBtn = document.getElementById('autoDetectBtn');
const stopDetectBtn = document.getElementById('stopDetectBtn');
const detectStatus = document.getElementById('detectStatus');
const detectProgress = document.getElementById('detectProgress');
const detectProgressBar = document.getElementById('detectProgressBar');
const detectResult = document.getElementById('detectResult');
const cpuCoresEl = document.getElementById('cpuCores');
const recommendedLimitEl = document.getElementById('recommendedLimit');
const browserInfoEl = document.getElementById('browserInfo');
const detectedLimitEl = document.getElementById('detectedLimit');

// Estado global
let workers = [];
let totalCreated = 0;
let errorCount = 0;
let startTime = Date.now();
let detectionInProgress = false;
let detectionStopped = false;
let detectedWorkerLimit = null;

// Detectar información del hardware
const cpuCores = navigator.hardwareConcurrency || 4;
const recommendedMax = cpuCores * 2;

// Detectar información del navegador
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Desconocido";
    
    if (ua.indexOf("Firefox") > -1) {
        browser = "Firefox";
    } else if (ua.indexOf("Edg") > -1) {
        browser = "Edge";
    } else if (ua.indexOf("Chrome") > -1) {
        browser = "Chrome";
    } else if (ua.indexOf("Safari") > -1) {
        browser = "Safari";
    }
    
    return browser;
}

// Mostrar información del sistema al inicio
function displaySystemInfo() {
    cpuCoresEl.textContent = cpuCores;
    recommendedLimitEl.textContent = `${recommendedMax} workers`;
    browserInfoEl.textContent = getBrowserInfo();
}

// Función para agregar log
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;
    
    logContainerEl.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Log en consola también
    const emoji = { info: '📘', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${emoji[type] || '📘'} ${message}`);
}

// Función para actualizar estadísticas
function updateStats() {
    activeCountEl.textContent = workers.length;
    totalCreatedEl.textContent = totalCreated;
    errorCountEl.textContent = errorCount;
    
    // Actualizar memoria si está disponible
    if (performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        memoryUsedEl.textContent = `${usedMB} MB`;
    }
}

// Función para actualizar la lista de workers
function updateWorkersList() {
    if (workers.length === 0) {
        workersListEl.innerHTML = `
            <p style="color: #999; text-align: center; padding: 20px;">
                No hay workers activos. Crea algunos usando los botones de arriba.
            </p>
        `;
        return;
    }
    
    workersListEl.innerHTML = workers.map((w, index) => `
        <div class="worker-item" data-worker-id="${w.id}">
            <div class="worker-info">
                <div class="worker-name">Worker #${w.id}</div>
                <div class="worker-status">
                    Creado hace ${Math.floor((Date.now() - w.createdAt) / 1000)}s
                    <span class="badge ${w.status}">${w.status === 'active' ? 'Activo' : 'Trabajando'}</span>
                </div>
            </div>
            <div class="worker-actions">
                <button onclick="terminateWorker(${w.id})">Terminar</button>
            </div>
        </div>
    `).join('');
}

// Función para crear un worker
function createWorker() {
    try {
        const workerId = totalCreated + 1;
        const worker = new Worker('worker.js');
        
        const workerData = {
            id: workerId,
            worker: worker,
            createdAt: Date.now(),
            status: 'active'
        };
        
        // Configurar listeners
        worker.onmessage = function(e) {
            const w = workers.find(w => w.id === workerId);
            if (w) {
                w.status = 'active';
                updateWorkersList();
            }
            addLog(`Worker #${workerId}: ${e.data.message}`, 'success');
        };
        
        worker.onerror = function(error) {
            errorCount++;
            addLog(`Error en Worker #${workerId}: ${error.message}`, 'error');
            updateStats();
        };
        
        // Agregar al array
        workers.push(workerData);
        totalCreated++;
        
        addLog(`Worker #${workerId} creado exitosamente`, 'success');
        
        // Enviar mensaje inicial
        worker.postMessage({ action: 'init', workerId: workerId });
        
        // Auto-limpieza si está habilitada
        if (autoCleanup.checked) {
            setTimeout(() => {
                const index = workers.findIndex(w => w.id === workerId);
                if (index !== -1) {
                    workers[index].worker.terminate();
                    workers.splice(index, 1);
                    addLog(`Worker #${workerId} terminado automáticamente (cleanup)`, 'info');
                    updateStats();
                    updateWorkersList();
                }
            }, 10000);
        }
        
        updateStats();
        updateWorkersList();
        
        return true;
        
    } catch (error) {
        errorCount++;
        addLog(`❌ Error al crear worker: ${error.message}`, 'error');
        addLog(`⚠️ Posiblemente has alcanzado el límite del navegador`, 'warning');
        updateStats();
        return false;
    }
}

// Función para terminar un worker específico
window.terminateWorker = function(workerId) {
    const index = workers.findIndex(w => w.id === workerId);
    
    if (index !== -1) {
        workers[index].worker.terminate();
        workers.splice(index, 1);
        
        addLog(`Worker #${workerId} terminado manualmente`, 'info');
        updateStats();
        updateWorkersList();
    }
};

// Función para terminar todos los workers
function terminateAllWorkers() {
    const count = workers.length;
    
    workers.forEach(w => {
        w.worker.terminate();
    });
    
    workers = [];
    
    addLog(`Todos los workers terminados (${count} workers)`, 'warning');
    updateStats();
    updateWorkersList();
}

// Función de auto-detección de límites
async function autoDetectLimit() {
    detectionInProgress = true;
    detectionStopped = false;
    const startDetectionTime = Date.now();
    
    // Limpiar workers existentes
    if (workers.length > 0) {
        terminateAllWorkers();
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Mostrar UI de detección
    detectStatus.style.display = 'block';
    detectResult.style.display = 'none';
    autoDetectBtn.disabled = true;
    stopDetectBtn.disabled = false;
    
    addLog('🔍 Iniciando auto-detección de límites...', 'info');
    addLog(`Creando workers progresivamente: 1, 2, 3...`, 'info');
    
    let currentWorker = 1;
    let maxEstimated = recommendedMax * 4; // Estimado generoso
    let consecutiveFailures = 0;
    let lastSuccessful = 0;
    
    while (currentWorker <= 100 && !detectionStopped) {
        // Actualizar progreso
        detectProgress.textContent = `Creando worker #${currentWorker}...`;
        const progress = Math.min((currentWorker / maxEstimated) * 100, 99);
        detectProgressBar.style.width = `${progress}%`;
        
        // Intentar crear worker
        const success = createWorker();
        
        if (success) {
            consecutiveFailures = 0;
            lastSuccessful = currentWorker;
            addLog(`✅ Worker #${currentWorker} creado exitosamente`, 'success');
        } else {
            consecutiveFailures++;
            addLog(`❌ Falló al crear worker #${currentWorker}`, 'error');
            
            // Si fallan 3 consecutivos, asumimos que alcanzamos el límite
            if (consecutiveFailures >= 3) {
                addLog(`🎯 Límite detectado: ${lastSuccessful} workers`, 'warning');
                break;
            }
        }
        
        currentWorker++;
        
        // Pequeño delay entre creaciones
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Completar detección
    detectionInProgress = false;
    const detectionDuration = ((Date.now() - startDetectionTime) / 1000).toFixed(1);
    
    detectProgressBar.style.width = '100%';
    detectProgress.textContent = 'Detección completada';
    
    // Mostrar resultados
    setTimeout(() => {
        detectStatus.style.display = 'none';
        detectResult.style.display = 'block';
        
        detectedWorkerLimit = lastSuccessful;
        detectedLimitEl.textContent = `${lastSuccessful} workers`;
        
        document.getElementById('finalLimit').textContent = `${lastSuccessful} workers`;
        document.getElementById('detectionTime').textContent = `${detectionDuration}s`;
        
        const comparison = lastSuccessful > recommendedMax 
            ? `+${lastSuccessful - recommendedMax} sobre recomendado`
            : `${recommendedMax - lastSuccessful} bajo recomendado`;
        document.getElementById('vsRecommended').textContent = comparison;
        
        addLog(`📊 Detección completada en ${detectionDuration}s`, 'success');
        addLog(`🎯 Tu navegador soporta hasta ${lastSuccessful} workers`, 'info');
        addLog(`📏 Recomendación: Usa ${Math.min(recommendedMax, 8)} workers en producción`, 'info');
        
        autoDetectBtn.disabled = false;
        stopDetectBtn.disabled = true;
    }, 500);
}

// Event Listeners para auto-detección
autoDetectBtn.addEventListener('click', () => {
    if (!detectionInProgress) {
        autoDetectLimit();
    }
});

stopDetectBtn.addEventListener('click', () => {
    detectionStopped = true;
    addLog('⏹️ Detección detenida por el usuario', 'warning');
    autoDetectBtn.disabled = false;
    stopDetectBtn.disabled = true;
    detectStatus.style.display = 'none';
    detectionInProgress = false;
});

// Event Listeners
createBtn.addEventListener('click', () => {
    const count = parseInt(workerCount.value);
    
    if (count < 1 || count > 100) {
        addLog('Por favor, ingresa un número entre 1 y 100', 'warning');
        return;
    }
    
    addLog(`Intentando crear ${count} workers...`, 'info');
    
    if (count > recommendedMax) {
        addLog(`⚠️ Advertencia: Estás creando más workers (${count}) que el recomendado (${recommendedMax}) para tu sistema (${cpuCores} cores)`, 'warning');
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < count; i++) {
        // Pequeño delay para no saturar el navegador
        setTimeout(() => {
            if (createWorker()) {
                successCount++;
            } else {
                failCount++;
            }
            
            if (i === count - 1) {
                addLog(`✅ Creación completada: ${successCount} exitosos, ${failCount} fallidos`, 
                       failCount > 0 ? 'warning' : 'success');
            }
        }, i * 50);
    }
});

stressBtn.addEventListener('click', () => {
    addLog('🔥 Iniciando test de estrés: intentando crear 50 workers...', 'warning');
    addLog(`💻 Tu sistema tiene ${cpuCores} núcleos CPU. Máximo recomendado: ${recommendedMax} workers`, 'info');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            if (createWorker()) {
                successCount++;
            } else {
                failCount++;
            }
            
            if (i === 49) {
                addLog(`🔥 Test de estrés completado:`, 'warning');
                addLog(`   ✅ ${successCount} workers creados exitosamente`, 'success');
                addLog(`   ❌ ${failCount} workers fallaron (límite alcanzado)`, 'error');
                addLog(`   📊 Límite práctico detectado: ~${successCount} workers`, 'info');
            }
        }, i * 50);
    }
});

terminateAllBtn.addEventListener('click', () => {
    if (workers.length === 0) {
        addLog('No hay workers para terminar', 'info');
        return;
    }
    
    if (confirm(`¿Estás seguro de querer terminar todos los ${workers.length} workers activos?`)) {
        terminateAllWorkers();
    }
});

clearLogsBtn.addEventListener('click', () => {
    logContainerEl.innerHTML = '';
    addLog('Logs limpiados', 'info');
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    terminateAllWorkers();
});

// Actualizar memoria periódicamente
setInterval(() => {
    if (workers.length > 0 && performance.memory) {
        updateStats();
    }
}, 2000);

// Inicializar información del sistema
displaySystemInfo();

// Log inicial
addLog(`Sistema iniciado. CPU cores detectados: ${cpuCores}`, 'info');
addLog(`Navegador: ${getBrowserInfo()}`, 'info');
addLog(`Máximo recomendado de workers: ${recommendedMax}`, 'info');
addLog(`Usa la auto-detección para encontrar el límite real de tu navegador`, 'info');

updateStats();

