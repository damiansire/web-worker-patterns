// main.js - Implementación de Worker Pool

// ===== CLASE WORKER POOL =====
class WorkerPool {
    constructor(poolSize, workerScript) {
        this.poolSize = poolSize;
        this.workerScript = workerScript;
        this.workers = [];
        this.taskQueue = [];
        this.activeCount = 0;
        this.completedCount = 0;
        this.startTime = null;
        this.completionTimes = [];
        
        // Inicializar workers
        this.initializeWorkers();
        
        addLog(`Worker Pool inicializado con ${poolSize} workers`, 'success');
    }
    
    initializeWorkers() {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = {
                id: i + 1,
                instance: new Worker(this.workerScript),
                busy: false,
                currentTask: null
            };
            
            // Configurar listener para este worker
            worker.instance.onmessage = (e) => {
                this.handleWorkerComplete(worker, e.data);
            };
            
            worker.instance.onerror = (error) => {
                addLog(`Error en Worker #${worker.id}: ${error.message}`, 'error');
            };
            
            this.workers.push(worker);
        }
    }
    
    // Agregar tarea a la cola
    addTask(task) {
        task.id = Date.now() + Math.random();
        task.addedAt = Date.now();
        
        this.taskQueue.push(task);
        this.processQueue();
        updateStats();
        updateQueueVisualization();
    }
    
    // Agregar múltiples tareas
    addTasks(tasks) {
        tasks.forEach(task => {
            task.id = Date.now() + Math.random();
            task.addedAt = Date.now();
            this.taskQueue.push(task);
        });
        
        addLog(`${tasks.length} tareas agregadas a la cola`, 'info');
        this.processQueue();
        updateStats();
        updateQueueVisualization();
    }
    
    // Procesar cola de tareas
    processQueue() {
        // Buscar workers disponibles
        const availableWorkers = this.workers.filter(w => !w.busy);
        
        // Asignar tareas a workers disponibles
        availableWorkers.forEach(worker => {
            if (this.taskQueue.length > 0) {
                const task = this.taskQueue.shift();
                this.assignTaskToWorker(worker, task);
            }
        });
        
        updateStats();
        updateQueueVisualization();
        updateWorkersVisualization();
    }
    
    // Asignar tarea a un worker específico
    assignTaskToWorker(worker, task) {
        worker.busy = true;
        worker.currentTask = task;
        this.activeCount++;
        
        task.startedAt = Date.now();
        
        addLog(`Worker #${worker.id} procesando Tarea #${Math.floor(task.id % 1000)}`, 'info');
        
        // Enviar tarea al worker
        worker.instance.postMessage({
            taskId: task.id,
            data: task.data,
            duration: task.duration
        });
        
        updateWorkersVisualization();
    }
    
    // Manejar completación de tarea
    handleWorkerComplete(worker, result) {
        const completionTime = Date.now() - worker.currentTask.startedAt;
        this.completionTimes.push(completionTime);
        
        addLog(`Worker #${worker.id} completó Tarea #${Math.floor(result.taskId % 1000)} en ${completionTime}ms`, 'success');
        
        worker.busy = false;
        worker.currentTask = null;
        this.activeCount--;
        this.completedCount++;
        
        // Procesar siguiente tarea si hay en cola
        this.processQueue();
        
        updateStats();
        updateWorkersVisualization();
        updateQueueVisualization();
    }
    
    // Limpiar cola
    clearQueue() {
        const cleared = this.taskQueue.length;
        this.taskQueue = [];
        addLog(`Cola limpiada: ${cleared} tareas removidas`, 'warning');
        updateStats();
        updateQueueVisualization();
    }
    
    // Cerrar pool
    shutdown() {
        this.workers.forEach(worker => {
            worker.instance.terminate();
        });
        
        this.workers = [];
        this.taskQueue = [];
        this.activeCount = 0;
        
        addLog('Worker Pool apagado', 'warning');
        updateStats();
        updateWorkersVisualization();
        updateQueueVisualization();
    }
    
    // Obtener estadísticas
    getStats() {
        const avgTime = this.completionTimes.length > 0
            ? this.completionTimes.reduce((a, b) => a + b, 0) / this.completionTimes.length
            : 0;
        
        const elapsedSeconds = this.startTime 
            ? (Date.now() - this.startTime) / 1000 
            : 0;
        
        const throughput = elapsedSeconds > 0 
            ? (this.completedCount / elapsedSeconds).toFixed(2) 
            : 0;
        
        return {
            poolSize: this.workers.length,
            queueSize: this.taskQueue.length,
            processing: this.activeCount,
            completed: this.completedCount,
            avgTime: avgTime > 0 ? Math.round(avgTime) : 0,
            throughput: throughput
        };
    }
}

