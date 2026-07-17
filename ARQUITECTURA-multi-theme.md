# Arquitectura multi-theme · web-worker-patterns

> **Estado actual (dos themes, un idioma).** El repo corre hoy con **dos themes** y **un solo
> idioma** (`es`): `default` (cálido, claro, la identidad "consultorio/pulso") y `midnight` (su
> contracara nocturna, oscura). Los dos se dibujan solo con el contrato de tokens y cubren la
> misma superficie de tokens, así que el switch es puramente de paleta y nada cae al valor de
> `:root`. `midnight` reusa la presentación de `default` (comparten shell, viaje y layouts) y solo
> cambia el bloque de tokens: por eso su `ThemePack` reusa los loaders del default en vez de
> duplicar componentes. Este documento describe el **motor** multi-theme, que sigue vigente: es
> data-driven (el registry es la fuente de verdad de qué themes existen) y soporta N themes/idiomas
> sin tocar el dominio. Sumar un theme con presentación propia es agregar su `ThemePack` al registry
> (con sus propios loaders) / su idioma a `availableLangs`. Los themes concretos que se nombran más
> abajo (`editorial`, `dev-tool`, `narrative`, `brutalist`) se retiraron al consolidar; se
> conservan como referencia histórica del abanico de pieles que el motor sostiene.

Documento de diseño del **motor** que permite mantener diseños radicalmente distintos en paralelo sobre una misma base Angular 22.

El principio: no comparten layout, tipografía, interacción ni librería UI. Lo único que comparten es el **dominio**: los ejemplos, la lógica real de los Web Workers, el estado de los hilos y la traducción.

---

## 1. Principio rector

> El dominio se escribe una vez. La presentación se escribe cuatro veces.

Todo lo que es *verdad sobre Web Workers* (el código del worker, cuándo se bloquea el main thread, qué tick emitió el timer) vive en una capa neutral, sin saber que existen los themes. Cada theme es una "piel" que consume ese estado y lo dibuja a su manera.

La consecuencia práctica más linda: como el estado vive en signals a nivel root, podés **cambiar de theme con el contador corriendo** y no se reinicia nada. Eso convierte el switch de theme en una demo en sí misma.

```
┌─────────────────────────────────────────────┐
│  DOMINIO (neutral, se escribe una vez)        │
│  workers reales · runner · thread-monitor     │
│  registry de 10 ejemplos · i18n · estado      │
└───────────────────┬─────────────────────────┘
                    │ contratos (interfaces)
    ┌───────────────┼───────────────┬───────────────┐
    ▼               ▼               ▼               ▼
┌────────┐     ┌────────┐     ┌──────────┐    ┌──────────┐
│editorial│    │dev-tool│     │narrative │    │brutalist │
│ shell   │    │ shell  │     │ shell    │    │ shell    │
│ prims   │    │ prims  │     │ prims    │    │ prims    │
│ Tailwind│    │ spartan│     │ Taiga UI │    │ raw scss │
│ + GSAP  │    │ + CDK  │     │ + CDK    │    │          │
└────────┘     └────────┘     └──────────┘    └──────────┘
```

---

## 2. Estructura de carpetas

