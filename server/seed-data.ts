import { db } from "./db";
import { vehicleTypes, checklistItems } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function seedInitialData() {
  try {

    // Crear tipos de vehículo básicos
    const vehicleTypesData = [
      {
        name: "moto",
        description: "Motocicletas y motos",
        isActive: true
      },
      {
        name: "sedan",
        description: "Automóviles tipo sedán",
        isActive: true
      },
      {
        name: "hatchback",
        description: "Automóviles tipo hatchback",
        isActive: true
      },
      {
        name: "camioneta",
        description: "Camionetas y SUVs",
        isActive: true
      },
      {
        name: "camion",
        description: "Camiones y vehículos pesados",
        isActive: true
      }
    ];

    for (const vehicleType of vehicleTypesData) {
      const [existing] = await db
        .select()
        .from(vehicleTypes)
        .where(eq(vehicleTypes.name, vehicleType.name));
      
      if (!existing) {
        await db.insert(vehicleTypes).values(vehicleType);
      }
    }

    // Obtener los tipos de vehículo creados
    const createdVehicleTypes = await db.select().from(vehicleTypes);

    // Crear checklist items por tipo de vehículo
    const checklistData = [
      // Checklist para motos
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "moto")?.id,
        name: "Revisión de motor",
        description: "Verificar funcionamiento del motor",
        category: "motor",
        isRequired: true,
        order: 1
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "moto")?.id,
        name: "Revisión de frenos",
        description: "Verificar sistema de frenos",
        category: "frenos",
        isRequired: true,
        order: 2
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "moto")?.id,
        name: "Revisión eléctrica",
        description: "Verificar sistema eléctrico",
        category: "electricidad",
        isRequired: true,
        order: 3
      },

      // Checklist para sedanes
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "sedan")?.id,
        name: "Revisión de motor",
        description: "Verificar funcionamiento del motor",
        category: "motor",
        isRequired: true,
        order: 1
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "sedan")?.id,
        name: "Revisión de frenos",
        description: "Verificar sistema de frenos",
        category: "frenos",
        isRequired: true,
        order: 2
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "sedan")?.id,
        name: "Revisión eléctrica",
        description: "Verificar sistema eléctrico",
        category: "electricidad",
        isRequired: true,
        order: 3
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "sedan")?.id,
        name: "Revisión de suspensión",
        description: "Verificar sistema de suspensión",
        category: "suspension",
        isRequired: true,
        order: 4
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "sedan")?.id,
        name: "Revisión de dirección",
        description: "Verificar sistema de dirección",
        category: "direccion",
        isRequired: true,
        order: 5
      },

      // Checklist para hatchbacks
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "hatchback")?.id,
        name: "Revisión de motor",
        description: "Verificar funcionamiento del motor",
        category: "motor",
        isRequired: true,
        order: 1
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "hatchback")?.id,
        name: "Revisión de frenos",
        description: "Verificar sistema de frenos",
        category: "frenos",
        isRequired: true,
        order: 2
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "hatchback")?.id,
        name: "Revisión eléctrica",
        description: "Verificar sistema eléctrico",
        category: "electricidad",
        isRequired: true,
        order: 3
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "hatchback")?.id,
        name: "Revisión de suspensión",
        description: "Verificar sistema de suspensión",
        category: "suspension",
        isRequired: true,
        order: 4
      },

      // Checklist para camionetas
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camioneta")?.id,
        name: "Revisión de motor",
        description: "Verificar funcionamiento del motor",
        category: "motor",
        isRequired: true,
        order: 1
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camioneta")?.id,
        name: "Revisión de frenos",
        description: "Verificar sistema de frenos",
        category: "frenos",
        isRequired: true,
        order: 2
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camioneta")?.id,
        name: "Revisión eléctrica",
        description: "Verificar sistema eléctrico",
        category: "electricidad",
        isRequired: true,
        order: 3
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camioneta")?.id,
        name: "Revisión de suspensión",
        description: "Verificar sistema de suspensión",
        category: "suspension",
        isRequired: true,
        order: 4
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camioneta")?.id,
        name: "Revisión de dirección",
        description: "Verificar sistema de dirección",
        category: "direccion",
        isRequired: true,
        order: 5
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camioneta")?.id,
        name: "Revisión de transmisión",
        description: "Verificar sistema de transmisión",
        category: "transmision",
        isRequired: true,
        order: 6
      },

      // Checklist para camiones
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión de motor",
        description: "Verificar funcionamiento del motor",
        category: "motor",
        isRequired: true,
        order: 1
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión de frenos",
        description: "Verificar sistema de frenos",
        category: "frenos",
        isRequired: true,
        order: 2
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión eléctrica",
        description: "Verificar sistema eléctrico",
        category: "electricidad",
        isRequired: true,
        order: 3
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión de suspensión",
        description: "Verificar sistema de suspensión",
        category: "suspension",
        isRequired: true,
        order: 4
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión de dirección",
        description: "Verificar sistema de dirección",
        category: "direccion",
        isRequired: true,
        order: 5
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión de transmisión",
        description: "Verificar sistema de transmisión",
        category: "transmision",
        isRequired: true,
        order: 6
      },
      {
        vehicleTypeId: createdVehicleTypes.find(vt => vt.name === "camion")?.id,
        name: "Revisión de neumáticos",
        description: "Verificar estado de neumáticos",
        category: "neumaticos",
        isRequired: true,
        order: 7
      }
    ];

    for (const item of checklistData) {
      if (item.vehicleTypeId) {
        const [existing] = await db
          .select()
          .from(checklistItems)
          .where(
            and(
              eq(checklistItems.vehicleTypeId, item.vehicleTypeId),
              eq(checklistItems.name, item.name)
            )
          );
        
        if (!existing) {
          await db.insert(checklistItems).values(item);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error poblando datos iniciales:", error);
    throw error;
  }
}
