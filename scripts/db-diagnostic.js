#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { 
  users, 
  clients, 
  vehicles, 
  serviceOrders, 
  serviceOrderItems 
} from '../shared/schema.js';

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'autotaller',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const db = drizzle(pool);

async function runDiagnostic() {
  console.log('🔍 Iniciando diagnóstico de la base de datos...\n');
  
  try {
    // 1. Verificar conexión
    console.log('1️⃣ Probando conexión a la base de datos...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar que las tablas existan
    console.log('2️⃣ Verificando existencia de tablas...');
    const tables = ['users', 'clients', 'vehicles', 'service_orders', 'service_order_items'];
    
    for (const table of tables) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (result.rows[0].exists) {
          console.log(`✅ Tabla ${table} existe`);
        } else {
          console.log(`❌ Tabla ${table} NO existe`);
        }
      } catch (error) {
        console.log(`❌ Error verificando tabla ${table}:`, error.message);
      }
    }
    console.log('');

    // 3. Verificar estructura de service_orders
    console.log('3️⃣ Verificando estructura de service_orders...');
    try {
      const columns = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'service_orders' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Columnas de service_orders:');
      columns.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ Error verificando estructura:', error.message);
    }
    console.log('');

    // 4. Verificar restricciones de clave foránea
    console.log('4️⃣ Verificando restricciones de clave foránea...');
    try {
      const constraints = await pool.query(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'service_orders';
      `);
      
      if (constraints.rows.length > 0) {
        console.log('🔗 Restricciones de clave foránea:');
        constraints.rows.forEach(constraint => {
          console.log(`   ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });
      } else {
        console.log('⚠️ No se encontraron restricciones de clave foránea');
      }
    } catch (error) {
      console.log('❌ Error verificando restricciones:', error.message);
    }
    console.log('');

    // 5. Verificar conteo de registros
    console.log('5️⃣ Verificando conteo de registros...');
    const tablesToCount = ['users', 'clients', 'vehicles', 'service_orders'];
    
    for (const table of tablesToCount) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📊 ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ Error contando ${table}:`, error.message);
      }
    }
    console.log('');

    // 6. Verificar secuencias
    console.log('6️⃣ Verificando secuencias...');
    try {
      const sequences = await pool.query(`
        SELECT 
          sequence_name,
          last_value,
          start_value,
          increment_by
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%service_orders%';
      `);
      
      if (sequences.rows.length > 0) {
        console.log('🔢 Secuencias encontradas:');
        sequences.rows.forEach(seq => {
          console.log(`   ${seq.sequence_name}: último valor = ${seq.last_value}`);
        });
      } else {
        console.log('⚠️ No se encontraron secuencias para service_orders');
      }
    } catch (error) {
      console.log('❌ Error verificando secuencias:', error.message);
    }
    console.log('');

    // 7. Verificar integridad referencial
    console.log('7️⃣ Verificando integridad referencial...');
    try {
      const orphanedOrders = await pool.query(`
        SELECT 
          'service_orders -> clients' as relationship,
          COUNT(*) as orphaned_records
        FROM service_orders so
        LEFT JOIN clients c ON so.client_id = c.id
        WHERE c.id IS NULL
        UNION ALL
        SELECT 
          'service_orders -> vehicles' as relationship,
          COUNT(*) as orphaned_records
        FROM service_orders so
        LEFT JOIN vehicles v ON so.vehicle_id = v.id
        WHERE v.id IS NULL;
      `);
      
      if (orphanedOrders.rows.length > 0) {
        console.log('⚠️ Registros huérfanos encontrados:');
        orphanedOrders.rows.forEach(row => {
          console.log(`   ${row.relationship}: ${row.orphaned_records} registros`);
        });
      } else {
        console.log('✅ No se encontraron registros huérfanos');
      }
    } catch (error) {
      console.log('❌ Error verificando integridad referencial:', error.message);
    }
    console.log('');

    // 8. Verificar restricciones de unicidad
    console.log('8️⃣ Verificando restricciones de unicidad...');
    try {
      const uniqueConstraints = await pool.query(`
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_name = 'service_orders';
      `);
      
      if (uniqueConstraints.rows.length > 0) {
        console.log('🔒 Restricciones de unicidad:');
        uniqueConstraints.rows.forEach(constraint => {
          console.log(`   ${constraint.column_name}: ${constraint.constraint_name}`);
        });
      } else {
        console.log('⚠️ No se encontraron restricciones de unicidad');
      }
    } catch (error) {
      console.log('❌ Error verificando restricciones de unicidad:', error.message);
    }

  } catch (error) {
    console.error('❌ Error general en el diagnóstico:', error);
  } finally {
    await pool.end();
    console.log('\n🏁 Diagnóstico completado');
  }
}

// Ejecutar el diagnóstico
runDiagnostic().catch(console.error);


