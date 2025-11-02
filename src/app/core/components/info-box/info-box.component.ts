import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-box',
  imports: [CommonModule],
  templateUrl: './info-box.component.html',
  styleUrl: './info-box.component.scss',
  standalone: true
})
export class InfoBoxComponent {
  @Input() title?: string;
  @Input() content!: string;
}

