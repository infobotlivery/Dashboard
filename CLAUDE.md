# Contexto del Proyecto Dashboard

> Este archivo contiene el contexto completo del proyecto para Claude Code.
> Se lee automáticamente al inicio de cada sesión.

---

## Información del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | Dashboard de Métricas / Sistema de Control |
| **Propietario** | El Rapero Marketero (Botlivery) |
| **URL Producción** | https://dashboard.elraperomarketero.com |
| **Repositorio** | https://github.com/infobotlivery/Dashboard |
| **Hosting** | Docker en Dokploy |

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 14.2.35 | Framework React (App Router) |
| React | 18.3.1 | UI |
| TypeScript | 5.9.3 | Tipado estático |
| Prisma | 5.22.0 | ORM para base de datos |
| SQLite | - | Base de datos (archivo) |
| Tailwind CSS | 3.4.19 | Estilos |
| Framer Motion | 12.27.0 | Animaciones |
| Docker | Alpine | Containerización |
| bcryptjs | 3.0.3 | Hash de contraseñas |

---

## Estructura del Proyecto

```
Dashboard/
├── src/
│   ├── middleware.ts             # Middleware de autenticación para APIs
│   ├── app/
│   │   ├── page.tsx              # Dashboard público principal
│   │   ├── admin/page.tsx        # Panel de administración (protegido)
│   │   ├── finanzas/page.tsx     # Dashboard financiero privado (protegido)
│   │   ├── layout.tsx            # Layout principal
│   │   ├── globals.css           # Estilos globales
│   │   └── api/
│   │       ├── auth/route.ts     # Autenticación admin
│   │       ├── metrics/
│   │       │   ├── route.ts      # CRUD métricas semanales
│   │       │   ├── current/route.ts    # Métrica semana actual
│   │       │   └── comparison/route.ts # Comparativa semanal
│   │       ├── finance/
│   │       │   ├── summary/route.ts    # Resumen financiero mensual
│   │       │   ├── history/route.ts    # Histórico últimos 6 meses (solo 2026+)
│   │       │   ├── expenses/route.ts   # CRUD gastos
│   │       │   ├── expenses/upcoming/route.ts # Próximos 5 pagos
│   │       │   ├── categories/route.ts # CRUD categorías de gastos
│   │       │   ├── goals/route.ts      # CRUD metas mensuales
│   │       │   └── export/route.ts     # Exportar CSV
│   │       ├── scorecard/route.ts      # CRUD scorecard mensual
│   │       ├── daily/route.ts          # CRUD checks diarios
│   │       ├── sales/route.ts          # CRUD cierres de ventas
│   │       ├── settings/route.ts       # Configuración y branding
│   │       └── webhooks/
│   │           └── kommo/route.ts      # Webhook para Kommo CRM
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── WeeklyDashboard.tsx     # Grid de 7 métricas semanales
│   │   │   ├── WeeklyComparison.tsx    # Tabla comparativa semanal
│   │   │   ├── MetricCard.tsx          # Card individual de métrica
│   │   │   ├── MonthlyScorecard.tsx    # Tabla scorecard mensual
│   │   │   ├── SalesCloseTable.tsx     # Tabla de cierres de ventas
│   │   │   └── CadenceTree.tsx         # Árbol de cadencias
│   │   ├── finanzas/
│   │   │   ├── index.ts                # Exportaciones centrales
│   │   │   ├── GlassCard.tsx           # Card con glassmorphism
│   │   │   ├── AnimatedNumber.tsx      # Números animados
│   │   │   ├── ProgressBar.tsx         # Barra de progreso para metas
│   │   │   ├── FinanceSidebar.tsx      # Sidebar lateral + mobile nav
│   │   │   ├── LoginScreen.tsx         # Pantalla de login
│   │   │   ├── ExportButton.tsx        # Botón exportar CSV
│   │   │   ├── UpcomingPayments.tsx    # Tabla de próximos 5 pagos
│   │   │   └── tabs/
│   │   │       ├── index.ts            # Exportaciones de tabs
│   │   │       ├── ResumenTab.tsx      # Tab resumen financiero
│   │   │       ├── GastosTab.tsx       # Tab gestión gastos
│   │   │       ├── CategoriasTab.tsx   # Tab categorías
│   │   │       ├── HistorialTab.tsx    # Tab historial mensual
│   │   │       └── MetasTab.tsx        # Tab metas mensuales
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── NumberInput.tsx
│   │       ├── Toggle.tsx
│   │       ├── DateSelector.tsx
│   │       └── Select.tsx              # Dropdown select
│   │
│   └── lib/
│       ├── db.ts                 # Cliente Prisma singleton
│       └── api.ts                # Utilidades API + auth (createAuthToken, verifyAuthToken)
│
├── prisma/
│   └── schema.prisma             # Modelos de base de datos
│
├── scripts/
│   ├── start-production.js       # Script de inicio en Docker
│   └── docker-entrypoint.sh      # Entrypoint de Docker
│
├── public/                        # Archivos estáticos
├── Dockerfile                     # Build multi-stage
├── .env.example                   # Variables de entorno ejemplo
└── CLAUDE.md                      # Este archivo
```

