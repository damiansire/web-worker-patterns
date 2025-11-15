import { AfterContentChecked, Component, ElementRef, HostBinding, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import { CodeVariant } from '../code-explanation/code-variant.type';

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
  private _tech: CodeVariant = 'javascript';

  @Input()
  set tech(value: CodeVariant) {
    this._tech = value ?? 'javascript';
  }

  get tech(): CodeVariant {
    return this._tech;
  }

  @Input() code?: string;
  @Input() languageClass = 'language-typescript';
  @ViewChild('codeBlock', { read: ElementRef }) private readonly codeBlock?: ElementRef<HTMLElement>;

  private hidden = false;

  private highlightedElements = new WeakSet<HTMLElement>();

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterContentChecked() {
    this.highlightProjectedCode();
    this.highlightInlineCode();
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

  private highlightInlineCode() {
    if (!this.codeBlock) {
      return;
    }

    const element = this.codeBlock.nativeElement;
    if (this.highlightedElements.has(element)) {
      return;
    }

    // Preserve the original text content with formatting
    const originalText = element.textContent || '';
    
    if (originalText.trim()) {
      try {
        const highlighted = hljs.highlight(originalText, { 
          language: this.getLanguageFromClass() 
        });
        element.innerHTML = highlighted.value;
        this.highlightedElements.add(element);
      } catch (e) {
        // If highlighting fails, just keep the original content
        console.warn('Failed to highlight code:', e);
        this.highlightedElements.add(element);
      }
    }
  }

  private getLanguageFromClass(): string {
    if (this.languageClass.includes('typescript')) {
      return 'typescript';
    }
    if (this.languageClass.includes('javascript')) {
      return 'javascript';
    }
    if (this.languageClass.includes('json')) {
      return 'json';
    }
    return 'typescript'; // default
  }

  setHidden(isHidden: boolean) {
    this.hidden = isHidden;
  }

  @HostBinding('class.is-hidden')
  get isHidden(): boolean {
    return this.hidden;
  }

  @HostBinding('class.angular-block')
  get isAngularVariant(): boolean {
    return this.tech === 'angular';
  }
}

