# Script para configurar la base de datos PostgreSQL
# Ejecutar como Administrador

Write-Host "🔧 Configurando base de datos PostgreSQL..." -ForegroundColor Green

# Verificar si PostgreSQL está instalado
$postgresService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue

if ($postgresService) {
    Write-Host "✅ PostgreSQL encontrado: $($postgresService.Name)" -ForegroundColor Green
    
    # Intentar iniciar el servicio
    try {
        Write-Host "🚀 Iniciando servicio PostgreSQL..." -ForegroundColor Yellow
        Start-Service $postgresService.Name
        Write-Host "✅ Servicio iniciado exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al iniciar el servicio: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Intenta ejecutar este script como Administrador" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "❌ PostgreSQL no encontrado" -ForegroundColor Red
    Write-Host "💡 Instala PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Verificar si el servicio está ejecutándose
Start-Sleep -Seconds 3
$postgresService = Get-Service -Name "*postgres*"
if ($postgresService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL está ejecutándose" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL no está ejecutándose" -ForegroundColor Red
    exit 1
}

# Crear archivo .env si no existe
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "📝 Creando archivo .env..." -ForegroundColor Yellow
    
    $envContent = @"
# Configuración de la base de datos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autotaller_pro

# Configuración del servidor
NODE_ENV=development
PORT=5000

# Configuración de JWT
JWT_SECRET=autotaller-pro-secret-key-2024

# Configuración de archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "✅ Archivo .env ya existe" -ForegroundColor Green
}

# Verificar si psql está disponible
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "✅ psql encontrado en: $($psqlPath.Source)" -ForegroundColor Green
    
    # Intentar crear la base de datos
    Write-Host "🗄️ Creando base de datos 'autotaller_pro'..." -ForegroundColor Yellow
    
    try {
        # Crear base de datos
        psql -U postgres -h localhost -c "CREATE DATABASE autotaller_pro;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Base de datos creada exitosamente" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ La base de datos ya existe o hubo un error" -ForegroundColor Yellow
        }
        
        # Ejecutar migraciones
        Write-Host "🔄 Ejecutando migraciones..." -ForegroundColor Yellow
        psql -U postgres -h localhost -d autotaller_pro -f "migrations/run_all_migrations.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migraciones ejecutadas exitosamente" -ForegroundColor Green
        } else {
            Write-Host "❌ Error al ejecutar migraciones" -ForegroundColor Red
        }
        
    }
    catch {
        Write-Host "❌ Error al crear base de datos: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ psql no encontrado en el PATH" -ForegroundColor Red
    Write-Host "💡 Agrega PostgreSQL al PATH o usa la ruta completa" -ForegroundColor Yellow
}

Write-Host "`n🎯 Configuración completada!" -ForegroundColor Green
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Verifica que el archivo .env tenga la configuración correcta" -ForegroundColor White
Write-Host "   2. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "   3. Prueba crear una orden de servicio" -ForegroundColor White
