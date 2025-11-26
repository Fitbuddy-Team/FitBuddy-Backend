# Guía de Deploy en Render - FitBuddy Backend

Esta guía te ayudará a desplegar el backend de FitBuddy en Render paso a paso.

## Tabla de Contenidos
1. [Preparación Inicial](#preparación-inicial)
2. [Crear Base de Datos PostgreSQL en Render](#crear-base-de-datos-postgresql-en-render)
3. [Crear Servicio Web en Render](#crear-servicio-web-en-render)
4. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
5. [Scripts y Comandos Necesarios](#scripts-y-comandos-necesarios)
6. [Verificar el Deploy](#verificar-el-deploy)
7. [Solución de Problemas](#solución-de-problemas)

---

## Preparación Inicial

### 1. Asegúrate de que tu código esté en GitHub/GitLab/Bitbucket

```bash
# Verifica que tu código esté en el repositorio remoto
git remote -v

# Si no tienes un repositorio remoto, créalo y haz push
git remote add origin https://github.com/tu-usuario/fitbuddy-backend.git
git push -u origin main
```

### 2. Verifica que tu proyecto tenga los archivos necesarios

- ✅ `package.json` con script `start`
- ✅ `src/server.js` como punto de entrada
- ✅ Todas las dependencias listadas en `package.json`

### 3. Configuración del Servidor para Render

⚠️ **IMPORTANTE**: El servidor debe escuchar en `0.0.0.0` (todas las interfaces) para que Render pueda acceder a él. 

Tu archivo `src/server.js` ya está configurado correctamente:
```javascript
server.listen(config.port, '0.0.0.0', () => {
  console.log(`API server listening on http://0.0.0.0:${config.port}`);
});
```

---

## Crear Base de Datos PostgreSQL en Render

### Paso 1: Acceder a Render Dashboard
1. Ve a [render.com](https://render.com)
2. Inicia sesión o crea una cuenta (puedes usar GitHub)

### Paso 2: Crear Base de Datos PostgreSQL
1. En el Dashboard, haz clic en **"New +"**
2. Selecciona **"PostgreSQL"**
3. Configura la base de datos:
   - **Name**: `fitbuddy-db` (o el nombre que prefieras)
   - **Database**: `fitbuddy_prod` (o el que prefieras)
   - **User**: Se generará automáticamente
   - **Region**: Elige la región más cercana a tus usuarios
   - **PostgreSQL Version**: `16` (recomendado) o la versión más reciente
   - **Plan**: 
     - **Free**: Para desarrollo/pruebas (se suspende después de inactividad)
     - **Starter ($7/mes)**: Para producción pequeña
     - **Standard o Professional**: Para producción con alta demanda

4. Haz clic en **"Create Database"**

### Paso 3: Obtener Credenciales de la Base de Datos
Una vez creada la base de datos:
1. Ve a la pestaña **"Connections"**
2. Copia los siguientes valores (los necesitarás más adelante):
   - **Host**: Ejemplo: `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: Generalmente `5432`
   - **Database**: El nombre que configuraste
   - **User**: Se genera automáticamente
   - **Password**: Se genera automáticamente (cópialo inmediatamente, solo se muestra una vez)
   - **Internal Database URL**: Ejemplo: `postgresql://user:password@host:port/database`
   - **External Database URL**: Para conexiones externas

**⚠️ IMPORTANTE**: Guarda estas credenciales en un lugar seguro. La contraseña solo se muestra una vez.

---

## Crear Servicio Web en Render

### Paso 1: Crear Nuevo Web Service
1. En el Dashboard, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Si es la primera vez, autoriza Render a acceder a tu repositorio
   - Selecciona el repositorio `fitbuddy-backend`
   - Selecciona la rama (generalmente `main` o `master`)

### Paso 2: Configurar el Servicio

Configura los siguientes valores:

#### Información Básica:
- **Name**: `fitbuddy-backend` (o el nombre que prefieras)
- **Region**: Misma región que la base de datos (recomendado)
- **Branch**: `main` (o la rama que uses para producción)
- **Root Directory**: Deja vacío (o usa `.` si es necesario)

#### Build & Deploy:
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install && npm run db:migrate
  ```
  ⚠️ Nota: Si prefieres hacer las migraciones manualmente, usa solo `npm install`

- **Start Command**: 
  ```bash
  npm start
  ```

#### Plan:
- **Free**: Para desarrollo/pruebas (se suspende después de 15 min de inactividad)
- **Starter ($7/mes)**: Para producción pequeña
- **Standard o Professional**: Para producción con más recursos

### Paso 3: NO hagas clic en "Create Web Service" todavía
Primero configuraremos las variables de entorno en el siguiente paso.

---

## Configurar Variables de Entorno

En la misma página donde estás creando el Web Service, desplázate hacia abajo hasta la sección **"Environment Variables"**.

Agrega las siguientes variables una por una:

### Variables de Base de Datos (PostgreSQL)
```
DB_DIALECT=postgres
DB_HOST=<HOST de tu base de datos>
DB_PORT=5432
DB_NAME=<NOMBRE de tu base de datos>
DB_USERNAME=<USER de tu base de datos>
DB_PASSWORD=<PASSWORD de tu base de datos>
```

**Ejemplo:**
```
DB_DIALECT=postgres
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=fitbuddy_prod
DB_USERNAME=fitbuddy_user
DB_PASSWORD=abc123xyz789password
```

### Variables del Servidor
```
NODE_ENV=production
PORT=10000
```
⚠️ **Nota**: Render asigna automáticamente la variable `PORT`. Tu código ya está preparado para usar `PORT` o `URL_PORT` (ver `src/config/env.js`).

### Variables de Sequelize
```
SEQUELIZE_LOGGING=false
```

### Variables de Auth0 (si las usas)
```
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu_client_id
AUTH0_CLIENT_SECRET=tu_client_secret
AUTH0_AUDIENCE=tu_audience
```

### Variables de Cloudinary (si las usas)
```
CLOUDINARY_CLOUD=tu_cloud_name
CLOUDINARY_KEY=tu_api_key
CLOUDINARY_SECRET=tu_api_secret
```

### Variables de IA/Groq (si las usas)
```
GROQ_API_KEY=tu_api_key
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama-3.1-8b-instant
```

### Otras Variables (opcionales)
```
URL_PORT=10000
```

---

## Resumen Completo de Variables de Entorno

Aquí está la lista completa que debes agregar en Render:

```
# Base de Datos
DB_DIALECT=postgres
DB_HOST=<valor de Render>
DB_PORT=5432
DB_NAME=<valor de Render>
DB_USERNAME=<valor de Render>
DB_PASSWORD=<valor de Render>

# Servidor
NODE_ENV=production
PORT=10000

# Sequelize
SEQUELIZE_LOGGING=false

# Auth0 (si aplica)
AUTH0_DOMAIN=<tu-dominio.auth0.com>
AUTH0_CLIENT_ID=<tu-client-id>
AUTH0_CLIENT_SECRET=<tu-client-secret>
AUTH0_AUDIENCE=<tu-audience>

# Cloudinary (si aplica)
CLOUDINARY_CLOUD=<tu-cloud-name>
CLOUDINARY_KEY=<tu-api-key>
CLOUDINARY_SECRET=<tu-api-secret>

# Groq/AI (si aplica)
GROQ_API_KEY=<tu-api-key>
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama-3.1-8b-instant
```

---

## Scripts y Comandos Necesarios

### Verificar que package.json tenga el script start
Tu `package.json` ya tiene:
```json
"start": "node src/server.js"
```

✅ Esto está correcto.

### Opción: Agregar script de postdeploy (Opcional)

Si quieres ejecutar migraciones automáticamente después de cada deploy, puedes crear un script `render.yaml` en la raíz del proyecto:

```yaml
services:
  - type: web
    name: fitbuddy-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

Sin embargo, es más flexible configurar todo desde el Dashboard de Render.

---

## Crear y Desplegar el Servicio

### Paso 1: Crear el Web Service
Después de agregar todas las variables de entorno:
1. Haz clic en **"Create Web Service"**
2. Render comenzará a:
   - Clonar tu repositorio
   - Instalar dependencias (`npm install`)
   - Ejecutar el build command (si configuraste uno)
   - Iniciar el servidor

### Paso 2: Ejecutar Migraciones de Base de Datos

**Opción A: Desde Render Shell (Recomendado)**
1. En el Dashboard de tu servicio web, ve a la pestaña **"Shell"**
2. Ejecuta:
   ```bash
   npm run db:migrate
   ```
3. (Opcional) Si tienes seeders:
   ```bash
   npm run db:seed
   ```

**Opción B: Desde tu máquina local**
1. Configura temporalmente tu `.env` local con las credenciales de Render:
   ```bash
   DB_DIALECT=postgres
   DB_HOST=<host-de-render>
   DB_PORT=5432
   DB_NAME=<nombre-de-render>
   DB_USERNAME=<usuario-de-render>
   DB_PASSWORD=<password-de-render>
   ```
2. Ejecuta:
   ```bash
   npm run db:migrate
   npm run db:seed  # opcional
   ```

**Opción C: Automático en cada deploy**
Modifica el build command en Render a:
```bash
npm install && npm run db:migrate
```
⚠️ **Nota**: Esto ejecutará migraciones en cada deploy. Asegúrate de que tus migraciones sean idempotentes.

---

## Verificar el Deploy

### 1. Revisar Logs
1. En el Dashboard de tu servicio, ve a la pestaña **"Logs"**
2. Deberías ver:
   ```
   API server listening on http://localhost:10000
   ```
   O similar.

### 2. Verificar el Endpoint de Salud
1. Copia la URL de tu servicio (ejemplo: `https://fitbuddy-backend.onrender.com`)
2. Visita: `https://tu-url.onrender.com/health`
3. Deberías recibir una respuesta exitosa

### 3. Probar Conexión a la Base de Datos
Revisa los logs para asegurarte de que no hay errores de conexión a la base de datos.

---

## Solución de Problemas

### Problema: El servicio no inicia
**Solución:**
1. Revisa los logs en Render
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` sean correctos
4. Verifica que el `PORT` esté configurado (Render lo asigna automáticamente, pero tu código debe leerlo)

### Problema: Error de conexión a la base de datos
**Solución:**
1. Verifica que la base de datos esté activa (no suspendida en plan Free)
2. Asegúrate de usar las credenciales correctas de la pestaña **"Connections"**
3. Verifica que `DB_DIALECT=postgres` esté configurado
4. Si usas plan Free, la base de datos puede tardar unos segundos en activarse

### Problema: Migraciones no se ejecutan
**Solución:**
1. Ejecuta manualmente desde el Shell de Render:
   ```bash
   npm run db:migrate
   ```
2. O agrega `npm run db:migrate` al build command

### Problema: El servicio se suspende (Plan Free)
**Solución:**
- El plan Free suspende servicios después de 15 minutos de inactividad
- Para producción, considera el plan Starter ($7/mes)
- Puedes usar un servicio como [UptimeRobot](https://uptimerobot.com) para hacer ping periódico y mantener el servicio activo

### Problema: Variables de entorno no se cargan
**Solución:**
1. Verifica que los nombres de las variables coincidan exactamente (case-sensitive)
2. Asegúrate de que `dotenv` esté instalado (ya está en tu `package.json`)
3. Reinicia el servicio después de agregar nuevas variables

### Problema: Error en el build
**Solución:**
1. Revisa los logs del build
2. Verifica que Node.js versión sea compatible (Render usa Node 20+ por defecto)
3. Asegúrate de que todas las dependencias estén en `package.json`
4. Verifica que no haya errores de sintaxis

---

## Comandos Útiles en Render Shell

Una vez desplegado, puedes acceder al Shell desde el Dashboard:

```bash
# Ejecutar migraciones
npm run db:migrate

# Revertir última migración
npm run db:migrate:undo

# Ejecutar seeders
npm run db:seed

# Revertir seeders
npm run db:seed:undo

# Verificar logs del servidor
# (Se ven automáticamente en la pestaña Logs del Dashboard)
```

---

## Configurar Deploy Automático (Auto-Deploy)

### ¿Qué es el Auto-Deploy?
El auto-deploy hace que Render despliegue automáticamente tu aplicación cada vez que hagas push a la rama configurada (por ejemplo, `main` o `prueba-deploy-andrew`).

### Configuración del Auto-Deploy

**Por defecto, Render tiene el auto-deploy ACTIVADO** cuando conectas un repositorio. Pero puedes verificar y ajustar la configuración así:

#### Paso 1: Acceder a la Configuración del Servicio
1. Ve a tu servicio web en Render Dashboard
2. Haz clic en la pestaña **"Settings"** (Configuración)
3. Desplázate hasta la sección **"Auto-Deploy"**

#### Paso 2: Verificar/Configurar Auto-Deploy
Deberías ver estas opciones:

**✅ Auto-Deploy: Enabled (Recomendado)**
- Render detecta automáticamente cada push a la rama configurada
- Ejecuta el build automáticamente
- Despliega la nueva versión

**⚠️ Auto-Deploy: Disabled (Manual)**
- Solo despliegas manualmente desde el Dashboard
- Útil si quieres controlar cuándo se despliega

#### Paso 3: Configurar la Rama (Branch)
En la misma sección de Settings, verifica:
- **Branch**: Asegúrate de que sea la rama correcta (ejemplo: `main`, `master`, `prueba-deploy-andrew`)

**Para tu caso específico:**
- Si quieres que se despliegue cada vez que hagas push a `prueba-deploy-andrew`, configúrala como:
  ```
  Branch: prueba-deploy-andrew
  ```

#### Paso 4: Configuraciones Adicionales (Opcional)

**Pull Request Previews** (Solo en planes de pago):
- Render puede crear previews de tu app para cada Pull Request
- Útil para testing antes de merge

**Render Deploy Hooks** (Webhooks):
- Puedes configurar webhooks para notificarte cuando hay un deploy
- Útil para integrar con Slack, Discord, etc.

### Verificar que el Auto-Deploy Está Funcionando

1. **Haz un cambio pequeño** en tu código
2. **Haz commit y push:**
   ```bash
   git add .
   git commit -m "test: verificar auto-deploy"
   git push origin prueba-deploy-andrew
   ```
3. **Ve a Render Dashboard** → Tu servicio → Pestaña **"Events"**
4. Deberías ver que Render detecta el push y comienza a hacer build automáticamente

### Si el Auto-Deploy No Funciona

**Verifica:**
1. ✅ Que el repositorio esté correctamente conectado
2. ✅ Que la rama configurada coincida con la rama a la que haces push
3. ✅ Que tengas permisos de acceso al repositorio en Render
4. ✅ Revisa la pestaña **"Events"** para ver errores

**Si necesitas reconectar el repositorio:**
1. Settings → Scroll hasta **"Repository"**
2. Haz clic en **"Disconnect"** y luego **"Connect"** nuevamente
3. Autoriza el acceso si es necesario

---

## Actualizar el Deploy

Cada vez que hagas push a la rama configurada (generalmente `main`):
1. Render detectará automáticamente los cambios (si auto-deploy está activado)
2. Ejecutará el build command
3. Desplegará la nueva versión
4. El servicio se reiniciará automáticamente

Puedes ver el progreso en tiempo real en la pestaña **"Events"** del Dashboard.

### Deploy Manual (si auto-deploy está desactivado)
Si tienes auto-deploy desactivado, puedes desplegar manualmente:
1. Ve a tu servicio en Render Dashboard
2. Haz clic en **"Manual Deploy"**
3. Selecciona la rama o commit que quieres desplegar
4. Haz clic en **"Deploy latest commit"**

---

## Configuración Avanzada (Opcional)

### Variables de Entorno desde Render Dashboard
- Puedes actualizar variables de entorno en cualquier momento
- Los cambios requieren un reinicio del servicio
- Puedes usar **Environment Groups** para compartir variables entre servicios

### Health Checks
Render monitorea automáticamente la salud del servicio. Puedes configurar un health check endpoint personalizado si lo deseas.

### Custom Domain
Puedes conectar un dominio personalizado:
1. Ve a la configuración del servicio
2. Sección **"Custom Domains"**
3. Agrega tu dominio y sigue las instrucciones de DNS

---

## Resumen Rápido

1. ✅ Sube tu código a GitHub/GitLab/Bitbucket
2. ✅ Crea una base de datos PostgreSQL en Render
3. ✅ Crea un Web Service en Render
4. ✅ Configura todas las variables de entorno
5. ✅ Ejecuta migraciones de base de datos
6. ✅ Verifica que el servicio esté funcionando

---

## Checklist Final

- [ ] Repositorio en GitHub/GitLab/Bitbucket
- [ ] Base de datos PostgreSQL creada en Render
- [ ] Credenciales de base de datos guardadas
- [ ] Web Service creado en Render
- [ ] Todas las variables de entorno configuradas
- [ ] Build command configurado
- [ ] Start command configurado (`npm start`)
- [ ] Migraciones ejecutadas
- [ ] Endpoint `/health` responde correctamente
- [ ] Servicio está funcionando

¡Listo! Tu backend debería estar funcionando en Render. 🚀

