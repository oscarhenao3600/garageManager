-- Script para crear usuarios de prueba para cada perfil
-- Ejecutar después de las migraciones: psql -d tu_base_de_datos -f scripts/create_test_users.sql

-- =====================================================
-- CREACIÓN DE USUARIOS DE PRUEBA PARA TESTING
-- =====================================================

BEGIN;

-- 1. CREAR SUPERADMIN
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('superadmin', 'superadmin@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'superAdmin', 'Super', 'Administrador', '12345678', '3001234567', true, false)
ON CONFLICT (username) DO NOTHING;

-- 2. CREAR ADMIN
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('admin', 'admin@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'admin', 'Admin', 'Sistema', '87654321', '3008765432', true, false)
ON CONFLICT (username) DO NOTHING;

-- 3. CREAR OPERARIOS
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('operario1', 'operario1@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Juan', 'Mecánico', '11111111', '3001111111', true, false),
('operario2', 'operario2@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Carlos', 'Técnico', '22222222', '3002222222', true, false),
('operario3', 'operario3@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Miguel', 'Especialista', '33333333', '3003333333', true, false)
ON CONFLICT (username) DO NOTHING;

-- 4. CREAR CLIENTES
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('cliente1', 'cliente1@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Ana', 'García', '44444444', '3004444444', true, false),
('cliente2', 'cliente2@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Luis', 'Rodríguez', '55555555', '3005555555', true, false),
('cliente3', 'cliente3@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'María', 'López', '66666666', '3006666666', true, false),
('cliente4', 'cliente4@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Pedro', 'Martínez', '77777777', '3007777777', true, false),
('cliente5', 'cliente5@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Carmen', 'Hernández', '88888888', '3008888888', true, false)
ON CONFLICT (username) DO NOTHING;

-- 5. CREAR VEHÍCULOS PARA LOS CLIENTES
INSERT INTO vehicles (client_id, plate, brand, model, year, color, vin, engine_number, soat_expiry, technical_inspection_expiry, vehicle_type, is_active) VALUES
-- Vehículos para cliente1
((SELECT id FROM users WHERE username = 'cliente1'), 'ABC123', 'Toyota', 'Corolla', 2020, 'Blanco', 'VIN123456789', 'ENG001', '2024-12-31', '2024-12-31', 'sedan', true),
((SELECT id FROM users WHERE username = 'cliente1'), 'XYZ789', 'Honda', 'Civic', 2019, 'Negro', 'VIN987654321', 'ENG002', '2024-12-31', '2024-12-31', 'sedan', true),

-- Vehículos para cliente2
((SELECT id FROM users WHERE username = 'cliente2'), 'DEF456', 'Ford', 'Ranger', 2021, 'Azul', 'VIN456789123', 'ENG003', '2024-12-31', '2024-12-31', 'camioneta', true),
((SELECT id FROM users WHERE username = 'cliente2'), 'GHI789', 'Yamaha', 'R1', 2022, 'Rojo', 'VIN789123456', 'ENG004', '2024-12-31', '2024-12-31', 'moto', true),

-- Vehículos para cliente3
((SELECT id FROM users WHERE username = 'cliente3'), 'JKL012', 'Chevrolet', 'Spark', 2020, 'Gris', 'VIN012345678', 'ENG005', '2024-12-31', '2024-12-31', 'hatchback', true),

-- Vehículos para cliente4
((SELECT id FROM users WHERE username = 'cliente4'), 'MNO345', 'Volkswagen', 'Golf', 2021, 'Verde', 'VIN345678901', 'ENG006', '2024-12-31', '2024-12-31', 'hatchback', true),

-- Vehículos para cliente5
((SELECT id FROM users WHERE username = 'cliente5'), 'PQR678', 'Mercedes-Benz', 'Sprinter', 2019, 'Blanco', 'VIN678901234', 'ENG007', '2024-12-31', '2024-12-31', 'camion', true)
ON CONFLICT DO NOTHING;

-- 6. CREAR ÓRDENES DE SERVICIO DE PRUEBA
INSERT INTO service_orders (client_id, vehicle_id, operator_id, order_number, description, status, priority, estimated_cost, start_date, created_at) VALUES
-- Orden pendiente para cliente1
((SELECT id FROM users WHERE username = 'cliente1'), 
 (SELECT id FROM vehicles WHERE plate = 'ABC123'), 
 NULL, 
 'OS001', 
 'Cambio de aceite y filtros', 
 'pending', 
 'medium', 
 150000, 
 NULL, 
 NOW()),

-- Orden en progreso para cliente2
((SELECT id FROM users WHERE username = 'cliente2'), 
 (SELECT id FROM vehicles WHERE plate = 'DEF456'), 
 (SELECT id FROM users WHERE username = 'operario1'), 
 'OS002', 
 'Revisión de frenos y suspensión', 
 'in_progress', 
 'high', 
 300000, 
 NOW(), 
 NOW()),

-- Orden completada para cliente3
((SELECT id FROM users WHERE username = 'cliente3'), 
 (SELECT id FROM vehicles WHERE plate = 'JKL012'), 
 (SELECT id FROM users WHERE username = 'operario2'), 
 'OS003', 
 'Cambio de neumáticos', 
 'completed', 
 'low', 
 400000, 
 NOW() - INTERVAL '2 days', 
 NOW() - INTERVAL '3 days'),

-- Orden facturada para cliente4
((SELECT id FROM users WHERE username = 'cliente4'), 
 (SELECT id FROM vehicles WHERE plate = 'MNO345'), 
 (SELECT id FROM users WHERE username = 'operario3'), 
 'OS004', 
 'Revisión completa del motor', 
 'billed', 
 'urgent', 
 500000, 
 NOW() - INTERVAL '5 days', 
 NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- 7. CREAR HISTORIAL DE ESTADOS PARA LAS ÓRDENES
INSERT INTO service_order_status_history (service_order_id, previous_status, new_status, changed_by, notes, operator_action) VALUES
-- Historial para OS002 (en progreso)
((SELECT id FROM service_orders WHERE order_number = 'OS002'), 'pending', 'in_progress', (SELECT id FROM users WHERE username = 'operario1'), 'Orden tomada por operario', 'take'),

-- Historial para OS003 (completada)
((SELECT id FROM service_orders WHERE order_number = 'OS003'), 'pending', 'in_progress', (SELECT id FROM users WHERE username = 'operario2'), 'Orden tomada por operario', 'take'),
((SELECT id FROM service_orders WHERE order_number = 'OS003'), 'in_progress', 'completed', (SELECT id FROM users WHERE username = 'operario2'), 'Servicio completado exitosamente', 'complete'),

-- Historial para OS004 (facturada)
((SELECT id FROM service_orders WHERE order_number = 'OS004'), 'pending', 'in_progress', (SELECT id FROM users WHERE username = 'operario3'), 'Orden tomada por operario', 'take'),
((SELECT id FROM service_orders WHERE order_number = 'OS004'), 'in_progress', 'completed', (SELECT id FROM users WHERE username = 'operario3'), 'Servicio completado exitosamente', 'complete'),
((SELECT id FROM service_orders WHERE order_number = 'OS004'), 'completed', 'billed', (SELECT id FROM users WHERE username = 'admin'), 'Factura generada', 'bill')
ON CONFLICT DO NOTHING;

-- 8. CREAR CHECKLIST PARA LAS ÓRDENES
INSERT INTO service_order_checklist (service_order_id, checklist_item_id, is_completed, notes, completed_by, completed_at) VALUES
-- Checklist para OS002 (en progreso)
((SELECT id FROM service_orders WHERE order_number = 'OS002'), 
 (SELECT id FROM checklist_items WHERE name = 'Revisión de frenos' AND vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'camioneta')), 
 true, 
 'Frenos en buen estado', 
 (SELECT id FROM users WHERE username = 'operario1'), 
 NOW()),

((SELECT id FROM service_orders WHERE order_number = 'OS002'), 
 (SELECT id FROM checklist_items WHERE name = 'Revisión de neumáticos' AND vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'camioneta')), 
 true, 
 'Neumáticos con desgaste normal', 
 (SELECT id FROM users WHERE username = 'operario1'), 
 NOW()),

((SELECT id FROM service_orders WHERE order_number = 'OS002'), 
 (SELECT id FROM checklist_items WHERE name = 'Revisión de suspensión' AND vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'camioneta')), 
 false, 
 NULL, 
 NULL, 
 NULL),

-- Checklist para OS003 (completada)
((SELECT id FROM service_orders WHERE order_number = 'OS003'), 
 (SELECT id FROM checklist_items WHERE name = 'Revisión de neumáticos' AND vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'hatchback')), 
 true, 
 'Neumáticos reemplazados', 
 (SELECT id FROM users WHERE username = 'operario2'), 
 NOW() - INTERVAL '1 day'),

