#!/bin/bash

echo "📊 ANÁLISIS COMPLETO SGM - REQUISITOS MÍNIMOS"
echo "============================================="
echo "Analizando datos de múltiples sesiones de monitoreo"
echo ""

# Crear directorio de análisis
ANALISIS_DIR="analisis_completo_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ANALISIS_DIR"

REPORTE="$ANALISIS_DIR/reporte_requisitos_sgm.txt"

# Función para escribir al reporte
write_report() {
    echo "$1" | tee -a "$REPORTE"
}

write_report "📊 ANÁLISIS DE REQUISITOS MÍNIMOS SGM - RINDE GASTOS"
write_report "===================================================="
write_report "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
write_report ""

# Analizar datos existentes
write_report "🔍 DATOS ANALIZADOS:"
write_report "-------------------"

# Buscar carpetas con datos de métricas
found_data=false

for dir in monitor_*; do
    if [ -d "$dir" ] && [ -f "$dir/metricas_sistema.csv" ]; then
        found_data=true
        write_report "✅ $dir - Contiene métricas del sistema"
        
        # Analizar el CSV
        if [ -f "$dir/metricas_sistema.csv" ]; then
            local cpu_max=$(tail -n +2 "$dir/metricas_sistema.csv" | cut -d',' -f2 | sort -n | tail -1)
            local ram_max=$(tail -n +2 "$dir/metricas_sistema.csv" | cut -d',' -f3 | sort -n | tail -1)
            local samples=$(tail -n +2 "$dir/metricas_sistema.csv" | wc -l)
            
            write_report "   📈 CPU máximo: ${cpu_max}%"
            write_report "   🧠 RAM máxima: ${ram_max}MB"
            write_report "   📊 Muestras: $samples"
        fi
    fi
done

if [ "$found_data" = false ]; then
    write_report "⚠️  No se encontraron datos de métricas detalladas"
fi

write_report ""
write_report "🎯 ANÁLISIS DE CONFIGURACIÓN ACTUAL:"
write_report "------------------------------------"

# Verificar contenedores activos
write_report "📋 Contenedores Docker activos:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | while read line; do
    write_report "   $line"
done

write_report ""

# Obtener métricas actuales en tiempo real
write_report "📊 MÉTRICAS EN TIEMPO REAL (SISTEMA IDLE):"
write_report "-------------------------------------------"

# CPU total del sistema
cpu_idle=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' | head -1)
write_report "🖥️  CPU Sistema (idle): ${cpu_idle}%"

# RAM total
ram_total=$(free -m | awk 'NR==2{printf "%.0f", $2}')
ram_used=$(free -m | awk 'NR==2{printf "%.0f", $3}')
ram_percent=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
write_report "🧠 RAM Sistema: ${ram_used}MB / ${ram_total}MB (${ram_percent}%)"

# Docker stats de contenedores clave
write_report ""
write_report "📊 MÉTRICAS DOCKER (IDLE):"
docker_django_cpu=$(docker stats --no-stream sgm-django-1 --format "{{.CPUPerc}}" 2>/dev/null | head -1)
docker_django_mem=$(docker stats --no-stream sgm-django-1 --format "{{.MemUsage}}" 2>/dev/null | head -1)
docker_celery_cpu=$(docker stats --no-stream sgm-celery_worker-1 --format "{{.CPUPerc}}" 2>/dev/null | head -1)
docker_celery_mem=$(docker stats --no-stream sgm-celery_worker-1 --format "{{.MemUsage}}" 2>/dev/null | head -1)

write_report "   🐍 Django: CPU ${docker_django_cpu} | RAM ${docker_django_mem}"
write_report "   ⚙️  Celery: CPU ${docker_celery_cpu} | RAM ${docker_celery_mem}"

write_report ""
write_report "🎯 WORKERS CELERY CONFIGURADOS:"
write_report "-------------------------------"
docker exec sgm-celery_worker-1 celery -A sgm_backend inspect registered 2>/dev/null | grep -A3 -B1 "contabilidad@" | while read line; do
    if [[ "$line" == *"contabilidad"* ]] || [[ "$line" == *"rg_procesar"* ]]; then
        write_report "   $line"
    fi
done

write_report ""
write_report "💡 CÁLCULO DE REQUISITOS MÍNIMOS:"
write_report "==================================="

