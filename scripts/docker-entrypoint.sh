#!/bin/sh
set -e

echo "=== Docker Entrypoint - Dashboard Metrics ==="

DATA_DIR="/app/data"
DB_PATH="$DATA_DIR/metrics.db"

# Crear directorio de datos si no existe
mkdir -p "$DATA_DIR"

# Asegurar permisos del directorio
chown -R 1001:1001 "$DATA_DIR"
chmod 755 "$DATA_DIR"

echo "Directorio $DATA_DIR preparado"

# Configurar DATABASE_URL
export DATABASE_URL="file:$DB_PATH"
echo "DATABASE_URL: $DATABASE_URL"

PRISMA_CLI="/app/node_modules/prisma/build/index.js"

cd /app

if [ ! -f "$PRISMA_CLI" ]; then
    echo "ERROR: Prisma CLI no encontrado"
    exit 1
fi

echo "Usando Prisma CLI de node_modules..."

# Si la base de datos no existe, crearla con prisma db push
if [ ! -f "$DB_PATH" ]; then
    echo "Base de datos no existe, creando nueva..."
    node "$PRISMA_CLI" db push --accept-data-loss --skip-generate 2>&1
    echo "Base de datos creada"
fi

# Verificar estructura actual
echo "=== Estructura actual de WeeklyMetric ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null || echo "Tabla no existe"

# SOLUCIÓN DIRECTA: Agregar columna mrrComunidad con SQL si no existe
echo "Verificando si mrrComunidad existe..."
if ! sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null | grep -q "mrrComunidad"; then
    echo "Columna mrrComunidad NO existe - AGREGANDO CON SQL..."
    sqlite3 "$DB_PATH" "ALTER TABLE WeeklyMetric ADD COLUMN mrrComunidad REAL NOT NULL DEFAULT 0;" 2>&1 || {
        echo "Error agregando columna, puede que la tabla no exista"
        # Intentar crear con prisma
        node "$PRISMA_CLI" db push --accept-data-loss --skip-generate 2>&1
    }
    echo "Columna agregada"
else
    echo "Columna mrrComunidad ya existe"
fi

# Verificar estructura final
echo "=== Estructura final de WeeklyMetric ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null

# Verificación final
if sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null | grep -q "mrrComunidad"; then
    echo "SUCCESS: Columna mrrComunidad verificada"
else
    echo "ERROR: Columna mrrComunidad no existe después de intentar agregarla"
    # NO hacer exit 1 - intentar continuar de todos modos
fi

