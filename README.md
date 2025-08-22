# AutoTaller Pro - Sistema de Gestión para Talleres Mecánicos

Sistema completo de gestión para taller mecánico automotriz con roles múltiples, inventario, órdenes de servicio y cumplimiento normativo colombiano.

## Características Principales

- **Sistema de autenticación JWT** con múltiples roles (superAdmin, admin, operator, user, guest)
- **Middleware de autorización por roles** con protección de rutas sensibles
- **Dashboard diferenciado por rol** con vistas personalizadas para cada usuario
- **Dashboard administrativo avanzado** con reportes detallados y estadísticas
- **Gestión de clientes** con información completa y documentos colombianos
- **Control de vehículos** con seguimiento de SOAT y revisión técnica
- **Órdenes de servicio** con estados, seguimiento y facturación
- **Inventario inteligente** con control de stock y alertas
- **Notificaciones automáticas** para vencimientos de documentos
- **Sistema de facturación** integrado con control de acceso
- **Reportes avanzados** para administradores (ventas, inventario, rendimiento)
- **Interfaz responsiva** con modo oscuro y navegación adaptativa

## Tecnologías Utilizadas

### Backend
- Node.js + Express.js
- PostgreSQL con Drizzle ORM
- JWT para autenticación
- bcrypt para encriptación

### Frontend
- React 18 + TypeScript
- Vite para desarrollo
- TailwindCSS + shadcn/ui
- TanStack Query para manejo de estado
- Wouter para enrutamiento

## Requisitos Previos

- Node.js 18 o superior
- PostgreSQL 12 o superior
- npm o yarn

## Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd autotaller-pro
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/autotaller_db

# JWT Secret (generar una clave segura)
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui

# Puerto del servidor (opcional)
PORT=5000
```

### 4. Configurar la base de datos

#### Crear la base de datos PostgreSQL:
```sql
CREATE DATABASE autotaller_db;
```

#### Ejecutar las migraciones:
```bash
npm run db:push
```

#### Crear datos iniciales:
```bash
node scripts/seed-admin.js
```

### 5. Ejecutar el proyecto
```bash
npm run dev
```

El proyecto estará disponible en: http://localhost:5000

## Credenciales de Acceso

### Usuario Administrador
- **Usuario:** admin
- **Contraseña:** admin123

### Usuario Operario
- **Usuario:** operario
- **Contraseña:** operario123

## Estructura del Proyecto

```
autotaller-pro/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilidades y configuración
│   │   ├── pages/          # Páginas de la aplicación
│   │   └── main.tsx        # Punto de entrada
├── server/                 # Backend Express
│   ├── db.ts              # Configuración de base de datos
│   ├── index.ts           # Servidor principal
│   ├── routes.ts          # Rutas de API
│   ├── storage.ts         # Capa de acceso a datos
│   └── vite.ts            # Configuración Vite
├── shared/                 # Código compartido
│   └── schema.ts          # Esquemas de base de datos
├── scripts/               # Scripts de utilidad
│   └── seed-admin.js      # Datos iniciales
└── package.json
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Inicia servidor de desarrollo

# Base de datos
npm run db:push            # Aplica cambios al esquema
npm run db:studio          # Abre Drizzle Studio

