# Script PowerShell para arreglar la base de datos
# Ejecutar con: .\scripts\fix_database.ps1

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
    Write-ColorOutput "  ARREGLO DE BASE DE DATOS - AUTOTALLER PRO        " "Blue"
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

# Función para ejecutar script SQL
function Execute-SQLScript {
    param(
        [hashtable]$ConnectionInfo
    )
    
    Write-ColorOutput "🔄 Ejecutando script de arreglo de base de datos..." "Blue"
    
    $env:PGPASSWORD = $ConnectionInfo.Password
    $sqlFile = "scripts\fix_database.sql"
    
    # Verificar que el archivo SQL existe
    if (-not (Test-Path $sqlFile)) {
        Write-ColorOutput "❌ Error: No se encontró el archivo $sqlFile" "Red"
        return $false
    }
    
    try {
        Write-ColorOutput "📁 Ejecutando archivo: $sqlFile" "Blue"
        
        $output = & psql -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User -d $ConnectionInfo.Name -f $sqlFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Script de arreglo ejecutado exitosamente" "Green"
            Write-Host $output
            return $true
        } else {
            Write-ColorOutput "❌ Error al ejecutar el script SQL" "Red"
            Write-ColorOutput "Detalles del error:" "Yellow"
            Write-Host $output
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error al ejecutar el script SQL" "Red"
        Write-ColorOutput "Excepción: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Función para verificar que el arreglo funcionó
function Test-DatabaseFix {
    param([hashtable]$ConnectionInfo)
    
    Write-ColorOutput "🔍 Verificando que el arreglo funcionó..." "Blue"
    
    $env:PGPASSWORD = $ConnectionInfo.Password
    
    try {
        # Verificar que la columna first_login existe
        $result = & psql -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User -d $ConnectionInfo.Name -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_login';" 2>&1
        
        if ($result -match "first_login") {
            Write-ColorOutput "✅ Columna first_login encontrada en tabla users" "Green"
        } else {
            Write-ColorOutput "❌ Columna first_login NO encontrada" "Red"
            return $false
        }
        
        # Verificar que la tabla vehicle_types existe
        $result = & psql -h $ConnectionInfo.Host -p $ConnectionInfo.Port -U $ConnectionInfo.User -d $ConnectionInfo.Name -c "SELECT COUNT(*) FROM vehicle_types;" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Tabla vehicle_types existe y es accesible" "Green"
        } else {
            Write-ColorOutput "❌ Tabla vehicle_types NO es accesible" "Red"
            return $false
        }
        
        return $true
        
    } catch {
        Write-ColorOutput "❌ Error al verificar el arreglo" "Red"
        Write-ColorOutput "Excepción: $($_.Exception.Message)" "Red"
        return $false
    }
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
    
    Write-ColorOutput "🚀 Iniciando arreglo de la base de datos..." "Blue"
    
    # Verificar conexión
    if (-not (Test-DatabaseConnection -ConnectionInfo $connectionInfo)) {
        exit 1
    }
    
    # Ejecutar script de arreglo
    if (-not (Execute-SQLScript -ConnectionInfo $connectionInfo)) {
        Write-ColorOutput "❌ Error en el arreglo. Abortando..." "Red"
        exit 1
    }
    
    # Verificar que el arreglo funcionó
    if (-not (Test-DatabaseFix -ConnectionInfo $connectionInfo)) {
        Write-ColorOutput "❌ El arreglo no funcionó completamente. Revisa los errores." "Red"
        exit 1
    }
    
    Write-Host ""
    Write-ColorOutput "🎉 ¡Arreglo de base de datos completado exitosamente!" "Green"
    Write-Host ""
    
    # Mostrar resumen
    Write-ColorOutput "📊 Resumen del arreglo:" "Blue"
    Write-ColorOutput "✅ Base de datos: $($connectionInfo.Name)" "Green"
    Write-ColorOutput "✅ Host: $($connectionInfo.Host)" "Green"
    Write-ColorOutput "✅ Puerto: $($connectionInfo.Port)" "Green"
    Write-ColorOutput "✅ Usuario: $($connectionInfo.User)" "Green"
    Write-ColorOutput "✅ Columna first_login agregada" "Green"
    Write-ColorOutput "✅ Tablas del sistema creadas" "Green"
    Write-ColorOutput "✅ Datos iniciales insertados" "Green"
    Write-Host ""
    
    Write-ColorOutput "🚀 El sistema ahora debería funcionar correctamente!" "Green"
    Write-ColorOutput "Reinicia el servidor para aplicar los cambios." "Yellow"
}

# Ejecutar función principal
Main
