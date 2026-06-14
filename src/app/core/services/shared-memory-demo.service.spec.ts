import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SharedMemoryDemoService } from './shared-memory-demo.service';
import { WorkerExample } from '../domain/examples/example.model';

describe('SharedMemoryDemoService (backend simulado)', () => {
  let svc: SharedMemoryDemoService;
  let example: WorkerExample;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(SharedMemoryDemoService);
    // Forzamos el camino simulado (sin SharedArrayBuffer real) para un test
    // determinista con timers falsos.
    svc.supported.set(false);
    example = {
      id: '12-shared-array-buffer',
      order: 12,
      category: 'advanced',
      i18nKey: 'examples.12-shared-array-buffer',
      demo: 'shared-memory',
      snippets: {},
    };
  });

  it('expone si SharedArrayBuffer está soportado', () => {
    // En Node SharedArrayBuffer existe; el servicio lo refleja al construirse.
    const fresh = TestBed.inject(SharedMemoryDemoService);
    expect(typeof fresh.supported()).toBe('boolean');
  });

  it('el valor que el main lee sube hasta el target y luego se detiene', () => {
    vi.useFakeTimers();
    try {
      svc.start(example);
      expect(svc.running()).toBe(true);
      expect(svc.value()).toBe(0);

      // Avanzamos bastante más que target * intervalMs para que llegue al tope.
      vi.advanceTimersByTime(60 * (svc.target + 5));

      expect(svc.value()).toBe(svc.target);
      expect(svc.running()).toBe(false); // se detuvo al llegar al target
    } finally {
      vi.useRealTimers();
    }
  });

  it('reset vuelve el valor a cero y frena', () => {
    vi.useFakeTimers();
    try {
      svc.start(example);
      vi.advanceTimersByTime(300);
      expect(svc.value()).toBeGreaterThan(0);
      svc.reset();
      expect(svc.value()).toBe(0);
      expect(svc.running()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