# Verificar y crear tabla SalesClose si no existe
echo "=== Verificando tabla SalesClose ==="
if ! sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='SalesClose';" 2>/dev/null | grep -q "SalesClose"; then
    echo "Tabla SalesClose NO existe - CREANDO..."
    sqlite3 "$DB_PATH" "
    CREATE TABLE IF NOT EXISTS SalesClose (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT NOT NULL,
        product TEXT NOT NULL,
        customProduct TEXT,
        onboardingValue REAL NOT NULL DEFAULT 0,
        recurringValue REAL NOT NULL DEFAULT 0,
        contractMonths INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cancelledAt DATETIME,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    " 2>&1 || echo "Error creando tabla SalesClose"
    echo "Tabla SalesClose creada"
else
    echo "Tabla SalesClose ya existe"
fi

echo "=== Estructura de SalesClose ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(SalesClose);" 2>/dev/null || echo "No se pudo leer estructura"

# Verificar y crear tabla KommoWebhookLog si no existe
echo "=== Verificando tabla KommoWebhookLog ==="
if ! sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='KommoWebhookLog';" 2>/dev/null | grep -q "KommoWebhookLog"; then
    echo "Tabla KommoWebhookLog NO existe - CREANDO..."
    sqlite3 "$DB_PATH" "
    CREATE TABLE IF NOT EXISTS KommoWebhookLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        leadId INTEGER NOT NULL,
        leadName TEXT NOT NULL,
        fromStage TEXT,
        toStage TEXT NOT NULL,
        action TEXT NOT NULL,
        pipelineActivo INTEGER NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    " 2>&1 || echo "Error creando tabla KommoWebhookLog"
    echo "Tabla KommoWebhookLog creada"
else
    echo "Tabla KommoWebhookLog ya existe"
fi

echo "=== Estructura de KommoWebhookLog ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(KommoWebhookLog);" 2>/dev/null || echo "No se pudo leer estructura"

# =====================================================
# DASHBOARD FINANCIERO - Nuevas tablas
# =====================================================

# Verificar y crear tabla ExpenseCategory si no existe
echo "=== Verificando tabla ExpenseCategory ==="
if ! sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='ExpenseCategory';" 2>/dev/null | grep -q "ExpenseCategory"; then
    echo "Tabla ExpenseCategory NO existe - CREANDO..."
    sqlite3 "$DB_PATH" "
    CREATE TABLE IF NOT EXISTS ExpenseCategory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#44e1fc',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    " 2>&1 || echo "Error creando tabla ExpenseCategory"
    echo "Tabla ExpenseCategory creada"
else
    echo "Tabla ExpenseCategory ya existe"
fi

# Verificar y crear tabla Expense si no existe
echo "=== Verificando tabla Expense ==="
if ! sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='Expense';" 2>/dev/null | grep -q "Expense"; then
    echo "Tabla Expense NO existe - CREANDO..."
    sqlite3 "$DB_PATH" "
    CREATE TABLE IF NOT EXISTS Expense (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL DEFAULT 'recurring',
        categoryId INTEGER NOT NULL,
        startDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        endDate DATETIME,
        notes TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES ExpenseCategory(id)
    );
    " 2>&1 || echo "Error creando tabla Expense"
    echo "Tabla Expense creada"
else
    echo "Tabla Expense ya existe"
fi

# Verificar y crear tabla MonthlyFinance si no existe
echo "=== Verificando tabla MonthlyFinance ==="
if ! sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='MonthlyFinance';" 2>/dev/null | grep -q "MonthlyFinance"; then
    echo "Tabla MonthlyFinance NO existe - CREANDO..."
    sqlite3 "$DB_PATH" "
    CREATE TABLE IF NOT EXISTS MonthlyFinance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month DATETIME NOT NULL UNIQUE,
        totalIncome REAL NOT NULL DEFAULT 0,
        totalOnboarding REAL NOT NULL DEFAULT 0,
        totalMrrServices REAL NOT NULL DEFAULT 0,
        totalMrrCommunity REAL NOT NULL DEFAULT 0,
        totalExpenses REAL NOT NULL DEFAULT 0,
        netProfit REAL NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    " 2>&1 || echo "Error creando tabla MonthlyFinance"
    echo "Tabla MonthlyFinance creada"
else
    echo "Tabla MonthlyFinance ya existe"
fi

echo "=== Estructura de tablas financieras ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(ExpenseCategory);" 2>/dev/null || echo "No se pudo leer ExpenseCategory"
sqlite3 "$DB_PATH" "PRAGMA table_info(Expense);" 2>/dev/null || echo "No se pudo leer Expense"
sqlite3 "$DB_PATH" "PRAGMA table_info(MonthlyFinance);" 2>/dev/null || echo "No se pudo leer MonthlyFinance"

# Asegurar permisos de archivos de base de datos
if [ -f "$DB_PATH" ]; then
    chown 1001:1001 "$DB_PATH"
    chmod 666 "$DB_PATH"
fi

for ext in "-wal" "-shm"; do
    if [ -f "$DB_PATH$ext" ]; then
        chown 1001:1001 "$DB_PATH$ext"
        chmod 666 "$DB_PATH$ext"
    fi
done

echo "Contenido de $DATA_DIR:"
ls -la "$DATA_DIR" 2>/dev/null

echo "=== Iniciando servidor Next.js ==="
exec su-exec nextjs node /app/server.js
