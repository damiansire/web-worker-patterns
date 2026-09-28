import { TestBed } from '@angular/core/testing';
import { readStored, writeStored } from './safe-storage';
import { LanguageService } from '../services/language.service';

/** Reproduce el navegador con el almacenamiento bloqueado: leer la propiedad ya tira. */
function blockStorage(): void {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Access is denied for this document.', 'SecurityError');
    },
  });
}

describe('safe-storage', () => {
  it('lee y escribe cuando el almacenamiento funciona', () => {
    writeStored('wwp-prueba', 'valor');
    expect(readStored('wwp-prueba')).toBe('valor');
  });

  it('con el almacenamiento bloqueado devuelve null y no tira', () => {
    blockStorage();

    expect(readStored('wwp-prueba')).toBeNull();
    expect(() => writeStored('wwp-prueba', 'valor')).not.toThrow();
  });

  it('LanguageService se construye igual con el almacenamiento bloqueado', () => {
    blockStorage();
    TestBed.configureTestingModule({});

    const language = TestBed.inject(LanguageService);
    TestBed.tick(); // corre el effect que persiste el idioma

    expect(language.currentLanguage()).toBe('es');
  });
});
