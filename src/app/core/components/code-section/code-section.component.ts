import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-code-section',
  imports: [CommonModule],
  templateUrl: './code-section.component.html',
  styleUrl: './code-section.component.scss',
  standalone: true
})
export class CodeSectionComponent {
  @Input() title?: string;
}

