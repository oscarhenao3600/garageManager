import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { companySettings } from '../shared/schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/autotaller_pro';

async function seedCompanySettings() {
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Verificando si existen configuraciones de empresa...');
    
    // Verificar si ya existen configuraciones
    const existingSettings = await db.select().from(companySettings).limit(1);
    
    if (existingSettings.length > 0) {
      console.log('Ya existen configuraciones de empresa:', existingSettings[0]);
      return;
    }

    console.log('Insertando configuración inicial de la empresa...');
    
    // Insertar configuración inicial
    const [newSettings] = await db.insert(companySettings).values({
      name: 'Mi Taller',
      nit: '000000000',
      address: 'Dirección del Taller',
      phone: '000-000-0000',
      email: 'taller@ejemplo.com',
      website: 'https://mitaller.com',
      logo: null,
      invoiceFooter: 'Gracias por confiar en nosotros',
      invoiceNotes: 'Pago a 30 días',
      bankInfo: JSON.stringify({
        bankName: 'Banco Ejemplo',
        accountNumber: '123456789',
        accountType: 'Corriente'
      }),
      electronicInvoiceSettings: JSON.stringify({
        enabled: false,
        provider: 'none'
      })
    }).returning();

    console.log('Configuración inicial insertada:', newSettings);
    
  } catch (error) {
    console.error('Error insertando configuración inicial:', error);
  } finally {
    await client.end();
  }
}

seedCompanySettings();