```
src/app/
├── core/                          # capa neutral — cero CSS de theme
│   ├── domain/
│   │   ├── examples/
│   │   │   ├── example.model.ts        # metadata de un ejemplo
│   │   │   └── examples.registry.ts     # los 10, sin componentes de UI
│   │   └── workers/                     # .worker.ts compartidos por TODOS
│   │       ├── counter.worker.ts
│   │       ├── heavy-compute.worker.ts
│   │       └── ...
│   ├── services/
│   │   ├── example-runner.service.ts    # spawnea workers, corre demos
│   │   ├── thread-monitor.service.ts    # emite actividad de hilos (signals)
│   │   └── language.service.ts          # wrapper de Transloco
│   └── tokens/
│       └── design-tokens.ts             # nombres semánticos de tokens (TS)
│
├── theming/                       # el motor de themes
│   ├── theme.types.ts                   # ThemePack, ThemeId, contratos
│   ├── theme.registry.ts                # las 4 ThemePack registradas
│   ├── theme.service.ts                 # signal activo + carga lazy + CSS
│   └── theme.tokens.ts                  # InjectionToken<ThemePack>
│
├── ui-contracts/                  # interfaces que cada theme DEBE cumplir
│   ├── shell.contract.ts
│   ├── example-layout.contract.ts
│   ├── thread-visualizer.contract.ts
│   ├── code-block.contract.ts
│   ├── button.contract.ts
│   └── nav.contract.ts
│
├── themes/                        # 4 implementaciones aisladas
│   ├── editorial/
│   │   ├── editorial.theme.ts           # registro del ThemePack
│   │   ├── editorial.providers.ts       # DI propio (config Tailwind, GSAP)
│   │   ├── shell/editorial-shell.ts
│   │   ├── home/editorial-home.ts
│   │   ├── example-layout/...
│   │   ├── primitives/                  # button, card, thread-visualizer...
│   │   └── styles/
│   │       ├── _tokens.scss             # llena los tokens semánticos
│   │       └── _theme.scss              # @layer editorial { ... }
│   ├── dev-tool/      (misma forma)
│   ├── narrative/     (misma forma)
│   └── brutalist/     (misma forma)
│
├── app.ts                          # host: monta el shell activo
├── app.routes.ts                   # rutas theme-aware: /:theme/...
└── app.config.ts                   # providers root (servicios + theming)
```

Regla de oro: **nada dentro de `core/` puede importar nada de `themes/`**. La dependencia va en un solo sentido. Un lint rule (`eslint-plugin-boundaries` o `dependency-cruiser`) lo hace cumplir automáticamente.

---

## 3. La capa de dominio (neutral)

### 3.1 El registry de ejemplos

Un ejemplo no es un componente. Es **metadata + referencia al worker**. Cada theme decide cómo renderizarlo.

```ts
// core/domain/examples/example.model.ts
export type Category =
  | 'understanding' | 'communication'
  | 'management' | 'optimization' | 'advanced';

export interface WorkerExample {
  id: string;                 // '01-setinterval-counter'
  order: number;              // 1..10
  category: Category;
  i18nKey: string;            // clave de traducción del título/desc
  workerFactory?: () => Worker; // el worker real, si aplica
  snippets: Record<string, string>; // tabs de código (component.ts, worker.ts)
}
```

```ts
// core/domain/examples/examples.registry.ts
export const EXAMPLES: WorkerExample[] = [
  {
    id: '01-setinterval-counter',
    order: 1,
    category: 'understanding',
    i18nKey: 'examples.setinterval',
    workerFactory: () =>
      new Worker(new URL('../workers/counter.worker', import.meta.url)),
    snippets: { /* ... */ },
  },
  // ... los 10
];
```

### 3.2 El monitor de hilos

Esta es la pieza más importante para que los 4 themes funcionen sin reescribir lógica. El servicio **emite datos**, no pinta nada. Cada theme dibuja esos datos a su manera (barras diagonales en editorial, celdas duras en brutalist, etc).

```ts
// core/services/thread-monitor.service.ts
export type ThreadState = 'main' | 'worker' | 'blocked' | 'idle';

export interface ThreadSegment {
  startMs: number;
  endMs: number;
  state: ThreadState;
}

export interface ThreadLane {
  id: string;          // 'main' | 'timer' | 'worker'
  label: string;
  segments: ThreadSegment[];
}

@Injectable({ providedIn: 'root' })
export class ThreadMonitorService {
  private readonly _lanes = signal<ThreadLane[]>([]);
  readonly lanes = this._lanes.asReadonly();
  readonly elapsedMs = signal(0);

  push(laneId: string, state: ThreadState) { /* agrega segmento */ }
  reset() { /* ... */ }
}
```

El contrato `ThreadActivity` (las `lanes`) es la **frontera**. Si mañana sumás un theme nuevo, recibís estos mismos datos.

### 3.3 i18n

La app actual usa traducciones caseras. Para 4 themes conviene algo escalable: **Transloco** (signals-friendly, lazy-load de scopes por theme si hiciera falta). El contenido educativo es neutral; solo el *chrome* de cada theme tiene strings propios.

---

## 4. El motor de theming

### 4.1 El contrato `ThemePack`

Un theme es un objeto que dice "acá están mis componentes y mi CSS". Todo lazy.