---

## Modelos de Datos (Prisma)

### WeeklyMetric
Métricas semanales del dashboard principal.
```prisma
model WeeklyMetric {
  id                 Int      @id @default(autoincrement())
  weekStart          DateTime @unique  // Lunes de la semana
  mrr                Float    @default(0)  // MRR Clientes
  mrrComunidad       Float    @default(0)  // MRR Comunidad
  pipelineActivo     Int      @default(0)  // Leads calientes
  cierresSemana      Float    @default(0)  // Ventas cerradas
  contenidoPublicado Int      @default(0)  // Piezas de contenido
  leadsEntrantes     Int      @default(0)  // Nuevas consultas
  entregasPendientes Int      @default(0)  // Proyectos sin cerrar
}
```

### MonthlyScorecard
Scorecard mensual con visión general del negocio.
```prisma
model MonthlyScorecard {
  id                    Int      @id @default(autoincrement())
  month                 DateTime @unique  // Primer día del mes
  facturacionTotal      Float    @default(0)
  mrr                   Float    @default(0)
  clientesNuevos        Int      @default(0)
  clientesPerdidos      Int      @default(0)
  enigmaVendidos        Int      @default(0)
  serviciosRecurrentes  Int      @default(0)
  leadsTotales          Int      @default(0)
  tasaCierre            Float    @default(0)  // Porcentaje
}
```

### DailyCheck
Checks diarios de actividades.
```prisma
model DailyCheck {
  id               Int      @id @default(autoincrement())
  date             DateTime @unique
  publicoContenido Boolean  @default(false)
  respondioLeads   Boolean  @default(false)
  notas            String?
}
```

### AdminSettings
Configuración de admin y branding.
```prisma
model AdminSettings {
  id           Int     @id @default(1)
  passwordHash String
  brandPrimary String  @default("#44e1fc")
  brandDark    String  @default("#171717")
  logoUrl      String?
}
```

### SalesClose
Registro de cierres de ventas con clientes.
```prisma
model SalesClose {
  id              Int       @id @default(autoincrement())
  clientName      String                              // Nombre del cliente
  product         String                              // Enigma, CRM, Agente IA, Asesoría, Otro
  customProduct   String?                             // Solo si product = "Otro"
  onboardingValue Float     @default(0)               // Pago único
  recurringValue  Float     @default(0)               // Pago mensual (suma a MRR si activo)
  contractMonths  Int?                                // Duración contrato (meses)
  status          String    @default("active")        // active, cancelled, completed
  createdAt       DateTime  @default(now())
  cancelledAt     DateTime?
  updatedAt       DateTime  @updatedAt
}
```

