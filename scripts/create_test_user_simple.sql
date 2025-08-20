-- Script para crear usuario de prueba simple
-- IMPORTANTE: Esto es solo para testing, en producción usar hashes

-- Primero, vamos a ver qué estructura tiene la tabla users
\d users;

-- Crear usuario de prueba con contraseña simple (solo para testing)
INSERT INTO users (
    username, 
    email, 
    password, 
    role, 
    first_name, 
    last_name, 
    document_number, 
    phone, 
    is_active, 
    first_login
) VALUES (
    'admin_test', 
    'admin@test.com', 
    '123456',  -- Contraseña simple para testing
    'admin', 
    'Admin', 
    'Test', 
    '88888888', 
    '3008888888', 
    true, 
    false
) ON CONFLICT (username) DO NOTHING;

-- Verificar que se creó
SELECT 
    username, 
    email, 
    role, 
    first_login,
    'Listo para usar' as estado
FROM users 
WHERE username = 'admin_test';

-- Mostrar todos los usuarios
SELECT 
    username, 
    role, 
    first_login,
    CASE 
        WHEN first_login THEN 'Debe cambiar contraseña'
        ELSE 'Listo para usar'
    END as estado
FROM users 
ORDER BY username;

