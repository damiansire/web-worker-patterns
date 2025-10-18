#!/bin/bash

# Script para iniciar automáticamente el proyecto con Docker
# Compatible con macOS, Linux y Git Bash en Windows

set -e  # Salir si hay algún error

echo "🚀 Iniciando Web Worker Patterns..."
echo ""

# Colores para el output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si Docker está instalado
check_docker_installed() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        echo ""
        echo "Por favor, instala Docker Desktop desde:"
        echo "https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker está instalado${NC}"
}

# Función para verificar si Docker está corriendo
check_docker_running() {
    if ! docker info &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker no está corriendo${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Docker está corriendo${NC}"
    return 0
}

# Función para intentar iniciar Docker (solo macOS)
start_docker_macos() {
    echo -e "${YELLOW}🔄 Intentando iniciar Docker Desktop...${NC}"
    
    if [ -d "/Applications/Docker.app" ]; then
        open -a Docker
        echo "⏳ Esperando a que Docker inicie..."
        
        # Esperar hasta 60 segundos a que Docker inicie
        for i in {1..60}; do
            if docker info &> /dev/null; then
                echo -e "${GREEN}✅ Docker iniciado correctamente${NC}"
                return 0
            fi
            sleep 1
            echo -n "."
        done
        
        echo ""
        echo -e "${RED}❌ Docker tardó demasiado en iniciar${NC}"
        return 1
    else
        echo -e "${RED}❌ Docker Desktop no encontrado en /Applications${NC}"
        return 1
    fi
}

# Función principal
main() {
    echo "=====================================";
    echo "  Web Worker Patterns - Setup";
    echo "=====================================";
    echo ""
    
    # 1. Verificar que Docker esté instalado
    check_docker_installed
    
    # 2. Verificar que Docker esté corriendo
    if ! check_docker_running; then
        echo ""
        
        # Detectar sistema operativo
        OS="$(uname -s)"
        case "${OS}" in
            Darwin*)    # macOS
                start_docker_macos
                ;;
            Linux*)     # Linux
                echo -e "${YELLOW}Para iniciar Docker en Linux, ejecuta:${NC}"
                echo "  sudo systemctl start docker"
                echo ""
                echo "¿Deseas que lo inicie automáticamente? (requiere sudo)"
                read -p "Iniciar Docker ahora? (s/n): " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[SsYy]$ ]]; then
                    sudo systemctl start docker
                    sleep 2
                    if ! check_docker_running; then
                        exit 1
                    fi
                else
                    exit 1
                fi
                ;;
            MINGW*|MSYS*|CYGWIN*)    # Windows (Git Bash)
                echo -e "${YELLOW}En Windows, inicia Docker Desktop manualmente:${NC}"
                echo "  1. Busca 'Docker Desktop' en el menú inicio"
                echo "  2. Haz clic para iniciarlo"
                echo "  3. Espera a ver el ícono en la bandeja del sistema"
                echo "  4. Ejecuta este script nuevamente"
                exit 1
                ;;
            *)
                echo -e "${RED}Sistema operativo no reconocido: ${OS}${NC}"
                exit 1
                ;;
        esac
    fi
    
    echo ""
    
    # 3. Construir y levantar el contenedor
    echo "🐳 Levantando contenedor con Docker Compose..."
    docker-compose up -d --build
    
    echo ""
    echo -e "${GREEN}=====================================";
    echo "  ✅ ¡Listo!";
    echo "=====================================${NC}";
    echo ""
    echo "🌐 Abre tu navegador en:"
    echo "   👉 http://localhost:9000"
    echo ""
    echo "📋 Comandos útiles:"
    echo "   Ver logs:      docker-compose logs -f"
    echo "   Detener:       docker-compose down"
    echo "   Reiniciar:     docker-compose restart"
    echo ""
}

# Ejecutar función principal
main

