export const BACKPRESSURE_SNIPPETS: Record<string, any> = {
  en: {
    vanillaSchedule: `// Core scheduling — the backpressure pattern
function scheduleTask(task, workerPool, activeTasks, MAX_TASKS) {
  // If we're under the limit, offload to a worker
  if (activeTasks.size < MAX_TASKS) {
    const freeWorker = workerPool.find(w => !w.busy);
    if (freeWorker) {
      activeTasks.set(task.id, task);
      freeWorker.busy = true;
      freeWorker.postMessage(task);
      return; // ✅ Offloaded to worker
    }
  }

  // BACKPRESSURE FALLBACK: execute synchronously on main thread
  // When MAX_TASKS is exceeded, run on current thread instead of queueing
  console.warn(\`Backpressure! \${activeTasks.size}/\${MAX_TASKS} active, running sync\`);
  executeSynchronously(task);
}`,
    vanillaFallback: `// When the system is saturated, it doesn't queue forever —
// it runs the task on the current thread immediately.
// This is a common pattern in simulation engines and task schedulers.

function executeSynchronously(task) {
  const start = performance.now();
  // Run the same computation the worker would run
  const result = heavyComputation(task.data);
  const duration = performance.now() - start;

  // ⚠️ This blocks the main thread but guarantees progress!
  // Trade-off: UI jank vs unbounded queue growth
  console.log(\`Sync fallback: \${task.id} in \${duration}ms\`);
  return result;
}`,
    cppReference: `// Reference: C++ implementation of the same pattern
// This is how native task schedulers implement backpressure
static void* ScheduleTask(
    TaskCallback* task, int32_t itemCount,
    int32_t minRange, void* taskContext, void* userContext)
{
    TaskSystem* system = static_cast<TaskSystem*>(userContext);

    if (system->activeTaskCount < TaskSystem::MAX_TASKS)
    {
        // Happy path: schedule on thread pool
        Task& poolTask = system->tasks[system->activeTaskCount];
        poolTask.m_SetSize = itemCount;
        poolTask.m_MinRange = minRange;
        poolTask.taskCallback = task;
        poolTask.taskData = taskContext;
        system->taskScheduler->AddTaskSetToPipe(&poolTask);
        ++system->activeTaskCount;
        return &poolTask;
    }
    else
    {
        // BACKPRESSURE: execute synchronously on calling thread
        task(0, itemCount, 0, taskContext);
        return nullptr;
    }
}`
  },
  es: {
    vanillaSchedule: `// Scheduling central — el patrón de backpressure
function scheduleTask(task, workerPool, activeTasks, MAX_TASKS) {
  // Si estamos bajo el límite, enviar al worker
  if (activeTasks.size < MAX_TASKS) {
    const freeWorker = workerPool.find(w => !w.busy);
    if (freeWorker) {
      activeTasks.set(task.id, task);
      freeWorker.busy = true;
      freeWorker.postMessage(task);
      return; // ✅ Enviado al worker
    }
  }

  // BACKPRESSURE FALLBACK: ejecutar síncronamente en el main thread
  // Cuando se excede MAX_TASKS, ejecutar en el thread actual
  console.warn(\`¡Backpressure! \${activeTasks.size}/\${MAX_TASKS} activas, ejecutando sync\`);
  executeSynchronously(task);
}`,
    vanillaFallback: `// Cuando el sistema está saturado, no encola eternamente —
// ejecuta la tarea en el thread actual inmediatamente.
// Este es un patrón común en motores de simulación y task schedulers.

function executeSynchronously(task) {
  const start = performance.now();
  // Ejecutar el mismo cómputo que haría el worker
  const result = heavyComputation(task.data);
  const duration = performance.now() - start;

  // ⚠️ Bloquea el main thread pero garantiza progreso!
  // Trade-off: jank en UI vs crecimiento infinito de la cola
  console.log(\`Sync fallback: \${task.id} en \${duration}ms\`);
  return result;
}`,
    cppReference: `// Referencia: Implementación en C++ del mismo patrón
// Así es como los task schedulers nativos implementan backpressure
static void* ScheduleTask(
    TaskCallback* task, int32_t itemCount,
    int32_t minRange, void* taskContext, void* userContext)
{
    TaskSystem* system = static_cast<TaskSystem*>(userContext);

    if (system->activeTaskCount < TaskSystem::MAX_TASKS)
    {
        // Camino feliz: programar en el thread pool
        Task& poolTask = system->tasks[system->activeTaskCount];
        poolTask.m_SetSize = itemCount;
        poolTask.m_MinRange = minRange;
        poolTask.taskCallback = task;
        poolTask.taskData = taskContext;
        system->taskScheduler->AddTaskSetToPipe(&poolTask);
        ++system->activeTaskCount;
        return &poolTask;
    }
    else
    {
        // BACKPRESSURE: ejecutar síncronamente en el thread que llama
        task(0, itemCount, 0, taskContext);
        return nullptr;
    }
}`
  },
  pt: {
    vanillaSchedule: `// Scheduling central — o padrão de backpressure
function scheduleTask(task, workerPool, activeTasks, MAX_TASKS) {
  if (activeTasks.size < MAX_TASKS) {
    const freeWorker = workerPool.find(w => !w.busy);
    if (freeWorker) {
      activeTasks.set(task.id, task);
      freeWorker.busy = true;
      freeWorker.postMessage(task);
      return; // ✅ Enviado ao worker
    }
  }

  // BACKPRESSURE FALLBACK: executar na main thread
  console.warn(\`Backpressure! \${activeTasks.size}/\${MAX_TASKS} ativas, executando sync\`);
  executeSynchronously(task);
}`,
    vanillaFallback: `// Quando o sistema está saturado, não enfileira eternamente —
// executa na thread atual imediatamente.
function executeSynchronously(task) {
  const start = performance.now();
  const result = heavyComputation(task.data);
  const duration = performance.now() - start;
  console.log(\`Sync fallback: \${task.id} em \${duration}ms\`);
  return result;
}`,
    cppReference: `// Referência: Implementação em C++ do mesmo padrão
static void* ScheduleTask(
    TaskCallback* task, int32_t itemCount,
    int32_t minRange, void* taskContext, void* userContext)
{
    TaskSystem* system = static_cast<TaskSystem*>(userContext);
    if (system->activeTaskCount < TaskSystem::MAX_TASKS)
    {
        // ... schedule on thread pool
        return &poolTask;
    }
    else
    {
        // BACKPRESSURE: executar na thread atual
        task(0, itemCount, 0, taskContext);
        return nullptr;
    }
}`
  }
};
