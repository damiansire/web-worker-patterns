# 🚀 Patrones de Web Workers

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)

Este repositorio contiene una colección de ejemplos prácticos para ilustrar los diferentes patrones de uso de los **Web Workers** en JavaScript. El objetivo es mostrar cómo descargar tareas pesadas del hilo principal para mantener una interfaz de usuario fluida y receptiva.

## ⚡ Quick Start

```bash
# 1. Clonar el repositorio
git clone <tu-repo-url>
cd web-worker-patterns

# 2. Ejecutar con Docker (recomendado)
./start.sh          # macOS/Linux
start.bat           # Windows

# 3. Abrir en tu navegador
# http://localhost:9000
```

🎉 **¡Listo!** En menos de 30 segundos tendrás todos los ejemplos corriendo.

## 📚 Ejemplos Incluidos

1. **01-basic-communication**: El "Hola Mundo" de los Web Workers. Comunicación básica entre el hilo principal y el worker.
2. **02-offloading-computation**: Cómo evitar que la UI se congele ejecutando cálculos pesados en un worker.
3. **03-transferable-objects**: Optimización del rendimiento al transferir objetos grandes como `ArrayBuffer`.
4. **04-error-handling**: Cómo capturar y manejar errores que ocurren dentro de un worker.
5. **05-shared-worker**: Cómo compartir un worker entre múltiples pestañas o iframes.
6. **06-lifecycle-and-termination**: Cómo gestionar el ciclo de vida de un worker y terminarlo explícitamente.

## 🎯 ¿Qué son los Web Workers?

Los Web Workers permiten ejecutar scripts de JavaScript en hilos de fondo, separados del hilo principal de ejecución de una página web. Esto es especialmente útil para:

- Evitar que operaciones costosas bloqueen la interfaz de usuario
- Realizar cálculos complejos sin afectar la experiencia del usuario
- Procesar grandes volúmenes de datos
- Mantener la aplicación responsiva durante tareas intensivas

## 🚀 ¿Cómo ejecutar los ejemplos?

Debido a las políticas de seguridad del navegador (CORS), no puedes ejecutar los ejemplos abriendo los archivos `index.html` directamente. Necesitas un servidor local.

### 🐳 Opción 1: Usando Docker (Recomendado - Más Rápido)

La forma más rápida y sencilla de ejecutar todos los ejemplos:

#### 📋 Prerrequisitos: Verificar que Docker esté corriendo

Antes de ejecutar los comandos, asegúrate de que Docker esté instalado y ejecutándose:

```bash
# Verificar si Docker está corriendo
docker --version
docker ps
```

**Si ves un error como "Cannot connect to the Docker daemon"**, significa que Docker no está corriendo. Aquí está cómo iniciarlo:

<details>
<summary><strong>🍎 macOS</strong> (click para expandir)</summary>

```bash
# Opción 1: Abrir Docker Desktop desde Aplicaciones
open -a Docker

# Opción 2: Desde la terminal (si está instalado)
open /Applications/Docker.app

# Esperar a que Docker inicie (puede tomar 10-30 segundos)
# Verás el ícono de Docker en la barra de menú cuando esté listo
```

**Verificar que está corriendo:**

```bash
# Deberías ver información de la versión sin errores
docker info
```

</details>

<details>
<summary><strong>🪟 Windows</strong> (click para expandir)</summary>

```bash
# Opción 1: Buscar "Docker Desktop" en el menú inicio y hacer clic

# Opción 2: Desde PowerShell
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Esperar a que Docker inicie (puede tomar 10-30 segundos)
# Verás el ícono de Docker en la bandeja del sistema cuando esté listo
```

**Verificar que está corriendo:**

```powershell
docker info
```

</details>

<details>
<summary><strong>🐧 Linux</strong> (click para expandir)</summary>

```bash
# Iniciar el servicio Docker
sudo systemctl start docker

# Habilitar Docker para que inicie automáticamente
sudo systemctl enable docker

# Verificar el estado
sudo systemctl status docker
```

