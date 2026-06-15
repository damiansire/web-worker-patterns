import { fpsInWindow, trimOldFrames } from './compositor-demo.logic';

describe('compositor-demo logic', () => {
  describe('fpsInWindow', () => {
    it('counts frames within the last window', () => {
      // frames a 0,100,...,900 ms; en t=950 con ventana 1000 entran los 10
      const frames = Array.from({ length: 10 }, (_, i) => i * 100);
      expect(fpsInWindow(frames, 950, 1000)).toBe(10);
    });

    it('excludes frames older than the window (main bloqueado → caen los FPS)', () => {
      // último frame a 200ms; en t=2000 (1.8s sin frames) la ventana de 1s no atrapa ninguno
      const frames = [0, 100, 200];
      expect(fpsInWindow(frames, 2000, 1000)).toBe(0);
    });

    it('counts only the frames inside a partial window', () => {
      const frames = [0, 500, 1000, 1500, 2000];
      // ventana (1100, 2100]: 1500 y 2000
      expect(fpsInWindow(frames, 2100, 1000)).toBe(2);
    });
  });

  describe('trimOldFrames', () => {
    it('drops timestamps older than the window', () => {
      expect(trimOldFrames([0, 100, 900, 1500], 1600, 1000)).toEqual([900, 1500]);
    });
  });
});
