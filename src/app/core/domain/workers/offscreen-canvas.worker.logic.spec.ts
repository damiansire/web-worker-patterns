import {
  handAngle,
  formatElapsed,
  drawClock,
  observedFrameBudgetMs,
  skippedFrames,
  Ctx2D,
  ClockPalette,
} from './offscreen-canvas.worker.logic';

describe('offscreen-canvas worker logic', () => {
  it('handAngle: 0 = arriba (12 en punto), 15s = un cuarto de vuelta', () => {
    expect(handAngle(0)).toBeCloseTo(-Math.PI / 2);
    expect(handAngle(15000)).toBeCloseTo(0); // 15/60 de vuelta desde arriba
    expect(handAngle(30000)).toBeCloseTo(Math.PI / 2);
    // robusto a la vuelta completa
    expect(handAngle(60000)).toBeCloseTo(handAngle(0));
  });

  it('formatElapsed: tiempo monotónico con 2 decimales, sin negativos', () => {
    expect(formatElapsed(0)).toBe('0.00s');
    expect(formatElapsed(12340)).toBe('12.34s');
    expect(formatElapsed(-50)).toBe('0.00s');
  });

  it('observedFrameBudgetMs: deriva el presupuesto por frame de la cadencia real (no 60Hz fijo)', () => {
    // 60 frames en 1s → ~16.7ms/frame; 120 frames en 1s → ~8.3ms/frame.
    expect(observedFrameBudgetMs(1000, 60)).toBeCloseTo(16.67, 1);
    expect(observedFrameBudgetMs(1000, 120)).toBeCloseTo(8.33, 1);
    // sin muestra todavía → cae a 60Hz.
    expect(observedFrameBudgetMs(0, 0)).toBeCloseTo(1000 / 60, 5);
    expect(observedFrameBudgetMs(500, 0)).toBeCloseTo(1000 / 60, 5);
  });

  it('skippedFrames: cuenta los frames saltados a la cadencia observada, no a 60Hz', () => {
    // Bloqueo de 1s a 60Hz, 0 pintados → ~60 saltados.
    expect(skippedFrames(1000, 1000 / 60, 0)).toBe(60);
    // El MISMO bloqueo en 120Hz salta el DOBLE (lo que el hardcode de 60Hz subcontaba).
    expect(skippedFrames(1000, 1000 / 120, 0)).toBe(120);
    // descuenta los que sí se pintaron y nunca da negativo.
    expect(skippedFrames(1000, 1000 / 60, 10)).toBe(50);
    expect(skippedFrames(100, 1000 / 60, 999)).toBe(0);
  });

  it('drawClock: limpia el frame e imprime el tiempo y el contador de frames en el píxel', () => {
    const texts: string[] = [];
    let cleared = false;
    const ctx = {
      clearRect: () => (cleared = true),
      beginPath: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      fillText: (t: string) => texts.push(t),
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineCap: 'round' as CanvasLineCap,
      font: '',
      textAlign: 'center' as CanvasTextAlign,
    } satisfies Ctx2D;
    const palette: ClockPalette = {
      surface: '#fff',
      ink: '#111',
      accent: '#e23',
      hand: '#2a7',
      label: 'worker',
    };

    drawClock(ctx, { elapsedMs: 12340, frames: 99, size: 200 }, palette);

    expect(cleared).toBe(true);
    expect(texts).toContain('12.34s'); // el tiempo transcurrido, impreso
    expect(texts).toContain('frame 99'); // el contador de frames, impreso
    expect(texts).toContain('worker'); // la etiqueta del lado
  });
});
