-- Script para consolidar las tablas users y clients de manera inteligente
-- Este script unifica toda la información en la tabla users respetando las diferencias

BEGIN;

-- 1. Agregar campos faltantes a la tabla users si no existen
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. Crear tabla temporal para mapear clientes existentes
CREATE TEMP TABLE client_mapping AS
SELECT 
    c.id as old_client_id,
    c.first_name,
    c.last_name,
    c.document_number,
    c.email,
    c.phone,
    c.address,
    c.city,
    c.department,
    c.is_active,
    c.created_at,
    u.id as existing_user_id,
    u.username,
    u.password,
    u.role as current_role
FROM clients c
LEFT JOIN users u ON c.document_number = u.document_number;

-- 3. Actualizar clientes que ya existen en users (por documento)
UPDATE users u
SET 
    address = c.address,
    city = c.city,
    department = c.department,
    phone = COALESCE(u.phone, c.phone),
    role = 'client' -- Cambiar rol a 'client' si no lo es ya
FROM clients c
WHERE u.document_number = c.document_number
AND u.role != 'client';

-- 4. Insertar clientes que NO existen en users
INSERT INTO users (username, email, password, role, first_name, last_name, phone, document_number, address, city, department, is_active, created_at)
SELECT 
    -- Generar username único basado en documento
    CASE 
        WHEN c.email IS NOT NULL AND c.email != '' THEN c.email
        ELSE 'cliente_' || c.document_number
    END as username,
    
    -- Generar email único si no existe
    CASE 
        WHEN c.email IS NOT NULL AND c.email != '' THEN c.email
        ELSE 'cliente_' || c.document_number || '@temporal.com'
    END as email,
    
    -- Usar documento como contraseña temporal
    c.document_number as password,
    
    'client' as role,
    c.first_name,
    c.last_name,
    c.phone,
    c.document_number,
    c.address,
    c.city,
    c.department,
    c.is_active,
    c.created_at
FROM clients c
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.document_number = c.document_number
);

-- 5. Crear tabla de mapeo final de IDs
CREATE TEMP TABLE final_client_mapping AS
SELECT 
    c.id as old_client_id,
    u.id as new_user_id,
    c.document_number
FROM clients c
JOIN users u ON c.document_number = u.document_number;

-- 6. Verificar que no hay conflictos de email/username
SELECT 
    'Verificando conflictos de email/username' as check_type,
    COUNT(*) as conflict_count
FROM users u1
JOIN users u2 ON u1.email = u2.email AND u1.id != u2.id
WHERE u1.role = 'client';

-- 7. Actualizar la tabla vehicles para usar user_id en lugar de client_id
-- Primero agregar la nueva columna
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- 8. Actualizar vehicles con los nuevos user_id
UPDATE vehicles v
SET user_id = m.new_user_id
FROM final_client_mapping m
WHERE v.client_id = m.old_client_id;

-- 9. Verificar que no hay vehículos sin referencia
SELECT 
    'Vehículos sin referencia válida' as check_type,
    COUNT(*) as orphaned_count
FROM vehicles v 
LEFT JOIN users u ON v.user_id = u.id 
WHERE u.id IS NULL;

-- 10. Hacer user_id NOT NULL solo si no hay vehículos huérfanos
-- (Comentar si hay vehículos huérfanos para revisar manualmente)
-- ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL;

-- 11. Renombrar la columna para mayor claridad (solo si user_id no es NULL)
-- ALTER TABLE vehicles RENAME COLUMN user_id TO clientId;

-- 12. Verificar la consolidación
SELECT 
    'Resumen de consolidación' as summary_type,
    role,
    COUNT(*) as count,
    CASE 
        WHEN role = 'client' THEN 'Clientes del taller'
        WHEN role = 'admin' THEN 'Administradores'
        WHEN role = 'operator' THEN 'Operarios'
        WHEN role = 'superAdmin' THEN 'Super Administradores'
        WHEN role = 'user' THEN 'Usuarios generales'
        ELSE 'Otros roles: ' || role
    END as description
FROM users 
GROUP BY role 
ORDER BY count DESC;

-- 13. Mostrar estadísticas de vehículos
SELECT 
    'Estadísticas de vehículos' as vehicle_stats,
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as vehicles_with_user,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as vehicles_orphaned
FROM vehicles;

-- 14. Mostrar clientes con vehículos
SELECT 
    'Clientes con vehículos' as client_vehicles,
        u.first_name,
    u.last_name,
    u.document_number,
COUNT(v.id) as vehicle_count
FROM users u
LEFT JOIN vehicles v ON u.id = v.user_id
WHERE u.role = 'client'
GROUP BY u.id, u.first_name, u.last_name, u.document_number
ORDER BY vehicle_count DESC;

-- 15. Verificar integridad de datos
SELECT 
    'Verificación de integridad' as integrity_check,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay vehículos huérfanos'
        ELSE '⚠️ Hay ' || COUNT(*) || ' vehículos huérfanos que requieren atención'
    END as status
FROM vehicles v 
LEFT JOIN users u ON v.user_id = u.id 
WHERE u.id IS NULL;

COMMIT;

-- NOTA: Después de verificar que todo funciona correctamente:
-- 1. Ejecutar: ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL;
-- 2. Ejecutar: ALTER TABLE vehicles DROP COLUMN clientId;
-- 3. Ejecutar: ALTER TABLE vehicles RENAME COLUMN user_id TO clientId;
-- 4. Opcional: DROP TABLE clients;
