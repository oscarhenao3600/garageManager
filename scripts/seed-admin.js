import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import bcrypt from 'bcrypt';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function createAdminUser() {
  try {
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    await db.execute(`
      INSERT INTO users (username, email, password, role, first_name, last_name, phone, document_number, is_active)
      VALUES ('admin', 'admin@autotaller.com', '${hashedPassword}', 'admin', 'Administrador', 'Principal', '3001234567', '12345678', true)
      ON CONFLICT (username) DO NOTHING;
    `);

    // Create some sample clients
    await db.execute(`
      INSERT INTO clients (first_name, last_name, document_number, email, phone, address, city, department, is_active)
      VALUES 
        ('Juan', 'Pérez', '1234567890', 'juan.perez@email.com', '3101234567', 'Calle 123 #45-67', 'Bogotá', 'Cundinamarca', true),
        ('María', 'González', '0987654321', 'maria.gonzalez@email.com', '3209876543', 'Carrera 45 #12-34', 'Medellín', 'Antioquia', true),
        ('Carlos', 'Rodríguez', '1122334455', 'carlos.rodriguez@email.com', '3156789012', 'Avenida 80 #23-45', 'Cali', 'Valle del Cauca', true)
      ON CONFLICT (document_number) DO NOTHING;
    `);

    // Create some sample vehicles
    await db.execute(`
      INSERT INTO vehicles (client_id, plate, brand, model, year, color, vin, engine_number, soat_expiry, technical_inspection_expiry, is_active)
      SELECT 
        c.id,
        CASE 
          WHEN c.document_number = '1234567890' THEN 'ABC123'
          WHEN c.document_number = '0987654321' THEN 'XYZ789'
          WHEN c.document_number = '1122334455' THEN 'DEF456'
        END,
        CASE 
          WHEN c.document_number = '1234567890' THEN 'Toyota'
          WHEN c.document_number = '0987654321' THEN 'Chevrolet'
          WHEN c.document_number = '1122334455' THEN 'Mazda'
        END,
        CASE 
          WHEN c.document_number = '1234567890' THEN 'Corolla'
          WHEN c.document_number = '0987654321' THEN 'Spark'
          WHEN c.document_number = '1122334455' THEN 'CX-5'
        END,
        CASE 
          WHEN c.document_number = '1234567890' THEN 2020
          WHEN c.document_number = '0987654321' THEN 2019
          WHEN c.document_number = '1122334455' THEN 2021
        END,
        CASE 
          WHEN c.document_number = '1234567890' THEN 'Blanco'
          WHEN c.document_number = '0987654321' THEN 'Rojo'
          WHEN c.document_number = '1122334455' THEN 'Azul'
        END,
        CASE 
          WHEN c.document_number = '1234567890' THEN 'VIN123456789'
          WHEN c.document_number = '0987654321' THEN 'VIN987654321'
          WHEN c.document_number = '1122334455' THEN 'VIN1122334455'
        END,
        CASE 
          WHEN c.document_number = '1234567890' THEN 'ENG123456'
          WHEN c.document_number = '0987654321' THEN 'ENG987654'
          WHEN c.document_number = '1122334455' THEN 'ENG112233'
        END,
        CURRENT_DATE + INTERVAL '6 months',
        CURRENT_DATE + INTERVAL '1 year',
        true
      FROM clients c
      WHERE NOT EXISTS (
        SELECT 1 FROM vehicles v WHERE v.plate IN ('ABC123', 'XYZ789', 'DEF456')
      );
    `);

    // Create an operator user
    const operatorPassword = await bcrypt.hash('operario123', 10);
    await db.execute(`
      INSERT INTO users (username, email, password, role, first_name, last_name, phone, document_number, is_active)
      VALUES ('operario', 'operario@autotaller.com', '${operatorPassword}', 'operator', 'José', 'Mécanico', '3187654321', '87654321', true)
      ON CONFLICT (username) DO NOTHING;
    `);

    // Create some inventory items
    await db.execute(`
      INSERT INTO inventory_items (code, name, description, category, brand, unit, current_stock, min_stock, max_stock, unit_cost, selling_price, supplier, location, is_active)
      VALUES 
        ('FIL001', 'Filtro de Aceite', 'Filtro de aceite para motor', 'filtros', 'Mann', 'unidad', 25, 5, 100, 15000, 25000, 'Repuestos Colombia', 'Estante A1', true),
        ('ACE001', 'Aceite Motor 20W50', 'Aceite multigrado para motor', 'lubricantes', 'Mobil', 'litro', 50, 10, 200, 12000, 20000, 'Lubricantes S.A.', 'Estante B2', true),
        ('FRE001', 'Pastilla de Freno', 'Pastilla de freno delantera', 'frenos', 'Brembo', 'juego', 8, 3, 50, 45000, 75000, 'Frenos Import', 'Estante C3', true),
        ('BUJ001', 'Bujía Iridium', 'Bujía de iridium', 'electricidad', 'NGK', 'unidad', 40, 10, 100, 8000, 15000, 'Eléctricos Pro', 'Estante D4', true),
        ('AMO001', 'Amortiguador Delantero', 'Amortiguador delantero', 'suspension', 'Monroe', 'unidad', 12, 2, 30, 85000, 140000, 'Suspensión Total', 'Estante E5', true)
      ON CONFLICT (code) DO NOTHING;
    `);

    // Create some sample service orders
    await db.execute(`
      INSERT INTO service_orders (client_id, vehicle_id, operator_id, order_number, description, status, priority, estimated_cost, start_date, created_at)
      SELECT 
        c.id,
        v.id,
        u.id,
        'SO-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
        CASE 
          WHEN v.plate = 'ABC123' THEN 'Cambio de aceite y filtro'
          WHEN v.plate = 'XYZ789' THEN 'Revisión de frenos'
          WHEN v.plate = 'DEF456' THEN 'Mantenimiento general'
        END,
        CASE 
          WHEN v.plate = 'ABC123' THEN 'in_progress'
          WHEN v.plate = 'XYZ789' THEN 'pending'
          WHEN v.plate = 'DEF456' THEN 'completed'
        END,
        'medium',
        CASE 
          WHEN v.plate = 'ABC123' THEN 150000
          WHEN v.plate = 'XYZ789' THEN 250000
          WHEN v.plate = 'DEF456' THEN 180000
        END,
        CURRENT_DATE,
        NOW()
      FROM clients c
      JOIN vehicles v ON c.id = v.client_id
      CROSS JOIN (SELECT id FROM users WHERE role = 'operator' LIMIT 1) u
      WHERE NOT EXISTS (
        SELECT 1 FROM service_orders so WHERE so.vehicle_id = v.id
      );
    `);

    // Create some notifications
    await db.execute(`
      INSERT INTO notifications (user_id, client_id, type, title, message, is_read, priority, created_at)
      SELECT 
        NULL,
        c.id,
        'soat_expiry',
        'SOAT próximo a vencer',
        'El SOAT del vehículo ' || v.plate || ' vence en 30 días',
        false,
        'high',
        NOW()
      FROM clients c
      JOIN vehicles v ON c.id = v.client_id
      WHERE v.soat_expiry <= CURRENT_DATE + INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n WHERE n.client_id = c.id AND n.type = 'soat_expiry'
      );
    `);

      // Usuario administrador y datos de ejemplo creados exitosamente
  // Credenciales de acceso:
  //    Usuario administrador: admin / admin123
  //    Usuario operario: operario / operario123
  // Datos de ejemplo creados:
  //    • 3 clientes con sus vehículos
  //    • 5 items de inventario
  //    • 3 órdenes de servicio de ejemplo
  //    • Notificaciones de vencimiento de SOAT

  } catch (error) {
    console.error('❌ Error creando datos iniciales:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();