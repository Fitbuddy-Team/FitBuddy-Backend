# Cómo Obtener el DB_HOST para Render

## Para desarrollo local (.env)

Si estás configurando tu archivo `.env` local, usa:
```bash
DB_HOST=localhost
```
(Porque PostgreSQL está corriendo en tu máquina local)

---

## Para producción en Render

El valor de `DB_HOST` lo obtienes de tu base de datos PostgreSQL creada en Render:

### Paso 1: Ir a tu Base de Datos en Render
1. Entra a [dashboard.render.com](https://dashboard.render.com)
2. Haz clic en tu base de datos PostgreSQL (ejemplo: `fitbuddy-db`)

### Paso 2: Ir a la pestaña "Connections"
1. En la página de tu base de datos, busca la pestaña **"Connections"**
2. Ahí encontrarás toda la información de conexión

### Paso 3: Copiar el Host
Encontrarás algo como esto:

```
Host: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
Database: fitbuddy_prod
User: fitbuddy_user_xxxxx
Password: abc123xyz789password
```

El **Host** es el valor que debes poner en `DB_HOST`

### Ejemplo de cómo debería verse:

**En Render Dashboard (Environment Variables):**
```
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
```

**O en tu .env local (si quieres probar la conexión desde tu máquina):**
```
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
```

---

## Formato típico del Host de Render

Los hosts de Render tienen un formato como:
```
dpg-[hash]-[region].postgres.render.com
```

Ejemplos:
- `dpg-abc123xyz-a.oregon-postgres.render.com`
- `dpg-def456uvw-b.singapore-postgres.render.com`
- `dpg-ghi789rst-c.frankfurt-postgres.render.com`

**⚠️ IMPORTANTE:**
- NO incluyas `http://` o `https://`
- NO incluyas el puerto (ese va en `DB_PORT`)
- Solo el dominio, por ejemplo: `dpg-xxxxx-a.oregon-postgres.render.com`

---

## Resumen Visual

```
┌─────────────────────────────────────────┐
│  Render Dashboard                       │
│  Base de Datos: fitbuddy-db            │
│                                         │
│  Pestaña: Connections                   │
│  ─────────────────────────────────────  │
│  Host: dpg-xxxxx-a.oregon-postgres...  │ ← COPIAR ESTO
│  Port: 5432                             │
│  Database: fitbuddy_prod                │
│  User: fitbuddy_user                    │
│  Password: ********                     │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  Variables de Entorno en Render        │
│  ─────────────────────────────────────  │
│  DB_HOST=dpg-xxxxx-a.oregon-postgres...│ ← PEGAR AQUÍ
│  DB_PORT=5432                           │
│  DB_NAME=fitbuddy_prod                  │
│  DB_USERNAME=fitbuddy_user              │
│  DB_PASSWORD=********                   │
└─────────────────────────────────────────┘
```

---

## Si no has creado la base de datos todavía

1. Ve a Render Dashboard
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura la base de datos
4. Una vez creada, ve a la pestaña **"Connections"**
5. Copia el **Host** y úsalo como `DB_HOST`

---

## Nota adicional

Si estás usando la base de datos **dentro de la misma región** que tu servicio web, también puedes usar la **"Internal Database URL"** que Render proporciona, pero es más fácil usar las variables individuales como te explico arriba.

