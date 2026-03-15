import {
  Component,
  ViewChild,
  ViewChildren,
  QueryList,
  ElementRef,
  input,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NumberEvaluation {
  number: number;
  isPrime: boolean;
}

@Component({
  selector: 'app-processor-numbers-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './processor-numbers-view.component.html',
  styleUrl: './processor-numbers-view.component.scss',
})
export class ProcessorNumbersViewComponent {
  readonly evaluatedNumbers = input.required<NumberEvaluation[]>();
  readonly processingIndex = input.required<number>();
  readonly isLoading = input.required<boolean>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly processingText = input.required<string>();
  readonly currentNumberLabel = input<string>('Reviewing:');
  readonly binaryLabel = input<string>('binary:');

  @ViewChild('numbersContainer', { static: false }) numbersContainerRef?: ElementRef<HTMLElement>;
  @ViewChildren('numberItem') numberItemRefs!: QueryList<ElementRef<HTMLElement>>;

  readonly processorLineLeft = signal(-1);

  constructor() {
    effect(() => {
      const index = this.processingIndex();
      setTimeout(() => {
        this.updateProcessorLinePosition();
        this.scrollCurrentIntoView();
      }, 0);
      setTimeout(() => {
        this.updateProcessorLinePosition();
        this.scrollCurrentIntoView();
      }, 45);
    });
  }

  updateProcessorLinePosition(): void {
    const index = this.processingIndex();
    if (index < 0) {
      this.processorLineLeft.set(-1);
      return;
    }
    const container = this.numbersContainerRef?.nativeElement;
    const refs = this.numberItemRefs?.toArray() ?? [];
    const itemRef = refs[index];
    if (!container || !itemRef) {
      return;
    }
    const cr = container.getBoundingClientRect();
    const ir = itemRef.nativeElement.getBoundingClientRect();
    const left = ir.left - cr.left + ir.width / 2 - 1;
    this.processorLineLeft.set(left);
  }

  /** Scroll only within the numbers container so the page scroll is not affected. */
  private scrollCurrentIntoView(): void {
    const index = this.processingIndex();
    if (index < 0) return;
    const container = this.numbersContainerRef?.nativeElement;
    const refs = this.numberItemRefs?.toArray() ?? [];
    const itemEl = refs[index]?.nativeElement;
    if (!container || !itemEl) return;
    const cr = container.getBoundingClientRect();
    const ir = itemEl.getBoundingClientRect();
    const itemTopRelative = ir.top - cr.top + container.scrollTop;
    const containerHeight = container.clientHeight;
    const itemHeight = ir.height;
    const targetScroll = itemTopRelative - containerHeight / 2 + itemHeight / 2;
    container.scrollTop = Math.max(0, Math.min(targetScroll, container.scrollHeight - containerHeight));
  }

  toBinary(n: number): string {
    if (n == null || n < 0) return '';
    return n === 0 ? '0' : n.toString(2);
  }
}
