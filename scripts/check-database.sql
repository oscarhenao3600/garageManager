-- Script de diagnóstico y corrección de la base de datos
-- Para ejecutar en PostgreSQL

-- 1. Verificar que las tablas existan
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'clients', 'vehicles', 'service_orders', 'service_order_items');

-- 2. Verificar la estructura de la tabla service_orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
ORDER BY ordinal_position;

-- 3. Verificar las restricciones de clave foránea
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'service_orders';

-- 4. Verificar si hay datos en las tablas relacionadas
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as count FROM clients
UNION ALL
SELECT 'vehicles' as table_name, COUNT(*) as count FROM vehicles
UNION ALL
SELECT 'service_orders' as table_name, COUNT(*) as count FROM service_orders;

-- 5. Verificar las secuencias (auto-increment)
SELECT 
    sequence_name,
    last_value,
    start_value,
    increment_by
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
AND sequence_name LIKE '%service_orders%';

-- 6. Verificar si hay problemas con las secuencias
SELECT 
    'service_orders_id_seq' as sequence_name,
    last_value,
    CASE 
        WHEN last_value < (SELECT COALESCE(MAX(id), 0) FROM service_orders) 
        THEN 'SEQUENCE BEHIND - NEEDS RESET'
        ELSE 'OK'
    END as status
FROM service_orders_id_seq;

-- 7. Verificar restricciones de unicidad
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_name = 'service_orders';

-- 8. Verificar si hay datos duplicados que violen restricciones
SELECT 
    order_number,
    COUNT(*) as count
FROM service_orders 
GROUP BY order_number 
HAVING COUNT(*) > 1;

-- 9. Verificar la integridad referencial
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
WHERE v.id IS NULL
UNION ALL
SELECT 
    'service_orders -> users (operator)' as relationship,
    COUNT(*) as orphaned_records
FROM service_orders so
LEFT JOIN users u ON so.operator_id = u.id
WHERE so.operator_id IS NOT NULL AND u.id IS NULL;

-- 10. Script de corrección (ejecutar solo si es necesario)

-- Resetear la secuencia si está desincronizada
-- SELECT setval('service_orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM service_orders));

-- Crear índices si no existen
-- CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON service_orders(client_id);
-- CREATE INDEX IF NOT EXISTS idx_service_orders_vehicle_id ON service_orders(vehicle_id);
-- CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);

-- Verificar permisos de usuario
-- SELECT 
--     grantee,
--     table_name,
--     privilege_type
-- FROM information_schema.role_table_grants 
-- WHERE table_name = 'service_orders';

