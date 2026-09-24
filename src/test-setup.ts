import { beforeEach } from 'vitest';

// El builder de Angular corre Vitest con `isolate: false`: todos los spec comparten
// el mismo jsdom, y por lo tanto el mismo localStorage. ThemeService y LanguageService
// leen su estado inicial de ahí, así que un theme persistido por un test (p.ej.
// `setTheme('midnight')`) se filtraba a los siguientes, incluso de otros archivos, y
// el resultado dependía del orden y de la versión de Node (Node 25+ trae su propio
// localStorage global, inerte sin `--localstorage-file`, que tapaba el bug en local).
// Arrancar cada test con storage vacío hace los tests deterministas.
beforeEach(() => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* sin storage (o un test lo reemplazó por un mock sin clear): nada que limpiar */
  }
});
