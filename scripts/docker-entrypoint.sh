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

# Ejecutar prisma db push para sincronizar schema con la base de datos
echo "Sincronizando schema de base de datos..."
cd /app

# Usar prisma CLI global instalado en Dockerfile
prisma db push --accept-data-loss --skip-generate 2>&1 || {
    echo "Primer intento de db push falló, reintentando..."
    sleep 2
    prisma db push --accept-data-loss --skip-generate 2>&1 || echo "ADVERTENCIA: db push falló, continuando..."
}

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
