# Docker Guide for Web Worker Patterns

This guide explains in detail how to use Docker to run this project.

## Table of Contents

- [Why Docker?](#why-docker)
- [Installing Docker](#installing-docker)
- [Quick Usage](#quick-usage)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

## Why Docker?

Docker provides:

- **Zero configuration**: No need to install Python, Node.js, PHP, or any web server
- **Portability**: Works the same on macOS, Windows, and Linux
- **Isolation**: Does not interfere with other services on your system
- **Reproducibility**: Everyone uses exactly the same environment
- **Production-like**: Serves the built Angular app (multi-stage build); no Node required on the host

## Installing Docker

### macOS

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Open the downloaded `.dmg` file
3. Drag Docker to your Applications folder
4. Open Docker from Applications
5. Wait for the Docker icon to appear in the menu bar

### Windows

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Follow the instructions (may require a restart)
4. Open Docker Desktop from the Start menu
5. Wait for the Docker icon to appear in the system tray

**Note for Windows**: You need WSL 2 (Windows Subsystem for Linux) installed.

### Linux (Ubuntu/Debian)

```bash
# Update packages
sudo apt-get update

# Install dependencies
sudo apt-get install ca-certificates curl gnupg lsb-release

# Add Docker's GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add the repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
docker --version
```

## Quick Usage

Docker builds the Angular app and serves it with nginx (no Node.js on the host). After code changes, rebuild the image.

```bash
# 1. Verify Docker is running
docker ps

# 2. Build and start
docker-compose up -d --build

# 3. Open in the browser
# http://localhost:9000
```

For local development with hot-reload, use `npm start` or the project scripts in `scripts/start/` (see README).

## Troubleshooting

### "Cannot connect to the Docker daemon"

**Problem**: Docker is not running.

**Solution**:

**macOS:**

```bash
open -a Docker
# Wait 10-30 seconds
docker ps
```

**Windows:**

- Search for "Docker Desktop" in the Start menu
- Click to launch it
- Wait for the icon to appear in the system tray

**Linux:**

```bash
sudo systemctl start docker
```

### "Port is already allocated"

**Problem**: The port is being used by another service.

**Solution 1** - Stop existing containers:

```bash
docker-compose down
docker-compose up -d
```

**Solution 2** - See what's using the port:

```bash
# macOS/Linux
lsof -i :3000

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

**Solution 3** - Change the port in `docker-compose.yml`:

```yaml
ports:
  - "8080:80" # Use port 8080
  # or any other available port
```

Then restart:

```bash
docker-compose down
docker-compose up -d
```

### "Error response from daemon: Conflict"

**Problem**: A container with the same name already exists.

**Solution**:

```bash
# Stop and remove the existing container
docker-compose down

# Recreate
docker-compose up -d
```

### Changes are not reflected in the browser

**Solution**:

```bash
# 1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

# 2. Or restart the container
docker-compose restart
```

### Permission denied on Linux

**Problem**: `permission denied while trying to connect to the Docker daemon socket`

**Solution**:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and log back in
# Or run:
newgrp docker

# Verify
docker ps
```

## Useful Commands

### View container status

```bash
# List active containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs in real time
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f web-worker-patterns
```

### Container management

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild (after Dockerfile changes)
docker-compose up -d --build

# Stop without removing
docker-compose stop

# Start again
docker-compose start
```

### View information

```bash
# View resource statistics
docker stats

# Inspect the container
docker inspect web-worker-patterns

# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Access the container

```bash
# Open a shell inside the container
docker exec -it web-worker-patterns sh

# View files inside the container
docker exec web-worker-patterns ls -la /usr/share/nginx/html

# View nginx configuration
docker exec web-worker-patterns cat /etc/nginx/conf.d/default.conf
```

### Cleanup

```bash
# Remove the container and its volumes
docker-compose down -v

# Clean unused images
docker image prune

# Clean everything (containers, networks, images, volumes)
docker system prune -a --volumes
```

## Project Architecture

```
┌──────────────────┐
│   Browser        │  http://localhost:9000
│  (Your machine)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Docker Host    │  Port 9000 → 80
│  (Your machine)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Container      │  Nginx Alpine
│   web-worker-    │  - Serves built Angular app
│   patterns       │  - SPA routing (try_files)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Built app       │  From image (dist/ in build stage)
│  /usr/share/     │  Rebuild with --build after changes
│  nginx/html/     │
└──────────────────┘
```

## Configuration Files

### `Dockerfile`

Multi-stage build:

- **Stage 1 (build)**: Node 20 runs `npm ci` and `npm run build` to produce the Angular app in `dist/`
- **Stage 2 (serve)**: nginx:alpine serves only the built static files from `dist/web-worker-patterns/browser/`
- Nginx is configured for SPA routing (`try_files` to `index.html`)

### `docker-compose.yml`

Defines the service:

- Ports (9000:80 by default; change if needed)
- No volume: the image contains the built app; run `docker-compose up -d --build` after code changes
- Healthcheck and container name

### `.dockerignore`

Files that are NOT copied to the container:

- .git
- node_modules
- Development scripts

## Tips and Best Practices

### Development

- **No hot-reload in Docker**: The image serves a built snapshot. For live reload, use `npm start` or the scripts in `scripts/start/` on the host.
- **Rebuild after changes**: `docker-compose up -d --build`
- **Check the logs**: `docker-compose logs -f` is your friend

### Production

For production, consider:

- Using a more robust image (nginx:stable)
- Configuring SSL/TLS
- Optimizing cache
- Adding gzip compression

### Performance

The container uses:

- Nginx Alpine (only ~5MB)
- Optimized cache configuration
- Correct CORS headers for workers

## FAQ

### Do I need to know Docker to use this?

No. The automatic scripts in `scripts/start/` do everything for you.

### Can I change the port?

Yes. Edit `docker-compose.yml` and change `"9000:80"` to `"YOUR_PORT:80"`, then run `docker-compose down && docker-compose up -d`.

### Are changes saved after stopping the container?

Yes. The files are on your machine; the container only serves them.

### How much space does it take?

- Base image (nginx:alpine): ~5MB
- Built image: ~5.5MB
- Running container: ~10MB RAM

### Can I use Docker Desktop UI?

Yes. You can manage everything from the Docker Desktop graphical interface.

---

## Need Help?

If you have problems:

1. Check this troubleshooting guide
2. Run `docker-compose logs -f` to see errors
3. Verify Docker is running: `docker ps`
4. Try rebuilding: `docker-compose up -d --build`

---

Made with love for the developer community.