```ts
// theming/theme.types.ts
export type ThemeId = 'editorial' | 'dev-tool' | 'narrative' | 'brutalist';

export interface ThemePack {
  id: ThemeId;
  label: string;

  // componentes lazy (standalone)
  shell: () => Promise<Type<unknown>>;
  home:  () => Promise<Type<unknown>>;
  exampleLayout: () => Promise<Type<unknown>>;

  // CSS de librería UI a inyectar SOLO cuando este theme está activo
  stylesheets?: string[];     // urls o paths a hojas de estilo globales

  // providers propios del theme (config de su librería UI)
  providers?: Provider[];
}
```

Cada theme implementa también los **primitivos** (botón, card, thread-visualizer, code-block). No van en el ThemePack porque se consumen vía contratos + DI, no vía outlet. Ver §5.

### 4.2 El `ThemeService`

Responsable de tres cosas: cuál es el theme activo (signal), cargar su shell lazy, e inyectar/quitar el CSS global de su librería UI sin que se pisen entre themes.

```ts
// theming/theme.service.ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly registry = inject(THEME_REGISTRY); // Map<ThemeId, ThemePack>
  readonly activeId = signal<ThemeId>('editorial');
  readonly active = computed(() => this.registry.get(this.activeId())!);

  private loadedLinks = new Map<ThemeId, HTMLLinkElement[]>();

  async setTheme(id: ThemeId) {
    const next = this.registry.get(id)!;
    this.injectStylesheets(next);        // carga CSS de la lib del theme
    this.activeId.set(id);
    this.purgeOtherStylesheets(id);      // saca el CSS de los demás
    document.documentElement.dataset['theme'] = id; // para tokens
  }

  private injectStylesheets(pack: ThemePack) { /* crea <link> y los trackea */ }
  private purgeOtherStylesheets(keep: ThemeId) { /* remueve <link> ajenos */ }
}
```

El `data-theme="brutalist"` en `<html>` activa el bloque de tokens correspondiente (ver §6).

### 4.3 El host que monta el shell

```ts
// app.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @if (shell(); as shellCmp) {
      <ng-container *ngComponentOutlet="shellCmp" />
    }
  `,
})
export class App {
  private theme = inject(ThemeService);
  shell = signal<Type<unknown> | null>(null);

  constructor() {
    effect(async () => {
      const pack = this.theme.active();
      this.shell.set(await pack.shell()); // re-monta el shell al cambiar theme
    });
  }
}
```

---

## 5. Primitivos: un contrato, cuatro caras

El `ThreadVisualizer` es estructuralmente distinto en cada theme (mirá los mockups: poster con barras diagonales vs. grilla de celdas dura). No alcanza con CSS. Solución: **contrato + DI por theme**.

```ts
// ui-contracts/thread-visualizer.contract.ts
export abstract class ThreadVisualizerContract {
  abstract lanes: InputSignal<ThreadLane[]>;
  abstract elapsedMs: InputSignal<number>;
}

export const THREAD_VISUALIZER =
  new InjectionToken<Type<ThreadVisualizerContract>>('thread-visualizer');