# Baseline del sistema
write_report "📊 BASELINE (Sistema idle):"
write_report "   - CPU Sistema: ${cpu_idle}%"
write_report "   - RAM Total: ${ram_used}MB"
write_report "   - Django CPU: ${docker_django_cpu}"
write_report "   - Celery CPU: ${docker_celery_cpu}"

write_report ""
write_report "🎯 PROYECCIÓN PARA 3 USUARIOS SIMULTÁNEOS:"

# Cálculos conservadores
cpu_projection=$(echo "$cpu_idle + 15" | bc)  # +5% por usuario
ram_projection=$(echo "$ram_used + 500" | bc)  # +166MB por usuario

write_report "   - CPU Estimado: ${cpu_projection}% (${cpu_idle}% base + 15% para 3 usuarios)"
write_report "   - RAM Estimada: ${ram_projection}MB (${ram_used}MB base + 500MB para procesamiento)"

write_report ""
write_report "🔧 RECOMENDACIONES HARDWARE:"
write_report "----------------------------"

# Recomendaciones basadas en los cálculos
if (( $(echo "$cpu_projection < 50" | bc -l) )); then
    write_report "✅ CPU: 2 cores suficientes (uso proyectado: ${cpu_projection}%)"
else
    write_report "⚠️  CPU: Recomendado 4 cores (uso proyectado: ${cpu_projection}%)"
fi

ram_gb=$(echo "scale=1; $ram_projection / 1024" | bc)
if (( $(echo "$ram_projection < 4096" | bc -l) )); then
    write_report "✅ RAM: 4GB suficientes (uso proyectado: ${ram_gb}GB)"
else
    write_report "⚠️  RAM: Recomendado 8GB (uso proyectado: ${ram_gb}GB)"
fi

write_report "✅ Almacenamiento: 20GB SSD (sistema + logs + temporales)"
write_report "✅ Red: 100Mbps (para subida de archivos Excel)"

write_report ""
write_report "🎯 CONFIGURACIÓN MÍNIMA RECOMENDADA:"
write_report "======================================"
write_report "   🖥️  CPU: 2 cores @ 2.4GHz"
write_report "   🧠 RAM: 4GB DDR4"
write_report "   💾 Storage: 20GB SSD"
write_report "   🌐 Network: 100Mbps"
write_report "   🐳 Docker: 20.10+"
write_report "   🐧 SO: Ubuntu 20.04+ / CentOS 8+"

write_report ""
write_report "⚡ CONFIGURACIÓN RECOMENDADA (ÓPTIMA):"
write_report "======================================"
write_report "   🖥️  CPU: 4 cores @ 3.0GHz"
write_report "   🧠 RAM: 8GB DDR4"
write_report "   💾 Storage: 50GB SSD NVMe"
write_report "   🌐 Network: 1Gbps"
write_report "   🐳 Docker: 24.0+"
write_report "   🐧 SO: Ubuntu 22.04 LTS"

write_report ""
write_report "📋 NOTAS IMPORTANTES:"
write_report "----------------------"
write_report "• Tareas de RindeGastos duran ~0.2 segundos"
write_report "• Sistema usa workers especializados (nomina, contabilidad, general)"
write_report "• Procesamiento Excel es rápido pero intensivo en CPU"
write_report "• PostgreSQL y Redis requieren almacenamiento persistente"
write_report "• Flower monitorea tareas en tiempo real (puerto 5555)"

write_report ""
write_report "🔗 ENLACES ÚTILES:"
write_report "-----------------"
write_report "• SGM Frontend: http://172.17.11.18:5174/"
write_report "• Django Admin: http://172.17.11.13:8000/admin/"
write_report "• Flower Monitor: http://172.17.11.18:5555/"
write_report "• Streamlit Conta: http://172.17.11.18:8502/"

write_report ""
write_report "📊 ANÁLISIS COMPLETADO: $(date '+%Y-%m-%d %H:%M:%S')"

echo ""
echo "📊 ANÁLISIS COMPLETADO!"
echo "======================="
echo "📁 Reporte guardado en: $REPORTE"
echo ""
echo "🎯 RESUMEN EJECUTIVO:"
echo "• Sistema actual usa ${ram_used}MB RAM y ${cpu_idle}% CPU en idle"
echo "• Para 3 usuarios: ~${cpu_projection}% CPU y ~${ram_gb}GB RAM"
echo "• Configuración mínima: 2 cores, 4GB RAM, 20GB SSD"
echo "• Configuración recomendada: 4 cores, 8GB RAM, 50GB SSD"
echo ""
echo "📋 Ver reporte completo: cat $REPORTE"