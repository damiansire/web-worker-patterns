import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeSectionComponent } from '../code-section/code-section.component';

@Component({
  selector: 'app-code-explanation',
  imports: [CommonModule, CodeSectionComponent],
  templateUrl: './code-explanation.component.html',
  styleUrl: './code-explanation.component.scss',
  standalone: true
})
export class CodeExplanationComponent {
  @Input() summaryText: string = '📖 Ver Código - ¿Cómo funciona?';
}

