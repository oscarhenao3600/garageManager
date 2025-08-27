# Script para probar la conexión a la base de datos
Write-Host "🔍 Probando conexión a la base de datos..." -ForegroundColor Green

# Leer variables del archivo .env
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "✅ Archivo .env encontrado" -ForegroundColor Green
    
    # Leer variables
    $envContent = Get-Content $envFile
    $databaseUrl = $envContent | Where-Object { $_ -match "DATABASE_URL" } | Select-Object -First 1
    $pgPassword = $envContent | Where-Object { $_ -match "PGPASSWORD" } | Select-Object -First 1
    
    if ($databaseUrl) {
        Write-Host "✅ DATABASE_URL: $databaseUrl" -ForegroundColor Green
    }
    
    if ($pgPassword) {
        Write-Host "✅ PGPASSWORD configurado" -ForegroundColor Green
        # Extraer la contraseña
        $password = ($pgPassword -split "=")[1]
        $env:PGPASSWORD = $password
    }
    
    # Probar conexión
    Write-Host "🔌 Probando conexión..." -ForegroundColor Yellow
    
    try {
        # Verificar si la base de datos existe
        $dbExists = psql -U postgres -h localhost -lqt 2>$null | Select-String "autotaller_db"
        
        if ($dbExists) {
            Write-Host "✅ Base de datos 'autotaller_db' encontrada" -ForegroundColor Green
            
            # Verificar tablas
            Write-Host "📋 Verificando tablas..." -ForegroundColor Yellow
            $tables = psql -U postgres -h localhost -d autotaller_db -c "\dt" 2>$null
            
            if ($tables) {
                Write-Host "✅ Tablas encontradas:" -ForegroundColor Green
                $tables | ForEach-Object { 
                    if ($_ -match "public.*(\w+).*") {
                        Write-Host "   - $($matches[1])" -ForegroundColor White
                    }
                }
            } else {
                Write-Host "❌ No se pudieron listar las tablas" -ForegroundColor Red
            }
            
            # Verificar estructura de service_orders si existe
            Write-Host "🔍 Verificando estructura de service_orders..." -ForegroundColor Yellow
            $columns = psql -U postgres -h localhost -d autotaller_db -c "\d service_orders" 2>$null
            
            if ($columns) {
                Write-Host "✅ Estructura de service_orders:" -ForegroundColor Green
                $columns | ForEach-Object { 
                    if ($_ -match "^\s*(\w+)\s+\|") {
                        Write-Host "   - $($matches[1])" -ForegroundColor White
                    }
                }
            } else {
                Write-Host "ℹ️ Tabla service_orders no existe o no se pudo verificar" -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "❌ Base de datos 'autotaller_db' no encontrada" -ForegroundColor Red
        }
        
    }
    catch {
        Write-Host "❌ Error al conectar: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Limpiar variable de entorno
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
}

Write-Host "`n📋 Resumen:" -ForegroundColor Cyan
Write-Host "   - Si hay tablas ✅, puedes ejecutar: npm run dev" -ForegroundColor White
Write-Host "   - Si no hay tablas ❌, necesitas ejecutar las migraciones" -ForegroundColor White
