import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type WorkerState = 'idle' | 'busy' | 'error' | 'terminated';
export type MessageFlow = 'sequential' | 'parallel' | 'shared';

export interface ThreadDiagramConfig {
  /** Number of workers to render (1 for basic examples, N for pool) */
  workers: number;
  /** Show a task queue between main thread and workers */
  showQueue?: boolean;
  /** Communication pattern */
  messageFlow: MessageFlow;
  /** Per-worker state array; length must match `workers` */
  workerStates?: WorkerState[];
}

interface WorkerNode {
  index: number;
  label: string;
  state: WorkerState;
}

/**
 * Generic visual component for representing Main Thread ↔ Worker communication.
 * Works for a single worker up to a full worker pool. The `animated` input
 * triggers pulsing arrows to show active message passing.
 */
@Component({
  selector: 'app-thread-diagram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thread-diagram.component.html',
  styleUrl: './thread-diagram.component.scss'
})
export class ThreadDiagramComponent {
  @Input() set config(value: ThreadDiagramConfig) {
    this._config.set(value);
  }
  @Input() animated = false;
  @Input() mainThreadLabel = 'Main Thread';
  @Input() queueLabel = 'Queue';

  private readonly _config = signal<ThreadDiagramConfig>({
    workers: 1,
    messageFlow: 'sequential'
  });

  readonly workerNodes = computed<WorkerNode[]>(() => {
    const cfg = this._config();
    return Array.from({ length: cfg.workers }, (_, i) => ({
      index: i,
      label: cfg.workers === 1 ? 'Worker' : `Worker ${i + 1}`,
      state: cfg.workerStates?.[i] ?? 'idle'
    }));
  });

  readonly showQueue = computed(() => this._config().showQueue ?? false);
  readonly messageFlow = computed(() => this._config().messageFlow);
  readonly isCompact = computed(() => this._config().workers > 4);

  workerStateClass(state: WorkerState): string {
    return `worker--${state}`;
  }

  workerStateIcon(state: WorkerState): string {
    const icons: Record<WorkerState, string> = {
      idle: '⏸',
      busy: '⚙',
      error: '✕',
      terminated: '■'
    };
    return icons[state];
  }
}
