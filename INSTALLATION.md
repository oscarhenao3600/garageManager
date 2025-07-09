# Guía de Instalación - AutoTaller Pro

## Pasos de Instalación Rápida

### 1. Preparar el Entorno

```bash
# Clonar e instalar
git clone <url-del-repositorio>
cd autotaller-pro
npm install
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb autotaller_db

# O usando psql:
psql -c "CREATE DATABASE autotaller_db;"
```

### 3. Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus datos:
```env
DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/autotaller_db
JWT_SECRET=genera_una_clave_segura_aqui
```

### 4. Inicializar Base de Datos

```bash
# Aplicar esquema
npm run db:push

# Crear datos iniciales
node scripts/seed-admin.js
```

### 5. Ejecutar

```bash
npm run dev
```

Acceder en: http://localhost:5000

## Credenciales por Defecto

- **Admin:** admin / admin123
- **Operario:** operario / operario123

## Estructura de Base de Datos

El sistema crea automáticamente las siguientes tablas:

- `users` - Usuarios del sistema
- `clients` - Clientes del taller
- `vehicles` - Vehículos registrados
- `service_orders` - Órdenes de servicio
- `inventory_items` - Items de inventario
- `service_order_items` - Items por orden
- `service_procedures` - Procedimientos realizados
- `notifications` - Notificaciones del sistema
- `invoices` - Facturas generadas

## Datos de Ejemplo Incluidos

El script de inicialización crea:

- 2 usuarios (admin y operario)
- 3 clientes con vehículos
- 5 items de inventario
- 3 órdenes de servicio de ejemplo
- Notificaciones de vencimiento SOAT

## Comandos Útiles

```bash
# Base de datos
npm run db:push          # Actualizar esquema
npm run db:studio        # Abrir interfaz visual

# Desarrollo
npm run dev              # Servidor desarrollo
npm run build            # Compilar producción
npm start                # Servidor producción
```

## Solución de Problemas

### Error de conexión a base de datos
Verificar que PostgreSQL esté corriendo y las credenciales sean correctas.

### Error de JWT
Generar un JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Puerto ocupado
Cambiar PORT en `.env` o cerrar proceso:
```bash
lsof -ti:5000 | xargs kill
```