# Producción
npm run build              # Construye para producción
npm start                  # Inicia servidor de producción
```

## Sistema de Autorización

### Middleware de Seguridad
- **authenticateToken**: Verifica JWT válido para todas las rutas protegidas
- **isAdmin**: Restringe acceso solo a usuarios con rol admin o superAdmin
- **isSuperAdmin**: Restringe acceso solo a usuarios con rol superAdmin
- **isOperatorOrHigher**: Permite acceso a operarios y roles superiores
- **canAccessResource**: Control granular de acceso a recursos específicos

### Rutas Protegidas por Rol
- **Solo Administradores**: `/api/company-settings`, `/api/invoices`, `/api/workers`
- **Solo Administradores**: `/api/reports/*` (todos los reportes avanzados)
- **Todos los Usuarios Autenticados**: `/api/dashboard/stats`, `/api/service-orders`
- **Operarios y Superiores**: `/api/inventory`, `/api/vehicles`, `/api/clients`

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales

### Clientes
- `GET /api/clients` - Lista de clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/:id/vehicles` - Vehículos del cliente

### Vehículos
- `GET /api/vehicles` - Lista de vehículos
- `POST /api/vehicles` - Crear vehículo
- `GET /api/vehicles/search` - Buscar vehículos

### Órdenes de Servicio
- `GET /api/service-orders` - Lista de órdenes
- `POST /api/service-orders` - Crear orden
- `GET /api/service-orders/:id` - Detalle de orden
- `PATCH /api/service-orders/:id` - Actualizar orden

### Inventario
- `GET /api/inventory` - Items de inventario
- `POST /api/inventory` - Crear item
- `PATCH /api/inventory/:id` - Actualizar item

### Notificaciones
- `GET /api/notifications` - Lista de notificaciones
- `POST /api/notifications` - Crear notificación
- `PATCH /api/notifications/:id/read` - Marcar como leída

### Facturación
- `GET /api/invoices` - Lista de facturas
- `POST /api/invoices` - Crear factura

### Reportes Avanzados (Solo Administradores)
- `GET /api/reports/sales` - Reporte de ventas por período
- `GET /api/reports/inventory` - Reporte de inventario con alertas
- `GET /api/reports/vehicles/expiring-documents` - Vehículos con documentos por vencer
- `GET /api/reports/operators/performance` - Rendimiento de operarios
- `GET /api/reports/clients/top` - Clientes más frecuentes
- `GET /api/reports/services/popular` - Servicios más solicitados
- `GET /api/reports/financial/pnl` - Reporte de ganancias y pérdidas
- `GET /api/reports/billing/status` - Estado de facturación

## Funcionalidades por Rol

### Super Administrador
- Acceso total al sistema
- Gestión de usuarios y roles
- Configuración del sistema
- Reportes avanzados y métricas del sistema
- Auditoría completa

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios y roles
- Configuración del sistema
- Reportes avanzados y estadísticas
- Dashboard administrativo completo

### Operario
- Gestión de órdenes de servicio
- Control de inventario
- Registro de procedimientos
- Acceso a clientes y vehículos
- Dashboard operativo

### Usuario
- Consulta de órdenes propias
- Visualización de vehículos personales
- Notificaciones personales
- Dashboard básico

### Invitado
- Consulta pública de historial de vehículos
- Verificación de documentos
- Acceso limitado al sistema

## 🏗️ **Arquitectura del Sistema**

Para una visualización completa de la arquitectura y el estado de implementación, consulta el archivo [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md).

### **Estado de Implementación**
- **🟢 90% Completado**: Sistema base, autenticación, dashboards, APIs
- **🔴 10% Pendiente**: Gráficos interactivos, exportación, notificaciones en tiempo real

### **Componentes Principales**
- **Frontend**: React + TypeScript con Tailwind CSS
- **Backend**: Node.js + Express con middleware de autorización
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: JWT con roles y permisos granulares

## Características Específicas para Colombia

- **Gestión de SOAT** con alertas de vencimiento
- **Control de revisión técnica** vehicular
- **Tipos de documento** colombianos (CC, CE, NIT)
- **Ubicaciones** por departamentos y ciudades
- **Formato de placas** vehiculares colombianas
- **Impuestos y facturación** según normativa local

## Arquitectura del Sistema

Para una descripción detallada de la arquitectura, flujos de autorización y estado de implementación, consulta el archivo [ARCHITECTURE.md](./ARCHITECTURE.md).

## Soporte

Para soporte técnico o consultas sobre el sistema, contacta al equipo de desarrollo.

## Licencia

Este proyecto está licenciado bajo los términos que se especifiquen en el acuerdo de desarrollo.