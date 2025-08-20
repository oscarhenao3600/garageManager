-- Script para crear usuario con hash de contraseña válido
-- Hash generado para contraseña "123456": $2b$10$WgwnG8nPyQ5nHjN4RdyOEujitmP/KODiiM8Z0QyLso91todBQ4/Ha

-- Crear usuario con hash válido
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
    'admin_valid', 
    'admin@valid.com', 
    '$2b$10$WgwnG8nPyQ5nHjN4RdyOEujitmP/KODiiM8Z0QyLso91todBQ4/Ha', 
    'admin', 
    'Admin', 
    'Valid', 
    '77777777', 
    '3007777777', 
    true, 
    false
) ON CONFLICT (username) DO UPDATE SET 
    password = '$2b$10$WgwnG8nPyQ5nHjN4RdyOEujitmP/KODiiM8Z0QyLso91todBQ4/Ha',
    email = 'admin@valid.com'
RETURNING username, email, role;

-- Verificar que se creó
SELECT 
    username, 
    email, 
    role, 
    first_login,
    'Listo para usar' as estado
FROM users 
WHERE username = 'admin_valid';

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
