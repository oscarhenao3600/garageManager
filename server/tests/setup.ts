import dotenv from 'dotenv';

// Cargar variables de entorno para tests
dotenv.config({ path: '.env.test' });

// Configuración global para tests
beforeAll(() => {
  // Configurar timezone para tests
  process.env.TZ = 'UTC';
  
  // Configurar NODE_ENV para tests
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Limpiar después de todos los tests
});

// Mock de console.log para tests más limpios
declare global {
  var jest: any;
}

global.console = {
  ...console,
  log: global.jest.fn(),
  debug: global.jest.fn(),
  info: global.jest.fn(),
  warn: global.jest.fn(),
  error: global.jest.fn(),
};
