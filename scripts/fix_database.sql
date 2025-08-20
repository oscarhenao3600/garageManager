-- Script para arreglar la base de datos y agregar columnas faltantes
-- Ejecutar este script en tu base de datos PostgreSQL

-- =====================================================
-- ARREGLO DE BASE DE DATOS - AUTOTALLER PRO
-- =====================================================

-- 1. VERIFICAR SI EXISTE LA TABLA users
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe. Ejecuta primero la migración inicial.';
    END IF;
END $$;

-- 2. AGREGAR COLUMNA first_login SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'first_login'
    ) THEN
        ALTER TABLE users ADD COLUMN first_login BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Columna first_login agregada a la tabla users';
    ELSE
        RAISE NOTICE 'La columna first_login ya existe';
    END IF;
END $$;

-- 3. AGREGAR COLUMNA vehicle_type A vehicles SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'vehicle_type'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN vehicle_type TEXT NOT NULL DEFAULT 'sedan';
        RAISE NOTICE 'Columna vehicle_type agregada a la tabla vehicles';
    ELSE
        RAISE NOTICE 'La columna vehicle_type ya existe';
    END IF;
END $$;

-- 4. CREAR TABLA vehicle_types SI NO EXISTE
CREATE TABLE IF NOT EXISTS vehicle_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. CREAR TABLA checklist_items SI NO EXISTE
CREATE TABLE IF NOT EXISTS checklist_items (
    id SERIAL PRIMARY KEY,
    vehicle_type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
    name TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. CREAR TABLA service_order_checklist SI NO EXISTE
CREATE TABLE IF NOT EXISTS service_order_checklist (
    id SERIAL PRIMARY KEY,
    service_order_id INTEGER NOT NULL REFERENCES service_orders(id),
    checklist_item_id INTEGER NOT NULL REFERENCES checklist_items(id),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. AGREGAR COLUMNAS A service_orders SI NO EXISTEN
DO $$
BEGIN
    -- Agregar taken_by
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'service_orders' AND column_name = 'taken_by'
    ) THEN
        ALTER TABLE service_orders ADD COLUMN taken_by INTEGER REFERENCES users(id);
        RAISE NOTICE 'Columna taken_by agregada a service_orders';
    END IF;
    
    -- Agregar taken_at
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'service_orders' AND column_name = 'taken_at'
    ) THEN
        ALTER TABLE service_orders ADD COLUMN taken_at TIMESTAMP;
        RAISE NOTICE 'Columna taken_at agregada a service_orders';
    END IF;
    
    -- Agregar updated_at
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'service_orders' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE service_orders ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada a service_orders';
    END IF;
END $$;

-- 8. CREAR TABLA service_order_status_history SI NO EXISTE
CREATE TABLE IF NOT EXISTS service_order_status_history (
    id SERIAL PRIMARY KEY,
    service_order_id INTEGER NOT NULL REFERENCES service_orders(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    reason TEXT
);

-- 9. CREAR TABLA system_audit_log SI NO EXISTE
CREATE TABLE IF NOT EXISTS system_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT,
    resource_id INTEGER,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    severity TEXT NOT NULL DEFAULT 'info'
);

-- 10. CREAR TABLA user_activity_log SI NO EXISTE
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    session_id TEXT,
    action TEXT NOT NULL,
    page TEXT,
    duration INTEGER,
    data_accessed TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT
);

-- 11. CREAR TABLA checklist_validation_rules SI NO EXISTE
CREATE TABLE IF NOT EXISTS checklist_validation_rules (
    id SERIAL PRIMARY KEY,
    vehicle_type_id INTEGER NOT NULL REFERENCES vehicle_types(id),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    description TEXT,
    conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. INSERTAR DATOS INICIALES PARA vehicle_types
INSERT INTO vehicle_types (name, description) VALUES
('moto', 'Motocicletas y scooters'),
('sedan', 'Automóviles sedan'),
('hatchback', 'Automóviles hatchback'),
('camioneta', 'Camionetas y SUVs'),
('camion', 'Camiones y vehículos pesados')
ON CONFLICT (name) DO NOTHING;

-- 13. INSERTAR ITEMS DE CHECKLIST PARA CADA TIPO DE VEHÍCULO
-- Moto
INSERT INTO checklist_items (vehicle_type_id, name, description, is_required, order_index) VALUES
((SELECT id FROM vehicle_types WHERE name = 'moto'), 'revision_general', 'Revisión general del vehículo', true, 1),
((SELECT id FROM vehicle_types WHERE name = 'moto'), 'revision_frenos', 'Revisión del sistema de frenos', true, 2),
((SELECT id FROM vehicle_types WHERE name = 'moto'), 'revision_aceite', 'Revisión del nivel de aceite', true, 3),
((SELECT id FROM vehicle_types WHERE name = 'moto'), 'revision_neumaticos', 'Revisión de neumáticos', true, 4),
((SELECT id FROM vehicle_types WHERE name = 'moto'), 'revision_luces', 'Revisión de luces y señalización', true, 5)
ON CONFLICT DO NOTHING;

-- Sedan
INSERT INTO checklist_items (vehicle_type_id, name, description, is_required, order_index) VALUES
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_general', 'Revisión general del vehículo', true, 1),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_frenos', 'Revisión del sistema de frenos', true, 2),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_aceite', 'Revisión del nivel de aceite', true, 3),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_neumaticos', 'Revisión de neumáticos', true, 4),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_luces', 'Revisión de luces y señalización', true, 5),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_aire', 'Revisión del sistema de aire acondicionado', false, 6),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'revision_transmision', 'Revisión de la transmisión', true, 7)
ON CONFLICT DO NOTHING;

