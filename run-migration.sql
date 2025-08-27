-- Script para ejecutar la migración de corrección del esquema
-- Ejecutar este script en la base de datos PostgreSQL

-- Corregir esquema de service_orders
\i migrations/007_fix_service_orders_schema.sql

-- Verificar que la migración se ejecutó correctamente
SELECT 'Verificando estructura de service_orders...' as status;

-- Mostrar la estructura actual de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'service_orders' 
ORDER BY ordinal_position;

-- Verificar que los campos requeridos existen
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos los campos requeridos están presentes'
        ELSE '❌ Faltan campos: ' || string_agg(column_name, ', ')
    END as status
FROM (
    SELECT unnest(ARRAY['estimated_time', 'actual_time', 'taken_by', 'taken_at', 'updated_at']) as column_name
    EXCEPT
    SELECT column_name FROM information_schema.columns WHERE table_name = 'service_orders'
) missing_columns;

-- Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'service_orders' 
ORDER BY indexname;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'service_orders';

SELECT 'Migración completada. Revisa los resultados arriba.' as final_status;
