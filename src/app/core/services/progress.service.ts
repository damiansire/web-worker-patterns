import { Injectable, signal, computed } from '@angular/core';
import { EXAMPLES_REGISTRY } from '../../examples/examples.registry';

const STORAGE_KEY = 'wwp-progress';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly visited = signal<Set<string>>(this.loadFromStorage());

  readonly visitedCount = computed(() => this.visited().size);
  readonly totalCount = EXAMPLES_REGISTRY.length;
  readonly progressPercent = computed(() =>
    Math.round((this.visitedCount() / this.totalCount) * 100)
  );

  markVisited(exampleNumber: string): void {
    this.visited.update(set => {
      const next = new Set(set);
      next.add(exampleNumber);
      this.saveToStorage(next);
      return next;
    });
  }

  isVisited(exampleNumber: string): boolean {
    return this.visited().has(exampleNumber);
  }

  private loadFromStorage(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveToStorage(set: Set<string>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  }
}
