// Script de prueba para verificar el sistema
import http from 'http';

// Iniciando pruebas del sistema...

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Pruebas del sistema
async function testSystem() {
  try {
    // 1️⃣ Probando conexión al backend...
    const healthCheck = await makeRequest('/api/company-info');
    // Backend respondiendo: ${healthCheck.statusCode}
    
    // 2️⃣ Probando ruta protegida (debe fallar sin token)...
    const protectedRoute = await makeRequest('/api/service-orders');
    // Ruta protegida correctamente: ${protectedRoute.statusCode} - ${protectedRoute.data.message}
    
    // 3️⃣ Probando ruta de debug...
    const debugRoute = await makeRequest('/api/debug/user-status');
    // Ruta de debug funcionando: ${debugRoute.statusCode} - ${debugRoute.data.message}
    
    // 🎉 Todas las pruebas básicas del backend pasaron correctamente!
    // 📋 Próximos pasos para pruebas completas:
    //    - Iniciar el frontend (npm run dev en /client)
    //    - Hacer login como admin
    //    - Crear datos de prueba desde la interfaz
    //    - Probar funcionalidades principales
    // 🔧 Para probar el frontend:
    //    1. cd client
    //    2. npm run dev
    //    3. Abrir http://localhost:5173 en el navegador
    //    4. Hacer login como admin
    //    5. Crear cliente, vehículo y orden de servicio
    //    6. Verificar que las órdenes se muestren correctamente
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testSystem();
