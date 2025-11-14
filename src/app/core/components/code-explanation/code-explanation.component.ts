import { AfterContentInit, Component, ContentChildren, Input, QueryList, Signal, WritableSignal, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeSectionComponent } from '../code-section/code-section.component';
import { CodeVariant } from './code-variant.type';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-code-explanation',
  imports: [CommonModule, CodeSectionComponent],
  templateUrl: './code-explanation.component.html',
  styleUrl: './code-explanation.component.scss',
  standalone: true
})
export class CodeExplanationComponent implements AfterContentInit {
  @Input() summaryText: string = '📖 Ver Código - ¿Cómo funciona?';
  @ContentChildren(CodeSectionComponent) private readonly sections?: QueryList<CodeSectionComponent>;

  readonly selectedVariant: WritableSignal<CodeVariant> = signal<CodeVariant>('javascript');
  readonly showEmptyState: WritableSignal<boolean> = signal<boolean>(false);

  readonly angularLabel: Signal<string>;
  readonly javascriptLabel: Signal<string>;
  readonly emptyStateMessage: Signal<string>;

  constructor(private readonly language: LanguageService) {
    this.angularLabel = computed(() => this.language.t('codeExplanation.angularButton', 'Angular'));
    this.javascriptLabel = computed(() => this.language.t('codeExplanation.javascriptButton', 'JavaScript'));
    this.emptyStateMessage = computed(() =>
      this.language.t(
        `codeExplanation.emptyState.${this.selectedVariant()}`,
        this.selectedVariant() === 'angular'
          ? 'Aún no hay código Angular disponible para este ejemplo.'
          : 'Aún no hay código JavaScript disponible para este ejemplo.'
      )
    );
  }

  ngAfterContentInit() {
    this.sections?.changes.subscribe(() => this.updateVisibility());
    this.updateVisibility();
  }

  selectVariant(variant: CodeVariant) {
    if (this.selectedVariant() === variant) {
      return;
    }
    this.selectedVariant.set(variant);
    this.updateVisibility();
  }

  isSelected(variant: CodeVariant): boolean {
    return this.selectedVariant() === variant;
  }

  private updateVisibility() {
    const currentVariant = this.selectedVariant();
    let hasVisible = false;

    this.sections?.forEach(section => {
      const shouldShow = section.tech === currentVariant;
      section.setHidden(!shouldShow);
      if (shouldShow) {
        hasVisible = true;
      }
    });

    this.showEmptyState.set(!hasVisible);
  }
}

