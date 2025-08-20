-- Script para verificar la configuración del sistema
-- Ejecutar después de las migraciones para confirmar que todo esté correcto

-- =====================================================
-- VERIFICACIÓN DE CONFIGURACIÓN - AUTOTALLER PRO
-- =====================================================

-- 1. VERIFICAR TABLAS CREADAS
SELECT 'Verificando tablas del sistema...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'vehicles', 'vehicle_types', 'checklist_items', 
                           'service_orders', 'service_order_checklist', 'system_audit_log',
                           'user_activity_log', 'checklist_validation_rules',
                           'service_order_status_history', 'inventory_items', 'invoices',
                           'notifications', 'service_order_items', 'service_procedures')
        THEN '✅ Tabla principal'
        ELSE '⚠️  Tabla adicional'
    END as tipo
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFICAR COLUMNAS CRÍTICAS
SELECT 'Verificando columnas críticas...' as status;

-- Verificar campo first_login en users
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'first_login' AND data_type = 'boolean' THEN '✅ Correcto'
        WHEN column_name = 'first_login' THEN '❌ Tipo incorrecto'
        ELSE 'ℹ️  Otro campo'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'first_login';

-- Verificar campo vehicle_type en vehicles
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'vehicle_type' AND data_type = 'text' THEN '✅ Correcto'
        WHEN column_name = 'vehicle_type' THEN '❌ Tipo incorrecto'
        ELSE 'ℹ️  Otro campo'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND column_name = 'vehicle_type';

-- Verificar campos en service_orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('taken_by', 'taken_at', 'updated_at') THEN '✅ Campo de gestión de operarios'
        ELSE 'ℹ️  Campo estándar'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
AND column_name IN ('taken_by', 'taken_at', 'updated_at');

-- 3. VERIFICAR DATOS INICIALES
SELECT 'Verificando datos iniciales...' as status;

-- Verificar tipos de vehículo
SELECT 
    'Tipos de vehículo' as categoria,
    COUNT(*) as cantidad,
    STRING_AGG(name, ', ') as tipos
FROM vehicle_types;

-- Verificar items de checklist
SELECT 
    'Items de checklist' as categoria,
    COUNT(*) as cantidad,
    COUNT(DISTINCT vehicle_type_id) as tipos_vehiculo_cubiertos
FROM checklist_items;

-- Verificar reglas de validación
SELECT 
    'Reglas de validación' as categoria,
    COUNT(*) as cantidad,
    STRING_AGG(rule_type, ', ') as tipos_reglas
FROM checklist_validation_rules;

-- 4. VERIFICAR USUARIOS DE PRUEBA
SELECT 'Verificando usuarios de prueba...' as status;

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
        ELSE 5
    END;

-- 5. VERIFICAR RELACIONES Y CONSTRAINTS
SELECT 'Verificando relaciones y constraints...' as status;

-- Verificar foreign keys
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN '✅ FK configurada'
        ELSE '⚠️  Otro tipo de constraint'
    END as estado
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('vehicles', 'service_orders', 'checklist_items', 'service_order_checklist');

-- 6. VERIFICAR ÍNDICES
SELECT 'Verificando índices...' as status;

SELECT 
    indexname,
    tablename,
    indexdef,
    CASE 
        WHEN indexname LIKE '%idx_%' THEN '✅ Índice personalizado'
        ELSE 'ℹ️  Índice del sistema'
    END as tipo
FROM pg_indexes 
WHERE tablename IN ('users', 'vehicles', 'service_orders', 'checklist_items', 'system_audit_log')
ORDER BY tablename, indexname;

-- 7. VERIFICAR FUNCIONES Y TRIGGERS
SELECT 'Verificando funciones y triggers...' as status;

-- Verificar funciones
SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name LIKE '%audit%' OR routine_name LIKE '%log%' THEN '✅ Función de auditoría'
        ELSE 'ℹ️  Otra función'
    END as tipo
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%audit%' OR routine_name LIKE '%log%';

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    CASE 
        WHEN trigger_name LIKE '%audit%' OR trigger_name LIKE '%log%' THEN '✅ Trigger de auditoría'
        ELSE 'ℹ️  Otro trigger'
    END as tipo
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 8. VERIFICAR VISTAS
SELECT 'Verificando vistas...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE '%audit%' OR table_name LIKE '%report%' THEN '✅ Vista de auditoría/reporte'
        ELSE 'ℹ️  Otra vista'
    END as tipo
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 9. RESUMEN DE VERIFICACIÓN
SELECT 'Generando resumen de verificación...' as status;

WITH verification_summary AS (
    SELECT 
        'Tablas del sistema' as categoria,
        COUNT(*) as cantidad,
        'Tablas principales del sistema' as descripcion
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('users', 'vehicles', 'vehicle_types', 'checklist_items', 
                       'service_orders', 'service_order_checklist', 'system_audit_log',
                       'user_activity_log', 'checklist_validation_rules',
                       'service_order_status_history')
    
    UNION ALL
    
    SELECT 
        'Usuarios de prueba' as categoria,
        COUNT(*) as cantidad,
        'Usuarios creados para testing' as descripcion
    FROM users
    
    UNION ALL
    
    SELECT 
        'Tipos de vehículo' as categoria,
        COUNT(*) as cantidad,
        'Tipos de vehículo configurados' as descripcion
    FROM vehicle_types
    
    UNION ALL
    
    SELECT 
        'Items de checklist' as categoria,
        COUNT(*) as cantidad,
        'Items de checklist por tipo de vehículo' as descripcion
    FROM checklist_items
    
    UNION ALL
    
    SELECT 
        'Reglas de validación' as categoria,
        COUNT(*) as cantidad,
        'Reglas de validación de checklist' as descripcion
    FROM checklist_validation_rules
)
SELECT 
    categoria,
    cantidad,
    descripcion,
    CASE 
        WHEN categoria = 'Tablas del sistema' AND cantidad >= 10 THEN '✅ Sistema completo'
        WHEN categoria = 'Usuarios de prueba' AND cantidad >= 10 THEN '✅ Usuarios listos'
        WHEN categoria = 'Tipos de vehículo' AND cantidad >= 5 THEN '✅ Tipos configurados'
        WHEN categoria = 'Items de checklist' AND cantidad >= 20 THEN '✅ Checklist configurado'
        WHEN categoria = 'Reglas de validación' AND cantidad >= 3 THEN '✅ Validaciones configuradas'
        ELSE '⚠️  Revisar configuración'
    END as estado
FROM verification_summary
ORDER BY 
    CASE categoria
        WHEN 'Tablas del sistema' THEN 1
        WHEN 'Usuarios de prueba' THEN 2
        WHEN 'Tipos de vehículo' THEN 3
        WHEN 'Items de checklist' THEN 4
        WHEN 'Reglas de validación' THEN 5
        ELSE 6
    END;

-- 10. MENSAJE FINAL
SELECT '🎉 ¡Verificación completada!' as mensaje;
SELECT 'El sistema está listo para pruebas si todos los estados muestran ✅' as instruccion;
