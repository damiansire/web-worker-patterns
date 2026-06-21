import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BrutalistButton } from '../themes/brutalist/primitives/brutalist-button.component';
import { provideButtonOptions } from './button.options';

describe('ButtonBehavior (host directive) + button options', () => {
  function createButton(): HTMLButtonElement {
    const fixture = TestBed.createComponent(BrutalistButton);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('button')!;
  }

  it('usa "ghost" como variant por defecto desde el token de opciones', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    expect(createButton().getAttribute('data-variant')).toBe('ghost');
  });

  it('respeta el default provisto por DI (provideButtonOptions)', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideButtonOptions({ variant: 'solid' })],
    });
    expect(createButton().getAttribute('data-variant')).toBe('solid');
  });

  it('mantiene la API pública (variant/disabled) vía hostDirectives', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(BrutalistButton);
    fixture.componentRef.setInput('variant', 'solid');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('data-variant')).toBe('solid');
    expect(button.disabled).toBe(true);
  });
});