-- Checklist para OS004 (facturada)
((SELECT id FROM service_orders WHERE order_number = 'OS004'), 
 (SELECT id FROM checklist_items WHERE name = 'Revisión de aceite' AND vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'hatchback')), 
 true, 
 'Aceite cambiado', 
 (SELECT id FROM users WHERE username = 'operario3'), 
 NOW() - INTERVAL '3 days'),

((SELECT id FROM service_orders WHERE order_number = 'OS004'), 
 (SELECT id FROM checklist_items WHERE name = 'Revisión de filtros' AND vehicle_type_id = (SELECT id FROM vehicle_types WHERE name = 'hatchback')), 
 true, 
 'Filtros reemplazados', 
 (SELECT id FROM users WHERE username = 'operario3'), 
 NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- 9. CREAR LOGS DE AUDITORÍA DE PRUEBA
INSERT INTO system_audit_log (user_id, action, resource, resource_id, details, ip_address, user_agent, severity) VALUES
-- Logs de login
((SELECT id FROM users WHERE username = 'admin'), 'login', 'auth', NULL, 'Usuario admin inició sesión', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),
((SELECT id FROM users WHERE username = 'operario1'), 'login', 'auth', NULL, 'Usuario operario1 inició sesión', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),
((SELECT id FROM users WHERE username = 'cliente1'), 'login', 'auth', NULL, 'Usuario cliente1 inició sesión', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),

-- Logs de acciones del sistema
((SELECT id FROM users WHERE username = 'admin'), 'data_access', 'service_orders', NULL, 'Admin accedió a lista de órdenes de servicio', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),
((SELECT id FROM users WHERE username = 'operario1'), 'data_access', 'service_orders', (SELECT id FROM service_orders WHERE order_number = 'OS002'), 'Operario accedió a orden OS002', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),

-- Logs de actividad de usuario
((SELECT id FROM users WHERE username = 'admin'), 'page_view', 'dashboard', NULL, 'Admin visitó el dashboard', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),
((SELECT id FROM users WHERE username = 'operario1'), 'page_view', 'orders', NULL, 'Operario visitó la página de órdenes', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info'),
((SELECT id FROM users WHERE username = 'cliente1'), 'page_view', 'vehicles', NULL, 'Cliente visitó la página de vehículos', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'info')
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- USUARIOS DE PRUEBA CREADOS EXITOSAMENTE
-- =====================================================

SELECT 'Usuarios de prueba creados exitosamente!' as status;

-- Mostrar resumen de usuarios creados
SELECT 
    role,
    COUNT(*) as cantidad,
    STRING_AGG(username, ', ') as usuarios
FROM users 
GROUP BY role 
ORDER BY 
    CASE role 
        WHEN 'superAdmin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'operator' THEN 3
        WHEN 'client' THEN 4
    END;

-- Mostrar resumen de vehículos creados
SELECT 
    COUNT(*) as total_vehiculos,
    COUNT(DISTINCT client_id) as clientes_con_vehiculos
FROM vehicles;

-- Mostrar resumen de órdenes de servicio
SELECT 
    status,
    COUNT(*) as cantidad
FROM service_orders 
GROUP BY status 
ORDER BY 
    CASE status 
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'billed' THEN 4
        WHEN 'closed' THEN 5
    END;
