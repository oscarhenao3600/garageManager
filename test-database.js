import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/autotaller_pro';

async function testDatabase() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    console.log('📡 Connection string:', connectionString);
    
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Probar conexión básica
    console.log('✅ Conexión establecida');
    
    // Verificar tablas existentes
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Verificar estructura de service_orders
    console.log('\n🔍 Estructura de service_orders:');
    const columns = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'service_orders' 
      ORDER BY ordinal_position
    `;
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Verificar si hay órdenes de servicio
    const orderCount = await client`
      SELECT COUNT(*) as count FROM service_orders
    `;
    
    console.log(`\n📊 Total de órdenes de servicio: ${orderCount[0].count}`);
    
    // Verificar si hay clientes
    const clientCount = await client`
      SELECT COUNT(*) as count FROM clients
    `;
    
    console.log(`👥 Total de clientes: ${clientCount[0].count}`);
    
    // Verificar si hay vehículos
    const vehicleCount = await client`
      SELECT COUNT(*) as count FROM vehicles
    `;
    
    console.log(`🚗 Total de vehículos: ${vehicleCount[0].count}`);
    
    // Verificar si hay usuarios
    const userCount = await client`
      SELECT COUNT(*) as count FROM users
    `;
    
    console.log(`👤 Total de usuarios: ${userCount[0].count}`);
    
    await client.end();
    console.log('\n✅ Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testDatabase();
