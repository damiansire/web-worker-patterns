# Guía de Docker para Web Worker Patterns

Esta guía explica en detalle cómo usar Docker para ejecutar este proyecto.

> **🌐 Esta guía también está disponible en otros idiomas:**
> [English](../DOCKER.md) | [Português](DOCKER.pt.md)

## Tabla de Contenidos

- [¿Por qué Docker?](#por-qué-docker)
- [Instalación de Docker](#instalación-de-docker)
- [Uso Rápido](#uso-rápido)
- [Troubleshooting](#troubleshooting)
- [Comandos Útiles](#comandos-útiles)

## ¿Por qué Docker?

Docker proporciona:

- **Configuración cero**: No necesitas instalar Python, Node.js, PHP o ningún servidor web
- **Portabilidad**: Funciona igual en macOS, Windows y Linux
- **Aislamiento**: No interfiere con otros servicios en tu sistema
- **Reproducibilidad**: Todos usan exactamente el mismo entorno
- **Hot-reload**: Los cambios en archivos se reflejan inmediatamente

## Instalación de Docker

### macOS

1. Descarga Docker Desktop: https://www.docker.com/products/docker-desktop
2. Abre el archivo `.dmg` descargado
3. Arrastra Docker a tu carpeta de Aplicaciones
4. Abre Docker desde Aplicaciones
5. Espera a ver el ícono de Docker en la barra de menú

### Windows

1. Descarga Docker Desktop: https://www.docker.com/products/docker-desktop
2. Ejecuta el instalador
3. Sigue las instrucciones (puede requerir reiniciar)
4. Abre Docker Desktop desde el menú inicio
5. Espera a ver el ícono de Docker en la bandeja del sistema

**Nota para Windows**: Necesitas WSL 2 (Windows Subsystem for Linux) instalado.

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

## Uso Rápido

### Opción 1: Scripts Automáticos

El proyecto incluye scripts que verifican y levantan Docker automáticamente:

**macOS/Linux:**

```bash
./start.sh
```

**Windows:**

```bash
start.bat
```

### Opción 2: Comandos Manuales

```bash
# 1. Verificar que Docker está corriendo
docker ps

# 2. Levantar el proyecto
docker-compose up -d

# 3. Abrir en el navegador
# http://localhost:9000
```

## Troubleshooting

### "Cannot connect to the Docker daemon"

**Problema**: Docker no está corriendo.

**Solución**:

**macOS:**

```bash
open -a Docker
# Espera 10-30 segundos
docker ps
```

**Windows:**

- Busca "Docker Desktop" en el menú inicio
- Haz clic para iniciarlo
- Espera a ver el ícono en la bandeja del sistema

**Linux:**

```bash
sudo systemctl start docker
```

### "Port is already allocated"

**Problema**: El puerto está siendo usado por otro servicio.

**Solución 1** - Detener contenedores existentes:

```bash
docker-compose down
docker-compose up -d
```

**Solución 2** - Ver qué está usando el puerto:

```bash
# macOS/Linux
lsof -i :3000

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

**Solución 3** - Cambiar el puerto en `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Usar puerto 8080
  # o cualquier otro puerto disponible
```

Luego reiniciar:

```bash
docker-compose down
docker-compose up -d
```

### "Error response from daemon: Conflict"

**Problema**: Ya existe un contenedor con el mismo nombre.

**Solución**:

```bash
# Detener y eliminar el contenedor existente
docker-compose down

# Volver a crear
docker-compose up -d
```

### Los cambios no se reflejan en el navegador

**Solución**:

```bash
# 1. Limpiar caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

# 2. O reiniciar el contenedor
docker-compose restart
```

### Permiso denegado en Linux

**Problema**: `permission denied while trying to connect to the Docker daemon socket`

**Solución**:

```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciarla
# O ejecutar:
newgrp docker

# Verificar
docker ps
```

## Comandos Útiles

### Ver estado del contenedor

```bash
# Listar contenedores activos
docker ps

# Ver todos los contenedores (incluyendo detenidos)
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

# Reconstruir (después de cambios en Dockerfile)
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

## Arquitectura del Proyecto

```
┌──────────────────┐
│   Navegador      │  http://localhost:9000
│  (Tu máquina)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Docker Host    │  Puerto 3000 → Puerto 80
│   (Tu máquina)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Contenedor     │  Nginx Alpine
│   web-worker-    │
│   patterns       │  - Sirve archivos estáticos
└────────┬─────────┘  - Headers CORS configurados
         │            - Hot-reload habilitado
         ▼
┌──────────────────┐
│  Archivos del    │  Montados desde tu máquina
│  Proyecto        │  /usr/share/nginx/html/
└──────────────────┘
```

## Archivos de Configuración

### `Dockerfile`

Define cómo se construye la imagen:

- Usa nginx:alpine (ligero y rápido)
- Copia archivos del proyecto
- Configura nginx para servir contenido estático

### `docker-compose.yml`

Define el servicio completo:

- Puertos (9000:80 por defecto, puedes cambiarlo)
- Volúmenes (hot-reload)
- Healthcheck
- Nombre del contenedor

### `.dockerignore`

Archivos que NO se copian al contenedor:

- .git
- node_modules
- Scripts de desarrollo

## Tips y Mejores Prácticas

### Desarrollo

- **Hot-reload está habilitado**: Los cambios se reflejan automáticamente
- **Usa el puerto 3000**: Ya está configurado
- **Revisa los logs**: `docker-compose logs -f` es tu amigo

### Producción

Para producción, considera:

- Usar una imagen más robusta (nginx:stable)
- Configurar SSL/TLS
- Optimizar el cache
- Agregar compresión gzip

### Performance

El contenedor usa:

- Nginx Alpine (solo ~5MB)
- Configuración optimizada de cache
- Headers CORS correctos para workers

## Preguntas Frecuentes

### ¿Necesito saber Docker para usar esto?

No. Los scripts automáticos (`start.sh` y `start.bat`) hacen todo por ti.

### ¿Puedo cambiar el puerto?

Sí. Edita `docker-compose.yml` y cambia `"9000:80"` a `"TU_PUERTO:80"`, luego ejecuta `docker-compose down && docker-compose up -d`.

### ¿Los cambios se guardan después de detener el contenedor?

Sí. Los archivos están en tu máquina, el contenedor solo los sirve.

### ¿Cuánto espacio ocupa?

- Imagen base (nginx:alpine): ~5MB
- Imagen construida: ~5.5MB
- Contenedor corriendo: ~10MB RAM

### ¿Puedo usar Docker Desktop UI?

Sí. Puedes gestionar todo desde la interfaz gráfica de Docker Desktop.

---

## ¿Necesitas ayuda?

Si tienes problemas:

1. Revisa esta guía de troubleshooting
2. Ejecuta `docker-compose logs -f` para ver errores
3. Verifica que Docker esté corriendo: `docker ps`
4. Intenta reconstruir: `docker-compose up -d --build`

---

Hecho con ❤️ para la comunidad de desarrolladores.
