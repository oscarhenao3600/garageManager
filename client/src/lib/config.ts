// Configuración de la API
export const API_CONFIG = {
  // Usar directamente la URL del backend para evitar problemas de proxy
  BASE_URL: 'http://localhost:5000',
  
  // Endpoints de la API
  ENDPOINTS: {
    AUTH: '/api/auth',
    SERVICE_ORDERS: '/api/service-orders',
    CLIENTS: '/api/clients',
    VEHICLES: '/api/vehicles',
    WORKERS: '/api/workers',
    OPERATORS: '/api/operators',
    DASHBOARD: '/api/dashboard',
    COMPANY_INFO: '/api/company-info',
    NOTIFICATIONS: '/api/notifications',
    IMAGES: '/api/images',
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
