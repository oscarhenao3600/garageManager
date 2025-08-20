import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

interface SuperAdminData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  phone?: string;
}

export async function createSuperAdmin(superAdminData: SuperAdminData) {
  try {
    console.log("🦸‍♂️ Creando usuario SuperAdmin inicial...");

    // Verificar si ya existe un SuperAdmin
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, "superAdmin"));

    if (existingSuperAdmin.length > 0) {
      console.log("ℹ️ Ya existe un usuario SuperAdmin en el sistema");
      return existingSuperAdmin[0];
    }

    // Encriptar contraseña (número de cédula)
    const hashedPassword = await bcrypt.hash(superAdminData.documentNumber, 10);

    // Crear usuario SuperAdmin
    const [superAdmin] = await db.insert(users).values({
      username: superAdminData.username,
      email: superAdminData.email,
      password: hashedPassword,
      role: "superAdmin",
      firstName: superAdminData.firstName,
      lastName: superAdminData.lastName,
      documentNumber: superAdminData.documentNumber,
      phone: superAdminData.phone || null,
      isActive: true,
      firstLogin: true, // Debe cambiar contraseña en primera sesión
    }).returning();

    console.log("✅ Usuario SuperAdmin creado exitosamente!");
    console.log(`👤 Usuario: ${superAdmin.username}`);
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🆔 Documento: ${superAdmin.documentNumber}`);
    console.log(`🔑 Contraseña inicial: ${superAdminData.documentNumber}`);
    console.log("⚠️ IMPORTANTE: Debe cambiar la contraseña en la primera sesión");

    return superAdmin;
  } catch (error) {
    console.error("❌ Error creando SuperAdmin:", error);
    throw error;
  }
}

// Datos del SuperAdmin inicial (modificar según necesidades)
const initialSuperAdminData: SuperAdminData = {
  username: "superadmin",
  email: "admin@autotaller.com",
  firstName: "Super",
  lastName: "Administrador",
  documentNumber: "12345678", // Cambiar por el número de cédula real
  phone: "3001234567"
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createSuperAdmin(initialSuperAdminData)
    .then(() => {
      console.log("🎉 Proceso completado exitosamente!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error fatal:", error);
      process.exit(1);
    });
}
