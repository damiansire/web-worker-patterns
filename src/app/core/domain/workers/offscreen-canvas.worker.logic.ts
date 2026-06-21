/**
 * Lógica pura de dibujo del ejemplo 14 (OffscreenCanvas). Se separa del worker para
 * poder testearla sin un Worker ni un canvas real (jsdom no los soporta): el worker y el
 * fallback en el main importan ESTA misma función, así el reloj se ve idéntico en los dos
 * lados (la regla de oro: el dibujo se escribe una vez).
 */

/** Paleta resuelta (el worker no tiene CSS: el main le pasa los tokens ya computados). */
export interface ClockPalette {
  surface: string;
  ink: string;
  accent: string;
  /** Color de la manecilla / arco activo (token --thread-worker o --thread-main según lado). */
  hand: string;
  /** Etiqueta corta del lado ('worker' | 'main'), se imprime tenue en el canvas. */
  label: string;
}

export interface ClockState {
  /** Tiempo transcurrido desde el arranque, en ms. Avanza suave si el hilo está vivo. */
  elapsedMs: number;
  /** Frames realmente pintados de este lado (deja de subir si el hilo se congela). */
  frames: number;
  /** Lado del canvas (cuadrado), en px de dibujo. */
  size: number;
}

/** Subconjunto del contexto 2D que usamos (sirve para Canvas y OffscreenCanvas, y para un fake en tests). */
export interface Ctx2D {
  clearRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fill(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineCap: CanvasLineCap;
  font: string;
  textAlign: CanvasTextAlign;
}

const TAU = Math.PI * 2;

/** Ángulo de la manecilla de segundos (barrido continuo), 0 = arriba (12 en punto). */
export function handAngle(elapsedMs: number): number {
  const seconds = elapsedMs / 1000;
  const fraction = (((seconds % 60) + 60) % 60) / 60; // robusto a negativos
  return fraction * TAU - Math.PI / 2;
}

/** Tiempo transcurrido como texto monotónico (sin zona horaria): '12.34s'. */
export function formatElapsed(elapsedMs: number): string {
  return `${(Math.max(0, elapsedMs) / 1000).toFixed(2)}s`;
}

/** Presupuesto por frame (ms) por defecto: 60Hz. */
const DEFAULT_FRAME_BUDGET_MS = 1000 / 60;

/**
 * Presupuesto por frame (ms) derivado de la cadencia REAL observada, no de 60Hz fijo:
 * `elapsedMs / frames`. En 120Hz da ~8.3ms, en 60Hz ~16.7ms. Si todavía no hay muestra
 * (frames o tiempo no positivos), cae a 60Hz.
 */
export function observedFrameBudgetMs(elapsedMs: number, frames: number): number {
  return frames > 0 && elapsedMs > 0 ? elapsedMs / frames : DEFAULT_FRAME_BUDGET_MS;
}

/**
 * Frames que el main "saltó" durante un bloqueo: los que habría pintado a la cadencia
 * observada (`blockedMs / frameBudgetMs`) menos los que realmente pintó. Nunca negativo.
 */
export function skippedFrames(
  blockedMs: number,
  frameBudgetMs: number,
  framesPainted: number,
): number {
  if (frameBudgetMs <= 0) {
    return 0;
  }
  const expected = Math.round(blockedMs / frameBudgetMs);
  return Math.max(0, expected - framesPainted);
}

/**
 * Dibuja un cuadro del reloj: cara, ticks, manecilla de segundos en barrido, y —la prueba
 * forense— el tiempo transcurrido y el contador de frames impresos EN el píxel. Si el hilo
 * se congela, este frame deja de redibujarse y el tiempo/los frames quedan clavados.
 */
export function drawClock(ctx: Ctx2D, state: ClockState, palette: ClockPalette): void {
  const { size, elapsedMs, frames } = state;
  const c = size / 2;
  const r = size * 0.36;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = palette.surface;
  ctx.fillRect(0, 0, size, size);

  // Cara
  ctx.beginPath();
  ctx.arc(c, c, r, 0, TAU);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(2, size * 0.012);
  ctx.stroke();

  // Ticks de las 12 horas
  ctx.strokeStyle = palette.ink;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    const inner = r * 0.86;
    ctx.beginPath();
    ctx.lineWidth = Math.max(1, size * 0.008);
    ctx.moveTo(c + Math.cos(a) * inner, c + Math.sin(a) * inner);
    ctx.lineTo(c + Math.cos(a) * r * 0.97, c + Math.sin(a) * r * 0.97);
    ctx.stroke();
  }

  // Arco de progreso del minuto en curso (acento)
  const prog = handAngle(elapsedMs);
  ctx.beginPath();
  ctx.arc(c, c, r * 1.06, -Math.PI / 2, prog);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.lineCap = 'round';
  ctx.stroke();

  // Manecilla de segundos
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(prog + Math.PI / 2); // rotate usa 0 = arriba tras sumar PI/2
  ctx.beginPath();
  ctx.moveTo(0, r * 0.1);
  ctx.lineTo(0, -r * 0.82);
  ctx.strokeStyle = palette.hand;
  ctx.lineWidth = Math.max(2, size * 0.016);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Centro
  ctx.beginPath();
  ctx.arc(c, c, Math.max(2, size * 0.02), 0, TAU);
  ctx.fillStyle = palette.hand;
  ctx.fill();

  // Evidencia forense: tiempo + frames impresos en el píxel
  ctx.fillStyle = palette.ink;
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(size * 0.11)}px ui-monospace, monospace`;
  ctx.fillText(formatElapsed(elapsedMs), c, c + r + size * 0.13);
  ctx.fillStyle = palette.accent;
  ctx.font = `${Math.round(size * 0.06)}px ui-monospace, monospace`;
  ctx.fillText(`frame ${frames}`, c, c + r + size * 0.21);

  // Etiqueta del lado, tenue arriba
  ctx.fillStyle = palette.ink;
  ctx.font = `${Math.round(size * 0.055)}px ui-monospace, monospace`;
  ctx.fillText(palette.label, c, c - r - size * 0.08);
}
