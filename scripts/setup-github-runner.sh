#!/bin/bash
# Script para instalar GitHub Actions Self-Hosted Runner
# Uso: ./setup-github-runner.sh [production|development]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar argumentos
if [ "$#" -ne 1 ] || ([ "$1" != "production" ] && [ "$1" != "development" ]); then
    print_error "Uso: $0 [production|development]"
    exit 1
fi

ENVIRONMENT=$1

print_step "Instalando GitHub Actions Self-Hosted Runner para: $ENVIRONMENT"
echo ""

# Crear directorio para el runner
RUNNER_DIR="$HOME/actions-runner-$ENVIRONMENT"
print_step "Creando directorio: $RUNNER_DIR"

if [ -d "$RUNNER_DIR" ]; then
    print_warning "El directorio ya existe. ¿Deseas continuar? (s/n)"
    read -r response
    if [[ ! "$response" =~ ^[sS]$ ]]; then
        print_error "Instalación cancelada."
        exit 1
    fi
    rm -rf "$RUNNER_DIR"
fi

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Descargar el runner
print_step "Descargando GitHub Actions Runner..."
RUNNER_VERSION="2.321.0"  # Actualizar según la última versión
curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

# Verificar hash (opcional pero recomendado)
print_step "Extrayendo archivos..."
tar xzf "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
rm "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

print_success "Runner descargado y extraído exitosamente"
echo ""

# Configurar el runner
print_step "Ahora necesitas configurar el runner con los siguientes pasos:"
echo ""
echo "1. Ve a GitHub: https://github.com/BDO-Chile/SGM-Contabilidad/settings/actions/runners/new"
echo ""
echo "2. Selecciona Linux como el sistema operativo"
echo ""
echo "3. Copia el TOKEN que aparece en el comando de configuración"
echo ""
echo "4. Ejecuta el siguiente comando (reemplaza <TOKEN> con el que copiaste):"
echo ""
echo -e "${GREEN}cd $RUNNER_DIR${NC}"
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${GREEN}./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad --token <TOKEN> --name sgm-runner-prod --labels self-hosted,Linux,X64,production${NC}"
else
    echo -e "${GREEN}./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad --token <TOKEN> --name sgm-runner-dev --labels self-hosted,Linux,X64,development${NC}"
fi
echo ""
echo "5. Después de configurar, instala el servicio:"
echo ""
echo -e "${GREEN}sudo ./svc.sh install${NC}"
echo -e "${GREEN}sudo ./svc.sh start${NC}"
echo ""
echo "6. Verifica que el servicio esté corriendo:"
echo ""
echo -e "${GREEN}sudo ./svc.sh status${NC}"
echo ""

print_success "Directorio del runner creado en: $RUNNER_DIR"
print_warning "No olvides seguir los pasos de arriba para completar la configuración."

# Crear script de utilidad para gestionar el servicio
cat > "$RUNNER_DIR/manage-runner.sh" << 'EOF'
#!/bin/bash
# Script de gestión del runner

case "$1" in
    start)
        sudo ./svc.sh start
        echo "Runner iniciado"
        ;;
    stop)
        sudo ./svc.sh stop
        echo "Runner detenido"
        ;;
    restart)
        sudo ./svc.sh stop
        sudo ./svc.sh start
        echo "Runner reiniciado"
        ;;
    status)
        sudo ./svc.sh status
        ;;
    logs)
        journalctl -u actions.runner.* -f
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

chmod +x "$RUNNER_DIR/manage-runner.sh"
print_success "Script de gestión creado: $RUNNER_DIR/manage-runner.sh"
echo ""
echo "Después de configurar el runner, usa estos comandos para gestionarlo:"
echo "  ./manage-runner.sh start   - Iniciar el runner"
echo "  ./manage-runner.sh stop    - Detener el runner"
echo "  ./manage-runner.sh restart - Reiniciar el runner"
echo "  ./manage-runner.sh status  - Ver estado del runner"
echo "  ./manage-runner.sh logs    - Ver logs en tiempo real"
