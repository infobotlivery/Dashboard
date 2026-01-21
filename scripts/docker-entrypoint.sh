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

    # FORZAR: Eliminar base de datos existente para recrearla con schema correcto
    # Esto es necesario porque la DB actual no tiene la columna mrrComunidad
    if [ -f "$DB_PATH" ]; then
        echo "=== FORZANDO RECREACIÓN DE BASE DE DATOS ==="
        echo "Verificando columnas actuales:"
        sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null || echo "No se pudo leer"

        # Verificar si mrrComunidad existe
        if sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null | grep -q "mrrComunidad"; then
            echo "Columna mrrComunidad YA existe, no es necesario recrear"
        else
            echo "Columna mrrComunidad NO existe - ELIMINANDO BASE DE DATOS"
            rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"
            echo "Base de datos eliminada"
        fi
    fi

    # Ejecutar db push para crear/actualizar la base de datos
    echo "Ejecutando prisma db push..."
    node "$PRISMA_CLI" db push --accept-data-loss --skip-generate 2>&1
    echo "Prisma db push completado"

    # Verificar resultado final
    if [ -f "$DB_PATH" ]; then
        echo "=== Verificación final del schema ==="
        sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null

        if sqlite3 "$DB_PATH" "PRAGMA table_info(WeeklyMetric);" 2>/dev/null | grep -q "mrrComunidad"; then
            echo "SUCCESS: Columna mrrComunidad existe"
        else
            echo "ERROR: Columna mrrComunidad NO fue creada"
            exit 1
        fi
    fi
else
    echo "ERROR: Prisma CLI no encontrado en $PRISMA_CLI"
    exit 1
fi

# Asegurar permisos de archivos de base de datos
if [ -f "$DB_PATH" ]; then
    chown 1001:1001 "$DB_PATH"
    chmod 666 "$DB_PATH"
    echo "Base de datos lista: $DB_PATH"
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
