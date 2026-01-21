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

echo "Directorio $DATA_DIR preparado con permisos correctos"

# Configurar DATABASE_URL
export DATABASE_URL="file:$DB_PATH"
echo "DATABASE_URL: $DATABASE_URL"

# Ejecutar prisma db push como root para crear/actualizar esquema
echo "Inicializando base de datos..."
cd /app

# Usar la ruta completa al binario de prisma
PRISMA_BIN="/app/node_modules/prisma/build/index.js"

# Intentar inicializar/actualizar la base de datos
echo "Ejecutando prisma db push para sincronizar schema..."
if [ -f "$PRISMA_BIN" ]; then
    echo "Prisma encontrado en: $PRISMA_BIN"
    if node "$PRISMA_BIN" db push --accept-data-loss 2>&1; then
        echo "Base de datos sincronizada correctamente"
    else
        echo "Advertencia: prisma db push falló, reintentando con skip-generate..."
        sleep 2
        node "$PRISMA_BIN" db push --skip-generate --accept-data-loss 2>&1 || echo "Continuando de todos modos..."
    fi
else
    echo "ERROR: Prisma no encontrado en $PRISMA_BIN"
    echo "Listando node_modules/prisma:"
    ls -la /app/node_modules/prisma/ 2>/dev/null || echo "Directorio no existe"
    echo "Intentando con npx..."
    npx prisma db push --accept-data-loss 2>&1 || echo "npx también falló"
fi

# Asegurar que los archivos de base de datos pertenezcan a nextjs
if [ -f "$DB_PATH" ]; then
    chown 1001:1001 "$DB_PATH"
    chmod 666 "$DB_PATH"
    echo "Permisos de $DB_PATH configurados"
fi

# También manejar archivos WAL y SHM de SQLite si existen
if [ -f "$DB_PATH-wal" ]; then
    chown 1001:1001 "$DB_PATH-wal"
    chmod 666 "$DB_PATH-wal"
fi

if [ -f "$DB_PATH-shm" ]; then
    chown 1001:1001 "$DB_PATH-shm"
    chmod 666 "$DB_PATH-shm"
fi

# Listar contenido del directorio de datos
echo "Contenido de $DATA_DIR:"
ls -la "$DATA_DIR" || echo "No se pudo listar"

echo "=== Iniciando servidor Next.js como usuario nextjs ==="

# Cambiar al usuario nextjs y ejecutar el servidor
exec su-exec nextjs node /app/server.js
