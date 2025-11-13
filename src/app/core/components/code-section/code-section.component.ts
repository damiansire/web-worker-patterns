import { AfterContentChecked, Component, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';

let languagesRegistered = false;

if (!languagesRegistered) {
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('json', json);
  languagesRegistered = true;
}

@Component({
  selector: 'app-code-section',
  imports: [CommonModule],
  templateUrl: './code-section.component.html',
  styleUrl: './code-section.component.scss',
  standalone: true
})
export class CodeSectionComponent implements AfterContentChecked {
  @Input() title?: string;

  private highlightedElements = new WeakSet<HTMLElement>();

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterContentChecked() {
    this.highlightProjectedCode();
  }

  private highlightProjectedCode() {
    const codeBlocks = this.host.nativeElement.querySelectorAll<HTMLElement>('pre code');

    codeBlocks.forEach(block => {
      if (this.highlightedElements.has(block)) {
        return;
      }

      if (!block.className.split(' ').some(cls => cls.startsWith('language-'))) {
        block.classList.add('language-typescript');
      }

      hljs.highlightElement(block);
      this.highlightedElements.add(block);
    });
  }
}

