# Mastering Web Workers

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🌐 Este README também está disponível em outros idiomas:**
> [English](../README.md) | [Español](README.es.md)

Plataforma educacional interativa sobre **Web Workers** construída com **Angular 22**. Inclui **16 exemplos progressivos** com demos ao vivo e visualização real de threads, suporte multilíngue (ES/EN/PT) e **5 temas visuais intercambiáveis** — o mesmo domínio neutro renderizado de cinco formas diferentes.

**▶ Demo ao vivo: [damiansire.github.io/web-worker-patterns](https://damiansire.github.io/web-worker-patterns/)**

## Quick Start

```bash
git clone https://github.com/damiansire/web-worker-patterns.git
cd web-worker-patterns
npm run dev
```

`npm run dev` verifica Node.js (≥18) e npm (≥9), instala dependências se necessário e inicia o servidor em `http://localhost:4200`.

Alternativas:
- **Só iniciar** (se já fez `npm install`): `npm start`
- **Windows:** duplo clique em `scripts/start/start.bat` ou em um terminal: `npm run dev`
- **macOS/Linux:** em um terminal: `./scripts/start/start.sh` ou `npm run dev`

Abra `http://localhost:4200` no navegador.

## Exemplos incluídos

Os 16 exemplos são organizados em 5 categorias por conceito. O agrupamento reflete `src/app/core/domain/examples/examples.registry.ts` — a única fonte da verdade.

### Entender

| # | Exemplo | Descrição |
|---|---------|-----------|
| 01 | **Contador com setInterval** | Como funcionam `setInterval` e o event loop — a base antes dos workers. |
| 02 | **A thread principal e o event loop** | Uma única thread roda JS, layout, paint e eventos; uma tarefa de 50 ms congela tudo. |
| 16 | **Compositor vs main** | A thread compositora mantém animações de `transform`/`opacity` fluidas mesmo com a main congelada. |

### Comunicação

| # | Exemplo | Descrição |
|---|---------|-----------|
| 03 | **Comunicação básica** | O "Olá Mundo" dos workers — `postMessage` nos dois sentidos. |
| 08 | **SharedWorker** | Uma única instância compartilhada entre abas/painéis, todos vendo o mesmo estado. |

### Otimização

| # | Exemplo | Descrição |
|---|---------|-----------|
| 04 | **Descarregar trabalho pesado** | Contar primos em um worker para manter a UI fluida — a diferença é sentida lado a lado. |
| 07 | **Objetos transferíveis** | Passar um `ArrayBuffer` sem cópia (zero-copy); o buffer do emissor fica *detached*. |
| 10 | **Worker pool** | Um pool fixo de N workers drena uma fila de tarefas (4 workers, 24 tarefas). |
| 14 | **OffscreenCanvas** | Um worker é dono do canvas e o anima — fluido mesmo com a main bloqueada. |
| 15 | **O custo de clonar** | Medir o round-trip *real* do structured clone à medida que tamanho e complexidade crescem. |

### Gestão

| # | Exemplo | Descrição |
|---|---------|-----------|
| 05 | **Tratamento de erros** | Um erro em um worker não quebra a página; a thread principal o captura. |
| 06 | **Ciclo de vida e terminação** | Criar, rodar e `terminate()` — o passo em curso é perdido e o worker não é reutilizado. |
| 09 | **Limites do paralelismo** | `navigator.hardwareConcurrency` limita o paralelismo real; além disso, os workers compartilham núcleos. |

### Avançado

| # | Exemplo | Descrição |
|---|---------|-----------|
| 11 | **Backpressure** | Controle de fluxo com créditos e acks para que a fila do worker não cresça sem limite. |
| 12 | **SharedArrayBuffer** | Main e worker compartilham a *mesma* memória; `Atomics` escreve/lê sem `postMessage`. |
| 13 | **Degradação graciosa** | Detectar `typeof Worker` e cair para a thread principal quando não estiver disponível. |

## Temas visuais

O mesmo domínio é vestido por **5 temas independentes**, alternáveis ao vivo pela UI:

**Brutalist** · **Full Brutalist** · **Dev Tool** · **Editorial** · **Narrative**

Cada tema fornece seu próprio shell, home, layout de exemplo, primitivos de UI e um visualizador de threads personalizado — sem que o domínio jamais saiba que um tema existe.

## Arquitetura do projeto

A regra de ouro: **o domínio é escrito uma vez; a apresentação é escrita cinco vezes.** `core/` é neutro e **nunca** importa de `themes/`. O raciocínio completo está em [`ARQUITECTURA-multi-theme.md`](../ARQUITECTURA-multi-theme.md).

```
src/app/
├── core/                       # Domínio neutro — não conhece os themes
│   ├── domain/
│   │   ├── workers/            # Web Workers reais + *.logic.ts puro (com testes)
│   │   └── examples/           # examples.registry.ts (fonte da verdade) + snippets
│   ├── services/               # Serviços de demo por exemplo (baseados em signals)
│   ├── i18n/                   # Loader do Transloco
│   ├── styles/                 # SCSS compartilhado (_buttons, _containers, _example-layout)
│   └── utils/                  # Helpers (code-snippet.helper)
├── theming/                    # Registry de themes, service, guard, contrato de tokens
├── ui-contracts/               # Interfaces que todo primitivo de theme deve cumprir
├── ui-primitives/              # Primitivos agnósticos ao theme (charts, seletor de idioma)
├── themes/                     # Apresentação — uma pasta por theme
│   ├── brutalist/  full-brutalist/  dev-tool/  editorial/  narrative/
│   │   ├── shell/  home/  example-layout/  primitives/  styles/
├── app.routes.ts              # Rotas geradas a partir do registry de exemplos
└── app.ts                     # Componente raiz

public/i18n/                    # en.json · es.json · pt.json (UI + conteúdo por exemplo)
```

### Adicionar um novo exemplo

Um novo exemplo é **uma definição de domínio neutra** renderizada pelos 5 themes. O pipeline completo está codificado no comando `/migrate-example` (`.claude/commands/migrate-example.md`). Em resumo:

1. Adicionar o worker em `core/domain/workers/` (+ um `*.logic.ts` puro com teste) e seus snippets em `core/domain/examples/snippets/`.
2. Registrá-lo em `core/domain/examples/examples.registry.ts` (`id`, `order`, `category`, `demo`, `workerFactory`).
3. Adicionar o conteúdo educacional (título, resumo, takeaways) a `public/i18n/{en,es,pt}.json`.
4. Conectar a visualização do demo no `@case` do layout de cada theme.

As rotas, a navegação e a home se atualizam sozinhas a partir do registry.

## Stack tecnológica

- **Angular 22** — Componentes standalone, Signals, change detection zoneless (opt-in via `provideZonelessChangeDetection()`), build com esbuild
- **TypeScript 6.0.3**
- **SCSS** — Tokens de design semânticos (`--surface`, `--ink`, `--accent`, `--thread-*`) por theme
- **@jsverse/transloco** — i18n em runtime (ES/EN/PT)
- **highlight.js** — Realce de sintaxe nos blocos de código
- **Vitest** — Testes unitários (111 testes: 29 sobre a lógica pura do domínio, o resto sobre serviços e temas)
- **dependency-cruiser** — Faz cumprir o limite `core/ ⇏ themes/`
- **Web Workers API** — Dedicated Workers, SharedWorker, Transferable Objects, SharedArrayBuffer + Atomics, OffscreenCanvas

Este projeto usa o suporte a workers integrado do Angular (`@angular/build` / esbuild). Outros setups usam [worker-plugin](https://github.com/GoogleChromeLabs/worker-plugin) (webpack), [rollup-plugin-off-main-thread](https://github.com/surma/rollup-plugin-off-main-thread) ou o suporte nativo do Parcel.

## Versão do Angular

Este projeto tem como alvo **Angular 22** com `@angular/build` e um `webWorkerTsConfig` dedicado para os bundles de workers.

Se você está atualizando de uma versão maior anterior, use a ferramenta de atualização do Angular e siga o guia oficial:

```bash
ng update @angular/core @angular/cli
```

Depois:

- **Zoneless (opt-in)**: Angular não é zoneless por padrão; este app o habilita com `provideZonelessChangeDetection()` em `app.config.ts` (por isso não inclui zone.js nos polyfills). Ele se apoia em Signals e `computed()` para a detecção de mudanças.
- **Testes**: `tsconfig.spec.json` exclui `**/*.worker.ts`, então os arquivos de worker não são compilados com o tipo `Window` do DOM.
- **Build**: `@angular/build` é o builder padrão e empacota o app com esbuild.

## Scripts disponíveis

```bash
npm run dev            # Verifica Node/npm, instala deps se necessário e inicia o servidor
npm start              # Dev server em localhost:4200 (requer npm install prévio)
npm run build          # Build de produção
npm test               # Testes unitários (Vitest)
npm run format         # Formata o código com Prettier
npm run format:check   # Verifica o formato sem escrever (gate de CI)
npm run lint:boundaries# Faz cumprir a regra de ouro (core/ ⇏ themes/)
```

Os gates de qualidade (build, formato, testes, boundaries) rodam em cada push/PR via [CI](../.github/workflows/ci.yml) e como git pre-commit local — independente do editor. Veja [`AGENTS.md`](../AGENTS.md) e [`docs/AI-PROCESS.md`](AI-PROCESS.md).

## Suporte multilíngue

A aplicação suporta inglês, espanhol e português via [Transloco](https://jsverse.github.io/transloco/). As traduções vivem em:

- `public/i18n/en.json` · `public/i18n/es.json` · `public/i18n/pt.json` — texto de UI **e** o conteúdo educacional de cada exemplo

Troque de idioma pelo seletor no shell de cada theme.

## Documentação

- [Guia do Docker](../DOCKER.md) — Rodar o projeto com Docker
- [Guia do Docker (ES)](DOCKER.es.md) | [Guia do Docker (PT)](DOCKER.pt.md)
- [Arquitetura multi-theme](../ARQUITECTURA-multi-theme.md) — A fonte da verdade do design
- [Processo de IA](AI-PROCESS.md) — Gates, loop de design-review, tooling

## Licença

MIT