// ===== VARIABLES GLOBALES =====
let workerPool = null;

// Referencias al DOM
const initPoolBtn = document.getElementById('initPoolBtn');
const addTasksBtn = document.getElementById('addTasksBtn');
const stress100Btn = document.getElementById('stress100Btn');
const clearQueueBtn = document.getElementById('clearQueueBtn');
const shutdownBtn = document.getElementById('shutdownBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const poolSizeInput = document.getElementById('poolSizeInput');
const taskCount = document.getElementById('taskCount');
const taskDuration = document.getElementById('taskDuration');
const logContainer = document.getElementById('logContainer');
const workersContainer = document.getElementById('workersContainer');
const queueVisualization = document.getElementById('queueVisualization');

// ===== FUNCIONES DE UI =====

function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span>${message}`;
    
    logContainer.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    const emoji = { info: '📘', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${emoji[type] || '📘'} ${message}`);
}

function updateStats() {
    if (!workerPool) {
        document.getElementById('poolSize').textContent = '0';
        document.getElementById('queueSize').textContent = '0';
        document.getElementById('processing').textContent = '0';
        document.getElementById('completed').textContent = '0';
        document.getElementById('throughput').textContent = '0';
        document.getElementById('avgTime').textContent = '-';
        return;
    }
    
    const stats = workerPool.getStats();
    
    document.getElementById('poolSize').textContent = stats.poolSize;
    document.getElementById('queueSize').textContent = stats.queueSize;
    document.getElementById('processing').textContent = stats.processing;
    document.getElementById('completed').textContent = stats.completed;
    document.getElementById('throughput').textContent = stats.throughput;
    document.getElementById('avgTime').textContent = stats.avgTime > 0 ? `${stats.avgTime}ms` : '-';
}

