# 🚀 Instalación Rápida del Runner

Para habilitar el deployment automático con GitHub Actions, necesitas instalar el runner en cada servidor.

## 📋 Instalación

### Servidor de Producción (172.17.11.13)

```bash
cd /home/outcontab1/dev/sgm-contabilidad
./scripts/setup-github-runner.sh production
```

### Servidor de Desarrollo (172.17.11.22 - vm-bdo-q)

```bash
cd /home/outcontab1/dev/sgm-contabilidad
./scripts/setup-github-runner.sh development
```

## 🔑 Obtener Token de GitHub

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/settings/actions/runners/new
2. Selecciona **Linux**
3. Copia el **TOKEN**

## ⚙️ Configurar Runner

**Producción:**
```bash
cd ~/actions-runner-production
./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad \
            --token <TU_TOKEN> \
            --name sgm-runner-prod \
            --labels self-hosted,Linux,X64,production
```

**Desarrollo:**
```bash
cd ~/actions-runner-development
./config.sh --url https://github.com/BDO-Chile/SGM-Contabilidad \
            --token <TU_TOKEN> \
            --name sgm-runner-dev \
            --labels self-hosted,Linux,X64,development
```

## 🎯 Instalar Servicio

```bash
sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
```

## ✅ Verificar

Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/settings/actions/runners

Deberías ver tu runner en estado **Idle** (verde).

## 📚 Documentación Completa

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas, troubleshooting y gestión del runner.

---

**¿Listo?** Una vez instalados los runners, cada push a `production` o `development` desplegará automáticamente! 🎉
