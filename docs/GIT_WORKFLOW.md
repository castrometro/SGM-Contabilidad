# 🔄 Git Workflow - SGM Contabilidad

Este documento describe el flujo de trabajo con Git para el desarrollo colaborativo del proyecto.

## 📊 Estructura de Ramas

```
production  ← Código en producción (172.17.11.13)
    ↑
    └── development  ← Código en desarrollo (172.17.11.22)
            ↑
            ├── feature/issue-1-cambiar-color-boton
            ├── feature/issue-5-nuevo-reporte
            └── bugfix/issue-3-corregir-validacion
```

## 🎯 Flujo Completo: De Issue a Producción

### **1️⃣ Crear Issue**

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/issues/new/choose
2. Selecciona el template apropiado:
   - 🐛 **Bug Report**: Para reportar errores
   - ✨ **Feature Request**: Para proponer funcionalidades
3. Completa la información y crea el issue

**Resultado**: Issue creado con número, ejemplo: `#15`

---

### **2️⃣ Desarrollador Toma el Issue**

En la página del issue:
1. Click en "Assignees" → Asignarte a ti mismo
2. Agregar label apropiado: `in progress`

---

### **3️⃣ Crear Feature Branch**

```bash
# Asegurarte de estar en development actualizado
git checkout development
git pull origin development

# Crear rama desde development
git checkout -b feature/issue-15-cambiar-color-boton
```

**Convención de nombres**:
- `feature/issue-N-descripcion-corta` - Nuevas funcionalidades
- `bugfix/issue-N-descripcion-corta` - Corrección de bugs
- `hotfix/issue-N-descripcion-critica` - Fix urgente para producción

---

### **4️⃣ Desarrollar y Commitear**

```bash
# Hacer cambios en el código
# ...

# Commitear con mensajes descriptivos
git add .
git commit -m "feat: Cambiar color del botón de login a azul

- Actualizar componente LoginButton.jsx
- Modificar estilos en theme.css
- Agregar variable CSS --primary-blue

Refs #15"

# Push de la rama
git push origin feature/issue-15-cambiar-color-boton
```

**Convenciones de commits**:
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `refactor:` - Refactorización sin cambio funcional
- `docs:` - Solo documentación
- `style:` - Formato, punto y coma, etc
- `test:` - Agregar tests
- `chore:` - Tareas de mantenimiento

**Importante**: Incluir `Refs #N` o `Closes #N` para vincular al issue

---

### **5️⃣ Crear Pull Request a Development**

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/pulls
2. Click "New pull request"
3. Configura:
   - `base: development` ← `compare: feature/issue-15-cambiar-color-boton`
4. El template se carga automáticamente, complétalo:
   - Objetivo del PR
   - Issues relacionados: `Closes #15`
   - Checklist de testing
   - Screenshots si aplica
5. Click "Create pull request"
6. Solicitar review: Click en "Reviewers" → Seleccionar compañeros

---

### **6️⃣ Code Review**

**El revisor**:
- Lee el código línea por línea
- Puede comentar en líneas específicas
- Puede solicitar cambios
- Aprueba cuando está OK

**Si hay cambios solicitados**:
```bash
# Hacer correcciones en la misma rama
git add .
git commit -m "fix: Ajustar tono de azul según feedback"
git push origin feature/issue-15-cambiar-color-boton
```

Los cambios aparecen automáticamente en el PR.

---

### **7️⃣ Merge a Development**

Una vez aprobado:
1. Click en "Merge pull request"
2. Opción recomendada: **"Squash and merge"** (combina todos los commits en uno)
3. Editar mensaje final si es necesario
4. Click "Confirm squash and merge"
5. **¡Automático!** → El workflow despliega a desarrollo (172.17.11.22)

**Resultado**: 
- ✅ Issue #15 se cierra automáticamente (por el `Closes #15`)
- ✅ Código desplegado en http://172.17.11.22:8000/
- ✅ Rama feature puede borrarse (GitHub ofrece botón)

---

### **8️⃣ Acumular Features en Development**

Repetir pasos 1-7 para múltiples issues:
- Issue #15: Botón azul ✅
- Issue #16: Validación de email ✅
- Issue #17: Nuevo reporte ✅
- Issue #18: Fix de carga lenta ✅

Todo se va juntando en `development` y probando en el servidor de desarrollo.

---

### **9️⃣ Release a Producción**

Cuando tengas un conjunto de cambios listos para producción:

1. Ve a: https://github.com/BDO-Chile/SGM-Contabilidad/pulls
2. Click "New pull request"
3. Configura:
   - `base: production` ← `compare: development`
4. Título: `Release v1.2.0 - [Fecha]`
5. Descripción del release:
   ```markdown
   ## 📦 Release v1.2.0
   
   ### ✨ Nuevas Funcionalidades
   - #15 Botón de login con nuevo diseño azul
   - #17 Reporte de consolidación mensual
   
   ### 🐛 Bug Fixes
   - #18 Optimización de carga de datos
   - #16 Validación de formato de email
   
   ### 🧪 Testing
   - [x] Todas las funcionalidades probadas en desarrollo
   - [x] Migrations verificadas
   - [x] Performance aceptable
   - [x] Aprobado por QA
   
   ### ⚠️ Notas de Deployment
   - Ejecutar migrations antes de reiniciar
   - Limpiar caché de Redis
   ```

6. Solicitar aprobación del Tech Lead o PM
7. Una vez aprobado → **Merge pull request**
8. **¡Automático!** → Workflow despliega a producción (172.17.11.13)

**Resultado**:
- ✅ Código en producción http://172.17.11.13:8000/
- ✅ Release documentado con todos los cambios
- ✅ Historial limpio y trazable

---

## 🚨 Hotfixes Urgentes

Para bugs críticos en producción que no pueden esperar:

```bash
# Crear hotfix desde production
git checkout production
git pull origin production
git checkout -b hotfix/issue-99-critical-auth-bug

# Fix rápido
git add .
git commit -m "hotfix: Corregir autenticación rota

Closes #99"
git push origin hotfix/issue-99-critical-auth-bug
```

**PR directo a production**:
- `base: production` ← `compare: hotfix/issue-99-critical-auth-bug`
- Merge urgente
- Luego hacer **backport** a development:
  ```bash
  git checkout development
  git merge production
  git push origin development
  ```

---

## 📋 Resumen Rápido

| Acción | Comando |
|--------|---------|
| **Tomar issue** | Crear branch desde `development` |
| **Desarrollar** | Commits con `feat:`, `fix:`, etc + `Refs #N` |
| **PR a dev** | `development` ← `feature/issue-N-*` |
| **Release** | `production` ← `development` (agrupa varios issues) |
| **Hotfix** | `production` ← `hotfix/issue-N-*` (urgente) |

---

## 🎯 Ventajas de Este Flujo

✅ **Trazabilidad**: Cada cambio vinculado a un issue  
✅ **Revisión**: Todo código pasa por code review  
✅ **Testing**: Desarrollo es ambiente de staging  
✅ **Documentación**: PRs describen qué y por qué  
✅ **Rollback fácil**: Releases completos, fácil de revertir  
✅ **Deploy automático**: Push → Deploy (CI/CD)  

---

## 🔗 Links Útiles

- **Issues**: https://github.com/BDO-Chile/SGM-Contabilidad/issues
- **Pull Requests**: https://github.com/BDO-Chile/SGM-Contabilidad/pulls
- **Actions (CI/CD)**: https://github.com/BDO-Chile/SGM-Contabilidad/actions
- **Desarrollo**: http://172.17.11.22:8000/
- **Producción**: http://172.17.11.13:8000/
