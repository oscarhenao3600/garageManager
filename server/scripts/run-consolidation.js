#!/usr/bin/env node

/**
 * Script para consolidar las tablas users y clients de manera inteligente
 * Ejecutar con: node server/scripts/run-consolidation.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando consolidación inteligente de tablas users y clients...\n');

// Leer los scripts SQL
const preCheckScript = fs.readFileSync(join(__dirname, 'pre-consolidation-check.sql'), 'utf8');
const consolidationScript = fs.readFileSync(join(__dirname, 'consolidate-users-clients.sql'), 'utf8');

console.log('📋 Scripts SQL cargados correctamente');
console.log('1. pre-consolidation-check.sql - Verificación previa');
console.log('2. consolidate-users-clients.sql - Consolidación principal\n');

console.log('⚠️  IMPORTANTE - PASOS A SEGUIR:');
console.log('─'.repeat(60));
console.log('1. HAZ BACKUP COMPLETO de tu base de datos');
console.log('2. Ejecuta en entorno de desarrollo PRIMERO');
console.log('3. Verifica que no hay usuarios activos en el sistema');
console.log('4. Ten plan de rollback preparado');
console.log('─'.repeat(60));

console.log('\n📝 PASOS DE EJECUCIÓN:');
console.log('─'.repeat(40));

console.log('\n🔍 PASO 1: Verificación previa');
console.log('Ejecuta este script en PostgreSQL:');
console.log('\\i server/scripts/pre-consolidation-check.sql');
console.log('Este script te mostrará:');
console.log('• Estructura actual de ambas tablas');
console.log('• Conteo de registros');
console.log('• Clientes duplicados');
console.log('• Conflictos potenciales');
console.log('• Estado de vehículos');

console.log('\n⚡ PASO 2: Consolidación principal');
console.log('Después de revisar la verificación, ejecuta:');
console.log('\\i server/scripts/consolidate-users-clients.sql');
console.log('Este script:');
console.log('• Agregará campos faltantes a users');
console.log('• Consolidará clientes duplicados');
console.log('• Insertará clientes únicos');
console.log('• Actualizará referencias de vehículos');
console.log('• Verificará integridad de datos');

console.log('\n✅ PASO 3: Verificación post-consolidación');
console.log('El script mostrará:');
console.log('• Resumen de consolidación por roles');
console.log('• Estadísticas de vehículos');
console.log('• Clientes con vehículos');
console.log('• Verificación de integridad');

console.log('\n🔧 PASO 4: Limpieza final (OPCIONAL)');
console.log('Solo después de verificar que todo funciona:');
console.log('1. ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL;');
console.log('2. ALTER TABLE vehicles DROP COLUMN clientId;');
console.log('3. ALTER TABLE vehicles RENAME COLUMN user_id TO clientId;');
console.log('4. DROP TABLE clients; (opcional)');

console.log('\n📊 CONTENIDO DEL SCRIPT DE VERIFICACIÓN PREVIA:');
console.log('─'.repeat(50));
console.log(preCheckScript);
console.log('─'.repeat(50));

console.log('\n🔄 CONTENIDO DEL SCRIPT DE CONSOLIDACIÓN:');
console.log('─'.repeat(50));
console.log(consolidationScript);
console.log('─'.repeat(50));

console.log('\n🎯 BENEFICIOS DE LA CONSOLIDACIÓN:');
console.log('✅ Login unificado - No más conflictos de autenticación');
console.log('✅ Datos consistentes - Información sincronizada');
console.log('✅ Mantenimiento fácil - Una sola tabla para gestionar');
console.log('✅ Performance mejorada - Menos JOINs complejos');
console.log('✅ Integridad de datos - Referencias consistentes');

console.log('\n⚠️  RIESGOS Y CONSIDERACIONES:');
console.log('❌ Posible pérdida de datos si no se hace backup');
console.log('❌ Interrupción del servicio durante la migración');
console.log('❌ Conflictos de email/username si no se manejan bien');
console.log('❌ Vehículos huérfanos si las referencias fallan');

console.log('\n🛡️  MEDIDAS DE SEGURIDAD:');
console.log('🔒 Backup completo antes de empezar');
console.log('🔒 Ejecutar en entorno de prueba primero');
console.log('🔒 Verificar cada paso antes de continuar');
console.log('🔒 Tener plan de rollback preparado');
console.log('🔒 Ejecutar en horario de bajo tráfico');

console.log('\n✅ Script de consolidación inteligente preparado correctamente');
console.log('📚 Revisa ambos archivos SQL antes de ejecutar');
console.log('🚀 ¡Buena suerte con la consolidación!');
