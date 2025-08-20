-- Script para crear usuarios de prueba con contraseñas conocidas
-- Ejecutar después de verificar que la base de datos esté funcionando

-- =====================================================
-- CREACIÓN DE USUARIOS DE PRUEBA PARA TESTING
-- =====================================================

BEGIN;

-- 1. CREAR SUPERADMIN (si no existe)
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('superadmin', 'superadmin@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'superAdmin', 'Super', 'Administrador', '12345678', '3001234567', true, false)
ON CONFLICT (username) DO NOTHING;

-- 2. CREAR ADMIN (si no existe)
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('admin', 'admin@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'admin', 'Admin', 'Sistema', '87654321', '3008765432', true, false)
ON CONFLICT (username) DO NOTHING;

-- 3. CREAR OPERARIOS DE PRUEBA (si no existen)
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('operario1', 'operario1@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Juan', 'Mecánico', '11111111', '3001111111', true, false),
('operario2', 'operario2@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Carlos', 'Técnico', '22222222', '3002222222', true, false),
('operario3', 'operario3@autotaller.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'operator', 'Miguel', 'Especialista', '33333333', '3003333333', true, false)
ON CONFLICT (username) DO NOTHING;

-- 4. CREAR CLIENTES DE PRUEBA (si no existen)
INSERT INTO users (username, email, password, role, first_name, last_name, document_number, phone, is_active, first_login) VALUES
('cliente1', 'cliente1@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Ana', 'García', '44444444', '3004444444', true, false),
('cliente2', 'cliente2@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'Luis', 'Rodríguez', '55555555', '3005555555', true, false),
('cliente3', 'cliente3@email.com', '$2b$10$rQZ8K9X2Y1W3V4U5T6S7R8Q9P0O1N2M3L4K5J6H7G8F9E0D1C2B3A4', 'client', 'María', 'López', '66666666', '3006666666', true, false)
ON CONFLICT (username) DO NOTHING;

-- 5. ACTUALIZAR USUARIOS EXISTENTES PARA QUE NO TENGAN QUE CAMBIAR CONTRASEÑA
UPDATE users SET first_login = false WHERE username IN ('cesar perez', 'carlos lopez', 'yenny ardila');

-- 6. VERIFICAR USUARIOS CREADOS
SELECT 
    username, 
    email, 
    role, 
    first_login,
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

