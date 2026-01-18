# Dashboard de Métricas - Sistema de Control

Dashboard visual para el seguimiento de métricas de negocio con integración N8N y despliegue en Dokploy.

## Características

- **Dashboard Semanal**: 6 métricas clave (MRR, Pipeline, Cierres, Contenido, Leads, Entregas)
- **Scorecard Mensual**: Registro histórico de indicadores mensuales
- **Checks Diarios**: Seguimiento de tareas diarias (contenido, leads)
- **Panel Admin**: Edición manual de métricas protegida con contraseña
- **API REST**: Endpoints para integración con N8N y otras herramientas
- **Personalización**: Colores de marca y logo configurables

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS + Framer Motion
- **Base de Datos**: SQLite + Prisma ORM
- **Despliegue**: Docker / Dokploy

---

## Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/infobotlivery/Dashboard.git
cd Dashboard
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="tu-contraseña-segura"
API_SECRET_KEY="tu-clave-api-para-n8n"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Inicializar la base de datos

```bash
npx prisma db push
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Despliegue en Dokploy

### 1. Subir a GitHub

```bash
git add .
git commit -m "Initial commit - Dashboard de Métricas"
git push origin main
```

### 2. Configurar en Dokploy

1. Accede a tu panel de Dokploy
2. Crea una nueva aplicación
3. Selecciona "GitHub" como fuente
4. Conecta el repositorio `infobotlivery/Dashboard`
5. Configura las variables de entorno:
   - `DATABASE_URL`: `file:./data/metrics.db`
   - `ADMIN_PASSWORD`: Tu contraseña segura
   - `API_SECRET_KEY`: Una clave aleatoria larga
   - `NEXT_PUBLIC_APP_URL`: URL de tu dominio
6. Habilita "Persistent Storage" para `/app/prisma` (para la base de datos)
7. Deploy!

### 3. Configurar dominio (opcional)

En Dokploy, configura tu dominio personalizado en la sección "Domains".

---

## Uso del Dashboard

### Dashboard Público (/)

Vista de solo lectura con:
- 6 métricas semanales con indicadores de progreso
- Scorecard mensual comparativo
- Árbol de cadencias de revisión

### Panel Admin (/admin)

1. Ingresa con la contraseña configurada en `ADMIN_PASSWORD`
2. Edita métricas semanales, scorecards mensuales o checks diarios
3. Configura colores de marca y logo
4. Cambia la contraseña si lo necesitas

---

## API REST para N8N

### Autenticación

Todos los endpoints POST requieren el header `X-API-Key`:

```
X-API-Key: tu-clave-api-configurada
```

### Endpoints Disponibles

#### Métricas Semanales

**GET /api/metrics**
- Obtiene las últimas métricas semanales
- Query params: `limit` (default: 12), `current=true` (semana actual)

**GET /api/metrics/current**
- Obtiene la métrica de la semana actual

**POST /api/metrics**
- Crea o actualiza una métrica semanal

```json
{
  "weekStart": "2025-01-13",
  "mrr": 1200,
  "pipelineActivo": 8,
  "cierresSemana": 1500,
  "contenidoPublicado": 4,
  "leadsEntrantes": 12,
  "entregasPendientes": 2
}
```

#### Scorecard Mensual

**GET /api/scorecard**
- Obtiene los scorecards mensuales
- Query params: `limit` (default: 12), `current=true` (mes actual)

**POST /api/scorecard**

```json
{
  "month": "2025-01-01",
  "facturacionTotal": 5000,
  "mrr": 1500,
  "clientesNuevos": 3,
  "clientesPerdidos": 1,
  "enigmaVendidos": 2,
  "serviciosRecurrentes": 5,
  "leadsTotales": 45,
  "tasaCierre": 15.5
}
```

#### Checks Diarios

**GET /api/daily**
- Obtiene los checks diarios
- Query params: `limit` (default: 30), `today=true` (día actual)

**POST /api/daily**

```json
{
  "date": "2025-01-18",
  "publicoContenido": true,
  "respondioLeads": true,
  "notas": "Día productivo"
}
```

### Ejemplo con N8N

1. Crea un nuevo workflow
2. Agrega un nodo "HTTP Request"
3. Configura:
   - Method: `POST`
   - URL: `https://tu-dominio.com/api/metrics`
   - Authentication: None
   - Headers: `X-API-Key: tu-clave-api`
   - Body Content Type: `JSON`
   - Body: Tu JSON con las métricas

---

## Personalización de Marca

### Desde el Panel Admin

1. Ve a `/admin` → pestaña "Configuración"
2. Selecciona tus colores con el picker o escribe el código hex
3. Pega la URL de tu logo
4. Guarda los cambios

### Desde el Código (avanzado)

Edita `tailwind.config.ts` para cambiar los colores base:

```typescript
colors: {
  brand: {
    primary: '#44e1fc',  // Tu color primario
    dark: '#171717',     // Color de fondo oscuro
  },
},
```

Edita `src/app/globals.css` para las variables CSS:

```css
:root {
  --brand-primary: #44e1fc;
  --brand-dark: #171717;
}
```

---

## Estructura del Proyecto

```
dashboard-metricas/
├── prisma/
│   └── schema.prisma        # Modelo de datos
├── src/
│   ├── app/
│   │   ├── page.tsx         # Dashboard público
│   │   ├── admin/
│   │   │   └── page.tsx     # Panel de edición
│   │   ├── api/             # Endpoints REST
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/              # Componentes base
│   │   ├── dashboard/       # Widgets del dashboard
│   │   └── admin/           # Componentes admin
│   └── lib/
│       ├── db.ts            # Cliente Prisma
│       └── api.ts           # Helpers API
├── .env.example             # Variables de entorno ejemplo
├── Dockerfile               # Para Dokploy
├── tailwind.config.ts
└── package.json
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm run start

# Inicializar/actualizar base de datos
npm run db:push

# Ver base de datos (Prisma Studio)
npm run db:studio
```

---

## Solución de Problemas

### "Error al obtener métricas"

1. Verifica que la base de datos esté inicializada: `npx prisma db push`
2. Revisa que las variables de entorno estén correctas

### "API Key inválida"

1. Verifica que el header `X-API-Key` coincida con `API_SECRET_KEY` en `.env`
2. El header es case-sensitive

### "Contraseña incorrecta" en admin

1. La contraseña se hashea en el primer uso
2. Si la olvidaste, borra la base de datos y reinicia: `rm prisma/dev.db`

---

## Licencia

Proyecto privado - Todos los derechos reservados.