function updateWorkersVisualization() {
    if (!workerPool || workerPool.workers.length === 0) {
        workersContainer.innerHTML = `
            <p style="color: #999; text-align: center; padding: 40px; grid-column: 1/-1;">
                Inicializa el pool para ver los workers en acción
            </p>
        `;
        return;
    }
    
    workersContainer.innerHTML = workerPool.workers.map(worker => `
        <div class="worker-card ${worker.busy ? 'busy' : 'idle'}">
            <div class="worker-header">
                <div class="worker-id">Worker #${worker.id}</div>
                <div class="worker-status ${worker.busy ? 'busy' : 'idle'}">
                    ${worker.busy ? 'Ocupado' : 'Disponible'}
                </div>
            </div>
            <div class="worker-info">
                ${worker.busy 
                    ? `Procesando tarea...` 
                    : `Esperando tareas`
                }
            </div>
            ${worker.busy && worker.currentTask ? `
                <div class="worker-task">
                    📦 Tarea #${Math.floor(worker.currentTask.id % 1000)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function updateQueueVisualization() {
    if (!workerPool || workerPool.taskQueue.length === 0) {
        queueVisualization.innerHTML = `
            <p style="color: #999; text-align: center; padding: 20px;">
                ${workerPool ? 'La cola está vacía' : 'Las tareas en cola aparecerán aquí'}
            </p>
        `;
        return;
    }
    
    // Mostrar solo las primeras 20 tareas para no sobrecargar el DOM
    const visibleTasks = workerPool.taskQueue.slice(0, 20);
    const remaining = workerPool.taskQueue.length - visibleTasks.length;
    
    queueVisualization.innerHTML = `
        <div class="queue-items">
            ${visibleTasks.map(task => `
                <div class="queue-item">
                    📦 Tarea #${Math.floor(task.id % 1000)}
                </div>
            `).join('')}
            ${remaining > 0 ? `
                <div class="queue-item" style="background: #e0e0e0;">
                    +${remaining} más...
                </div>
            ` : ''}
        </div>
    `;
}

// ===== EVENT LISTENERS =====

initPoolBtn.addEventListener('click', () => {
    const size = parseInt(poolSizeInput.value);
    
    if (size < 1 || size > 16) {
        addLog('Por favor, ingresa un tamaño de pool entre 1 y 16', 'warning');
        return;
    }
    
    if (workerPool) {
        workerPool.shutdown();
    }
    
    workerPool = new WorkerPool(size, 'worker.js');
    workerPool.startTime = Date.now();
    
    // Habilitar botones
    addTasksBtn.disabled = false;
    stress100Btn.disabled = false;
    clearQueueBtn.disabled = false;
    shutdownBtn.disabled = false;
    
    updateStats();
    updateWorkersVisualization();
    updateQueueVisualization();
    
    addLog(`✨ Recomendación: Tu sistema tiene ${navigator.hardwareConcurrency || 4} núcleos CPU`, 'info');
});

addTasksBtn.addEventListener('click', () => {
    const count = parseInt(taskCount.value);
    const duration = parseInt(taskDuration.value);
    
    if (!workerPool) {
        addLog('Primero debes inicializar el pool', 'warning');
        return;
    }
    
    const tasks = [];
    for (let i = 0; i < count; i++) {
        tasks.push({
            data: `Tarea ${i + 1}`,
            duration: duration
        });
    }
    
    workerPool.addTasks(tasks);
});

stress100Btn.addEventListener('click', () => {
    if (!workerPool) {
        addLog('Primero debes inicializar el pool', 'warning');
        return;
    }
    
    addLog('🔥 Iniciando stress test con 100 tareas...', 'warning');
    
    const tasks = [];
    for (let i = 0; i < 100; i++) {
        tasks.push({
            data: `Stress Task ${i + 1}`,
            duration: 500
        });
    }
    
    workerPool.addTasks(tasks);
});

clearQueueBtn.addEventListener('click', () => {
    if (!workerPool) return;
    
    if (confirm('¿Estás seguro de querer limpiar la cola?')) {
        workerPool.clearQueue();
    }
});

shutdownBtn.addEventListener('click', () => {
    if (!workerPool) return;
    
    if (confirm('¿Estás seguro de querer apagar el pool?')) {
        workerPool.shutdown();
        workerPool = null;
        
        addTasksBtn.disabled = true;
        stress100Btn.disabled = true;
        clearQueueBtn.disabled = true;
        shutdownBtn.disabled = true;
        
        updateStats();
        updateWorkersVisualization();
        updateQueueVisualization();
    }
});

clearLogsBtn.addEventListener('click', () => {
    logContainer.innerHTML = '';
    addLog('Logs limpiados', 'info');
});

// Actualizar stats periódicamente
setInterval(() => {
    if (workerPool) {
        updateStats();
    }
}, 1000);

// Limpiar al cerrar
window.addEventListener('beforeunload', () => {
    if (workerPool) {
        workerPool.shutdown();
    }
});

// Log inicial
addLog('Sistema listo. Configura e inicializa tu Worker Pool.', 'info');
addLog(`💻 Núcleos CPU detectados: ${navigator.hardwareConcurrency || 'desconocido'}`, 'info');
updateStats();

