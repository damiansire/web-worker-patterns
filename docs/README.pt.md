# Mastering Web Workers

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🌐 Este README também está disponível em outros idiomas:**
> [English](../README.md) | [Español](README.es.md)

Plataforma educacional interativa sobre **Web Workers** construída com Angular 19. Inclui 10 exemplos progressivos com demos ao vivo, visualização de threads, suporte multilíngue (ES/EN/PT) e um tema visual cyberpunk.

## Quick Start

```bash
git clone https://github.com/damiansire/web-worker-patterns.git
cd web-worker-patterns
npm install
npm start
```

Abra `http://localhost:4200` no seu navegador.

## Exemplos incluídos

A aplicação organiza os exemplos em 5 categorias por nível de complexidade:

### Fundamentos

| # | Exemplo | Descrição |
|---|---------|-----------|
| 01 | **Contador com setInterval** | Como funciona o event loop e por que o setInterval é executado na thread principal. |
| 02 | **Main Thread Blocking** | Demonstra o bloqueio da UI ao executar cálculos pesados na thread principal. |

### Comunicação

| # | Exemplo | Descrição |
|---|---------|-----------|
| 03 | **Basic Communication** | Primeiros passos: enviar e receber mensagens entre a thread principal e um Worker. |
| 04 | **Offloading Computation** | Mover cálculos pesados para um Worker para manter a UI fluida. |

### Gestão

| # | Exemplo | Descrição |
|---|---------|-----------|
| 05 | **Error Handling** | Capturar e tratar erros que ocorrem dentro dos Workers. |
| 06 | **Lifecycle & Termination** | Criar, executar e encerrar Workers de forma controlada. |

### Otimização

| # | Exemplo | Descrição |
|---|---------|-----------|
| 07 | **Transferable Objects** | Transferir dados na memória sem copiá-los usando `ArrayBuffer`. |

### Avançado

| # | Exemplo | Descrição |
|---|---------|-----------|
| 08 | **Shared Worker** | Compartilhar um Worker entre múltiplas abas do navegador. |
| 09 | **Worker Limits** | Descobrir os limites de hardware e quantos Workers o navegador suporta. |
| 10 | **Worker Pool** | Padrão de pool: gerenciar um conjunto fixo de Workers com uma fila de tarefas. |

## Arquitetura do projeto

```
src/app/
├── core/
│   ├── components/          # Componentes reutilizáveis (InfoBox, CodeSection, LogPanel, etc.)
│   ├── layout/              # Header, Sidebar, Footer
│   ├── models/              # ExampleManifest, tipos compartilhados
│   ├── services/            # LanguageService, NavigationService
│   ├── styles/              # SCSS compartilhados (_buttons, _containers, _shared)
│   ├── translations/        # Traduções UI + conteúdo por exemplo
│   └── utils/               # Helpers (code-snippet.helper)
├── examples/
│   ├── 01-setinterval-counter/
│   │   ├── manifest.ts                        # Metadata declarativa do exemplo
│   │   ├── setinterval-counter.component.ts   # Lógica do componente
│   │   ├── setinterval-counter.component.html # Template
│   │   ├── setinterval-counter.component.scss # Estilos
│   │   └── setinterval-counter.snippets.ts    # Code snippets para visualização
│   ├── 02-main-thread/
│   ├── ...
│   └── examples.registry.ts  # Registro central de todos os exemplos
├── home/                      # Página inicial com cards de exemplo
├── app.routes.ts              # Rotas geradas dinamicamente a partir do registro
└── app.ts                     # Componente raiz
```

### Adicionar um novo exemplo

1. Criar uma pasta em `src/app/examples/` (ex: `11-meu-exemplo/`)
2. Criar `manifest.ts` com os metadados do exemplo (id, categoria, traduções, `loadComponent`)
3. Criar o componente, template, estilos e arquivo de snippets
4. Importar o `MANIFEST` em `examples.registry.ts` e adicioná-lo ao array

As rotas, a navegação do sidebar e a página inicial são atualizadas automaticamente.

## Stack técnico

- **Angular 19** — Standalone Components, Signals
- **SCSS** — Design tokens, tema cyberpunk com variáveis CSS
- **highlight.js** — Syntax highlighting para os blocos de código
- **Web Workers API** — Dedicated Workers, Shared Workers, Transferable Objects

## Scripts disponíveis

```bash
npm start       # Servidor de desenvolvimento em localhost:4200
npm run build   # Build de produção
npm test        # Testes unitários
```

## Suporte multilíngue

A aplicação suporta Inglês, Espanhol e Português. As traduções são gerenciadas em:

- `src/app/core/translations/translations.ts` — Textos de UI (sidebar, header, home)
- `src/app/core/translations/examples/*.content.ts` — Conteúdo educacional por exemplo

O idioma é alterado a partir do seletor no sidebar.

## Documentação

- [Guia do Docker](../DOCKER.md) — Executar o projeto com Docker
- [Guia do Docker (ES)](DOCKER.es.md) | [Guia do Docker (PT)](DOCKER.pt.md)

## Licença

MIT
