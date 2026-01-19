#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Dashboard Metrics - Iniciando ===');

// Forzar la ruta correcta de la base de datos en producción
const DATA_DIR = '/app/data';
const DB_PATH = `${DATA_DIR}/metrics.db`;
const DATABASE_URL = `file:${DB_PATH}`;

// Exportar variable de entorno
process.env.DATABASE_URL = DATABASE_URL;
console.log(`DATABASE_URL configurado: ${DATABASE_URL}`);

// Crear directorio de datos si no existe
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Directorio ${DATA_DIR} creado`);
  }
} catch (error) {
  console.log(`Nota: No se pudo crear ${DATA_DIR} (puede que ya exista o no tengamos permisos)`);
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
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL }
});

server.on('error', (error) => {
  console.error('Error al iniciar servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code);
});
