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
