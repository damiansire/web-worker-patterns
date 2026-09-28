/**
 * Lectura y escritura en `localStorage` que NUNCA tiran.
 *
 * Con el almacenamiento bloqueado (cookies de terceros o del sitio bloqueadas,
 * iframes sandboxeados), el solo hecho de LEER la propiedad `localStorage` tira
 * SecurityError: `typeof localStorage` no protege, porque igual invoca el getter.
 * Como ThemeService y LanguageService leen su estado inicial al construirse, esa
 * excepción dejaba la página en blanco. Persistir la preferencia es un extra: si
 * no se puede, la app arranca igual con sus valores por defecto.
 */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento (bloqueado, lleno o inexistente): la preferencia no persiste.
  }
}
