#!/usr/bin/env node

/**
 * Seed de categorías de gastos por defecto.
 * Usa upsert → no falla si ya existen, no duplica.
 * Ejecutar: node scripts/seed-categories.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Alquiler',                          color: '#f59e0b' },
  { name: 'Compra De Productos E Insumos',      color: '#22c55e' },
  { name: 'Gastos Administrativos',             color: '#44e1fc' },
  { name: 'Mantenimiento Y Reparaciones',       color: '#f97316' },
  { name: 'Mercadeo Y Publicidad',              color: '#ec4899' },
  { name: 'Muebles, Equipos O Maquinaria',      color: '#8b5cf6' },
  { name: 'Nómina',                             color: '#06b6d4' },
  { name: 'Servicios Públicos',                 color: '#14b8a6' },
  { name: 'Transporte, Domicilios Y Logistica', color: '#6366f1' },
  { name: 'Otros',                              color: '#64748b' },
];

async function seedCategories() {
  console.log('Seeding categorías de gastos...');

  let created = 0;
  let skipped = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const result = await prisma.expenseCategory.upsert({
      where:  { name: cat.name },
      update: {},           // Si ya existe, no tocar nada
      create: { name: cat.name, color: cat.color },
    });

    if (result.createdAt.getTime() === result.updatedAt?.getTime?.() ?? true) {
      created++;
    } else {
      skipped++;
    }

    console.log(`  ✓ ${cat.name}`);
  }

  console.log(`\nListo: ${DEFAULT_CATEGORIES.length} categorías procesadas.`);
}

seedCategories()
  .catch((e) => {
    console.error('Error en seed de categorías:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
