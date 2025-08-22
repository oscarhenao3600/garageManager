-- Script de verificación previa antes de la consolidación
-- Ejecutar este script ANTES de consolidate-users-clients.sql

-- 1. Verificar estructura actual de la tabla users
SELECT 
    'Estructura de tabla users' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Verificar estructura actual de la tabla clients
SELECT 
    'Estructura de tabla clients' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- 3. Contar registros en cada tabla
SELECT 
    'Conteo de registros' as count_info,
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as client_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'operator' THEN 1 END) as operator_users,
    COUNT(CASE WHEN role = 'superAdmin' THEN 1 END) as superadmin_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as general_users
FROM users
UNION ALL
SELECT 
    'Conteo de registros' as count_info,
    'clients' as table_name,
    COUNT(*) as total_records,
    NULL, NULL, NULL, NULL, NULL
FROM clients;

-- 4. Verificar clientes que ya existen en ambas tablas (por documento)
SELECT 
    'Clientes duplicados por documento' as duplicate_check,
    c.documentNumber,
    c.firstName,
    c.lastName,
    c.id as client_id,
    u.id as user_id,
    u.role as user_role,
    u.username,
    u.email as user_email,
    c.email as client_email
FROM clients c
JOIN users u ON c.documentNumber = u.documentNumber;

-- 5. Verificar clientes únicos en tabla clients
SELECT 
    'Clientes únicos en tabla clients' as unique_clients,
    c.documentNumber,
    c.firstName,
    c.lastName,
    c.email,
    c.phone,
    c.address,
    c.city,
    c.department
FROM clients c
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.documentNumber = c.documentNumber
);

-- 6. Verificar vehículos y sus referencias actuales
SELECT 
    'Estado de vehículos' as vehicle_status,
    v.id as vehicle_id,
    v.plate,
    v.brand,
    v.model,
    v.clientId as current_client_id,
    c.firstName as client_first_name,
    c.lastName as client_last_name,
    c.documentNumber as client_document,
    u.id as user_id_if_exists,
    u.role as user_role_if_exists
FROM vehicles v
LEFT JOIN clients c ON v.clientId = c.id
LEFT JOIN users u ON c.documentNumber = u.documentNumber
ORDER BY v.id;

-- 7. Verificar conflictos potenciales de email/username
SELECT 
    'Conflictos potenciales de email' as email_conflicts,
    email,
    COUNT(*) as count,
    STRING_AGG(role, ', ') as roles
FROM users 
WHERE email IS NOT NULL AND email != ''
GROUP BY email 
HAVING COUNT(*) > 1;

-- 8. Verificar conflictos potenciales de username
SELECT 
    'Conflictos potenciales de username' as username_conflicts,
    username,
    COUNT(*) as count,
    STRING_AGG(role, ', ') as roles
FROM users 
GROUP BY username 
HAVING COUNT(*) > 1;

-- 9. Verificar campos obligatorios en users
SELECT 
    'Campos obligatorios en users' as required_fields_check,
    COUNT(*) as total_users,
    COUNT(CASE WHEN username IS NULL OR username = '' THEN 1 END) as missing_username,
    COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_email,
    COUNT(CASE WHEN password IS NULL OR password = '' THEN 1 END) as missing_password,
    COUNT(CASE WHEN firstName IS NULL OR firstName = '' THEN 1 END) as missing_firstname,
    COUNT(CASE WHEN lastName IS NULL OR lastName = '' THEN 1 END) as missing_lastname
FROM users;

-- 10. Verificar campos obligatorios en clients
SELECT 
    'Campos obligatorios en clients' as required_fields_check,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN firstName IS NULL OR firstName = '' THEN 1 END) as missing_firstname,
    COUNT(CASE WHEN lastName IS NULL OR lastName = '' THEN 1 END) as missing_lastname,
    COUNT(CASE WHEN documentNumber IS NULL OR documentNumber = '' THEN 1 END) as missing_document,
    COUNT(CASE WHEN phone IS NULL OR phone = '' THEN 1 END) as missing_phone
FROM clients;

-- 11. Resumen de preparación para consolidación
SELECT 
    'RESUMEN DE PREPARACIÓN' as preparation_summary,
    CASE 
        WHEN (SELECT COUNT(*) FROM clients c JOIN users u ON c.documentNumber = u.documentNumber) > 0 
        THEN '⚠️ Hay clientes duplicados que se consolidarán'
        ELSE '✅ No hay clientes duplicados'
    END as duplicate_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM vehicles v LEFT JOIN clients c ON v.clientId = c.id WHERE c.id IS NULL) > 0
        THEN '⚠️ Hay vehículos sin cliente válido'
        ELSE '✅ Todos los vehículos tienen cliente válido'
    END as vehicle_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE email IS NULL OR email = '') > 0
        THEN '⚠️ Hay usuarios sin email (se generarán automáticamente)'
        ELSE '✅ Todos los usuarios tienen email'
    END as email_status;

-- 12. Recomendaciones antes de la consolidación
SELECT 
    'RECOMENDACIONES' as recommendations,
    '1. Hacer backup completo de la base de datos' as rec1,
    '2. Verificar que no hay sesiones activas de clientes' as rec2,
    '3. Ejecutar en horario de bajo tráfico' as rec3,
    '4. Tener plan de rollback preparado' as rec4;
