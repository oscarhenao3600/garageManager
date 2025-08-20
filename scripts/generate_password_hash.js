// Script para generar hash de contraseña con bcrypt
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = '123456';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Contraseña:', password);
        console.log('Hash generado:', hash);
        console.log('');
        console.log('Para usar en SQL:');
        console.log(`'${hash}'`);
        console.log('');
        console.log('Verificación:');
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash válido:', isValid);
    } catch (error) {
        console.error('Error:', error);
    }
}

generateHash();