-- Hatchback
INSERT INTO checklist_items (vehicle_type_id, name, description, is_required, order_index) VALUES
((SELECT id FROM vehicle_types WHERE name = 'hatchback'), 'revision_general', 'Revisión general del vehículo', true, 1),
((SELECT id FROM vehicle_types WHERE name = 'hatchback'), 'revision_frenos', 'Revisión del sistema de frenos', true, 2),
((SELECT id FROM vehicle_types WHERE name = 'hatchback'), 'revision_aceite', 'Revisión del nivel de aceite', true, 3),
((SELECT id FROM vehicle_types WHERE name = 'hatchback'), 'revision_neumaticos', 'Revisión de neumáticos', true, 4),
((SELECT id FROM vehicle_types WHERE name = 'hatchback'), 'revision_luces', 'Revisión de luces y señalización', true, 5),
((SELECT id FROM vehicle_types WHERE name = 'hatchback'), 'revision_aire', 'Revisión del sistema de aire acondicionado', false, 6)
ON CONFLICT DO NOTHING;

-- Camioneta
INSERT INTO checklist_items (vehicle_type_id, name, description, is_required, order_index) VALUES
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_general', 'Revisión general del vehículo', true, 1),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_frenos', 'Revisión del sistema de frenos', true, 2),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_aceite', 'Revisión del nivel de aceite', true, 3),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_neumaticos', 'Revisión de neumáticos', true, 4),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_luces', 'Revisión de luces y señalización', true, 5),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_suspension', 'Revisión de la suspensión', true, 6),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'revision_traccion', 'Revisión del sistema de tracción', false, 7)
ON CONFLICT DO NOTHING;

-- Camión
INSERT INTO checklist_items (vehicle_type_id, name, description, is_required, order_index) VALUES
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_general', 'Revisión general del vehículo', true, 1),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_frenos', 'Revisión del sistema de frenos', true, 2),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_aceite', 'Revisión del nivel de aceite', true, 3),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_neumaticos', 'Revisión de neumáticos', true, 4),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_luces', 'Revisión de luces y señalización', true, 5),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_suspension', 'Revisión de la suspensión', true, 6),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_motor', 'Revisión completa del motor', true, 7),
((SELECT id FROM vehicle_types WHERE name = 'camion'), 'revision_transmision', 'Revisión de la transmisión', true, 8)
ON CONFLICT DO NOTHING;

-- 14. INSERTAR REGLAS DE VALIDACIÓN POR DEFECTO
INSERT INTO checklist_validation_rules (vehicle_type_id, rule_name, rule_type, description, conditions) VALUES
((SELECT id FROM vehicle_types WHERE name = 'moto'), 'Revisión Completa Antes de Completar', 'required_before_status_change', 'Todos los items del checklist deben estar completados antes de cambiar el estado a completed', '{"required_status": "completed", "checklist_completion": "100%"}'),
((SELECT id FROM vehicle_types WHERE name = 'sedan'), 'Inspección Técnica Obligatoria', 'required_before_status_change', 'La inspección técnica debe estar completada antes de finalizar el servicio', '{"required_status": "completed", "specific_items": ["revision_frenos", "revision_neumaticos"]}'),
((SELECT id FROM vehicle_types WHERE name = 'camioneta'), 'Checklist Secuencial', 'sequential_completion', 'Los items del checklist deben completarse en orden secuencial', '{"completion_order": "sequential", "allow_parallel": false}')
ON CONFLICT DO NOTHING;

-- 15. ACTUALIZAR USUARIOS EXISTENTES PARA QUE NO TENGAN QUE CAMBIAR CONTRASEÑA
UPDATE users SET first_login = false WHERE first_login IS NULL;

-- 16. CREAR ÍNDICES PARA OPTIMIZAR EL RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_users_first_login ON users(first_login);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_service_orders_taken_by ON service_orders(taken_by);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_vehicle_type ON checklist_items(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_log_timestamp ON system_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);

-- 17. MENSAJE DE COMPLETADO
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ARREGLO DE BASE DE DATOS COMPLETADO EXITOSAMENTE';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Se han agregado todas las columnas y tablas faltantes';
    RAISE NOTICE 'El sistema ahora debería funcionar correctamente';
    RAISE NOTICE '=====================================================';
END $$;