**Estados:**
- `active` → Cliente activo, suma al MRR
- `cancelled` → Cliente canceló, no suma al MRR
- `completed` → Servicio sin recurrencia completado (Enigma, Asesoría)

**MRR Híbrido:** El MRR mostrado = MRR manual + suma de `recurringValue` donde `status='active'`

### KommoWebhookLog
Log de auditoría para webhooks de Kommo CRM (leads calificados).
```prisma
model KommoWebhookLog {
  id             Int      @id @default(autoincrement())
  leadId         Int                      // ID del lead en Kommo
  leadName       String                   // Nombre del lead
  fromStage      String?                  // Etapa anterior (puede ser null)
  toStage        String                   // Etapa nueva (Calificado)
  action         String                   // "increment"
  pipelineActivo Int                      // Valor después de la acción
  createdAt      DateTime @default(now()) // Cuándo ocurrió
}
```

### ExpenseCategory
Categorías personalizadas de gastos para el dashboard financiero.
```prisma
model ExpenseCategory {
  id        Int       @id @default(autoincrement())
  name      String    @unique           // "Herramientas", "Marketing", etc.
  color     String    @default("#44e1fc") // Color para visualización
  expenses  Expense[]
  createdAt DateTime  @default(now())
}
```

### Expense
Registro de gastos fijos y recurrentes.
```prisma
model Expense {
  id           Int              @id @default(autoincrement())
  name         String                    // "Cursor Pro", "ChatGPT Plus"
  amount       Float                     // Monto mensual
  type         String           @default("recurring") // "fixed" | "recurring"
  categoryId   Int
  category     ExpenseCategory  @relation(fields: [categoryId], references: [id])
  startDate    DateTime         @default(now())
  endDate      DateTime?                 // Si terminó (para cancelados)
  notes        String?
  billingDay   Int?                      // Día del mes (1-31) en que se cobra
  paidByClient String?                   // Nombre del cliente que paga el gasto
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}
```

**Tipos de gasto:**
- `recurring` → Se contabiliza cada mes mientras esté activo (endDate = null)
- `fixed` → Pago único, se contabiliza solo en el mes de creación

**Campos de fecha de pago:**
- `billingDay` → Día del mes (1-31) cuando se cobra. Permite ver "Próximos Pagos"
- `paidByClient` → Si un cliente paga este gasto, su nombre. Mostrado con badge amarillo

### MonthlyFinance
Snapshot mensual de finanzas (para histórico).
```prisma
model MonthlyFinance {
  id               Int      @id @default(autoincrement())
  month            DateTime @unique      // Primer día del mes
  totalIncome      Float    @default(0)  // Onboarding + MRR
  totalOnboarding  Float    @default(0)
  totalMrrServices Float    @default(0)
  totalMrrCommunity Float   @default(0)
  totalExpenses    Float    @default(0)
  netProfit        Float    @default(0)  // Ingresos - Gastos
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## Variables de Entorno

```env
# Base de datos SQLite
DATABASE_URL="file:/app/data/metrics.db"  # Producción Docker
DATABASE_URL="file:./prisma/dev.db"       # Desarrollo local

# Contraseña de admin (IMPORTANTE: cambiar en producción)
ADMIN_PASSWORD="tu-contraseña-segura"

# API Key para integraciones externas (N8N)
API_SECRET_KEY="clave-aleatoria-larga"

# URL base de la aplicación
NEXT_PUBLIC_APP_URL="https://dashboard.elraperomarketero.com"
```

---

## Tema Visual / Branding

| Variable | Valor | Uso |
|----------|-------|-----|
| `--brand-primary` | `#44e1fc` | Color de acento (cyan) |
| `--brand-dark` | `#171717` | Fondo de cards |
| `--background` | `#000000` | Fondo principal (negro) |
| `--card-border` | `#2b2b2b` | Bordes de cards |
| `--text-muted` | `#afafaf` | Texto secundario |

