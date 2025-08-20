// Script para crear un usuario con hash de contraseña válido
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createValidUser() {
  try {
    const password = '123456';
    const saltRounds = 10;
    
    // Generar hash de contraseña
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('Contraseña:', password);
    console.log('Hash generado:', hash);
    
    // Conectar a la base de datos
    const client = await pool.connect();
    
    // Crear usuario con hash válido
    const result = await client.query(`
      INSERT INTO users (
        username, 
        email, 
        password, 
        role, 
        first_name, 
        last_name, 
        document_number, 
        phone, 
        is_active, 
        first_login
      ) VALUES (
        'admin_valid', 
        'admin@valid.com', 
        $1, 
        'admin', 
        'Admin', 
        'Valid', 
        '77777777', 
        '3007777777', 
        true, 
        false
      ) ON CONFLICT (username) DO UPDATE SET 
        password = $1,
        email = 'admin@valid.com'
      RETURNING username, email, role;
    `, [hash]);
    
    console.log('Usuario creado/actualizado:', result.rows[0]);
    
    // Verificar que la contraseña funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash válido:', isValid);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Usuario creado exitosamente!');
    console.log('Username: admin_valid');
    console.log('Password: 123456');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createValidUser();

