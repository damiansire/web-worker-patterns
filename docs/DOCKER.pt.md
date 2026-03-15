# Guia do Docker para Web Worker Patterns

Este guia explica em detalhes como usar Docker para executar este projeto.

> **🌐 Este guia também está disponível em outros idiomas:**
> [English](../DOCKER.md) | [Español](DOCKER.es.md)

## Índice

- [Por que Docker?](#por-que-docker)
- [Instalação do Docker](#instalação-do-docker)
- [Uso Rápido](#uso-rápido)
- [Troubleshooting](#troubleshooting)
- [Comandos Úteis](#comandos-úteis)

## Por que Docker?

Docker oferece:

- **Configuração zero**: Não precisa instalar Python, Node.js, PHP ou nenhum servidor web
- **Portabilidade**: Funciona da mesma forma no macOS, Windows e Linux
- **Isolamento**: Não interfere com outros serviços no seu sistema
- **Reprodutibilidade**: Todos usam exatamente o mesmo ambiente
- **Hot-reload**: As alterações nos arquivos são refletidas imediatamente

## Instalação do Docker

### macOS

1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop
2. Abra o arquivo `.dmg` baixado
3. Arraste o Docker para a pasta Aplicativos
4. Abra o Docker a partir de Aplicativos
5. Aguarde o ícone do Docker aparecer na barra de menus

### Windows

1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop
2. Execute o instalador
3. Siga as instruções (pode exigir reinicialização)
4. Abra o Docker Desktop pelo menu Iniciar
5. Aguarde o ícone do Docker aparecer na bandeja do sistema

**Nota para Windows**: Você precisa do WSL 2 (Windows Subsystem for Linux) instalado.

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

## Uso Rápido

### Opção 1: Scripts Automáticos

O projeto inclui scripts que verificam e iniciam o Docker automaticamente:

**macOS/Linux:**

```bash
./scripts/start/start.sh
```

**Windows:**

```bash
scripts\start\start.bat
```

### Opção 2: Comandos Manuais

```bash
# 1. Verificar se o Docker está rodando
docker ps

# 2. Iniciar o projeto
docker-compose up -d

# 3. Abrir no navegador
# http://localhost:9000
```

## Troubleshooting

### "Cannot connect to the Docker daemon"

**Problema**: Docker não está rodando.

**Solução**:

**macOS:**

```bash
open -a Docker
# Aguarde 10-30 segundos
docker ps
```

**Windows:**

- Procure "Docker Desktop" no menu Iniciar
- Clique para iniciá-lo
- Aguarde o ícone aparecer na bandeja do sistema

**Linux:**

```bash
sudo systemctl start docker
```

### "Port is already allocated"

**Problema**: A porta está sendo usada por outro serviço.

**Solução 1** - Parar containers existentes:

```bash
docker-compose down
docker-compose up -d
```

**Solução 2** - Ver o que está usando a porta:

```bash
# macOS/Linux
lsof -i :3000

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

**Solução 3** - Alterar a porta no `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Usar porta 8080
  # ou qualquer outra porta disponível
```

Depois reiniciar:

```bash
docker-compose down
docker-compose up -d
```

### "Error response from daemon: Conflict"

**Problema**: Já existe um container com o mesmo nome.

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
# 1. Limpar cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

# 2. Ou reiniciar o container
docker-compose restart
```

### Permissão negada no Linux

**Problema**: `permission denied while trying to connect to the Docker daemon socket`

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

## Comandos Úteis

### Ver status do container

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

# Reconstruir (após alterações no Dockerfile)
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

## Arquitetura do Projeto

```
┌──────────────────┐
│   Navegador      │  http://localhost:9000
│  (Sua máquina)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Docker Host    │  Porta 3000 → Porta 80
│  (Sua máquina)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Container      │  Nginx Alpine
│   web-worker-    │
│   patterns       │  - Serve arquivos estáticos
└────────┬─────────┘  - Headers CORS configurados
         │            - Hot-reload habilitado
         ▼
┌──────────────────┐
│  Arquivos do     │  Montados da sua máquina
│  Projeto         │  /usr/share/nginx/html/
└──────────────────┘
```

## Arquivos de Configuração

### `Dockerfile`

Define como a imagem é construída:

- Usa nginx:alpine (leve e rápido)
- Copia arquivos do projeto
- Configura nginx para servir conteúdo estático

### `docker-compose.yml`

Define o serviço completo:

- Portas (9000:80 por padrão, você pode alterar)
- Volumes (hot-reload)
- Healthcheck
- Nome do container

### `.dockerignore`

Arquivos que NÃO são copiados para o container:

- .git
- node_modules
- Scripts de desenvolvimento

## Dicas e Melhores Práticas

### Desenvolvimento

- **Hot-reload está habilitado**: As alterações são refletidas automaticamente
- **Use a porta 3000**: Já está configurada
- **Verifique os logs**: `docker-compose logs -f` é seu amigo

### Produção

Para produção, considere:

- Usar uma imagem mais robusta (nginx:stable)
- Configurar SSL/TLS
- Otimizar o cache
- Adicionar compressão gzip

### Performance

O container usa:

- Nginx Alpine (apenas ~5MB)
- Configuração otimizada de cache
- Headers CORS corretos para workers

## Perguntas Frequentes

### Preciso saber Docker para usar isso?

Não. Os scripts automáticos em `scripts/start/` fazem tudo por você.

### Posso alterar a porta?

Sim. Edite `docker-compose.yml` e altere `"9000:80"` para `"SUA_PORTA:80"`, depois execute `docker-compose down && docker-compose up -d`.

### As alterações são salvas após parar o container?

Sim. Os arquivos estão na sua máquina, o container apenas os serve.

### Quanto espaço ocupa?

- Imagem base (nginx:alpine): ~5MB
- Imagem construída: ~5.5MB
- Container rodando: ~10MB RAM

### Posso usar a UI do Docker Desktop?

Sim. Você pode gerenciar tudo pela interface gráfica do Docker Desktop.

---

## Precisa de ajuda?

Se tiver problemas:

1. Revise este guia de troubleshooting
2. Execute `docker-compose logs -f` para ver erros
3. Verifique se o Docker está rodando: `docker ps`
4. Tente reconstruir: `docker-compose up -d --build`

---

Feito com amor para a comunidade de desenvolvedores.