**Tipografía:** Inter (Google Fonts)
**Border radius:** 20px para cards, 12px para botones

---

## Páginas y Funcionalidades

### Dashboard Público (`/`)
- **WeeklyDashboard:** 7 cards con métricas de la semana actual
- **WeeklyComparison:** Tabla comparativa semana actual vs anterior
- **MonthlyScorecard:** Tabla con últimos 6 meses
- **CadenceTree:** Árbol visual de cadencias de revisión

### Panel Admin (`/admin`)
- Protegido con contraseña (bcrypt)
- **Tab Semanal:** Editar métricas de cualquier semana
- **Tab Mensual:** Editar scorecard de cualquier mes
- **Tab Diario:** Registrar checks diarios
- **Tab Cierres:** Registrar y editar cierres de ventas
- **Tab Configuración:** Colores de marca, logo, cambiar contraseña

### Dashboard Financiero (`/finanzas`)
- Protegido con la misma contraseña del admin
- URL separada y privada para control de finanzas
- **Tab Resumen:** Balance general del mes (ingresos vs gastos vs utilidad)
  - Desglose de ingresos: Onboarding, MRR Servicios, MRR Comunidad
  - Desglose de gastos por categoría
- **Tab Gastos:** CRUD de gastos fijos y recurrentes
  - Asignar categoría y tipo (fijo/recurrente)
  - Marcar como cancelado (endDate)
- **Tab Categorías:** Gestión de categorías personalizadas con colores
- **Tab Historial:** Tabla de últimos 6 meses con tendencias

**Cálculo automático de ingresos:**
- Onboarding = SUM(SalesClose.onboardingValue) del mes actual
- MRR Servicios = SUM(SalesClose.recurringValue) donde status='active'
- MRR Comunidad = WeeklyMetric.mrrComunidad más reciente

**Cálculo automático de gastos:**
- Gastos recurrentes activos (sin endDate) + gastos fijos del mes

---

## Problemas Conocidos y Soluciones

### Zona Horaria (RESUELTO)
**Problema:** Al seleccionar fechas en el admin, se guardaba el día anterior.
**Causa:** `new Date("2026-01-13")` se interpreta como UTC, no hora local.
**Solución:** Funciones `formatLocalDate()` y `parseLocalDate()` en admin/page.tsx.

### Campo mrrComunidad (RESUELTO)
**Problema:** Error "column mrrComunidad does not exist".
**Causa:** La base de datos en Docker no tenía la columna nueva.
**Solución:** ALTER TABLE directo en docker-entrypoint.sh.

### Auto-crear mes actual (RESUELTO)
**Problema:** El scorecard mostraba el mes anterior, no el actual.
**Solución:** La API `/api/scorecard` ahora crea automáticamente el mes actual si no existe.

---

## Integración Kommo CRM

### Arquitectura
```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   KOMMO CRM     │      │      N8N        │      │   DASHBOARD     │
│                 │      │                 │      │                 │
│ Lead → Etapa    │─────▶│ Webhook Trigger │─────▶│ /api/webhooks/  │
│ "Calificado"    │ POST │ + Code Node     │ POST │    kommo        │
│                 │      │ + HTTP Request  │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Endpoint: POST /api/webhooks/kommo
Recibe notificaciones cuando un lead entra a la etapa "Calificado".

**Headers requeridos:**
- `X-API-Key`: API_SECRET_KEY del dashboard

**Body:**
```json
{
  "leadId": 12345,
  "leadName": "Juan Pérez",
  "fromStage": "Nuevo",
  "toStage": "Calificado"
}
```

**Campos:**
- `leadId`: ID del lead en Kommo
- `leadName`: Nombre del lead/contacto
- `fromStage`: Etapa anterior (de donde venía el lead)
- `toStage`: Etapa nueva (siempre "Calificado")

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "pipelineActivo": 8,
    "leadId": 12345,
    "leadName": "Juan Pérez",
    "logged": true
  }
}
```

