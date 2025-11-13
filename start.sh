#!/bin/bash

# Script para iniciar automáticamente la nueva app Angular del proyecto
# Compatible con macOS, Linux y Git Bash en Windows

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_ROOT}"

NODE_REQUIRED_MAJOR=18
NPM_REQUIRED_MAJOR=9
DEV_SERVER_PORT=4200
STAMP_FILE="node_modules/.install.stamp"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

print_header() {
    echo "====================================="
    echo "  Web Worker Patterns - Angular App"
    echo "====================================="
    echo ""
}

require_command() {
    local cmd="$1"
    local friendly="$2"
    if ! command -v "${cmd}" >/dev/null 2>&1; then
        echo -e "${RED}❌ ${friendly} no está instalado o no está en el PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ ${friendly} detectado${NC}"
}

check_node_version() {
    local version
    version="$(node -v | sed 's/^v//')"
    local major="${version%%.*}"

    if (( major < NODE_REQUIRED_MAJOR )); then
        echo -e "${RED}❌ Se requiere Node.js >= ${NODE_REQUIRED_MAJOR}.x (encontrado ${version})${NC}"
        echo "Descarga la versión actual desde: https://nodejs.org/"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js ${version}${NC}"
}

check_npm_version() {
    local version
    version="$(npm -v)"
    local major="${version%%.*}"

    if (( major < NPM_REQUIRED_MAJOR )); then
        echo -e "${RED}❌ Se requiere npm >= ${NPM_REQUIRED_MAJOR}.x (encontrado ${version})${NC}"
        echo "Actualiza npm con: npm install -g npm"
        exit 1
    fi
    echo -e "${GREEN}✅ npm ${version}${NC}"
}

install_dependencies() {
    local needs_install=0

    if [ ! -d "node_modules" ]; then
        needs_install=1
    elif [ ! -f "${STAMP_FILE}" ]; then
        needs_install=1
    elif [ "package-lock.json" -nt "${STAMP_FILE}" ]; then
        needs_install=1
    fi

    if [ "${needs_install}" -eq 1 ]; then
        echo -e "${YELLOW}📦 Instalando dependencias del proyecto...${NC}"
        npm install
        mkdir -p "$(dirname "${STAMP_FILE}")"
        touch "${STAMP_FILE}"
        echo -e "${GREEN}✅ Dependencias listas${NC}"
    else
        echo -e "${GREEN}✅ Dependencias actualizadas (saltando npm install)${NC}"
    fi
}

start_dev_server() {
    echo ""
    echo -e "${YELLOW}⚙️  Iniciando servidor de desarrollo Angular...${NC}"
    echo "   🌐 URL: http://localhost:${DEV_SERVER_PORT}"
    echo "   📌 Usa Ctrl+C para detener el servidor."
    echo ""
    npm run start -- --host 0.0.0.0 --port "${DEV_SERVER_PORT}"
}

main() {
    print_header
    require_command node "Node.js"
    require_command npm "npm"
    check_node_version
    check_npm_version
    install_dependencies
    start_dev_server
}

main