```

Cada theme provee su implementación:

```ts
// themes/brutalist/brutalist.providers.ts
export const BRUTALIST_PROVIDERS: Provider[] = [
  { provide: THREAD_VISUALIZER, useValue: BrutalistThreadVisualizer },
  { provide: BUTTON,            useValue: BrutalistButton },
  { provide: CODE_BLOCK,        useValue: BrutalistCodeBlock },
];
```

Un componente de layout que quiere mostrar el visualizador lo resuelve por token y lo monta con `ngComponentOutlet`, pasándole los inputs neutrales del servicio. Resultado: **el dato es uno, el render son cuatro**, y agregar un theme nuevo es agregar una implementación más del contrato.

---

## 6. Tokens semánticos: el puente entre dominio y theme

Los primitivos compartidos (los que sí son iguales en estructura) y los visualizadores leen **tokens semánticos**, nunca colores literales. Cada theme rellena los mismos nombres con sus valores.

```scss
// contrato de tokens (mismos nombres en los 4 themes)
:root {
  --surface:        ; --surface-raised: ;
  --ink:            ; --ink-muted:      ;
  --accent:         ;
  --thread-main:    ; --thread-worker:  ;
  --thread-blocked: ; --thread-idle:    ;
  --border:         ; --border-width:   ;
  --radius:         ;
  --font-display:   ; --font-body:      ; --font-mono: ;
}
```

```scss
// themes/brutalist/styles/_tokens.scss
[data-theme='brutalist'] {
  --surface: #dcff1a;   --surface-raised: #fff;
  --ink: #000;          --ink-muted: #333;
  --accent: #ff3b3b;
  --thread-main: #000;  --thread-worker: #000;
  --thread-blocked: #ff3b3b; --thread-idle: rgba(0,0,0,.15);
  --border: #000;       --border-width: 3px;
  --radius: 0;
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono: 'Space Mono', monospace;
}
```

```scss
// themes/editorial/styles/_tokens.scss
[data-theme='editorial'] {
  --surface: #f2efe6;   --surface-raised: #fff;
  --ink: #15130d;       --ink-muted: #3d3a30;
  --accent: #e63924;
  --thread-main: #4f6ef7; --thread-worker: #34c992;
  --thread-blocked: #e63924; --thread-idle: rgba(0,0,0,.08);
  --border: rgba(0,0,0,.1); --border-width: 0.5px;
  --radius: 12px;
  --font-display: 'Archivo', sans-serif;
  --font-body: 'Archivo', sans-serif;
}
```

Esto es lo que evita reescribir cuatro veces lo que sí se puede compartir.

---

## 7. Aislar 4 librerías UI sin que se pisen

Este es el punto delicado de tu pedido. Tres mecanismos combinados:

**a) Cascade layers.** El CSS de cada theme va en su propia capa. Garantiza orden de cascada predecible y que un theme inactivo no gane especificidad.

```scss
// themes/dev-tool/styles/_theme.scss
@layer theme-dev-tool {
  /* estilos del shell, primitivos, etc. */
}
```

**b) CSS global lazy.** El CSS pesado de una librería (Material, PrimeNG, Taiga) se inyecta como `<link>` solo cuando ese theme se activa, y se remueve al salir (lo hace el `ThemeService`, §4.2). Así nunca hay dos full theme stylesheets vivos a la vez.

**c) Scoping bajo `[data-theme]`.** Cuando la librería trae CSS global inevitable, se la namespacea bajo el atributo del theme (con la API de theming de la librería, o `@scope`, o prefijado en build). El theme activo es el único cuyo `[data-theme]` matchea `<html>`.

**d) Encapsulación de componentes.** Los componentes Angular usan `ViewEncapsulation.Emulated` (default), así sus estilos no se escapan. El riesgo es solo el CSS *global* de librerías, que ya cubren a/b/c.

---

## 8. Stack sugerido por theme

Compartido por todos: Angular 22 (signals, zoneless, standalone), Transloco (i18n), highlight.js (código), `@fontsource/*` para fuentes self-hosted, Vitest.

| Theme | Librería UI | Animación / extra | Fuentes |
|---|---|---|---|
| `editorial` | Tailwind CSS (utilitario) + `@angular/cdk` | GSAP (composición poster, scroll) | Archivo |
| `dev-tool` | spartan-ng (shadcn-style) + `@angular/cdk` | CDK Overlay para command palette (⌘K); Monaco opcional | JetBrains Mono |
| `narrative` | Taiga UI **o** PrimeNG | IntersectionObserver para scrollytelling; `@angular/cdk/scrolling` | Fraunces + Inter |
| `brutalist` | sin librería (SCSS puro) | CSS keyframes nativo | Space Grotesk + Space Mono |

La tabla es deliberadamente heterogénea para probar que la arquitectura aguanta librerías distintas. Si querés bajar complejidad, podés unificar dev-tool y narrative bajo una sola librería; la arquitectura no cambia.

### package.json (mapa de dependencias)

```jsonc
{
  "dependencies": {
    "@angular/core": "^21",
    "@angular/cdk": "^21",
    "@ngneat/transloco": "^6",
    "highlight.js": "^11",
    "@fontsource/archivo": "^5",
    "@fontsource/jetbrains-mono": "^5",
    "@fontsource/fraunces": "^5",
    "@fontsource/inter": "^5",
    "@fontsource/space-grotesk": "^5",
    "@fontsource/space-mono": "^5",
    "gsap": "^3",                    // theme editorial
    "tailwindcss": "^4",            // theme editorial
    "@spartan-ng/ui-core": "latest",// theme dev-tool
    "@taiga-ui/core": "^4"          // theme narrative (o primeng)
  }
}
```

Las dependencias específicas de un theme se importan **solo** dentro de `themes/<id>/`, así el tree-shaking las deja fuera de los chunks de los otros themes.

---

## 9. Rutas theme-aware

El theme vive en la URL: deep-linkear a un diseño concreto y refrescar mantiene la elección.

```ts
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'editorial', pathMatch: 'full' },
  {
    path: ':theme',
    canActivate: [themeGuard],        // valida y setea el ThemeService
    children: [
      { path: '', loadComponent: homeFromActiveTheme },
      { path: 'example/:id', loadComponent: layoutFromActiveTheme },
    ],
  },
];
```

`/dev-tool/example/01-setinterval-counter` abre el ejemplo 1 con la piel de IDE. Cambiar el selector de theme reescribe el segmento `:theme` y reusa el mismo estado.

---

## 10. Plan de implementación (orden sugerido para Claude Desktop)

1. **Andamiaje.** Angular 22 zoneless, Transloco, estructura de carpetas, lint de boundaries (`core` no importa `themes`).
2. **Dominio primero.** Migrar los 10 workers reales + `examples.registry` + `ThreadMonitorService` + `ExampleRunnerService`. Sin UI todavía: testear con Vitest que un worker emite ticks y el monitor los registra.
3. **Contrato de tokens.** Definir los nombres semánticos y un theme "skeleton" gris que los rellene, para validar el puente.
4. **Motor de theming.** `ThemePack`, `ThemeService` (con inyección/purga de CSS), host con `ngComponentOutlet`, guard de ruta.
5. **Theme 1 completo (brutalist).** Es el más simple (sin librería) → valida el pipeline punta a punta: shell, home, example-layout, los 4 primitivos, su `ThreadVisualizer`.
6. **Theme 2 con librería (dev-tool + spartan/CDK).** Primer test real de aislamiento de CSS y command palette.
7. **Themes 3 y 4.** Una vez que dos themes conviven limpios, los otros dos son repetición del patrón.
8. **Selector de theme** en el chrome + persistencia (URL + `localStorage`).
9. **Pulido de switching en vivo:** confirmar que cambiar de theme con un worker corriendo no reinicia el estado.

---

## 11. Riesgos y cómo mitigarlos

- **CSS de librerías que se filtra entre themes** → cascade layers + lazy `<link>` + scoping bajo `[data-theme]` (§7). Si una librería es muy invasiva, aislarla detrás de su propio Custom Element / iframe es el último recurso.
- **Peso del bundle** → cada theme es un chunk lazy; sus dependencias no entran en los demás. Medir con `source-map-explorer`.
- **Duplicar lógica sin querer** → si te encontrás copiando algo de un theme a otro que no es CSS, probablemente pertenece a `core/` o a un primitivo compartido por tokens.
- **FOUC al cambiar theme** → precargar las fuentes self-hosted y aplicar `data-theme` antes de montar el shell.
- **Escala a futuro (4→N themes o builds separados)** → migrar a Nx con `libs/core` compartido y `apps/<theme>`. La frontera dominio/presentación que ya tenés hace que ese salto sea mecánico.

---

## TL;DR para pasarle a Claude Desktop

Construí una app Angular 22 única donde: (1) un núcleo neutral contiene los workers, el registry de ejemplos y el `ThreadMonitorService` con estado en signals root; (2) un motor de theming carga themes lazy y swapea el CSS de su librería UI sin pisarse, usando cascade layers + `[data-theme]`; (3) cuatro themes implementan shell, layouts y primitivos vía contratos + DI, leyendo tokens semánticos; (4) el theme vive en la ruta y se puede cambiar en runtime sin reiniciar el estado. Empezá por el dominio, después el theme brutalist (sin librería), después uno con librería para validar el aislamiento, y replicá.