**Comportamiento:**
- Solo incrementa `pipelineActivo` (+1), nunca decrementa
- Guarda log de auditoría en `KommoWebhookLog`
- Auto-crea métrica de la semana si no existe

---

### Workflow N8N Completo

**URL N8N:** https://ssn8n.elraperomarketero.com
**Workflow:** Kommo → Dashboard Pipeline

#### Nodo 1: Webhook Trigger
- **Tipo:** Webhook
- **Method:** POST
- **Path:** `kommo-calificado`
- **URL Producción:** `https://ssn8n.elraperomarketero.com/webhook/kommo-calificado`

#### Nodo 2: Kommo (Get Lead)
- **Credential:** Kommo account
- **Resource:** Lead
- **Operation:** Get Lead List
- **Filter > List of Lead IDs:** `{{ $json.body['leads[add][0][id]'] }}`

#### Nodo 3: Code (JavaScript)
```javascript
// Extraer datos de la respuesta de Kommo
const data = $input.first().json;
const lead = data._embedded?.leads?.[0] || {};

return [{
  json: {
    leadId: lead.id || 0,
    leadName: lead.name || 'Sin nombre',
    fromStage: String(lead.status_id || ''),
    toStage: 'Calificado'
  }
}];
```

#### Nodo 4: HTTP Request
- **Method:** POST
- **URL:** `https://dashboard.elraperomarketero.com/api/webhooks/kommo`
- **Headers:** `X-API-Key: [API_SECRET_KEY]`
- **Body (JSON):**
```json
{
  "leadId": {{ $json.leadId }},
  "leadName": "{{ $json.leadName }}",
  "fromStage": "{{ $json.fromStage }}",
  "toStage": "{{ $json.toStage }}"
}
```

---

### Configuración en Kommo

**Opción A: Digital Pipeline (Recomendada)**
1. Ir a Leads → Automate
2. Click en la etapa "Calificado"
3. Agregar acción → API: Send webhook
4. URL: `https://ssn8n.elraperomarketero.com/webhook/kommo-calificado`

**Opción B: Integraciones globales**
1. Settings → Integrations → Webhooks
2. Evento: "Lead status changed"
3. URL: `https://ssn8n.elraperomarketero.com/webhook/kommo-calificado`

---

### Payload que envía Kommo
```json
{
  "leads": {
    "status": [{
      "id": 12345,
      "name": "Juan Pérez",
      "status_id": 142,
      "old_status_id": 141,
      "pipeline_id": 123
    }]
  },
  "account": {
    "id": 12345678,
    "subdomain": "tuempresa"
  }
}
```

---

### Test con Hoppscotch/Postman
```
POST https://ssn8n.elraperomarketero.com/webhook-test/kommo-calificado
Content-Type: application/json

{
  "leads": {
    "status": [{
      "id": 12345,
      "name": "Lead de Prueba",
      "old_status_id": 100,
      "status_id": 142
    }]
  }
}
```

---

## REGLAS DE DESARROLLO (IMPORTANTE)

### Regla #1: No romper lo que funciona
- **SIEMPRE** verificar que TypeScript compila antes de hacer commit (`npx tsc --noEmit`)
- **PREFERIR** cambios aditivos (crear archivos nuevos) sobre modificar existentes
- **NUNCA** hacer cambios masivos sin explicar primero qué se va a modificar

### Regla #2: Comunicación clara
- Explicar **qué** se va a hacer y **por qué** antes de hacerlo
- Mostrar el **impacto** del cambio (archivos afectados, riesgo)
- Si hay dudas, **preguntar** antes de asumir

### Regla #3: Cambios incrementales
- Un cambio a la vez
- Commit y push después de cada funcionalidad completa
- El usuario hace rebuild en Dokploy para verificar

### Regla #4: Manejo de fechas
- Usar `formatLocalDate()` para convertir Date → string "YYYY-MM-DD"
- Usar `parseLocalDate()` para convertir string "YYYY-MM-DD" → Date
- NUNCA usar `toISOString().split('T')[0]` directamente

