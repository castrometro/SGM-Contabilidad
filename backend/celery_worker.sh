#!/bin/bash

echo "🚀 Iniciando worker único de Celery para Contabilidad/RindeGastos..."

sleep 2

# Función para manejar la terminación limpia
cleanup() {
    echo "🛑 Deteniendo worker..."
    pkill -P $$
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "🔧 Iniciando Worker Contabilidad (cola: contabilidad, concurrencia: 3)..."
celery -A sgm_backend worker -Q contabilidad -c 3 --loglevel=info --hostname=contabilidad@%h &
CONTABILIDAD_PID=$!

echo ""
echo "✅ Worker iniciado"
echo "📈 PID Contabilidad=$CONTABILIDAD_PID"
echo "🔍 Monitoreando worker... (Ctrl+C para detener)"

# Esperar que el proceso termine
wait