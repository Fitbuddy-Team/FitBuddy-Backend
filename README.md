## FitBuddy-Backend

Backend de la app móvil FitBuddy. Stack: Node.js, Express, Sequelize. Base local por defecto: SQLite.

### Requisitos
- Node.js 18+

### Instalación
```bash
npm install
```

### Variables de entorno
Copia el archivo `.env.example` a `.env` y ajusta lo necesario.

Variables relevantes:
- `URL_PORT` (default 3000)
- `DB_DIALECT` (sqlite | postgres | mysql | mariadb | mssql)
- `DB_STORAGE` (ruta a .sqlite si usas sqlite)
- `DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD` (si usas un motor distinto a sqlite)
- `SEQUELIZE_LOGGING` (true/false)

```bash
cp .env.example .env
```

### Ejecutar en desarrollo
```bash
npm run dev
```
La API quedará escuchando en `http://localhost:3000`.

Endpoint de salud:
```text
GET /health
```

### Scripts útiles
- `npm run start`: arranca el servidor en modo producción
- `npm run dev`: arranca con nodemon
- `npm run sequelize`: proxy a sequelize-cli
- `npm run db:migrate`: corre migraciones
- `npm run db:migrate:undo`: revierte la última migración
- `npm run db:seed`: ejecuta todos los seeders
- `npm run db:seed:undo`: revierte todos los seeders

### Estructura del proyecto (resumen)
```
src/
  app/
    app.js             # configuración de Express
    routes/
      index.js         # rutas base (/api)
    controllers/
      health.controller.js
    models/
      index.js         # instancia de Sequelize
  config/
    env.js             # carga de .env
  database/
    config.js          # config para sequelize-cli
    migrations/
    seeders/
server.js              # arranque del servidor
```

### Notas para el equipo
- `sequelize-cli` está mapeado a `src/database` y `src/app/models` vía `.sequelizerc`.


