import { beforeEach } from 'vitest';

// El builder de Angular corre Vitest con `isolate: false`: todos los spec comparten
// el mismo entorno, y por lo tanto el mismo localStorage. ThemeService y
// LanguageService leen su estado inicial de ahí, así que un theme persistido por un
// test (p.ej. `setTheme('midnight')`) se filtraba a los siguientes, incluso de otros
// archivos. Además el storage visible depende de la versión de Node: en Node 22 es
// el de jsdom; en Node 25+ el global propio de Node lo tapa y, sin
// `--localstorage-file`, no existe. Instalar un storage en memoria NUEVO antes de
// cada test deja el mismo entorno, vacío, en cualquier Node.
class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, String(value));
  }
}

beforeEach(() => {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: new MemoryStorage(),
    });
  }
});
