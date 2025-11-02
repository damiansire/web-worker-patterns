import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCard {
  label: string;
  value: string | number;
  type?: 'default' | 'active' | 'error' | 'success' | 'warning';
}

@Component({
  selector: 'app-stats-panel',
  imports: [CommonModule],
  templateUrl: './stats-panel.component.html',
  styleUrl: './stats-panel.component.scss',
  standalone: true
})
export class StatsPanelComponent {
  @Input() title: string = '📊 Estadísticas';
  @Input() stats: StatCard[] = [];
}

