import {
  handAngle,
  formatElapsed,
  drawClock,
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
