/**
 * Lógica pura de la demo "compositor vs main" (ejemplo 16). El concepto, fiel a
 * cómo lo implementa Chromium: dentro de un mismo renderer hay DOS hilos que
 * importan para la fluidez — el main thread (Blink/JS/layout/paint) y el
 * compositor thread (cc). El compositor sigue pintando scroll y animaciones de
 * transform/opacity a ~60fps aunque el main esté bloqueado con JavaScript. Lo
 * que vive en el main (animaciones por JS, layout) NO sobrevive al bloqueo.
 *
 * Acá medimos los FPS del MAIN contando los frames (callbacks de
 * requestAnimationFrame) que ocurrieron en la última ventana de tiempo: si el
 * main se bloquea, no hay frames y los FPS caen; el compositor, en cambio, sigue.
 * Esta parte es pura y testeable; el bucle de rAF real vive en el servicio.
 */

/** Cuenta los frames (timestamps) dentro de la ventana [now - windowMs, now] → FPS. */
export function fpsInWindow(frameTimestamps: number[], now: number, windowMs = 1000): number {
  const cutoff = now - windowMs;
  return frameTimestamps.filter((t) => t > cutoff).length;
}

/** Descarta timestamps más viejos que la ventana (para que el buffer no crezca sin techo). */
export function trimOldFrames(frameTimestamps: number[], now: number, windowMs = 1000): number[] {
  const cutoff = now - windowMs;
  return frameTimestamps.filter((t) => t > cutoff);
}
