# Backend Node.js + Express + MySQL

Backend para la app de jefes y empleados.

## Seguridad aplicada

- API Key obligatoria en header `x-api-key`
- Validacion estricta de entrada con `express-validator`
- CORS restringido por lista blanca (`CORS_ORIGINS`)
- Limite de peticiones por ventana (`RATE_LIMIT_*`)
- Cabeceras seguras con `helmet`
- Bloqueo de pollution de parametros con `hpp`
- Consultas preparadas con `mysql2` (prevencion SQL injection)
- Validacion de relacion jefe-empleado al crear reportes

## 1. Instalar y configurar

1. Copia `.env.example` a `.env`.
2. Ajusta usuario, password y nombre de base de datos.
3. Configura una API key robusta en `API_KEY`.

## 2. Crear base de datos en MySQL Workbench

1. Abre MySQL Workbench.
2. Crea o abre una conexion local.
3. Ve a _File > Open SQL Script_ y selecciona `backend/database/schema.sql`.
4. Ejecuta todo el script (icono de rayo).

## 3. Levantar backend

```bash
cd backend
npm run dev
```

Servidor: `http://localhost:4000`

## 4. Endpoints base

- Todos los endpoints (excepto health) requieren header `x-api-key`.

- `GET /api/health`
- `POST /api/bosses`
- `GET /api/bosses/:bossId`
- `POST /api/bosses/:bossId/employees`
- `GET /api/bosses/:bossId/employees`
- `POST /api/reports`
- `GET /api/bosses/:bossId/reports`

## 5. Conexion segura en MySQL Workbench

1. En Workbench abre tu conexion y valida host, puerto, usuario y password.
2. Ejecuta `backend/database/schema.sql`.
3. Usa esos mismos datos en `backend/.env`.
4. Si vas a produccion, configura SSL en Workbench y tambien `DB_SSL_CA` en el backend.
5. Prueba API:

```bash
curl -H "x-api-key: TU_API_KEY" http://localhost:4000/api/health
```

## 6. Ejemplo rapido de payloads

### Crear jefe

```json
{
  "name": "Carla Medina",
  "position": "Jefe de Operaciones",
  "phone": "573001112233",
  "email": "carla@empresa.com",
  "notes": "Turno de dia",
  "plan": "FREE"
}
```

### Crear empleado para jefe

```json
{
  "fullName": "Juan Perez",
  "idNumber": "CC123456",
  "phone": "573115551122",
  "email": "juan@empresa.com"
}
```

### Crear reporte

```json
{
  "bossId": 1,
  "employeeId": 1,
  "observations": "Se completo ruta de mantenimiento.",
  "workDate": "2026-03-15",
  "imageUrls": ["https://mi-cdn.com/foto1.jpg", "https://mi-cdn.com/foto2.jpg"]
}
```
