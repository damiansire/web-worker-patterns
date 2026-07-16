export type { WorkerLike } from './worker-like.js';
export { incrementShared, readShared, reachedTarget } from './shared-counter.logic.js';
export {
  SharedCounterBuffer,
  isSharedMemorySupported,
  type SharedCounterOptions,
  type SharedCounterHandlers,
} from './shared-counter-buffer.js';
export {
  WorkerPool,
  type WorkerPoolTask,
  type WorkerPoolOptions,
  type WorkerPoolEvents,
} from './worker-pool.js';
