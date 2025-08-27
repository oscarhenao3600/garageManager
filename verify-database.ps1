# Script para verificar el estado de la base de datos
Write-Host "🔍 Verificando estado de la base de datos..." -ForegroundColor Green

# Verificar archivo .env
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    
    # Leer DATABASE_URL
    $envContent = Get-Content $envFile
    $databaseUrl = $envContent | Where-Object { $_ -match "DATABASE_URL" }
    if ($databaseUrl) {
        Write-Host "✅ DATABASE_URL configurado: $databaseUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ DATABASE_URL no encontrado en .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
}

# Verificar servicio PostgreSQL
$postgresService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue
if ($postgresService) {
    Write-Host "✅ Servicio PostgreSQL: $($postgresService.Status)" -ForegroundColor Green
    
    if ($postgresService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL está ejecutándose" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL no está ejecutándose" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Servicio PostgreSQL no encontrado" -ForegroundColor Red
}

# Verificar si psql está disponible
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "✅ psql encontrado en: $($psqlPath.Source)" -ForegroundColor Green
    
    # Intentar conectar a la base de datos
    try {
        Write-Host "🔌 Probando conexión a la base de datos..." -ForegroundColor Yellow
        
        # Verificar si la base de datos existe
        $dbExists = psql -U postgres -h localhost -lqt | Select-String "autotaller_pro"
        if ($dbExists) {
            Write-Host "✅ Base de datos 'autotaller_pro' existe" -ForegroundColor Green
            
            # Verificar tablas
            Write-Host "📋 Verificando tablas..." -ForegroundColor Yellow
            $tables = psql -U postgres -h localhost -d autotaller_pro -c "\dt" 2>$null
            
            if ($tables) {
                Write-Host "✅ Tablas encontradas:" -ForegroundColor Green
                $tables | ForEach-Object { 
                    if ($_ -match "public\|(\w+)\|") {
                        Write-Host "   - $($matches[1])" -ForegroundColor White
                    }
                }
            } else {
                Write-Host "❌ No se pudieron listar las tablas" -ForegroundColor Red
            }
            
            # Verificar estructura de service_orders
            Write-Host "🔍 Verificando estructura de service_orders..." -ForegroundColor Yellow
            $columns = psql -U postgres -h localhost -d autotaller_pro -c "\d service_orders" 2>$null
            
            if ($columns) {
                Write-Host "✅ Estructura de service_orders:" -ForegroundColor Green
                $columns | ForEach-Object { 
                    if ($_ -match "^\s*(\w+)\s+\|") {
                        Write-Host "   - $($matches[1])" -ForegroundColor White
                    }
                }
            } else {
                Write-Host "❌ No se pudo verificar la estructura de service_orders" -ForegroundColor Red
            }
            
        } else {
            Write-Host "❌ Base de datos 'autotaller_pro' no existe" -ForegroundColor Red
            Write-Host "💡 Ejecuta setup-database.ps1 como Administrador" -ForegroundColor Yellow
        }
        
    }
    catch {
        Write-Host "❌ Error al conectar: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ psql no encontrado en el PATH" -ForegroundColor Red
    Write-Host "💡 Agrega PostgreSQL al PATH" -ForegroundColor Yellow
}

Write-Host "`n📋 Resumen:" -ForegroundColor Cyan
Write-Host "   - Si todo está ✅, puedes ejecutar: npm run dev" -ForegroundColor White
Write-Host "   - Si hay ❌, ejecuta: setup-database.ps1 como Administrador" -ForegroundColor White
