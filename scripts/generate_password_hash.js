// Script para generar hash de contraseña con bcrypt
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = '123456';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        // Contraseña: ${password}
// Hash generado: ${hash}
// Para usar en SQL: '${hash}'
// Verificación:
const isValid = await bcrypt.compare(password, hash);
// Hash válido: ${isValid}
    } catch (error) {
        console.error('Error:', error);
    }
}

generateHash();

