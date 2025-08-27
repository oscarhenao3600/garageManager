// Script para insertar tipos de vehículos básicos
// Ejecutar desde el navegador en la consola del admin dashboard

const vehicleTypes = [
  { name: 'Sedán', description: 'Automóvil de 4 puertas con maletero separado' },
  { name: 'Hatchback', description: 'Automóvil compacto con puerta trasera elevada' },
  { name: 'SUV', description: 'Vehículo utilitario deportivo, alto y espacioso' },
  { name: 'Camioneta', description: 'Vehículo de carga ligera con cabina y caja' },
  { name: 'Pickup', description: 'Camioneta con cabina y caja de carga abierta' },
  { name: 'Moto', description: 'Motocicleta de dos ruedas' },
  { name: 'Camión', description: 'Vehículo pesado de carga' },
  { name: 'Bus', description: 'Vehículo de transporte público' },
  { name: 'Van', description: 'Furgoneta de pasajeros' },
  { name: 'Deportivo', description: 'Automóvil de alto rendimiento' }
];



vehicleTypes.forEach((type, index) => {
  // ${index + 1}. Nombre: ${type.name}
  //    Descripción: ${type.description}
});

// Instrucciones:
// 1. Ve a la sección de configuración del sistema
// 2. Busca "Tipos de Vehículos" o "Vehicle Types"
// 3. Crea cada uno de estos tipos
// 4. O usa la API POST /api/vehicle-types si tienes acceso

// Función para crear tipos de vehículos via API (ejecutar en consola del admin)
async function createVehicleTypes() {
  const token = localStorage.getItem('token'); // Obtener token del localStorage
  
  for (const type of vehicleTypes) {
    try {
      const response = await fetch('/api/vehicle-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(type)
      });
      
      if (response.ok) {
        // Creado: ${type.name}
      } else {
        // Error creando ${type.name}
      }
    } catch (error) {
      // Error creando ${type.name}
    }
  }
}

// Ejecutar: createVehicleTypes()
// Para crear automáticamente, ejecuta: createVehicleTypes()

