# Guia de Docker para Web Worker Patterns

Este guia explica em detalhes como usar Docker para executar este projeto.

> **🌐 Este guia também está disponível em outros idiomas:**
> [English](../DOCKER.md) | [Español](DOCKER.es.md)

## Índice

- [Por que Docker?](#por-que-docker)
- [Instalação do Docker](#instalação-do-docker)
- [Uso rápido](#uso-rápido)
- [Troubleshooting](#troubleshooting)
- [Comandos úteis](#comandos-úteis)

## Por que Docker?

O Docker oferece:

- **Configuração zero**: não é preciso instalar Python, Node.js, PHP ou qualquer servidor web.
- **Portabilidade**: funciona da mesma forma no macOS, Windows e Linux.
- **Isolamento**: não interfere com outros serviços do seu sistema.
- **Reprodutibilidade**: todos usam exatamente o mesmo ambiente.
- **Igual à produção**: serve a app Angular já construída (multi-stage build), sem precisar de Node no host.

## Instalação do Docker

### macOS

1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop
2. Abra o arquivo `.dmg` baixado.
3. Arraste o Docker para a pasta Aplicativos.
4. Abra o Docker a partir de Aplicativos.
5. Aguarde o ícone do Docker aparecer na barra de menus.

### Windows

1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop
2. Execute o instalador.
3. Siga as instruções (pode exigir reinicialização).
4. Abra o Docker Desktop pelo menu Iniciar.
5. Aguarde o ícone do Docker aparecer na bandeja do sistema.

**Nota para Windows**: você precisa do WSL 2 (Windows Subsystem for Linux) instalado.

### Linux (Ubuntu/Debian)

```bash
# Atualizar pacotes
sudo apt-get update

# Instalar dependências
sudo apt-get install ca-certificates curl gnupg lsb-release

# Adicionar a chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar o repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
```

## Uso rápido

O Docker constrói a app Angular e a serve com nginx (sem Node.js no host). Depois de alterar o código, é preciso reconstruir a imagem.

```bash
# 1. Verificar se o Docker está rodando
docker ps

# 2. Construir e iniciar
docker-compose up -d --build

# 3. Abrir no navegador
# http://localhost:9000
```

Para desenvolvimento local com hot-reload, use `npm start` ou os scripts em `scripts/start/` (veja o README).

## Troubleshooting

### "Cannot connect to the Docker daemon"

**Problema**: o Docker não está rodando.

**Solução**:

**macOS:**

```bash
open -a Docker
# Aguarde 10-30 segundos
docker ps
```

**Windows:**

- Procure "Docker Desktop" no menu Iniciar.
- Clique para iniciá-lo.
- Aguarde o ícone aparecer na bandeja do sistema.

**Linux:**

```bash
sudo systemctl start docker
```

### "Port is already allocated"

**Problema**: a porta está sendo usada por outro serviço.

**Solução 1** - Parar os containers existentes:

```bash
docker-compose down
docker-compose up -d
```

**Solução 2** - Ver o que está usando a porta:

```bash
# macOS/Linux
lsof -i :9000

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 9000).OwningProcess
```

**Solução 3** - Alterar a porta no `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Usar a porta 8080
  # ou qualquer outra porta disponível
```

Depois reiniciar:

```bash
docker-compose down
docker-compose up -d
```

### "Error response from daemon: Conflict"

**Problema**: já existe um container com o mesmo nome.

**Solução**:

```bash
# Parar e remover o container existente
docker-compose down

# Recriar
docker-compose up -d
```

### As alterações não são refletidas no navegador

**Solução**:

```bash
# 1. Limpar o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

# 2. Ou reconstruir o container (não há hot-reload no Docker, veja Dicas abaixo)
docker-compose up -d --build
```

### Permissão negada no Linux

**Problema**: `permission denied while trying to connect to the Docker daemon socket`.

**Solução**:

```bash
# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
# Ou executar:
newgrp docker

# Verificar
docker ps
```

## Comandos úteis

### Ver o status do container

```bash
# Listar containers ativos
docker ps

# Ver todos os containers (incluindo parados)
docker ps -a

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f web-worker-patterns
```

### Gerenciamento do container

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Reconstruir (após alterações no Dockerfile ou no código)
docker-compose up -d --build

# Parar sem remover
docker-compose stop

# Iniciar novamente
docker-compose start
```

### Ver informações

```bash
# Ver estatísticas de recursos
docker stats

# Inspecionar o container
docker inspect web-worker-patterns

# Ver o status de saúde
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Acessar o container

```bash
# Abrir um shell dentro do container
docker exec -it web-worker-patterns sh

# Ver arquivos dentro do container
docker exec web-worker-patterns ls -la /usr/share/nginx/html

# Ver a configuração do nginx
docker exec web-worker-patterns cat /etc/nginx/conf.d/default.conf
```

### Limpeza

```bash
# Remover o container e seus volumes
docker-compose down -v

# Limpar imagens sem uso
docker image prune

# Limpar tudo (containers, redes, imagens, volumes)
docker system prune -a --volumes
```

## Arquitetura do projeto

```
┌──────────────────┐
│   Navegador      │  http://localhost:9000
│  (Sua máquina)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Docker Host    │  Porta 9000 → Porta 80
│  (Sua máquina)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Container      │  Nginx Alpine
│   web-worker-    │  - Serve a app Angular já construída
│   patterns       │  - Roteamento de SPA (try_files)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  App construída  │  Vem na imagem (dist/ do stage de build)
│  /usr/share/     │  Reconstrua com --build após alterações
│  nginx/html/     │
└──────────────────┘
```

## Arquivos de configuração

### `Dockerfile`

Build multi-stage:

- **Stage 1 (build)**: Node 20 executa `npm ci` e `npm run build` para gerar a app Angular em `dist/`.
- **Stage 2 (serve)**: nginx:alpine serve apenas os arquivos estáticos construídos, a partir de `dist/web-worker-patterns/browser/`.
- O Nginx é configurado para roteamento de SPA (`try_files` para `index.html`).

### `docker-compose.yml`

Define o serviço:

- Portas (`9000:80` por padrão; pode ser alterada).
- Sem volume: a imagem contém a app já construída; execute `docker-compose up -d --build` após alterar o código.
- Healthcheck e nome do container.

### `.dockerignore`

Arquivos que NÃO são copiados para o container:

- .git
- node_modules
- Scripts de desenvolvimento

## Dicas e boas práticas

### Desenvolvimento

- **Não há hot-reload no Docker**: a imagem serve um retrato já construído da app. Para recarga em tempo real, use `npm start` ou os scripts em `scripts/start/` no host.
- **Reconstrua após alterações**: `docker-compose up -d --build`.
- **Verifique os logs**: `docker-compose logs -f` é seu amigo.

### Produção

Para produção, considere:

- Usar uma imagem mais robusta (nginx:stable).
- Configurar SSL/TLS.
- Otimizar o cache.
- Adicionar compressão gzip.

### Performance

O container usa:

- Nginx Alpine (apenas ~5MB).
- Configuração de cache otimizada.

### Cabeçalhos de segurança

A configuração do nginx (`nginx.conf`) emite, em cada resposta:

- `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`: essas duas deixam o documento **cross-origin isolated** (`crossOriginIsolated === true`), que é o pré-requisito real de `SharedArrayBuffer` / `Atomics`. A demo de memória compartilhada (exemplo 12) só segue o caminho real quando isso é verdadeiro; caso contrário, cai para o backend simulado.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- Uma `Content-Security-Policy` restritiva (`default-src 'self'`, `worker-src 'self' blob:`, `object-src 'none'`, `frame-ancestors 'none'`).

Você pode verificá-los em um container rodando com `curl -I http://localhost:9000`.

## Perguntas frequentes

### Preciso saber Docker para usar isso?

Não muito: os dois comandos de [Uso rápido](#uso-rápido) (`docker-compose up -d --build` e abrir `http://localhost:9000`) são suficientes. Não existe um script separado que inicie o Docker por você; `scripts/start/` inicia o servidor de desenvolvimento local (`npm start`), não o container.

### Posso alterar a porta?

Sim. Edite `docker-compose.yml` e altere `"9000:80"` para `"SUA_PORTA:80"`, depois execute `docker-compose down && docker-compose up -d`.

### As alterações são salvas após parar o container?

Sim. Os arquivos estão na sua máquina; o container apenas os serve.

### Quanto espaço ocupa?

- Imagem base (nginx:alpine): ~5MB
- Imagem construída: ~5.5MB
- Container rodando: ~10MB de RAM

### Posso usar a interface do Docker Desktop?

Sim. Você pode gerenciar tudo pela interface gráfica do Docker Desktop.

---

## Precisa de ajuda?

Se tiver problemas:

1. Revise este guia de troubleshooting.
2. Execute `docker-compose logs -f` para ver erros.
3. Verifique se o Docker está rodando: `docker ps`.
4. Tente reconstruir: `docker-compose up -d --build`.

---

Feito com carinho para a comunidade de desenvolvedores.
