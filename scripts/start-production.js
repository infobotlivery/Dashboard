#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Dashboard Metrics - Iniciando ===');

// Forzar la ruta correcta de la base de datos en producción
const DATA_DIR = '/app/data';
const DB_PATH = `${DATA_DIR}/metrics.db`;
const DB_WAL_PATH = `${DATA_DIR}/metrics.db-wal`;
const DB_SHM_PATH = `${DATA_DIR}/metrics.db-shm`;
const DATABASE_URL = `file:${DB_PATH}`;

// Exportar variable de entorno
process.env.DATABASE_URL = DATABASE_URL;
console.log(`DATABASE_URL configurado: ${DATABASE_URL}`);

// Verificar permisos del usuario actual
try {
  const userId = process.getuid ? process.getuid() : 'N/A';
  const groupId = process.getgid ? process.getgid() : 'N/A';
  console.log(`Ejecutando como UID: ${userId}, GID: ${groupId}`);
} catch (e) {
  console.log('No se pudo obtener UID/GID (Windows?)');
}

// Crear directorio de datos si no existe
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Directorio ${DATA_DIR} creado`);
  }

  // Verificar permisos del directorio
  fs.accessSync(DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
  console.log(`Directorio ${DATA_DIR} tiene permisos de lectura/escritura`);
} catch (error) {
  console.error(`ERROR: No se puede acceder a ${DATA_DIR}: ${error.message}`);
}

// Si existe la base de datos, verificar que podemos escribir en ella
if (fs.existsSync(DB_PATH)) {
  try {
    fs.accessSync(DB_PATH, fs.constants.R_OK | fs.constants.W_OK);
    console.log(`Base de datos existente en ${DB_PATH} con permisos correctos`);
  } catch (error) {
    console.log(`ADVERTENCIA: Base de datos existe pero sin permisos de escritura`);
    console.log(`Intentando corregir permisos...`);
    try {
      // Intentar cambiar permisos (solo funciona si somos dueños o root)
      fs.chmodSync(DB_PATH, 0o666);
      if (fs.existsSync(DB_WAL_PATH)) fs.chmodSync(DB_WAL_PATH, 0o666);
      if (fs.existsSync(DB_SHM_PATH)) fs.chmodSync(DB_SHM_PATH, 0o666);
      console.log('Permisos corregidos');
    } catch (chmodError) {
      console.log(`No se pudieron cambiar permisos: ${chmodError.message}`);
    }
  }
}

// Inicializar base de datos con reintentos
console.log('Inicializando base de datos...');
let dbInitialized = false;
const maxRetries = 5;

for (let i = 1; i <= maxRetries; i++) {
  try {
    console.log(`Intento ${i} de ${maxRetries}...`);
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL }
    });
    console.log('Base de datos inicializada correctamente');

    // Asegurar permisos después de crear/actualizar la base de datos
    try {
      if (fs.existsSync(DB_PATH)) {
        fs.chmodSync(DB_PATH, 0o666);
        console.log(`Permisos de ${DB_PATH} establecidos a 666`);
      }
      if (fs.existsSync(DB_WAL_PATH)) {
        fs.chmodSync(DB_WAL_PATH, 0o666);
      }
      if (fs.existsSync(DB_SHM_PATH)) {
        fs.chmodSync(DB_SHM_PATH, 0o666);
      }
    } catch (chmodError) {
      console.log(`Nota: No se pudieron ajustar permisos: ${chmodError.message}`);
    }

    dbInitialized = true;
    break;
  } catch (error) {
    console.log(`Fallo en intento ${i}: ${error.message}`);
    if (i < maxRetries) {
      console.log('Reintentando en 3 segundos...');
      execSync('sleep 3');
    }
  }
}

if (!dbInitialized) {
  console.error('ERROR: No se pudo inicializar la base de datos después de todos los intentos');
  console.log('Intentando continuar de todos modos...');
}

// Verificar contenido del directorio de datos
try {
  console.log(`\nContenido de ${DATA_DIR}:`);
  const files = fs.readdirSync(DATA_DIR);
  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file} - ${stats.size} bytes`);
  });
} catch (error) {
  console.log(`No se pudo listar ${DATA_DIR}: ${error.message}`);
}

// Iniciar servidor Next.js
console.log('\n=== Iniciando servidor Next.js ===');

// Buscar server.js en las ubicaciones posibles (para standalone build)
const possibleServerPaths = [
  '/app/server.js',
  '/app/.next/standalone/server.js',
  path.join(__dirname, '..', 'server.js'),
  path.join(__dirname, '..', '.next', 'standalone', 'server.js'),
];

let serverPath = null;
for (const p of possibleServerPaths) {
  if (fs.existsSync(p)) {
    serverPath = p;
    console.log(`Encontrado server.js en: ${p}`);
    break;
  }
}

let server;
if (serverPath) {
  // Modo standalone - usar node server.js
  console.log('Usando modo standalone');
  server = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: path.dirname(serverPath),
    env: { ...process.env, DATABASE_URL }
  });
} else {
  // Modo Nixpacks/normal - usar next start directamente
  const port = process.env.PORT || '3000';
  console.log(`Usando modo next start (Nixpacks) en puerto ${port}`);

  // Buscar el ejecutable de next
  const nextBin = '/app/node_modules/.bin/next';
  if (fs.existsSync(nextBin)) {
    console.log(`Usando next en: ${nextBin}`);
    server = spawn(nextBin, ['start', '-p', port], {
      stdio: 'inherit',
      cwd: '/app',
      env: { ...process.env, DATABASE_URL, PORT: port }
    });
  } else {
    console.log('Usando npx next start');
    server = spawn('npx', ['next', 'start', '-p', port], {
      stdio: 'inherit',
      cwd: '/app',
      shell: true,
      env: { ...process.env, DATABASE_URL, PORT: port }
    });
  }
}

server.on('error', (error) => {
  console.error('Error al iniciar servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code);
});
