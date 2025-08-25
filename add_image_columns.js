const { Pool } = require('pg');
require('dotenv').config();

async function addImageColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Agregando columnas de imágenes...');
    
    // Agregar columna banner
    await pool.query(`
      ALTER TABLE company_settings 
      ADD COLUMN IF NOT EXISTS banner TEXT;
    `);
    console.log('✅ Columna banner agregada');

    // Agregar columna favicon
    await pool.query(`
      ALTER TABLE company_settings 
      ADD COLUMN IF NOT EXISTS favicon TEXT;
    `);
    console.log('✅ Columna favicon agregada');

    // Verificar que las columnas se agregaron
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'company_settings' 
      AND column_name IN ('banner', 'favicon');
    `);
    
    console.log('📋 Columnas en company_settings:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('🎉 Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await pool.end();
  }
}

addImageColumns();



