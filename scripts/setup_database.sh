#!/bin/bash

# Script para configurar la base de datos y ejecutar migraciones
# Ejecutar con: bash scripts/setup_database.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  CONFIGURACIÓN DE BASE DE DATOS - AUTOTALLER      ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql no está instalado o no está en el PATH${NC}"
    echo -e "${YELLOW}Por favor instala PostgreSQL y asegúrate de que psql esté disponible${NC}"
    exit 1
fi

# Solicitar información de conexión a la base de datos
echo -e "${YELLOW}📋 Configuración de conexión a la base de datos:${NC}"
read -p "Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Puerto (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Nombre de la base de datos: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Error: El nombre de la base de datos es obligatorio${NC}"
    exit 1
fi

read -p "Usuario (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -s -p "Contraseña: " DB_PASSWORD
echo

# Variable de entorno para la contraseña
export PGPASSWORD=$DB_PASSWORD

# Función para ejecutar comandos SQL
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo -e "${BLUE}🔄 $description...${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" > /tmp/sql_output.log 2>&1; then
        echo -e "${GREEN}✅ $description completado exitosamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error en $description${NC}"
        echo -e "${YELLOW}Detalles del error:${NC}"
        cat /tmp/sql_output.log
        return 1
    fi
}

# Función para verificar conexión
check_connection() {
    echo -e "${BLUE}🔍 Verificando conexión a la base de datos...${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexión exitosa a la base de datos${NC}"
        return 0
    else
        echo -e "${RED}❌ Error de conexión a la base de datos${NC}"
        echo -e "${YELLOW}Verifica:${NC}"
        echo -e "  - Credenciales correctas"
        echo -e "  - Base de datos existe"
        echo -e "  - Usuario tiene permisos"
        return 1
    fi
}

# Función para crear base de datos si no existe
create_database_if_not_exists() {
    echo -e "${BLUE}🔍 Verificando si la base de datos existe...${NC}"
    
    # Conectar a postgres para verificar si existe la base de datos
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "postgres" -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" | grep -q 1; then
        echo -e "${GREEN}✅ La base de datos '$DB_NAME' ya existe${NC}"
        return 0
    else
        echo -e "${YELLOW}📝 La base de datos '$DB_NAME' no existe. Creándola...${NC}"
        
        if createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"; then
            echo -e "${GREEN}✅ Base de datos '$DB_NAME' creada exitosamente${NC}"
            return 0
        else
            echo -e "${RED}❌ Error al crear la base de datos${NC}"
            return 1
        fi
    fi
}

# Función para mostrar progreso
show_progress() {
    local current=$1
    local total=$2
    local description=$3
    
    local percentage=$((current * 100 / total))
    local bars=$((percentage / 2))
    local spaces=$((50 - bars))
    
    printf "\r["
    printf "%${bars}s" | tr ' ' '█'
    printf "%${spaces}s" | tr ' ' ' '
    printf "] %d%% - %s" "$percentage" "$description"
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando configuración de la base de datos...${NC}"
    
    # Verificar conexión
    if ! check_connection; then
        exit 1
    fi
    
    # Crear base de datos si no existe
    if ! create_database_if_not_exists; then
        exit 1
    fi
    
    # Verificar conexión nuevamente (ahora a la base de datos específica)
    if ! check_connection; then
        exit 1
    fi
    
    echo -e "${GREEN}✅ Base de datos configurada correctamente${NC}"
    echo
    
    # Ejecutar migraciones
    echo -e "${BLUE}📦 Ejecutando migraciones...${NC}"
    
    local current_step=1
    local total_steps=2
    
    # Paso 1: Ejecutar migración completa
    show_progress $current_step $total_steps "Ejecutando migración completa"
    if execute_sql "migrations/run_all_migrations.sql" "Migración completa del sistema"; then
        current_step=$((current_step + 1))
        show_progress $current_step $total_steps "Migración completa completada"
        echo
    else
        echo -e "${RED}❌ Error en la migración. Abortando...${NC}"
        exit 1
    fi
    
    # Paso 2: Crear usuarios de prueba
    show_progress $current_step $total_steps "Creando usuarios de prueba"
    if execute_sql "scripts/create_test_users.sql" "Creación de usuarios de prueba"; then
        current_step=$((current_step + 1))
        show_progress $current_step $total_steps "Usuarios de prueba creados"
        echo
    else
        echo -e "${RED}❌ Error al crear usuarios de prueba. Abortando...${NC}"
        exit 1
    fi
    
    echo
    echo -e "${GREEN}🎉 ¡Configuración completada exitosamente!${NC}"
    echo
    
    # Mostrar resumen
    echo -e "${BLUE}📊 Resumen de la configuración:${NC}"
    echo -e "${GREEN}✅ Base de datos: $DB_NAME${NC}"
    echo -e "${GREEN}✅ Host: $DB_HOST${NC}"
    echo -e "${GREEN}✅ Puerto: $DB_PORT${NC}"
    echo -e "${GREEN}✅ Usuario: $DB_USER${NC}"
    echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"
    echo -e "${GREEN}✅ Usuarios de prueba creados${NC}"
    echo
    
    # Mostrar información de acceso
    echo -e "${YELLOW}🔑 Información de acceso para testing:${NC}"
    echo -e "${BLUE}SuperAdmin:${NC} superadmin / superadmin@autotaller.com"
    echo -e "${BLUE}Admin:${NC} admin / admin@autotaller.com"
    echo -e "${BLUE}Operario 1:${NC} operario1 / operario1@autotaller.com"
    echo -e "${BLUE}Operario 2:${NC} operario2 / operario2@autotaller.com"
    echo -e "${BLUE}Operario 3:${NC} operario3 / operario3@autotaller.com"
    echo -e "${BLUE}Cliente 1:${NC} cliente1 / cliente1@email.com"
    echo -e "${BLUE}Cliente 2:${NC} cliente2 / cliente2@email.com"
    echo -e "${BLUE}Cliente 3:${NC} cliente3 / cliente3@email.com"
    echo -e "${BLUE}Cliente 4:${NC} cliente4 / cliente4@email.com"
    echo -e "${BLUE}Cliente 5:${NC} cliente5 / cliente5@email.com"
    echo
    echo -e "${YELLOW}⚠️  NOTA: Todas las contraseñas son: ${NC}123456"
    echo
    
    # Limpiar archivo temporal
    rm -f /tmp/sql_output.log
    
    echo -e "${GREEN}🚀 El sistema está listo para pruebas!${NC}"
}

# Ejecutar función principal
main "$@"
