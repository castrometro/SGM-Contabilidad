# 🔐 Contexto de Seguridad - VPN Corporativa

**Servidor:** vm-bdo-outcontab2 (172.17.11.14)  
**Actualizado:** 28 de Noviembre, 2025  
**Contexto de Red:** 🔒 VPN Corporativa Empresarial  

---

## 🏢 Arquitectura de Red Empresarial

### **Topología de Seguridad**

```
Internet (Público)
        │
        │ Firewall Corporativo
        │ + VPN Gateway
        ▼
┌─────────────────────────────────────┐
│        VPN CORPORATIVA              │
│     (Red Interna Empresarial)       │
│                                     │
│  ┌──────────────┐ ┌──────────────┐  │
│  │ Servidor App │ │ Servidor DB  │  │
│  │ (172.17.11.13)│ │(172.17.11.14)│  │
│  │              │ │              │  │
│  │ Django+Redis │ │ PostgreSQL   │  │
│  │ Celery       │ │ + Monitoreo  │  │
│  └──────────────┘ └──────────────┘  │
│         │                 │         │
│         └─── PostgreSQL ───┘         │
│               (5432)                 │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │        Administradores          │ │
│  │    (Conectados via VPN)         │ │
│  │                                 │ │
│  │  • Acceso Grafana :3000         │ │
│  │  • Acceso Prometheus :9090      │ │
│  │  • SSH Admin :22                │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🛡️ Análisis de Seguridad Revisado

### **Niveles de Protección**

#### **Capa 1: VPN Corporativa (Principal)**
```yaml
Función: Perimetro de seguridad empresarial
Características:
  - Solo empleados/dispositivos autorizados
  - Autenticación multi-factor típica
  - Cifrado del tráfico end-to-end
  - Logs de acceso centralizados
  - Policies empresariales aplicadas

Nivel de Seguridad: 🔒 ALTO
```

#### **Capa 2: UFW Firewall (Defensa en Profundidad)**
```yaml
Función: Filtrado adicional a nivel de servidor
Estado: ACTIVO ✅
Reglas:
  - 22/tcp: SSH (administración)
  - 5432/tcp: PostgreSQL desde 172.17.11.13 únicamente
  - Resto: DENY por defecto

Nivel de Seguridad: 🔒 MEDIO (complementario)
```

#### **Capa 3: Autenticación de Servicios**
```yaml
PostgreSQL:
  - Usuario específico: sgm_user
  - Password robusta 32 chars
  - IP restriction: 172.17.11.13 únicamente

Grafana:
  - Local authentication
  - Usuario: admin (cambio recomendado pero no crítico)
  
Prometheus:
  - Sin auth individual (aceptable en VPN)
  - Solo métricas técnicas, no datos sensibles
```

---

## ✅ Evaluación de Riesgo Actualizada

### **Riesgos ELIMINADOS por VPN:**
- ❌ ~~Acceso desde internet público~~
- ❌ ~~Ataques automatizados externos~~  
- ❌ ~~Scanning de puertos desde exterior~~
- ❌ ~~Brute force desde IPs arbitrarias~~

### **Riesgos MITIGADOS por VPN:**
- 🔽 **Acceso no autorizado**: Solo empleados con VPN
- 🔽 **Intercepción de tráfico**: Cifrado VPN
- 🔽 **Password por defecto**: Acceso ya restringido a personal autorizado
- 🔽 **Métricas sensibles**: Solo visibles internamente

### **Riesgos RESIDUALES (Contexto VPN):**
- 🟡 **Insider threats**: Empleados maliciosos con acceso VPN
- 🟡 **Devices comprometidos**: Laptops corporativos infectados
- 🟡 **Password sharing**: Credenciales compartidas entre admins
- 🟡 **Session hijacking**: En caso de device comprometido

---

## 📊 Matriz de Acceso Revisada

| Usuario/Rol | Método Acceso | Servicios Disponibles | Nivel Riesgo |
|-------------|---------------|----------------------|--------------|
| **Desarrolladores Django** | VPN + App Server | PostgreSQL via Django | 🟢 Muy Bajo |
| **Administradores DB** | VPN + SSH | PostgreSQL directo, Grafana, Prometheus | 🟡 Bajo |
| **DevOps/SRE** | VPN + Web | Grafana dashboards, Prometheus queries | 🟢 Muy Bajo |
| **Usuarios SGM** | VPN + Frontend | Solo interfaz web (sin acceso a DB) | 🟢 Muy Bajo |

---

## 🔧 Recomendaciones Ajustadas al Contexto VPN

### **Prioridad BAJA (Buenas Prácticas)**
```yaml
1. Cambiar password Grafana admin:
   - No crítico debido a VPN protection
   - Recomendado por hygiene de seguridad
   - Timeline: 2-4 semanas

2. Implementar HTTPS (opcional):
   - VPN ya provee cifrado
   - Útil para compliance/políticas empresariales
   - Timeline: No urgente

3. Monitoring de accesos:
   - Logs de login Grafana
   - Conexiones PostgreSQL por usuario
   - Timeline: 1-2 meses
```

### **Mantener Como Está (Adecuado)**
```yaml
✅ PostgreSQL sin SSL:
   - VPN provee cifrado de transporte
   - Red interna confiable
   - Performance impact evitado

