# Configurar Auto-Deploy en Render

## ✅ Auto-Deploy está ACTIVADO por defecto

Cuando conectas un repositorio a Render, el auto-deploy **ya viene activado**. Esto significa que cada vez que hagas push a tu rama configurada, Render desplegará automáticamente.

---

## Verificar/Configurar Auto-Deploy

### Paso 1: Ir a Settings de tu Servicio
1. Render Dashboard → Tu servicio web
2. Pestaña **"Settings"** (Configuración)

### Paso 2: Sección "Auto-Deploy"
Busca la sección **"Auto-Deploy"** y verifica:

```
✅ Auto-Deploy: Enabled  ← Debería estar así
Branch: prueba-deploy-andrew  ← Tu rama actual
```

### Paso 3: Configurar la Rama
- **Branch**: Elige la rama que quieres que se despliegue automáticamente
  - `main` o `master` → Para producción
  - `prueba-deploy-andrew` → Para pruebas (tu caso actual)
  - Cualquier otra rama → Para desarrollo

---

## Cómo Funciona

### Flujo Automático

```
1. Haces cambios en tu código local
   ↓
2. git add .
   git commit -m "mi cambio"
   git push origin prueba-deploy-andrew
   ↓
3. Render detecta el push automáticamente
   ↓
4. Render ejecuta el Build Command
   (npm install && npm run db:migrate)
   ↓
5. Render despliega la nueva versión
   ↓
6. Tu app se actualiza automáticamente
```

### Tiempo de Deploy
- **Primera vez**: 2-5 minutos (instala dependencias)
- **Actualizaciones**: 1-3 minutos (solo cambios)

---

## Ver el Progreso del Deploy

### Pestaña "Events"
1. Render Dashboard → Tu servicio
2. Pestaña **"Events"**
3. Verás el historial completo de deploys

Ejemplo de lo que verás:
```
✅ Deploy started (latest commit: abc123)
  → Building...
  → Installing dependencies...
  → Running build command...
✅ Build succeeded
✅ Deploy succeeded
```

### Pestaña "Logs"
1. Pestaña **"Logs"**
2. Verás los logs en tiempo real durante el deploy

---

## Desactivar Auto-Deploy (Opcional)

Si prefieres controlar cuándo se despliega:

1. Settings → Sección "Auto-Deploy"
2. Cambia a **"Auto-Deploy: Disabled"**
3. Guarda los cambios

**Para desplegar manualmente:**
- Dashboard → Tu servicio → Botón **"Manual Deploy"**

---

## Configuraciones Avanzadas

### Deploy de una Rama Específica

En Settings → Auto-Deploy:
```
Branch: main
```
Solo se desplegará cuando hagas push a `main`.

### Ignorar Commits Específicos

Puedes agregar `[skip deploy]` en el mensaje del commit:
```bash
git commit -m "Actualizar README [skip deploy]"
```

Render ignorará ese commit y no hará deploy automático.

### Pull Request Previews

En planes de pago, puedes activar:
- **Pull Request Previews**: Crea un preview de tu app para cada PR
- Útil para testing antes de merge

---

## Solución de Problemas

### El auto-deploy no se activa

**Verifica:**
1. ✅ Settings → Auto-Deploy está en "Enabled"
2. ✅ La rama configurada coincide con la que haces push
3. ✅ Tienes permisos en el repositorio
4. ✅ El repositorio está correctamente conectado

**Reconectar el repositorio:**
1. Settings → Sección "Repository"
2. **"Disconnect"** → **"Connect"**
3. Autoriza el acceso nuevamente

### El deploy falla

**Revisa:**
1. Pestaña **"Events"** → Ver qué error aparece
2. Pestaña **"Logs"** → Ver logs detallados
3. Verifica que el Build Command sea correcto
4. Verifica variables de entorno

---

## Ejemplo Práctico

### Configuración Actual Recomendada

```
Servicio: fitbuddy-backend
Branch: prueba-deploy-andrew
Auto-Deploy: ✅ Enabled
Build Command: npm install && npx sequelize-cli db:migrate
Start Command: npm start
```

### Cada vez que hagas push:

```bash
# 1. Hacer cambios
# 2. Commit
git add .
git commit -m "Agregar nueva feature"

# 3. Push (esto activa el auto-deploy)
git push origin prueba-deploy-andrew

# 4. Ir a Render Dashboard
# 5. Ver pestaña "Events" para ver el progreso
```

---

## Checklist

- [ ] Auto-Deploy está **Enabled** en Settings
- [ ] La rama configurada es la correcta
- [ ] El repositorio está conectado correctamente
- [ ] Hice push a la rama configurada
- [ ] Veo el deploy en la pestaña "Events"

---

## Notas Importantes

⚠️ **En plan Free:**
- El servicio puede tardar unos segundos en "despertar" si estuvo suspendido
- El auto-deploy funciona igual, pero puede tomar más tiempo la primera vez

✅ **Best Practices:**
- Usa `main` o `master` para producción
- Usa ramas separadas para desarrollo/testing
- Revisa los logs después de cada deploy
- Verifica que el endpoint `/health` responda después del deploy

---

¡Listo! Tu auto-deploy debería estar funcionando. 🚀

Cada push a tu rama configurada desplegará automáticamente tu aplicación.