### Regla #5: Base de datos
- La base de datos está en `/app/data/metrics.db` (Docker)
- Los datos persisten en un volumen Docker
- NO borrar la base de datos sin confirmación del usuario

### Regla #6: Actualización de documentación
- **SIEMPRE** actualizar este archivo (CLAUDE.md) después de cada cambio significativo
- Agregar nuevas funcionalidades a la sección correspondiente
- Registrar cada cambio en el "Historial de Cambios Importantes"
- Actualizar la estructura del proyecto si se crean nuevos archivos/carpetas
- Actualizar la fecha de "Última actualización" al final del documento

---

## Flujo de Trabajo Típico

1. **Usuario describe** lo que quiere
2. **Claude explica** el plan y el impacto
3. **Usuario confirma** que quiere proceder
4. **Claude implementa** el cambio
5. **Claude verifica** que compila sin errores
6. **Claude hace commit y push** a GitHub
7. **Usuario hace rebuild** en Dokploy
8. **Usuario verifica** en producción

---

## Comandos Útiles

```bash
# Desarrollo local
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build de producción
npx tsc --noEmit         # Verificar TypeScript sin compilar
npx prisma studio        # Ver/editar base de datos visualmente
npx prisma db push       # Sincronizar schema con DB

# Git
git status               # Ver cambios pendientes
git add <archivo>        # Agregar archivo al commit
git commit -m "mensaje"  # Crear commit
git push origin main     # Subir a GitHub

# Docker (en servidor)
docker logs <container>  # Ver logs del contenedor
```

---

## Historial de Cambios Importantes

| Fecha | Cambio | Commit |
|-------|--------|--------|
| 2026-01-21 | Fix columna mrrComunidad con ALTER TABLE | c7e738c |
| 2026-01-23 | Auto-crear mes actual en scorecard | 7aca74b |
| 2026-01-23 | Fix zona horaria con formatLocalDate | 7681975 |
| 2026-01-23 | Fix parseo de fechas con parseLocalDate | dc62ff7 |
| 2026-01-23 | Agregar comparativa semanal | 4110d57 |
| 2026-01-25 | Auto-calcular tasaCierre (clientesNuevos/leadsTotales×100) | a670c93 |
| 2026-01-25 | Sistema de registro de cierres de ventas con MRR híbrido | c54a167 |
| 2026-01-26 | Integración Kommo CRM webhook para leads calificados | db4dce5 |
| 2026-01-26 | Dashboard financiero privado + fixes UI admin | 38bbe49 |
| 2026-01-27 | Rediseño Dashboard Financiero con sidebar y glassmorphism | ea57d96 |
| 2026-01-27 | Seguridad APIs con middleware + fixes visuales | d81e2e0 |
| 2026-01-27 | Rediseño visual dashboard público con glassmorphism | 329179f |
| 2026-02-02 | Sistema de fechas de pago y próximos pagos | pendiente |

### Detalle del cambio 2026-02-02 (Fechas de Pago):

**Nuevos campos en modelo Expense:**
- `billingDay` (Int?) - Día del mes (1-31) cuando se cobra el gasto
- `paidByClient` (String?) - Nombre del cliente que paga este gasto

**Nuevo endpoint API:**
- `GET /api/finance/expenses/upcoming` - Retorna los 5 próximos pagos ordenados por fecha

**Nuevo componente:**
- `UpcomingPayments.tsx` - Tabla de próximos 5 pagos con indicadores de urgencia

**Archivos modificados:**
- `prisma/schema.prisma` - Agregados campos billingDay y paidByClient
- `src/app/api/finance/expenses/route.ts` - POST/PUT aceptan nuevos campos con validación
- `src/app/api/finance/expenses/upcoming/route.ts` - Nuevo endpoint
- `src/components/finanzas/tabs/GastosTab.tsx` - Formulario con día de cobro y cliente pagador
- `src/components/finanzas/tabs/ResumenTab.tsx` - Muestra próximos pagos
- `src/app/finanzas/page.tsx` - Estado y props para upcoming payments