✅ Prometheus sin auth:
   - Solo métricas técnicas
   - Acceso ya controlado por VPN
   - Complejidad innecesaria evitada

✅ UFW firewall activo:
   - Defensa en profundidad válida
   - Protección adicional apropiada
   - Costo operacional mínimo
```

---

## 🏢 Políticas Empresariales Sugeridas

### **Para el Departamento IT/Seguridad**
```yaml
VPN Access Control:
  - Review trimestral de usuarios VPN
  - Rotación de credenciales VPN cada 90 días
  - Multi-factor authentication obligatorio
  - Device compliance checks

Database Access:
  - Solo administradores autorizados
  - Sesiones loggeadas y auditables
  - No shared accounts para acceso directo
  - Emergency access procedures documented
```

### **Para Desarrollo y DevOps**
```yaml
Application Connectivity:
  - Connection strings en variables de entorno
  - No hardcoded credentials
  - Connection pooling apropiado
  - Retry logic para network hiccups

Monitoring Access:
  - Dashboards compartidos de solo lectura
  - Admin access solo para team leads
  - Alert destinations configuradas
  - Escalation procedures claras
```

---

## 📋 Checklist de Seguridad VPN-Aware

### **✅ Implementado y Apropiado**
- [x] VPN corporativa como perímetro principal
- [x] UFW firewall como defensa en profundidad  
- [x] PostgreSQL con autenticación MD5 + IP restriction
- [x] Grafana con local auth (password change opcional)
- [x] Prometheus metrics-only (sin datos sensitivos)
- [x] Logging de conexiones PostgreSQL
- [x] Servicios auto-restart configurados

### **🟡 Opcional/Recomendado (No Crítico)**
- [ ] Password change Grafana (hygiene)
- [ ] HTTPS para Grafana (compliance)
- [ ] Certificate management setup
- [ ] Centralized logging (ELK stack)
- [ ] Automated backup con cifrado
- [ ] Database connection pooling metrics

### **❌ No Necesario en Contexto VPN**
- [x] ~~Restricción IP adicional para Grafana~~
- [x] ~~Authentication layer para Prometheus~~
- [x] ~~Rate limiting agresivo~~
- [x] ~~DDoS protection~~
- [x] ~~Public SSL certificates~~

---

## 🔄 Procedimientos Operacionales VPN

### **Acceso para Nuevos Administradores**
```bash
1. Solicitar acceso VPN corporativo
2. Configurar cliente VPN en device corporativo
3. Conectar a VPN empresarial
4. Acceder a servicios:
   - Grafana: http://172.17.11.14:3000
   - Prometheus: http://172.17.11.14:9090
   - SSH: ssh outcontab2@172.17.11.14
```

### **Troubleshooting Conectividad**
```bash
# Verificar conexión VPN
ping 172.17.11.14

# Test puertos específicos  
telnet 172.17.11.14 3000  # Grafana
telnet 172.17.11.14 9090  # Prometheus
telnet 172.17.11.14 5432  # PostgreSQL (desde app server)

# Verificar servicios del servidor
ssh outcontab2@172.17.11.14
sudo systemctl status postgresql prometheus grafana-server
```

### **Emergency Access (VPN Down)**
```yaml
Scenario: VPN corporativa no disponible
Options:
  1. Acceso desde oficina (network corporativo directo)
  2. Temporary firewall rules para IP específica:
     sudo ufw allow from [ADMIN_IP] to any port 22
  3. Console access via virtualization platform
  4. Coordinate con team de networking para VPN restore
```

---

## 📈 Monitoring en Contexto VPN

### **Métricas de Seguridad Apropiadas**
```promql
# Conexiones anómalas (opcional en VPN)
increase(postgresql_connection_errors_total[5m])

# Uso normal de servicios (interno)
grafana_active_users
prometheus_query_rate
pg_stat_activity_count

# Performance interno
http_requests_duration_seconds
db_query_execution_time
```

### **Alertas Ajustadas**
```yaml
# Críticas (afectan operación)
- Database down
- Service unavailable  
- Disk space low
- Memory exhaustion

# Warning (investigar, no urgente)
- High connection count
- Slow query detected
- Login failures (podría ser typos)
- Unusual access patterns
```

---

## 🎯 Resumen Ejecutivo

### **Estado de Seguridad: 🔒 APROPIADO PARA VPN CORPORATIVA**

**Fortalezas:**
- ✅ Perímetro de seguridad robusto (VPN)
- ✅ Autenticación de base de datos apropiada
- ✅ Firewall local como defensa adicional
- ✅ Logs y monitoreo funcional
- ✅ Configuración estable y documentada

**Consideraciones Menores:**
- 🟡 Password Grafana por defecto (cambio cosmético)
- 🟡 HTTPS no implementado (VPN compensa)
- 🟡 Monitoring de accesos puede mejorarse

**Recomendación:**
El servidor está **apropiadamente securizado** para un entorno VPN corporativo. Las medidas implementadas son proporcionales al riesgo real. Cambios adicionales son opcionales y deben priorizarse según políticas empresariales y recursos disponibles.

---

**Análisis Generado:** 28 de Noviembre, 2025  
**Contexto:** VPN Corporativa - Acceso Interno Empresarial  
**Risk Level:** 🟢 Bajo (Apropiado para el contexto)  
**Next Review:** Trimestral o cambios en la topología VPN  

---