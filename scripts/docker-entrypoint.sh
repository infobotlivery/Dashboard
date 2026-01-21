#!/bin/sh
set -e

echo "=== Docker Entrypoint - Dashboard Metrics ==="

DATA_DIR="/app/data"
DB_PATH="$DATA_DIR/metrics.db"

# Crear directorio de datos si no existe
mkdir -p "$DATA_DIR"

# Asegurar permisos del directorio para el usuario nextjs (UID 1001)
chown -R 1001:1001 "$DATA_DIR"
chmod 755 "$DATA_DIR"

echo "Directorio $DATA_DIR preparado"

# Configurar DATABASE_URL
export DATABASE_URL="file:$DB_PATH"
echo "DATABASE_URL: $DATABASE_URL"

# IMPORTANTE: Usar prisma de node_modules (v5.22.0)
PRISMA_CLI="/app/node_modules/prisma/build/index.js"

cd /app

if [ -f "$PRISMA_CLI" ]; then
    echo "Usando Prisma CLI de node_modules..."
    node "$PRISMA_CLI" --version

    # Verificar si la base de datos existe y tiene la columna mrrComunidad
    if [ -f "$DB_PATH" ]; then
        echo "Base de datos existente encontrada, verificando schema..."

        # Verificar si la columna mrrComunidad existe
        HAS_COLUMN=$(sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null | grep -c "mrrComunidad" || echo "0")

        if [ "$HAS_COLUMN" = "0" ]; then
            echo "=== ADVERTENCIA: Columna mrrComunidad NO existe ==="
            echo "Eliminando base de datos antigua para recrear con schema actualizado..."
            rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"
            echo "Base de datos eliminada. Se creará una nueva."
        else
            echo "Columna mrrComunidad existe, schema OK"
        fi
    fi

    # Ejecutar db push para crear/actualizar la base de datos
    echo "Ejecutando prisma db push..."
    if node "$PRISMA_CLI" db push --accept-data-loss --skip-generate 2>&1; then
        echo "Base de datos sincronizada correctamente"
    else
        echo "Primer intento falló, reintentando con force-reset..."
        sleep 2
        node "$PRISMA_CLI" db push --force-reset --accept-data-loss --skip-generate 2>&1 || {
            echo "ADVERTENCIA: db push falló, intentando crear DB desde cero..."
            rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"
            node "$PRISMA_CLI" db push --accept-data-loss --skip-generate 2>&1 || echo "ERROR CRITICO: No se pudo crear la base de datos"
        }
    fi
else
    echo "ERROR: Prisma CLI no encontrado en $PRISMA_CLI"
    ls -la /app/node_modules/prisma/ 2>/dev/null || echo "Directorio prisma no existe"
    exit 1
fi

# Asegurar permisos de archivos de base de datos
if [ -f "$DB_PATH" ]; then
    chown 1001:1001 "$DB_PATH"
    chmod 666 "$DB_PATH"
    echo "Base de datos lista: $DB_PATH"

    # Verificar columnas finales
    echo "=== Verificación final del schema ==="
    sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null || echo "No se pudo verificar schema"
fi

# Archivos WAL y SHM de SQLite
for ext in "-wal" "-shm"; do
    if [ -f "$DB_PATH$ext" ]; then
        chown 1001:1001 "$DB_PATH$ext"
        chmod 666 "$DB_PATH$ext"
    fi
done

echo "Contenido de $DATA_DIR:"
ls -la "$DATA_DIR" 2>/dev/null || echo "No se pudo listar"

echo "=== Iniciando servidor Next.js ==="

# Cambiar al usuario nextjs y ejecutar el servidor
exec su-exec nextjs node /app/server.js