**Funcionalidades:**
- Campos de día de cobro y cliente pagador solo visibles para gastos recurrentes
- Badges en cards: azul para día de cobro, amarillo para cliente pagador
- Vista "Próximos Pagos" en ResumenTab y GastosTab
- Indicadores de urgencia: rojo (<3 días), amarillo (<7 días), verde (+7 días)
- Cálculo automático de nextPaymentDate considerando fin de mes

### Detalle del cambio 329179f (Rediseño Dashboard Público):

**Archivos modificados:**
- `src/components/dashboard/MetricCard.tsx` - Usa GlassCard, AnimatedNumber y ProgressBar
- `src/components/dashboard/WeeklyDashboard.tsx` - Añade barras de progreso vs metas
- `src/components/dashboard/WeeklyComparison.tsx` - Glassmorphism en tabla
- `src/components/dashboard/MonthlyComparison.tsx` - Glassmorphism en tabla
- `src/components/dashboard/SalesCloseTable.tsx` - KPI cards con GlassCard y AnimatedNumber
- `src/app/page.tsx` - Header sticky con glass effect

**Mejoras visuales:**
- Cards de métricas con glassmorphism (variantes por color según trend)
- Números animados al cargar usando framer-motion useSpring
- Barras de progreso vs metas en cada métrica
- Tablas con efecto glass y bordes semitransparentes
- Badges de cambio (% positivo/negativo) con fondo coloreado
- Header sticky con backdrop-blur
- Mejoras responsive en mobile

**Reutilización de componentes:**
- `GlassCard` de finanzas → wrapper para MetricCard
- `AnimatedNumber` de finanzas → valores numéricos animados
- `ProgressBar` de finanzas → progreso vs metas

### Detalle del cambio d81e2e0 (Seguridad APIs):

**Problema resuelto:**
- Las APIs estaban abiertas sin verificación server-side
- El token era predecible (`Buffer.from('admin:timestamp').toString('base64')`)
- Cualquiera podía hacer requests a `/api/finance/*`, `/api/sales`, etc.

**Solución implementada:**

1. **Middleware de Next.js** (`src/middleware.ts`):
   - Intercepta todas las requests a `/api/*`
   - Verifica token firmado en header `Authorization: Bearer <token>`
   - Retorna 401 si el token es inválido o expirado
   - Rutas públicas excluidas: `/api/auth`, `/api/webhooks`

2. **Token firmado con HMAC-SHA256** (`src/lib/api.ts`):
   - `createAuthToken()`: Genera `admin:timestamp:signature`
   - `verifyAuthToken()`: Verifica firma y expiración (24h)
   - Usa `crypto.timingSafeEqual()` para comparación segura

3. **Clientes actualizados**:
   - `finanzas/page.tsx`: Helper `authFetch()` envía token en headers
   - `admin/page.tsx`: Helper `authFetch()` envía token en headers

**Fixes visuales incluidos:**
- ResumenTab: Fecha ISO formateada a "enero 2026" (línea 119)
- GastosTab: Selects con clase `.dark-select` para tema oscuro
- globals.css: Estilos `.dark-select` con flecha custom SVG

**Rutas protegidas:**
- `/api/finance/*`, `/api/sales`, `/api/settings`, `/api/daily`, `/api/metrics`, `/api/scorecard`

**Rutas públicas:**
- `/api/auth` (login), `/api/webhooks/*` (externos con X-API-Key)

**Nota:** Usuarios con tokens antiguos deben re-loguearse después del deploy.

### Detalle del cambio 2026-01-27 (Rediseño Dashboard Financiero):

