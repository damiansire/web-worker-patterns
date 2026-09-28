# Guía de Docker para Web Worker Patterns

Esta guía explica en detalle cómo usar Docker para ejecutar este proyecto.

> **🌐 Esta guía también está disponible en otros idiomas:**
> [English](../DOCKER.md) | [Português](DOCKER.pt.md)

## Tabla de contenidos

- [¿Por qué Docker?](#por-qué-docker)
- [Instalación de Docker](#instalación-de-docker)
- [Uso rápido](#uso-rápido)
- [Troubleshooting](#troubleshooting)
- [Comandos útiles](#comandos-útiles)

## ¿Por qué Docker?

Docker da:

- **Configuración cero**: no hace falta instalar Python, Node.js, PHP ni ningún servidor web.
- **Portabilidad**: funciona igual en macOS, Windows y Linux.
- **Aislamiento**: no interfiere con otros servicios de tu sistema.
- **Reproducibilidad**: todos usan exactamente el mismo entorno.
- **Como en producción**: sirve la app Angular ya construida (multi-stage build), sin necesitar Node en el host.

## Instalación de Docker

### macOS

1. Descargá Docker Desktop: https://www.docker.com/products/docker-desktop
2. Abrí el archivo `.dmg` descargado.
3. Arrastrá Docker a tu carpeta de Aplicaciones.
4. Abrí Docker desde Aplicaciones.
5. Esperá a que aparezca el ícono de Docker en la barra de menú.

### Windows

1. Descargá Docker Desktop: https://www.docker.com/products/docker-desktop
2. Ejecutá el instalador.
3. Seguí las instrucciones (puede pedir reiniciar).
4. Abrí Docker Desktop desde el menú de inicio.
5. Esperá a que aparezca el ícono de Docker en la bandeja del sistema.

**Nota para Windows**: necesitás WSL 2 (Windows Subsystem for Linux) instalado.

### Linux (Ubuntu/Debian)

```bash
# Actualizar paquetes
sudo apt-get update

# Instalar dependencias
sudo apt-get install ca-certificates curl gnupg lsb-release

# Agregar la clave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar el repositorio
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalación
docker --version
```

## Uso rápido

Docker construye la app Angular y la sirve con nginx (sin Node.js en el host). Después de cambiar código, hay que reconstruir la imagen.

```bash
# 1. Verificar que Docker está corriendo
docker ps

# 2. Construir y levantar
docker-compose up -d --build

# 3. Abrir en el navegador
# http://localhost:9000
```

Para desarrollo local con hot-reload, usá `npm start` o los scripts de `scripts/start/` (ver README).

## Troubleshooting

### "Cannot connect to the Docker daemon"

**Problema**: Docker no está corriendo.

**Solución**:

**macOS:**

```bash
open -a Docker
# Esperá 10-30 segundos
docker ps
```

**Windows:**

- Buscá "Docker Desktop" en el menú de inicio.
- Hacé clic para iniciarlo.
- Esperá a que aparezca el ícono en la bandeja del sistema.

**Linux:**

```bash
sudo systemctl start docker
```

### "Port is already allocated"

**Problema**: el puerto está siendo usado por otro servicio.

**Solución 1** - Parar los contenedores existentes:

```bash
docker-compose down
docker-compose up -d
```

**Solución 2** - Ver qué está usando el puerto:

```bash
# macOS/Linux
lsof -i :9000

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 9000).OwningProcess
```

**Solución 3** - Cambiar el puerto en `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Usar el puerto 8080
  # o cualquier otro puerto disponible
```

Después reiniciar:

```bash
docker-compose down
docker-compose up -d
```

### "Error response from daemon: Conflict"

**Problema**: ya existe un contenedor con el mismo nombre.

**Solución**:

```bash
# Parar y eliminar el contenedor existente
docker-compose down

# Recrear
docker-compose up -d
```

### Los cambios no se reflejan en el navegador

**Solución**:

```bash
# 1. Limpiar la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

# 2. O reconstruir el contenedor (no hay hot-reload en Docker, ver Tips más abajo)
docker-compose up -d --build
```

### Permiso denegado en Linux

**Problema**: `permission denied while trying to connect to the Docker daemon socket`.

**Solución**:

```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a entrar
# O ejecutar:
newgrp docker

# Verificar
docker ps
```

## Comandos útiles

### Ver el estado del contenedor

```bash
# Listar contenedores activos
docker ps

# Ver todos los contenedores (incluidos los detenidos)
docker ps -a

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f web-worker-patterns
```

### Gestión del contenedor

```bash
# Iniciar
docker-compose up -d

# Detener
docker-compose down

# Reiniciar
docker-compose restart

# Reconstruir (después de cambios en el Dockerfile o en el código)
docker-compose up -d --build

# Detener sin eliminar
docker-compose stop

# Volver a iniciar
docker-compose start
```

### Ver información

```bash
# Ver estadísticas de recursos
docker stats

# Inspeccionar el contenedor
docker inspect web-worker-patterns

# Ver el estado de salud
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Acceder al contenedor

```bash
# Abrir una shell dentro del contenedor
docker exec -it web-worker-patterns sh

# Ver archivos dentro del contenedor
docker exec web-worker-patterns ls -la /usr/share/nginx/html

# Ver la configuración de nginx
docker exec web-worker-patterns cat /etc/nginx/conf.d/default.conf
```

### Limpieza

```bash
# Eliminar el contenedor y sus volúmenes
docker-compose down -v

# Limpiar imágenes sin usar
docker image prune

# Limpiar todo (contenedores, redes, imágenes, volúmenes)
docker system prune -a --volumes
```

## Arquitectura del proyecto

```
┌──────────────────┐
│   Navegador      │  http://localhost:9000
│  (Tu máquina)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Docker Host    │  Puerto 9000 → Puerto 80
│  (Tu máquina)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Contenedor     │  Nginx Alpine
│   web-worker-    │  - Sirve la app Angular ya construida
│   patterns       │  - Routing de SPA (try_files)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  App construida  │  Viene en la imagen (dist/ del stage de build)
│  /usr/share/     │  Reconstruir con --build después de cambios
│  nginx/html/     │
└──────────────────┘
```

## Archivos de configuración

### `Dockerfile`

Build multi-stage:

- **Stage 1 (build)**: Node 20 corre `npm ci` y `npm run build` para producir la app Angular en `dist/`.
- **Stage 2 (serve)**: nginx:alpine sirve solo los archivos estáticos construidos, desde `dist/web-worker-patterns/browser/`.
- Nginx queda configurado para routing de SPA (`try_files` hacia `index.html`).

### `docker-compose.yml`

Define el servicio:

- Puertos (`9000:80` por defecto; se puede cambiar).
- Sin volumen: la imagen contiene la app ya construida; correr `docker-compose up -d --build` después de cambiar código.
- Healthcheck y nombre del contenedor.

### `.dockerignore`

Archivos que NO se copian al contenedor:

- .git
- node_modules
- Scripts de desarrollo

## Tips y buenas prácticas

### Desarrollo

- **No hay hot-reload en Docker**: la imagen sirve una foto ya construida de la app. Para recarga en vivo, usá `npm start` o los scripts de `scripts/start/` en el host.
- **Reconstruí después de cambios**: `docker-compose up -d --build`.
- **Revisá los logs**: `docker-compose logs -f` es tu amigo.

### Producción

Para producción, considerá:

- Usar una imagen más robusta (nginx:stable).
- Configurar SSL/TLS.
- Optimizar la caché.
- Agregar compresión gzip.

### Performance

El contenedor usa:

- Nginx Alpine (solo ~5MB).
- Configuración de caché optimizada.

### Cabeceras de seguridad

La configuración de nginx (`nginx.conf`) emite, en cada respuesta:

- `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`: estas dos dejan al documento **cross-origin isolated** (`crossOriginIsolated === true`), que es el requisito real de `SharedArrayBuffer` / `Atomics`. La demo de memoria compartida (ejemplo 12) solo toma el camino real cuando esto es cierto; si no, cae al backend simulado.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- Una `Content-Security-Policy` restrictiva (`default-src 'self'`, `worker-src 'self' blob:`, `object-src 'none'`, `frame-ancestors 'none'`).

Podés verificarlas en un contenedor corriendo con `curl -I http://localhost:9000`.

## Preguntas frecuentes

### ¿Necesito saber Docker para usar esto?

No mucho: con los dos comandos de [Uso rápido](#uso-rápido) (`docker-compose up -d --build` y abrir `http://localhost:9000`) alcanza. No hay un script separado que levante Docker por vos; `scripts/start/` inicia el servidor de desarrollo local (`npm start`), no el contenedor.

### ¿Puedo cambiar el puerto?

Sí. Editá `docker-compose.yml` y cambiá `"9000:80"` por `"TU_PUERTO:80"`, después corré `docker-compose down && docker-compose up -d`.

### ¿Los cambios se guardan después de detener el contenedor?

Sí. Los archivos están en tu máquina; el contenedor solo los sirve.

### ¿Cuánto espacio ocupa?

- Imagen base (nginx:alpine): ~5MB
- Imagen construida: ~5.5MB
- Contenedor corriendo: ~10MB de RAM

### ¿Puedo usar la interfaz de Docker Desktop?

Sí. Podés gestionar todo desde la interfaz gráfica de Docker Desktop.

---

## ¿Necesitás ayuda?

Si tenés problemas:

1. Revisá esta guía de troubleshooting.
2. Corré `docker-compose logs -f` para ver errores.
3. Verificá que Docker esté corriendo: `docker ps`.
4. Probá reconstruir: `docker-compose up -d --build`.

---

Hecho con cariño para la comunidad de desarrolladores.
