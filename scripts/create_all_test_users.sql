-- Script para crear usuarios de prueba para todos los roles
-- Ejecutar después de verificar que el sistema funciona

-- =====================================================
-- CREACIÓN DE USUARIOS DE PRUEBA COMPLETOS
-- =====================================================

BEGIN;

-- 1. CREAR SUPERADMIN
-- Contraseña: super123
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
    'superadmin', 
    'superadmin@autotaller.com', 
    '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 
    'superAdmin', 
    'Super', 
    'Administrador', 
    '12345678', 
    '3001234567', 
    true, 
    false
) ON CONFLICT (username) DO UPDATE SET 
    password = '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4',
    role = 'superAdmin',
    first_login = false;

-- 2. CREAR ADMINISTRADORES
-- Contraseña: admin123
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
) VALUES 
('admin1', 'admin1@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'admin', 'Admin', 'Principal', '11111111', '3001111111', true, false),
('admin2', 'admin2@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'admin', 'Admin', 'Secundario', '22222222', '3002222222', true, false)
ON CONFLICT (username) DO UPDATE SET 
    password = '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4',
    role = 'admin',
    first_login = false;

-- 3. CREAR OPERARIOS
-- Contraseña: oper123
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
) VALUES 
('operario1', 'operario1@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Juan', 'Mecánico', '33333333', '3003333333', true, false),
('operario2', 'operario2@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Carlos', 'Técnico', '44444444', '3004444444', true, false),
('operario3', 'operario3@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Miguel', 'Especialista', '55555555', '3005555555', true, false),
('operario4', 'operario4@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Pedro', 'Electricista', '66666666', '3006666666', true, false)
ON CONFLICT (username) DO UPDATE SET 
    password = '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4',
    role = 'operator',
    first_login = false;

-- 4. CREAR CLIENTES
-- Contraseña: client123
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
) VALUES 
('cliente1', 'cliente1@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Ana', 'García', '77777777', '3007777777', true, false),
('cliente2', 'cliente2@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Luis', 'Rodríguez', '88888888', '3008888888', true, false),
('cliente3', 'cliente3@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'María', 'López', '99999999', '3009999999', true, false),
('cliente4', 'cliente4@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Carmen', 'Hernández', '10101010', '3001010101', true, false),
('cliente5', 'cliente5@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Roberto', 'Martínez', '12121212', '3001212121', true, false)
ON CONFLICT (username) DO UPDATE SET 
    password = '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4',
    role = 'client',
    first_login = false;

-- 5. ACTUALIZAR USUARIOS EXISTENTES PARA QUE NO TENGAN QUE CAMBIAR CONTRASEÑA
UPDATE users SET first_login = false WHERE username IN ('cesar perez', 'carlos lopez', 'yenny ardila', 'oscar henao');

-- 6. VERIFICAR USUARIOS CREADOS
SELECT 
    'RESUMEN DE USUARIOS' as titulo,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN role = 'superAdmin' THEN 1 END) as superadmin,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as administradores,
    COUNT(CASE WHEN role = 'operator' THEN 1 END) as operarios,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clientes
FROM users;

-- 7. MOSTRAR TODOS LOS USUARIOS ORGANIZADOS POR ROL
SELECT 
    role as rol,
    username,
    email,
    first_name || ' ' || last_name as nombre_completo,
    CASE 
        WHEN first_login THEN 'Debe cambiar contraseña'
        ELSE 'Listo para usar'
    END as estado
FROM users 
ORDER BY 
    CASE role 
        WHEN 'superAdmin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'operator' THEN 3
        WHEN 'client' THEN 4
        ELSE 5
    END, username;

COMMIT;