**Nuevos componentes (src/components/finanzas/):**
- `GlassCard.tsx` - Cards con efecto glassmorphism (variantes: default, green, red, cyan)
- `AnimatedNumber.tsx` - Números animados con Framer Motion useSpring
- `ProgressBar.tsx` - Barras de progreso para metas
- `FinanceSidebar.tsx` - Sidebar lateral fijo (desktop) + bottom nav (mobile)
- `LoginScreen.tsx` - Pantalla de login extraída
- `ExportButton.tsx` - Botón para exportar datos a CSV

**Tabs extraídos (src/components/finanzas/tabs/):**
- `ResumenTab.tsx` - Balance general con donut chart SVG, desglose visual de ingresos/gastos
- `GastosTab.tsx` - CRUD de gastos con filtros, vista cards/lista, estadísticas
- `CategoriasTab.tsx` - Gestión de categorías con paleta de colores visual y preview en vivo
- `HistorialTab.tsx` - Historial mensual con gráfico de barras visual y tendencias
- `MetasTab.tsx` - Sistema de metas con progreso visual e indicadores de estado

**Nuevo modelo Prisma:**
```prisma
model MonthlyGoal {
  id            Int      @id @default(autoincrement())
  month         DateTime @unique
  incomeTarget  Float    @default(0)
  expenseLimit  Float    @default(0)
  savingsTarget Float    @default(0)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Nuevas APIs:**
- `POST/GET/DELETE /api/finance/goals` - CRUD metas mensuales
- `GET /api/finance/export?type=all|expenses|history|goals` - Exportar CSV

**Bug fix:**
- `/api/finance/history` ahora filtra meses anteriores a 2026

**CSS nuevo (globals.css):**
- Clases `.glass`, `.glass-card`, `.glass-card-green/red/cyan`, `.glass-sidebar`

**Layout:**
- Desktop: Sidebar fijo 256px izquierda + contenido con margin-left
- Mobile: Header fijo top + Bottom navigation + contenido con padding

**Mejoras visuales en todos los tabs:**
- **ResumenTab**: Header con badges (mes, clientes, margen), donut chart SVG animado para ingresos, barras de progreso con gradientes, cards de gastos por categoría con iconos automáticos
- **GastosTab**: Filtros por categoría/tipo, toggle vista cards/lista, estadísticas rápidas (total, recurrentes, fijos, promedio), cards con glow effects
- **CategoriasTab**: Paleta visual de 12 colores predefinidos + color picker, preview en vivo de la categoría, iconos automáticos según nombre, grid de categorías con progress bars
- **HistorialTab**: Gráfico de barras visual con animaciones, indicadores de tendencia (mejor/peor mes), cards expandibles con desglose detallado
- **MetasTab**: Badges de estado del mes, cards de progreso con indicadores (🏆 alcanzada, 🔥 cerca, ⏳ en progreso), preview en vivo al configurar, historial diferenciado por color (pasado/actual/futuro)

### Detalle del cambio 38bbe49:
**Fixes Admin UI:**
- Fix z-index en Select y DateSelector (z-50 → z-[100])
- Remover scale del hover en Card para evitar overlap
- Toast fijo en esquina inferior derecha (z-[200])
- Tabla de cierres con scroll vertical (max-h-400px)
- Header responsive con flex-wrap
- Botones +/- más grandes en mobile
- Renombrar "Pipeline Activo" a "Propuestas Enviadas"

**Dashboard Financiero:**
- Nuevos modelos: ExpenseCategory, Expense, MonthlyFinance
- API endpoints: /api/finance/categories, expenses, summary, history
- Página /finanzas protegida con tabs: Resumen, Gastos, Categorías, Historial
- Cálculo automático de ingresos y gastos

---

## Contacto y Recursos

- **Repositorio:** https://github.com/infobotlivery/Dashboard
- **Producción:** https://dashboard.elraperomarketero.com
- **Admin:** https://dashboard.elraperomarketero.com/admin
- **Finanzas:** https://dashboard.elraperomarketero.com/finanzas

---

*Última actualización: 2026-02-02*
