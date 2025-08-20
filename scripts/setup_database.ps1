# Script PowerShell para configurar la base de datos y ejecutar migraciones
# Ejecutar con: .\scripts\setup_database.ps1

param(
    [string]$DB_HOST = "localhost",
    [string]$DB_PORT = "5432",
    [string]$DB_NAME = "",
    [string]$DB_USER = "postgres",
    [string]$DB_PASSWORD = ""
)

# Función para escribir con colores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = "Red"
        "Green" = "Green"
        "Yellow" = "Yellow"
        "Blue" = "Blue"
        "White" = "White"
    }
    
    if ($colors.ContainsKey($Color)) {
        Write-Host $Message -ForegroundColor $colors[$Color]
    } else {
        Write-Host $Message
    }
}

# Función para mostrar banner
function Show-Banner {
    Write-ColorOutput "=====================================================" "Blue"
    Write-ColorOutput "  CONFIGURACIÓN DE BASE DE DATOS - AUTOTALLER      " "Blue"
    Write-ColorOutput "=====================================================" "Blue"
    Write-Host ""
}

# Función para verificar si psql está disponible
function Test-PSQLAvailable {
    try {
        $null = Get-Command psql -ErrorAction Stop
        Write-ColorOutput "✅ psql encontrado en el sistema" "Green"
        return $true
    } catch {
        Write-ColorOutput "❌ Error: psql no está instalado o no está en el PATH" "Red"
        Write-ColorOutput "Por favor instala PostgreSQL y asegúrate de que psql esté disponible" "Yellow"
        return $false
    }
}

# Función para solicitar información de conexión
function Get-DatabaseConnectionInfo {
    Write-ColorOutput "📋 Configuración de conexión a la base de datos:" "Yellow"
    
    if (-not $DB_HOST) {
        $DB_HOST = Read-Host "Host (default: localhost)"
        if (-not $DB_HOST) { $DB_HOST = "localhost" }
    }
    
    if (-not $DB_PORT) {
        $DB_PORT = Read-Host "Puerto (default: 5432)"
        if (-not $DB_PORT) { $DB_PORT = "5432" }
    }
    
    if (-not $DB_NAME) {
        $DB_NAME = Read-Host "Nombre de la base de datos"
        if (-not $DB_NAME) {
            Write-ColorOutput "❌ Error: El nombre de la base de datos es obligatorio" "Red"
            exit 1
        }
    }
    
    if (-not $DB_USER) {
        $DB_USER = Read-Host "Usuario (default: postgres)"
        if (-not $DB_USER) { $DB_USER = "postgres" }
    }
    
    if (-not $DB_PASSWORD) {
        $DB_PASSWORD = Read-Host "Contraseña" -AsSecureString
        $DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
    }
    
    return @{
        Host = $DB_HOST
        Port = $DB_PORT
        Name = $DB_NAME
        User = $DB_USER
        Password = $DB_PASSWORD
    }
}