**Verificar que está corriendo:**

```bash
docker info
```

</details>

**¿No tienes Docker instalado?** [Descárgalo aquí](https://www.docker.com/products/docker-desktop)

**¿Problemas con Docker?** Consulta la [Guía Completa de Docker](DOCKER.md) con troubleshooting y comandos útiles.

#### 🚀 Pasos para ejecutar:

**Opción A: Script Automático (Recomendado)**

Usa el script que verifica y levanta Docker automáticamente:

```bash
# 1. Clonar el repositorio
git clone <tu-repo-url>
cd web-worker-patterns

# 2. Ejecutar el script (detecta tu sistema operativo)
# En macOS/Linux:
./start.sh

# En Windows (Command Prompt o PowerShell):
start.bat
```

El script automáticamente:

- ✅ Verifica si Docker está instalado
- ✅ Detecta si Docker está corriendo (y lo inicia en macOS)
- ✅ Levanta el contenedor
- ✅ Te muestra la URL para abrir en el navegador

**Opción B: Manual**

```bash
# 1. Clonar el repositorio
git clone <tu-repo-url>
cd web-worker-patterns

# 2. Asegurarse de que Docker está corriendo (ver arriba)
docker ps

# 3. Levantar el contenedor con Docker Compose
docker-compose up -d

# 4. Abrir en el navegador
# http://localhost:9000
```

**Ventajas:**

- ✅ No necesitas instalar Python, Node.js o PHP
- ✅ Configuración automática de servidor web optimizado (Nginx)
- ✅ Los cambios en archivos se reflejan inmediatamente (hot-reload)
- ✅ Funciona igual en cualquier sistema operativo

**Comandos útiles:**

```bash
# Ver logs
docker-compose logs -f

# Detener el contenedor
docker-compose down

# Reiniciar
docker-compose restart
```

### 🐍 Opción 2: Usando Python

```bash
# Python 3
python3 -m http.server 8000
```

### 📦 Opción 3: Usando Node.js

```bash
# Si tienes npx instalado
npx serve

# O usando http-server
npx http-server
```

### 🐘 Opción 4: Usando PHP

```bash
php -S localhost:8000
```

### Pasos (para opciones sin Docker):

1. Clona este repositorio:
   ```bash
   git clone <tu-repo-url>
   cd web-worker-patterns
   ```
2. Inicia un servidor local usando una de las opciones anteriores.
3. Abre tu navegador en `http://localhost:8000` (o `http://localhost:9000` para Docker).
4. Navega por los diferentes ejemplos desde el índice principal.

## 📖 Orden de Aprendizaje Recomendado

Si eres nuevo en Web Workers, te recomiendo seguir los ejemplos en orden:

1. Comienza con **01-basic-communication** para entender los fundamentos
2. Continúa con **02-offloading-computation** para ver el caso de uso principal
3. Aprende sobre **04-error-handling** para hacer tu código más robusto
4. Explora **03-transferable-objects** para optimizaciones de rendimiento
5. Experimenta con **06-lifecycle-and-termination** para gestión de recursos
6. Finalmente, prueba **05-shared-worker** para casos de uso avanzados

## 🔍 Recursos Adicionales

- [MDN Web Workers API](https://developer.mozilla.org/es/docs/Web/API/Web_Workers_API)
- [HTML5 Rocks - The Basics of Web Workers](https://www.html5rocks.com/en/tutorials/workers/basics/)
- [Can I Use - Web Workers](https://caniuse.com/webworkers)

## 💡 Notas Importantes

- Los Web Workers no tienen acceso al DOM
- La comunicación entre el hilo principal y el worker se hace mediante mensajes
- Los datos se clonan al pasar entre hilos (excepto cuando se usan transferable objects)
- Los Shared Workers requieren soporte del navegador (verifica la compatibilidad)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para nuevos ejemplos o mejoras, no dudes en abrir un issue o pull request.

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Siéntete libre de usar estos ejemplos para aprender y enseñar.

---

Hecho con ❤️ para la comunidad de desarrolladores.
