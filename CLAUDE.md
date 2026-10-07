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

---

## Estructura del Proyecto

```
Dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard público principal
│   │   ├── admin/page.tsx        # Panel admin: Semanal / Mensual / Trimestral (solo lectura, automático)
│   │   ├── finanzas/page.tsx     # Dashboard financiero (sin contraseña)
│   │   ├── layout.tsx            # Layout principal
│   │   ├── globals.css           # Estilos globales
│   │   └── api/
│   │       ├── collections/route.ts    # Cobros de mensualidades: listar del mes y marcar cobrada / no cobrada
│   │       ├── collections/import/route.ts # Importar cobros históricos desde CSV (mensualidades + otros ingresos) / plantilla
│   │       ├── finance/review/route.ts # Revisión mensual de gastos: GET agrupado por categoría, POST sigue/cancelar/cambiar monto
│   │       ├── finance/breakdown/route.ts # Detalle del mes: clientes y montos detrás de facturación cobrada y MRR
│   │       ├── export/route.ts         # CSV unificado filtrable por fechas: metrics|sales|collections|proposals|calls|expenses
│   │       ├── admin/reset/route.ts    # Borrado masivo con respaldo previo: proposals | sales (+cobros)
│   │       ├── calls/route.ts          # Llamadas: listar, agregar manual, marcar asistencia, eliminar
│   │       ├── calls/sync/route.ts     # Sincroniza Calendly → llamadas
│   │       ├── calls/import/route.ts   # Importar llamadas desde CSV (preview + confirmar) / plantilla
│   │       ├── calls/export/route.ts   # CSV de llamadas
│   │       ├── proposals/route.ts      # CRUD propuestas
│   │       ├── proposals/import/route.ts # Importar propuestas desde CSV (preview + confirmar) / plantilla
│   │       ├── metrics/
│   │       │   ├── route.ts      # CRUD métricas semanales
│   │       │   ├── current/route.ts    # Métrica semana actual
│   │       │   ├── comparison/route.ts # Comparativa semanal
│   │       │   ├── period/route.ts     # Métricas automáticas por semana/mes/trimestre
│   │       │   └── export/route.ts     # CSV de las métricas de un periodo
│   │       ├── finance/
│   │       │   ├── summary/route.ts    # Resumen financiero mensual
│   │       │   ├── history/route.ts    # Histórico últimos 6 meses (solo 2026+)
│   │       │   ├── expenses/route.ts   # CRUD gastos
│   │       │   ├── expenses/upcoming/route.ts # Próximos 5 pagos
│   │       │   ├── categories/route.ts # CRUD categorías de gastos
│   │       │   ├── goals/route.ts      # CRUD metas mensuales
│   │       │   ├── accounts/route.ts   # CRUD cuentas por cobrar / por pagar
│   │       │   └── export/route.ts     # Exportar CSV
│   │       ├── scorecard/route.ts      # CRUD scorecard mensual
│   │       ├── daily/route.ts          # CRUD checks diarios
│   │       ├── sales/route.ts          # CRUD cierres de ventas
│   │       ├── sales/import/route.ts   # Importar cierres desde CSV (preview + confirmar) / plantilla
│   │       ├── sales/upcoming/route.ts # Cobros próximos 7 días (GET público)
│   │       ├── settings/route.ts       # Configuración y branding
│   │       └── webhooks/
│   │           └── kommo/route.ts      # Webhook para Kommo CRM
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── BillingMetrics.tsx      # Facturación + utilidad del mes (selector de mes, importar ventas CSV)
│   │   │   ├── AccountsBoxes.tsx       # Cuentas por pagar / por cobrar (pendientes a la fecha)
│   │   │   ├── ExpenseReviewAlert.tsx  # Aviso en la portada: gastos del mes sin revisar
│   │   │   ├── MonthBreakdown.tsx      # Desplegable "¿De dónde sale este mes?" (clientes detrás de facturación y MRR)
│   │   │   ├── ExportModal.tsx         # Modal "Exportar" (tipo + desde/hasta) en el encabezado de la portada
│   │   │   ├── ResetButton.tsx         # Botón de borrado masivo con confirmación escrita (BORRAR)
│   │   │   ├── Legend.tsx              # Leyenda al final: qué significa cada número y qué es automático
│   │   │   ├── ClientCharges.tsx       # Cobros de clientes (esta semana / este mes) con ✓ de cobrado
│   │   │   ├── UpcomingClientPayments.tsx # (sin uso) antiguo "Cobros esta semana"
│   │   │   ├── PeriodMetrics.tsx       # Métricas automáticas (semana/mes/trimestre) — portada y admin
│   │   │   ├── CallsBoard.tsx          # Llamadas (Calendly): lead, fecha, presupuesto, asistencia, propuesta
│   │   │   ├── ProposalsBoard.tsx      # Propuestas: agregar, editar, estado, filtros, importar CSV
│   │   │   ├── ProposalFormModal.tsx   # Alta/edición de propuesta
│   │   │   ├── CloseSaleModal.tsx      # Registro del cierre de venta al aprobar una propuesta
│   │   │   ├── Modal.tsx               # Modal base + Field
│   │   │   ├── CadenceTree.tsx         # Árbol de cadencias
│   │   │   └── (WeeklyDashboard, WeeklyComparison, MetricCard, MonthlyScorecard, SalesCloseTable: sin uso en la portada)
│   │   ├── finanzas/
│   │   │   ├── index.ts                # Exportaciones centrales
│   │   │   ├── GlassCard.tsx           # Card con glassmorphism
│   │   │   ├── AnimatedNumber.tsx      # Números animados
│   │   │   ├── ProgressBar.tsx         # Barra de progreso para metas
│   │   │   ├── FinanceSidebar.tsx      # Sidebar lateral + mobile nav
│   │   │   ├── AutoAccounts.tsx        # Cuentas automáticas del mes (gastos por pagar + mensualidades por cobrar) en tab Gastos
│   │   │   ├── CuentasPanel.tsx        # Cuentas por cobrar / por pagar (en tab Gastos)
│   │   │   ├── CsvImportCard.tsx       # Tarjeta genérica de importación CSV (vista previa + confirmar)
│   │   │   ├── SalesCsvImport.tsx      # Wrappers: SalesCsvImport / ProposalsCsvImport
│   │   │   ├── ExportButton.tsx        # Botón exportar CSV
│   │   │   ├── UpcomingPayments.tsx    # Tabla de próximos 5 pagos
│   │   │   └── tabs/
│   │   │       ├── index.ts            # Exportaciones de tabs
│   │   │       ├── ResumenTab.tsx      # Tab resumen financiero
│   │   │       ├── GastosTab.tsx       # Tab gestión gastos
│   │   │       ├── CategoriasTab.tsx   # Tab categorías
│   │   │       ├── HistorialTab.tsx    # Tab historial mensual
│   │   │       ├── MetasTab.tsx        # Tab metas mensuales
│   │   │       ├── RevisionTab.tsx     # Tab revisión mensual de gastos (Sigue / Cancelar / Cambiar monto)
│   │       └── ClientesTab.tsx     # Tab clientes (registro de ventas + filtros)
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── NumberInput.tsx
│   │       ├── Toggle.tsx
│   │       ├── DateSelector.tsx
│   │       └── Select.tsx              # Dropdown select
│   │
│   ├── types/
│   │   └── index.ts              # Interfaces compartidas (WeeklyMetric, SalesClose, Expense, etc.)
│   │
│   └── lib/
│       ├── db.ts                 # Cliente Prisma singleton
│       ├── api.ts                # Utilidades API + verifyApiKey (webhooks)
│       ├── apiFetch.ts           # fetch con JSON por defecto (sin auth)
│       ├── collectionsCsv.ts     # Parser/validador del CSV de cobros
│       ├── calendly.ts           # Cliente de la API de Calendly (CALENDLY_API_TOKEN)
│       ├── callsSync.ts          # Sincronización Calendly → tabla Call
│       ├── callsCsv.ts           # Parser/validador del CSV de llamadas
│       ├── dates.ts              # formatLocalDate, parseLocalDate, getMonday
│       ├── finance.ts            # Reglas de MRR/gastos por mes + cuentas por cobrar/pagar a la fecha
│       ├── periodMetrics.ts      # Cálculo de métricas por semana/mes/trimestre
│       ├── proposalsCsv.ts       # Parser/validador del CSV de propuestas
│       └── salesCsv.ts           # Parser/validador del CSV de ventas
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
  proposalId      Int?                                // Propuesta que originó el cierre (para deshacerlo)
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
Registro de gastos (fijo mensual, variable o único).
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

**Tipos de gasto** (etiquetas en la UI):
- `recurring` = **Fijo mensual**: mismo monto cada mes mientras esté activo (endDate = null)
- `variable` = **Variable**: se cobra cada mes pero el monto cambia; se ajusta en la revisión mensual
- `fixed` = **Único**: un solo pago, se contabiliza solo en el mes de creación (el nombre interno `fixed` es histórico)

**Campos de fecha de pago:**
- `billingDay` → Día del mes (1-31) cuando se cobra. Permite ver "Próximos Pagos"
- `paidByClient` → Si un cliente paga este gasto, su nombre. Mostrado con badge amarillo

### ExpenseReview
Revisión mensual de gastos: una fila por gasto y mes (`@@unique([expenseId, month])`).
```prisma
model ExpenseReview { id Int @id; expenseId Int; month String /* "YYYY-MM" */; action String /* keep | changed | cancelled */; createdAt DateTime }
```

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

### Call
Llamadas agendadas (Calendly o manuales). Cada llamada nueva cuenta como lead.
```prisma
model Call {
  id Int @id; calendlyEventUri String? @unique; calendlyInviteeUri String? @unique
  leadName String; leadEmail String; eventName String
  scheduledAt DateTime   // fecha y hora de la llamada
  bookedAt DateTime      // cuándo se agendó (fecha del lead)
  budget String?         // respuesta del formulario (presupuesto / rango de facturación)
  status String          // scheduled | canceled
  attendance String      // pending | attended | no_show (se marca a mano)
  isReschedule Boolean   // reprogramación: no cuenta como lead nuevo
  source String          // calendly | manual
}
```

### ClientPayment
Mensualidades (MRR) COBRADAS a clientes: una fila por cliente y mes. La mensualidad esperada no se guarda; se calcula desde `SalesClose`.
```prisma
model ClientPayment {
  id Int @id; saleId Int; forMonth String // "YYYY-MM"
  amount Float; paidAt DateTime           // cuenta como facturación del mes de paidAt
  @@unique([saleId, forMonth])
}
```

### AccountEntry
Cuentas por cobrar (`receivable`) y por pagar (`payable`), gestionadas en el tab Gastos.
```prisma
model AccountEntry {
  id Int @id; kind String; concept String; counterparty String @default("")
  amount Float; dueDate DateTime; status String @default("pending") // pending | paid
  paidAt DateTime?; notes String?; createdAt DateTime; updatedAt DateTime
}
```

### Proposal
Propuestas de ventas para el pipeline.
```prisma
model Proposal {
  id          Int      @id @default(autoincrement())
  clientName  String
  company     String   @default("")
  service     String   @default("")
  amount      Float    @default(0)            // Pago único / onboarding
  recurringAmount Float @default(0)           // MRR esperado si se cierra
  callId      Int?                            // Llamada de origen (no cuenta como lead extra)
  date        DateTime @default(now())
  status      String   @default("por_aprobacion") // por_aprobacion | aprobada | no_cerrada
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Estados:** `por_aprobacion` (amarillo) | `aprobada` (verde) | `no_cerrada` (rojo)

---

## Variables de Entorno

```env
# Base de datos SQLite
DATABASE_URL="file:/app/data/metrics.db"  # Producción Docker
DATABASE_URL="file:./prisma/dev.db"       # Desarrollo local

# API Key solo para webhooks/integraciones externas (N8N, Kommo)
API_SECRET_KEY="clave-aleatoria-larga"

# Calendly: token personal para sincronizar llamadas automáticamente
CALENDLY_API_TOKEN="..."
# Opcional: solo contar eventos cuyo nombre contenga este texto (ej. "IA AUDIT")
CALENDLY_EVENT_NAME_FILTER=""

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
El **selector de mes** de "Finanzas del Mes" controla toda la página: finanzas, cuentas, métricas y filtro de propuestas.
- **BillingMetrics:** Facturación (COBRADA) y utilidad del mes + MRR proyectado + botón "Importar ventas (CSV)"
- **AccountsBoxes:** Cuentas por pagar (cuentas manuales + gastos mensuales —fijos y variables— del mes sin marcar como pagados; vencen el día de cobro o, si no tiene, el día en que empezó el gasto; botón ✓ Pagado) y por cobrar (cuentas manuales), pendientes al día de consulta (o al cierre del mes si es un mes pasado)
- **ClientCharges ("Cobros de clientes"):** mensualidades de los clientes con casilla ✓. Vista "Esta semana" (vencidas + próximos 7 días) y "Este mes". Marcar ✓ = cobrado: sale de cuentas por cobrar y suma a facturación y utilidad
- **CallsBoard:** (importar CSV, exportar CSV, sincronizar) llamadas de Calendly (lead, fecha y hora, presupuesto), botones Asistió / No asistió; al marcar "Asistió" pregunta qué propuesta se envió y la crea vinculada a la llamada. Sincroniza al abrir y cada 5 min; también se pueden agregar llamadas a mano
- **PeriodMetrics:** (botón Exportar CSV) Leads, personas agendadas, propuestas enviadas, clientes nuevos, % de cierre, asistencia, llamadas por marcar, facturación de ventas nuevas, MRR de clientes nuevos, facturación por cerrar, facturación (cobrada), MRR proyectado y clientes perdidos — Semanal / Mensual / Trimestral, todo automático con comparación vs periodo anterior
- **ProposalsBoard:** "Agregar nueva propuesta" (cuenta como lead), cambio de estado en la tabla, filtros por estado y mes, importar CSV. Al pasar una propuesta a **Aprobada** se abre el modal de **registro de cierre de venta** (no hay formulario de cierres aparte)
- **CadenceTree:** Árbol visual de cadencias de revisión (pendiente de rediseño)

### Panel Admin (`/admin`)
- Acceso directo, sin contraseña
- Solo **Semanal / Mensual / Trimestral**, en modo lectura: las métricas se calculan solas
- Se eliminaron los tabs Diario, Cierres, Propuestas y Configuración (las APIs `/api/daily`, `/api/settings` y `/api/scorecard` siguen existiendo)

**Definición de métricas (src/lib/periodMetrics.ts):**
- **Panel en 4 bloques:** 1 Embudo (¿genero oportunidades?), 2 Ventas (¿cuánto vendí?), 3 Dinero (¿cuánto entró?), 4 Base recurrente MRR (¿qué tan sólida es la agencia?). ★ = números clave: % de cierre, Facturación cobrada, MRR activo
- **Lead** = llamada agendada (por `Call.bookedAt`, sin reprogramaciones) + propuesta directa (sin `callId` y sin una llamada del mismo nombre hasta 45 días antes). Los leads de Kommo (`WeeklyMetric.leadsEntrantes`) se muestran aparte y NO suman
- Personas agendadas = llamadas agendadas no canceladas en el periodo; si nunca hubo llamadas se usa `WeeklyMetric.personasAgendadas` (Kommo)
- **% de cierre** = clientes nuevos ÷ llamadas asistidas; si no hay asistencia marcada en el periodo cae a llamadas agendadas (o leads) y la tarjeta lo indica (`cierreSobre`)
- **MRR perdido** = recurringValue de los clientes cancelados en el periodo; **churn** = MRR perdido ÷ MRR al inicio del periodo; **MRR neto** = MRR nuevo − MRR perdido
- Asistencia = asistió ÷ (asistió + no asistió) de las llamadas del periodo (por `scheduledAt`, sin canceladas); no-show = el complemento
- Exportar: `GET /api/metrics/export?period=&date=` y `GET /api/calls/export?month=`
- Cierres = cierres de venta (`SalesClose.createdAt`) del periodo; % cierre = cierres ÷ leads
- **Facturación = lo COBRADO:** mes = onboarding + mensualidades marcadas como cobradas (por fecha de cobro) + otras cuentas por cobrar cobradas; trimestre = suma de sus meses ya iniciados; semana = onboarding + cobros de la semana
- **MRR proyectado** = lo que los clientes deberían pagar (recurrencia vigente al cierre del periodo). **Por cobrar** = proyectado − cobrado
- **Seguimiento de cobros desde julio 2026** (`COLLECTIONS_START` en `src/lib/finance.ts`; antes era octubre 2026): los meses anteriores no tienen registro de pagos y se asumen cobrados (facturación = onboarding + MRR, como antes) y no se pueden editar
- Día de cobro de cada cliente = día del mes en que se cerró la venta (ajustado a fin de mes)
- Facturación de ventas nuevas = onboarding + MRR de los clientes cerrados en el periodo; MRR de clientes nuevos = recurringValue de esos cierres (activos)
- **Facturación por cerrar** = suma de `amount` (pago único) + `recurringAmount` (mensual) de las propuestas del periodo en estado por_aprobacion

**Deshacer una venta:**
- Desde la propuesta: al sacarla de "Aprobada" se ofrece eliminar el cierre vinculado (`SalesClose.proposalId`); al eliminar la propuesta también.
- Cualquier cierre (incluso sin propuesta): `/finanzas` → Clientes → Cancelar cliente / Reactivar / Eliminar (`PATCH` y `DELETE /api/sales`).

### Dashboard Financiero (`/finanzas`)
- Acceso directo, sin contraseña (URL separada para control de finanzas)
- **Tab Resumen:** Balance general del mes (ingresos vs gastos vs utilidad)
  - Desglose de ingresos: Onboarding, MRR Servicios, MRR Comunidad
  - Desglose de gastos por categoría
- **Tab Gastos:** CRUD de gastos fijos y recurrentes
  - Asignar categoría y tipo (fijo/recurrente)
  - Marcar como cancelado (endDate)
- **Tab Categorías:** Gestión de categorías personalizadas con colores
- **Tab Historial:** Tabla de últimos 6 meses con tendencias
- **Tab Metas:** Metas mensuales de ingresos/gastos/ahorro
- **Tab Clientes:** Registro de cierres de ventas con filtro por mes y estado + importación CSV

**Cálculo automático de ingresos (src/lib/finance.ts):**
- Onboarding = SUM(SalesClose.onboardingValue) de cierres firmados en el mes
- Facturación del mes = onboarding + mensualidades cobradas (ver arriba); utilidad neta = facturación − gastos
- MRR proyectado del mes = SUM(recurringValue) de TODOS los clientes con recurrencia vigente al cierre del mes:
  `active` siempre cuenta; `cancelled` solo hasta su `cancelledAt`; `completed` no cuenta.
  Servicios = product ≠ 'Comunidad'; Comunidad = product 'Comunidad'.

**Cálculo automático de gastos:**
- Recurrentes vigentes en el mes consultado (startDate ≤ fin de mes y sin endDate o endDate ≥ inicio)
- Fijos solo en el mes de su startDate

**Cuentas por cobrar / por pagar:** `summary.accounts` = pendientes, vencidas y
balance proyectado (utilidad + por cobrar − por pagar).

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

## Skills Disponibles (Herramientas de Claude Code)

Claude Code tiene acceso a skills personalizadas instaladas en `~/.claude/skills/` y `.claude/skills/`. Estas son herramientas especializadas que mejoran la calidad del trabajo. Se pueden usar de dos formas:

### Skills Automáticas (Claude las usa cuando son relevantes)

| Skill | Nombre instalado | Cuándo se activa |
|-------|-----------------|-----------------|
| API Design | `api-patterns` | Al diseñar o implementar endpoints REST/GraphQL/tRPC |
| Frontend Design | `frontend-design` | Al crear componentes UI, páginas o estilos con Tailwind |
| Planificación | `planning-with-files` | En tareas complejas multi-paso (crea task_plan.md, findings.md, progress.md) |
| Diagramas | `mermaid-diagrams` | Al explicar código, visualizar arquitectura, flujos o ERDs |
| Investigación | `research-engineer` | Al investigar arquitectura, dependencias o patrones del codebase |
| Code Review | `code-review` | Al revisar código (seguridad, rendimiento, legibilidad) |
| Humanizer | `humanizer` | Al reescribir texto para que suene natural (elimina patrones IA) |
| Security Audit | `security-compliance` | Al auditar seguridad (OWASP Top 10, SOC2, GDPR, threat modeling) |
| Security Review | `cc-skill-security-review` | Al agregar auth, manejar inputs, secretos o endpoints sensibles |
| Git Helper | `git-commit-helper` | Al ayudar con mensajes de commit descriptivos |
| Performance | `performance-profiling` | Al analizar rendimiento (N+1 queries, re-renders, memory leaks) |
| Error Resolver | `error-resolver` | Al diagnosticar errores, stack traces o comportamiento inesperado |

### Skills Manuales (el usuario las invoca con `/comando`)

| Comando | Skill instalada | Qué hace | Ejemplo |
|---------|----------------|----------|---------|
| `/commit-work` | `commit-work` | Genera commits con Conventional Commits (feat/fix/refactor) | `/commit-work` |
| `/gh-address-comments` | `gh-address-comments` | Responde comentarios de review en PRs de GitHub | `/gh-address-comments` |
| `/webapp-testing [url]` | `webapp-testing` | Testea app web con Playwright (screenshots + interacciones) | `/webapp-testing localhost:3000` |
| `/claude-d3js-skill [tipo]` | `claude-d3js-skill` | Crea gráficos interactivos D3.js (bar, line, donut, etc.) | `/claude-d3js-skill bar` |
| `/mcp-builder [servicio]` | `mcp-builder` | Guía para crear servidor MCP de integración | `/mcp-builder kommo` |
| `/mermaid-diagrams` | `mermaid-diagrams` | Genera diagramas visuales del proyecto (C4, ERD, flowcharts) | `/mermaid-diagrams` |

### Skills más relevantes para este proyecto

- **`security-compliance`** + **`cc-skill-security-review`**: Para auditorías como la de 2026-02-05 (middleware, secretos, N+1)
- **`performance-profiling`**: Para detectar N+1 queries en APIs de finance/history
- **`code-review`**: Para revisiones estructuradas antes de deploys a producción
- **`api-patterns`**: Se activa automáticamente al trabajar con los 17 endpoints REST
- **`frontend-design`**: Al crear componentes con glassmorphism y Tailwind
- **`error-resolver`**: Para diagnosticar y resolver errores del repo
- **`/commit-work`**: Para commits consistentes con Conventional Commits
- **`/gh-address-comments`**: Para responder comentarios de PR en GitHub
- **`/webapp-testing`**: Para testear el dashboard en localhost:3000 con Playwright
- **`/claude-d3js-skill`**: Para generar gráficos de métricas o historial financiero

### Cómo solicitar una skill

```
# Automáticas: solo pedir lo que necesitas
"Hazme una auditoría de seguridad del middleware"  → activa security-compliance
"Revisa el código de finance/summary"              → activa code-review
"Analiza el rendimiento de las queries"            → activa performance-profiling
"Diagnostica este error"                           → activa error-resolver

# Manuales: usar el comando /
/commit-work
/webapp-testing http://localhost:3000/finanzas
/claude-d3js-skill bar
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
| 2026-02-05 | Auditoría de seguridad, performance y tipos + 5 fixes | d387919 |
| 2026-02-05 | Fix middleware Web Crypto API para Edge Runtime | 674dfde |
| 2026-02-05 | Indexes automáticos en docker-entrypoint.sh | d520926 |
| 2026-02-23 | Rediseño Dashboard Principal + Mejoras Finanzas | pendiente |
| 2026-10-05 | Se elimina autenticación por contraseña (admin y finanzas) | d341521 |
| 2026-10-05 | MRR de todos los clientes activos + cuentas por cobrar/pagar | a4618aa |
| 2026-10-05 | Importación de ventas por CSV | ddc0799 |
| 2026-10-05 | Admin dividido en componentes (SalesTab, ProposalsTab) | 0b0bc1f |
| 2026-10-05 | Portada: cuentas por pagar/cobrar, métricas automáticas, propuestas editables, cierre desde propuesta; admin reducido a 3 tabs | 23e3cba |
| 2026-10-05 | Métricas de ventas nuevas / MRR nuevo / MRR por cerrar; deshacer ventas; Proposal.recurringAmount y SalesClose.proposalId | 9c79381 |
| 2026-10-05 | Llamadas de Calendly (leads, personas agendadas, asistencia), propuesta desde llamada, exportar métricas a CSV; modelo Call y Proposal.callId | ea57959 |
| 2026-10-06 | Importar llamadas por CSV, respaldo automático de la BD, fixes de reprogramación y detección del presupuesto en Calendly | 50d2591 |
| 2026-10-07 | Cobros de mensualidades: facturación = cobrado, MRR proyectado, por cobrar con ✓; facturación por cerrar | 07eae37 |
| 2026-10-07 | Panel en 4 bloques (embudo, ventas, dinero, MRR), churn, leyenda al final; leads = llamadas; filtros de mes hasta 60 meses | 7ae2518 |
| 2026-10-08 | Buscador de gastos por nombre (tabs Gastos y Revisión) y botón ✓ Pagado en el bloque "Automáticas" | pendiente |
| 2026-10-08 | Cuentas por pagar automáticas (todos los gastos mensuales del mes, con botón ✓ Pagado en la portada) y bloque "Automáticas" en tab Gastos | pendiente |
| 2026-10-08 | Revisión mensual de gastos (tab Revisión + aviso en portada), tipo de gasto Variable, etiquetas Fijo mensual / Variable / Único | pendiente |
| 2026-10-08 | Portada reordenada (finanzas, cobros, llamadas, propuestas, métricas, cadencia, leyenda), cadencia y leyenda desplegables, detalle "¿De dónde sale este mes?", historial hasta 5 años, Clientes muestra recurrentes vigentes del mes | pendiente |
| 2026-10-07 | Carga del trimestre jul–sep 2026 (PDF): seguimiento de cobros desde julio 2026, importador de cobros CSV, exportación filtrable por fechas, borrado masivo con respaldo, "mensualidades por cobrar" real | pendiente |

### Detalle del cambio 2026-10-08 (buscador y pagado):
- `GastosTab` y `RevisionTab`: buscador por nombre (sin tildes ni mayúsculas). `AutoAccounts` muestra ✓ Pagado en cada gasto por pagar (usa `PATCH /api/finance/expenses` y refresca el resumen).

### Detalle del cambio 2026-10-08 (cuentas automáticas):
- Las cuentas por pagar ya no dependen de `billingDay` ni de agregarlas a mano: todo gasto fijo mensual o variable vigente en el mes (que no pague un cliente) aparece hasta marcarlo pagado (`PATCH /api/finance/expenses`, `lastPaymentDate`). Los únicos no generan cuenta por pagar.
- Las cuentas por cobrar automáticas son las mensualidades de clientes sin cobrar (✓ en "Cobros de clientes").
- El botón manual quedó como "+ Agregar manual" (CuentasPanel) para casos extra; el tab Gastos muestra primero el bloque `AutoAccounts`.

### Detalle del cambio 2026-10-08 (revisión mensual de gastos):
- **Tab Finanzas → Revisión** (`/finanzas?tab=revision`): gastos del mes agrupados por categoría con subtotales, totales fijo/variable/único y comparación con el mes anterior. Los gastos mensuales (fijo y variable) se confirman con **Sigue**, **Cambiar monto** o **Cancelar**; los únicos solo se muestran.
- `POST /api/finance/review`: `keep` registra la revisión; `cancel` fija `endDate` = último día del mes anterior (el gasto deja de contarse desde ese mes); `change` cierra la versión vieja el mes anterior y crea una nueva con el monto nuevo desde el 1 del mes, así el historial no se reescribe.
- Portada: `ExpenseReviewAlert` avisa cuántos gastos del mes en curso faltan por revisar y enlaza a la pestaña.
- Tabla `ExpenseReview` creada en `docker-entrypoint.sh`.

### Detalle del cambio 2026-10-08 (orden de la portada y trazabilidad):
- **Orden de la portada:** 1 Finanzas del mes, 2 Cobros de clientes, 3 Llamadas, 4 Propuestas, 5 Métricas, 6 Cadencia de revisión (desplegable), Leyenda (desplegable). Ambos desplegables arrancan cerrados.
- `GET /api/finance/breakdown?month=YYYY-MM` + `MonthBreakdown.tsx`: lista cada cobro (pago único, mensualidad, otro ingreso) y cada cliente con MRR vigente, para que los totales se puedan auditar. En meses sin registro de cobros (antes de julio 2026) la mensualidad se marca como "asumida cobrada".
- `GET /api/finance/history?months=N` (6–60, antes solo 2026+) y selector de rango en el tab Historial.
- Finanzas → Clientes: por defecto muestra cierres del mes + clientes con mensualidad vigente ese mes; "Solo cerrados en el mes" restaura el filtro anterior.
- Datos históricos de Kommo (ventas ganadas) se cargan como cobros únicos (`completed`, sin MRR): el MRR anterior a julio 2026 no se reconstruye.

### Detalle del cambio 2026-10-07 (carga histórica jul–sep 2026):
- `COLLECTIONS_START` pasa a **2026-07-01**: jul–sep 2026 tienen cobros registrados (`ClientPayment`); lo anterior se asume cobrado.
- **CSV de cobros** (`POST /api/collections/import`, plantilla en GET): `tipo (mensualidad|otro), cliente, concepto, mes (AAAA-MM), monto, fecha_cobro`. `mensualidad` busca la venta por nombre exacto y guarda un `ClientPayment` (monto 0 permitido: primer mes cubierto por el onboarding); `otro` crea una cuenta por cobrar ya cobrada. Duplicados = misma venta+mes / mismo cliente+concepto+monto+fecha.
- **Exportar**: `GET /api/export?type=metrics|sales|collections|proposals|calls|expenses&from=&to=` (sin fechas = todo). `metrics` = una fila por mes (máx. 60). Botón "Exportar" en el encabezado de la portada.
- **Borrado masivo**: `POST /api/admin/reset {target:'proposals'|'sales', confirm:'BORRAR'}`; copia la BD a `backups/pre-reset-<target>-<fecha>.db` antes de borrar (`sales` borra también los cobros). Botones en Propuestas ("Borrar todas") y Finanzas → Clientes ("Reiniciar ventas y cobros").
- `PeriodValues.porCobrarMensualidades` = suma de mensualidades esperadas sin cobrar (ya no `mrr − mrrCobrado`, que fallaba con cobros de $0).
- Orden recomendado de carga: (opcional) reiniciar ventas → importar ventas → importar cobros.

### Detalle del cambio 2026-10-07 (cobros):
- Nuevo modelo `ClientPayment` y `GET/POST /api/collections`. Cada cliente activo genera una mensualidad esperada por mes; al marcarla cobrada se guarda el pago.
- `summary`, `history`, `export` y `periodMetrics` usan lo cobrado para la facturación (helpers `expectedCharges` y `collectedMrr` en `src/lib/finance.ts`).
- Cuentas por cobrar (portada) incluye TODAS las mensualidades pendientes de clientes + las cuentas manuales.
- Al eliminar un cierre (o su propuesta) se borran también sus cobros.
- Se retiran de las métricas "MRR por cerrar" y "No asistencia".

### Detalle del cambio 2026-10-06:
- **Respaldo automático:** `docker-entrypoint.sh` copia `metrics.db` a `/app/data/backups/metrics-AAAAMMDD-HHMMSS.db`
  al iniciar el contenedor, ANTES de cualquier migración (usa `sqlite3 .backup`; si falla, copia simple). Conserva los últimos 10.
  El directorio vive en el volumen de datos, así que sobrevive a los rebuilds. Para restaurar: detener la app y
  copiar el respaldo elegido sobre `/app/data/metrics.db`.
- **CSV de llamadas:** columnas `lead, email, fecha_llamada, agendada_el, presupuesto, estado, reprogramada, asistencia`
  (+ opcionales `evento_calendly`, `invitado_calendly`, `nombre_evento`). Duplicado = mismo invitado de Calendly,
  o mismo email + misma hora. Plantilla en `GET /api/calls/import`.
- **Sincronización Calendly:** una llamada cargada por CSV se vincula a su reserva de Calendly (por email + hora)
  en vez de duplicarse. Respeta el `no_show` marcado en Calendly.
- **Reprogramaciones:** Calendly marca `old_invitee` en la reserva NUEVA; la original (cancelada, `rescheduled: true`)
  es el lead. Antes ambas se marcaban como reprogramación.
- **Presupuesto:** se detecta por la pregunta del formulario (presupuesto, facturación, invertir, fondos, inversión).

### Detalle del cambio 2026-10-05:
- **Sin contraseña:** se eliminaron login, `middleware.ts`, `/api/auth`, `authFetch.ts`, tokens y bcryptjs.
  Las APIs ya no exigen sesión; solo los webhooks siguen con `X-API-Key` (comparación en tiempo constante;
  falla si `API_SECRET_KEY` no está definida). Riesgo asumido: cualquiera con la URL puede leer/editar datos.
  Si se quiere restringir, usar Cloudflare Access / VPN delante del dominio.
- **MRR:** `src/lib/finance.ts` centraliza el cálculo; antes solo contaba clientes que firmaron en el mes.
  Gastos fijos ya no se arrastran a meses posteriores y los recurrentes se evalúan contra el mes consultado.
- **CSV:** columnas `cliente, producto, onboarding, mensual, meses_contrato, estado, fecha[, fecha_cancelacion]`;
  fechas AAAA-MM-DD o DD/MM/AAAA; duplicados = cliente+producto+día (se omiten); plantilla en `GET /api/sales/import`.
  Para clientes cancelados incluir `fecha_cancelacion` o su MRR no se contará en meses pasados.

### Detalle del cambio 2026-02-23 (Rediseño Dashboard + Finanzas):

**Resumen:** Nuevo dashboard con métricas financieras en la portada, propuestas de ventas, y tab Clientes en Finanzas.

**Nuevo modelo Prisma:**
- `Proposal`: propuestas de ventas (clientName, company, service, amount, date, status, notes)

**Nuevas APIs:**
- `GET/POST/PUT/DELETE /api/proposals` — CRUD propuestas (GET público sin auth)
- `GET /api/sales/upcoming` — clientes activos con cobros próximos 7 días (GET público)
- `GET /api/finance/summary?month=YYYY-MM` — acepta filtro de mes (antes solo mes actual)

**Nuevos componentes:**
- `BillingMetrics.tsx` — Facturación + utilidad del mes con selector de mes (navegación prev/next)
- `UpcomingClientPayments.tsx` — Tabla de cobros de clientes próximos 7 días
- `ProposalsTable.tsx` — Tabla read-only de propuestas con filtros por status y mes, total de posible facturación
- `ClientesTab.tsx` — Tab de Finanzas con SalesCloseTable + filtros por mes y status

**Modificaciones:**
- `page.tsx` — Reemplaza WeeklyDashboard/WeeklyComparison/SalesCloseTable con BillingMetrics/UpcomingClientPayments/ProposalsTable
- `admin/page.tsx` — Nuevo tab "Propuestas" con CRUD completo
- `finanzas/page.tsx` — Nuevo tab "Clientes" con SalesCloseTable + filtros
- `FinanceSidebar.tsx` — Agrega tab 'clientes' a FinanceTab type
- `middleware.ts` — Agrega /api/proposals, /api/finance/summary, /api/finance/goals como GET públicas
- `docker-entrypoint.sh` — CREATE TABLE Proposal con indexes
- `prisma/schema.prisma` — Modelo Proposal

**Tipos nuevos en src/types/index.ts:**
- `Proposal` — interfaz para propuestas
- `UpcomingClientPayment` — interfaz para cobros próximos de clientes

### Detalle del cambio 2026-02-05 (Auditoría + Fixes):

**Auditoría completa del proyecto con 3 agentes:**
- Agente de seguridad: 20 hallazgos (4 CRÍTICOS)
- Agente de TypeScript: 17 hallazgos (0 errores de compilación)
- Agente de Prisma/performance: 20 hallazgos (N+1 queries, indexes faltantes)

**Fix 1 - Middleware de autenticación reescrito (middleware.ts):**
- Reescrito para usar **Web Crypto API** (`crypto.subtle`) en vez de Node.js `crypto`
- Necesario porque Next.js middleware corre en **Edge Runtime**, no Node.js
- Funciones: `hexToBytes()`, `bufferToHex()`, `safeCompare()` (constant-time), `verifyToken()`
- Lógica duplicada de `src/lib/api.ts` adaptada a Web Crypto

**Fix 2 - Eliminación de secretos hardcodeados:**
- `src/lib/api.ts`: Removido fallback `'fallback-secret-change-in-production'` → `''`
- `src/app/api/auth/route.ts`: Removido `|| 'admin123'` → retorna 500 si ADMIN_PASSWORD no está configurado
- `src/app/api/settings/route.ts`: Removido `|| 'admin123'` → throw si no está configurado

**Fix 3 - Indexes de base de datos (schema.prisma + docker-entrypoint.sh):**
- SalesClose: `@@index([status, createdAt])`, `@@index([createdAt])`, `@@index([cancelledAt])`
- Expense: `@@index([type, endDate])`, `@@index([startDate])`
- Indexes se crean automáticamente en docker-entrypoint.sh con `CREATE INDEX IF NOT EXISTS`

**Fix 4 - Refactor N+1 queries:**
- `src/app/api/finance/history/route.ts`: De ~48 queries secuenciales → 5 queries paralelas con `Promise.all()`
- `src/app/api/finance/export/route.ts`: Mismo refactor en sección de historial

**Fix 5 - Tipos centralizados (src/types/index.ts):**
- 13 interfaces compartidas extraídas: WeeklyMetric, MonthlyScorecard, DailyCheck, Settings, SalesClose, SalesSummary, FinanceSummary, MonthlyHistory, Category, Expense, UpcomingPayment, MonthlyGoal
- 14 archivos actualizados para importar desde `@/types` en vez de definiciones locales duplicadas

**Archivos creados:**
- `src/types/index.ts` - Módulo de tipos compartidos
- `src/lib/authFetch.ts` - Helpers para requests autenticados

**Archivos modificados (20+):**
- `src/middleware.ts`, `src/lib/api.ts`, `prisma/schema.prisma`, `scripts/docker-entrypoint.sh`
- `src/app/api/auth/route.ts`, `src/app/api/settings/route.ts`
- `src/app/api/finance/history/route.ts`, `src/app/api/finance/export/route.ts`
- 14 componentes/páginas (solo cambios de imports a `@/types`)

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

*Última actualización: 2026-10-08*