# Función para ejecutar comandos SQL
function Execute-SQL {
    param(
        [string]$SQLFile,
        [string]$Description,
        [hashtable]$ConnectionInfo
    )
    
    Write-ColorOutput "🔄 $Description..." "Blue"
    
    $env:PGPASSWORD = $ConnectionInfo.Password
    
    try {
        $output = & psql -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User -d $ConnectionInfo.Name -f $SQLFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ $Description completado exitosamente" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Error en $Description" "Red"
            Write-ColorOutput "Detalles del error:" "Yellow"
            Write-Host $output
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error en $Description" "Red"
        Write-ColorOutput "Excepción: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Función para verificar conexión
function Test-DatabaseConnection {
    param([hashtable]$ConnectionInfo)
    
    Write-ColorOutput "🔍 Verificando conexión a la base de datos..." "Blue"
    
    $env:PGPASSWORD = $ConnectionInfo.Password
    
    try {
        $result = & psql -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User -d $ConnectionInfo.Name -c "SELECT version();" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Conexión exitosa a la base de datos" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ Error de conexión a la base de datos" "Red"
            Write-ColorOutput "Verifica:" "Yellow"
            Write-ColorOutput "  - Credenciales correctas" "Yellow"
            Write-ColorOutput "  - Base de datos existe" "Yellow"
            Write-ColorOutput "  - Usuario tiene permisos" "Yellow"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error de conexión a la base de datos" "Red"
        Write-ColorOutput "Excepción: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Función para crear base de datos si no existe
function New-DatabaseIfNotExists {
    param([hashtable]$ConnectionInfo)
    
    Write-ColorOutput "🔍 Verificando si la base de datos existe..." "Blue"
    
    $env:PGPASSWORD = $ConnectionInfo.Password
    
    try {
        # Conectar a postgres para verificar si existe la base de datos
        $result = & psql -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User -d "postgres" -c "SELECT 1 FROM pg_database WHERE datname = '$($ConnectionInfo.Name)';" 2>&1
        
        if ($result -match "1") {
            Write-ColorOutput "✅ La base de datos '$($ConnectionInfo.Name)' ya existe" "Green"
            return $true
        } else {
            Write-ColorOutput "📝 La base de datos '$($ConnectionInfo.Name)' no existe. Creándola..." "Yellow"
            
            $createResult = & createdb -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User $ConnectionInfo.Name 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Base de datos '$($ConnectionInfo.Name)' creada exitosamente" "Green"
                return $true
            } else {
                Write-ColorOutput "❌ Error al crear la base de datos" "Red"
                Write-Host $createResult
                return $false
            }
        }
    } catch {
        Write-ColorOutput "❌ Error al verificar/crear la base de datos" "Red"
        Write-ColorOutput "Excepción: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Función para mostrar progreso
function Show-Progress {
    param(
        [int]$Current,
        [int]$Total,
        [string]$Description
    )
    
    $percentage = [math]::Round(($Current * 100) / $Total)
    $bars = [math]::Round($percentage / 2)
    $spaces = 50 - $bars
    
    $progressBar = "[" + ("█" * $bars) + (" " * $spaces) + "]"
    Write-Host "`r$progressBar $percentage% - $Description" -NoNewline
}

# Función principal
function Main {
    Show-Banner
    
    # Verificar psql
    if (-not (Test-PSQLAvailable)) {
        exit 1
    }
    
    # Obtener información de conexión
    $connectionInfo = Get-DatabaseConnectionInfo
    
    Write-ColorOutput "🚀 Iniciando configuración de la base de datos..." "Blue"
    
    # Verificar conexión
    if (-not (Test-DatabaseConnection -ConnectionInfo $connectionInfo)) {
        exit 1
    }
    
    # Crear base de datos si no existe
    if (-not (New-DatabaseIfNotExists -ConnectionInfo $connectionInfo)) {
        exit 1
    }
    
    # Verificar conexión nuevamente (ahora a la base de datos específica)
    if (-not (Test-DatabaseConnection -ConnectionInfo $connectionInfo)) {
        exit 1
    }
    
    Write-ColorOutput "✅ Base de datos configurada correctamente" "Green"
    Write-Host ""
    
    # Ejecutar migraciones
    Write-ColorOutput "📦 Ejecutando migraciones..." "Blue"
    
    $currentStep = 1
    $totalSteps = 2
    
    # Paso 1: Ejecutar migración completa
    Show-Progress -Current $currentStep -Total $totalSteps -Description "Ejecutando migración completa"
    if (Execute-SQL -SQLFile "migrations\run_all_migrations.sql" -Description "Migración completa del sistema" -ConnectionInfo $connectionInfo) {
        $currentStep++
        Show-Progress -Current $currentStep -Total $totalSteps -Description "Migración completa completada"
        Write-Host ""
    } else {
        Write-ColorOutput "❌ Error en la migración. Abortando..." "Red"
        exit 1
    }
    
    # Paso 2: Crear usuarios de prueba
    Show-Progress -Current $currentStep -Total $totalSteps -Description "Creando usuarios de prueba"
    if (Execute-SQL -SQLFile "scripts\create_test_users.sql" -Description "Creación de usuarios de prueba" -ConnectionInfo $connectionInfo) {
        $currentStep++
        Show-Progress -Current $currentStep -Total $totalSteps -Description "Usuarios de prueba creados"
        Write-Host ""
    } else {
        Write-ColorOutput "❌ Error al crear usuarios de prueba. Abortando..." "Red"
        exit 1
    }
    
    Write-Host ""
    Write-ColorOutput "🎉 ¡Configuración completada exitosamente!" "Green"
    Write-Host ""
    
    # Mostrar resumen
    Write-ColorOutput "📊 Resumen de la configuración:" "Blue"
    Write-ColorOutput "✅ Base de datos: $($connectionInfo.Name)" "Green"
    Write-ColorOutput "✅ Host: $($connectionInfo.Host)" "Green"
    Write-ColorOutput "✅ Puerto: $($connectionInfo.Port)" "Green"
    Write-ColorOutput "✅ Usuario: $($connectionInfo.User)" "Green"
    Write-ColorOutput "✅ Migraciones ejecutadas" "Green"
    Write-ColorOutput "✅ Usuarios de prueba creados" "Green"
    Write-Host ""
    
    # Mostrar información de acceso
    Write-ColorOutput "🔑 Información de acceso para testing:" "Yellow"
    Write-ColorOutput "SuperAdmin: superadmin / superadmin@autotaller.com" "Blue"
    Write-ColorOutput "Admin: admin / admin@autotaller.com" "Blue"
    Write-ColorOutput "Operario 1: operario1 / operario1@autotaller.com" "Blue"
    Write-ColorOutput "Operario 2: operario2 / operario2@autotaller.com" "Blue"
    Write-ColorOutput "Operario 3: operario3 / operario3@autotaller.com" "Blue"
    Write-ColorOutput "Cliente 1: cliente1 / cliente1@email.com" "Blue"
    Write-ColorOutput "Cliente 2: cliente2 / cliente2@email.com" "Blue"
    Write-ColorOutput "Cliente 3: cliente3 / cliente3@email.com" "Blue"
    Write-ColorOutput "Cliente 4: cliente4 / cliente4@email.com" "Blue"
    Write-ColorOutput "Cliente 5: cliente5 / cliente5@email.com" "Blue"
    Write-Host ""
    Write-ColorOutput "⚠️  NOTA: Todas las contraseñas son: 123456" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "🚀 El sistema está listo para pruebas!" "Green"
}

# Ejecutar función principal
Main
