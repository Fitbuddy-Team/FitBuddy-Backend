# Comandos Rápidos para Render

## Comandos en Render Dashboard

### Build Command
```bash
npm install && npm run db:migrate
```

### Start Command
```bash
npm start
```

---

## Comandos en Render Shell (desde Dashboard > Shell)

### Migraciones
```bash
npm run db:migrate
npm run db:migrate:undo
```

### Seeders
```bash
npm run db:seed
npm run db:seed:undo
```

---

## Variables de Entorno Mínimas Requeridas

```bash
# Base de Datos (OBLIGATORIAS)
DB_DIALECT=postgres
DB_HOST=<de tu base de datos Render>
DB_PORT=5432
DB_NAME=<de tu base de datos Render>
DB_USERNAME=<de tu base de datos Render>
DB_PASSWORD=<de tu base de datos Render>

# Servidor (OBLIGATORIAS)
NODE_ENV=production
PORT=10000

# Sequelize (RECOMENDADA)
SEQUELIZE_LOGGING=false

# Auth0 (si usas autenticación)
AUTH0_DOMAIN=<tu-dominio>
AUTH0_CLIENT_ID=<tu-client-id>
AUTH0_CLIENT_SECRET=<tu-secret>
AUTH0_AUDIENCE=<tu-audience>

# Cloudinary (si usas almacenamiento de imágenes)
CLOUDINARY_CLOUD=<tu-cloud-name>
CLOUDINARY_KEY=<tu-api-key>
CLOUDINARY_SECRET=<tu-api-secret>

# Groq/AI (si usas IA)
GROQ_API_KEY=<tu-api-key>
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama-3.1-8b-instant
```

---

## Orden de Pasos

1. **Crear PostgreSQL** en Render Dashboard
2. **Copiar credenciales** de la base de datos
3. **Crear Web Service** en Render Dashboard
4. **Configurar variables** de entorno (todas las de arriba)
5. **Configurar Build Command**: `npm install && npm run db:migrate`
6. **Configurar Start Command**: `npm start`
7. **Crear servicio** y esperar primer deploy
8. **Ejecutar migraciones** desde Shell si no las incluiste en build command
9. **Verificar**: `https://tu-url.onrender.com/health`

---

## URLs Importantes

- **Dashboard Render**: https://dashboard.render.com
- **Tu servicio**: `https://tu-servicio.onrender.com`
- **Health check**: `https://tu-servicio.onrender.com/health`
- **Logs**: Dashboard > Tu Servicio > Pestaña "Logs"
- **Shell**: Dashboard > Tu Servicio > Pestaña "Shell"
- **Variables**: Dashboard > Tu Servicio > Pestaña "Environment"

