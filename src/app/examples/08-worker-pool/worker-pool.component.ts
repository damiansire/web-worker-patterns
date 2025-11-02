import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-worker-pool',
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-pool.component.html',
  styleUrl: './worker-pool.component.scss',
  standalone: true
})
export class WorkerPoolComponent {
  poolSize = signal(4);
  taskCount = signal(10);
  tasksProcessed = signal(0);
  
  processTasks() {
    this.tasksProcessed.set(0);
    // Simplified implementation
    for (let i = 0; i < this.taskCount(); i++) {
      setTimeout(() => {
        this.tasksProcessed.update(c => c + 1);
      }, i * 100);
    }
  }
}
