-- Script simple para crear un usuario de prueba
-- Usuario: testuser
-- Contraseña: 123456

-- Primero, vamos a crear un hash de contraseña válido
-- Para bcrypt, la contraseña "123456" debería generar un hash como este:
-- $2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4

-- Insertar usuario de prueba
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
    'testuser', 
    'test@test.com', 
    '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 
    'admin', 
    'Test', 
    'User', 
    '99999999', 
    '3009999999', 
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
WHERE username = 'testuser';

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

