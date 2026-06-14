/**
 * Lógica pura de la "tarea riesgosa" del ejemplo 05 (manejo de errores).
 *
 * Parsea un payload JSON y devuelve cuántas claves de primer nivel tiene el
 * objeto. Si el payload no es JSON válido, `JSON.parse` lanza un `SyntaxError`
 * REAL (no un error artificial): ese es justamente el error que el worker deja
 * propagar para que el main lo capture con `onerror`.
 *
 * Al ser una función pura se testea sin worker ni interfaz (Vitest).
 */
export function riskyTask(payload: string): number {
  const parsed: unknown = JSON.parse(payload); // lanza SyntaxError si el JSON está roto
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('El payload no es un objeto JSON');
  }
  return Object.keys(parsed).length;
}
