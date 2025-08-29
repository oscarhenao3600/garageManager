import { db } from "./db";
import { eq, count, desc, asc, and, or, sql, lte, gte } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import {
  users,
  clients,
  vehicles,
  serviceOrders,
  serviceOrderStatusHistory,
  checklistItems,
  vehicleTypes,
  inventoryItems,
  notifications,
  invoices,
  companySettings,
} from "../shared/schema";
import type { ServiceOrder } from "../shared/schema";

export class DatabaseStorage {
  // Dashboard stats
  async getDashboardStats() {
    try {
      // 1. Total de clientes
      const [totalClientsResult] = await db
        .select({ count: count() })
        .from(clients)
        .where(eq(clients.isActive, true));

      // 2. Total de vehículos
      const [totalVehiclesResult] = await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.isActive, true));

      // 3. Total de órdenes de servicio
      const [totalOrdersResult] = await db
        .select({ count: count() })
        .from(serviceOrders);

      // 4. Órdenes pendientes
      const [pendingOrdersResult] = await db
        .select({ count: count() })
        .from(serviceOrders)
        .where(eq(serviceOrders.status, "pending"));

      // 5. Órdenes en progreso
      const [inProgressOrdersResult] = await db
        .select({ count: count() })
        .from(serviceOrders)
        .where(eq(serviceOrders.status, "in_progress"));

      // 6. Items con stock bajo
      const [lowStockResult] = await db
        .select({ count: count() })
        .from(inventoryItems)
        .where(sql`current_stock <= min_stock`);

      // 7. Total de items en inventario
      const [totalItemsResult] = await db
        .select({ count: count() })
        .from(inventoryItems);

      // 8. Ingresos totales (suma de finalCost de órdenes completadas)
      const [totalRevenueResult] = await db
        .select({ total: sql<number>`COALESCE(SUM(CAST(final_cost AS DECIMAL)), 0)` })
        .from(serviceOrders)
        .where(eq(serviceOrders.status, "completed"));

      return {
        totalClients: totalClientsResult?.count || 0,
        totalVehicles: totalVehiclesResult?.count || 0,
        totalOrders: totalOrdersResult?.count || 0,
        pendingOrders: pendingOrdersResult?.count || 0,
        inProgressOrders: inProgressOrdersResult?.count || 0,
        lowStockItems: lowStockResult?.count || 0,
        totalInventoryItems: totalItemsResult?.count || 0,
        totalRevenue: totalRevenueResult?.total || 0,
      };
    } catch (error) {
      console.error("❌ Storage: getDashboardStats error:", error);
      return {
        totalClients: 0,
        totalVehicles: 0,
        totalOrders: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        lowStockItems: 0,
        totalInventoryItems: 0,
        totalRevenue: 0,
      };
    }
  }

  // Service Orders
  async getServiceOrders(): Promise<ServiceOrder[]> {
    try {
      return await db
        .select()
        .from(serviceOrders)
        .orderBy(desc(serviceOrders.createdAt));
    } catch (error) {
      console.error("Error getting service orders:", error);
      return [];
    }
  }

  // Service Orders with related data (for dashboard)
  async getServiceOrdersWithDetails(): Promise<any[]> {
    try {
      const orders = await db
        .select()
        .from(serviceOrders)
        .orderBy(desc(serviceOrders.createdAt));
      
      // Enriquecer cada orden con información del cliente y vehículo
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, order.clientId));
          
          const [vehicle] = await db
            .select()
            .from(vehicles)
            .where(eq(vehicles.id, order.vehicleId));
          
          let operator = null;
          if (order.operatorId) {
            [operator] = await db
              .select()
              .from(users)
              .where(eq(users.id, order.operatorId));
          }
          
          return {
            ...order,
            client: client || null,
            vehicle: vehicle || null,
            operator: operator || null
          };
        })
      );
      
      return enrichedOrders;
    } catch (error) {
      console.error("Error getting service orders with details:", error);
      return [];
    }
  }

  async getServiceOrderById(id: number): Promise<ServiceOrder | undefined> {
    try {
      const [result] = await db
        .select()
        .from(serviceOrders)
        .where(eq(serviceOrders.id, id));
      return result;
    } catch (error) {
      console.error("Error getting service order by id:", error);
      return undefined;
    }
  }

  async createServiceOrder(order: any): Promise<ServiceOrder> {
    try {
      if (!order.clientId || !order.vehicleId || !order.description) {
        throw new Error('clientId, vehicleId y description son campos obligatorios');
      }

      let orderCount = await this.getServiceOrderCount();
      if (orderCount === null || orderCount === undefined) {
        orderCount = 0;
      }
      
      const orderNumber = `OS-${String(orderCount + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
      
      const orderData = {
        clientId: order.clientId,
        vehicleId: order.vehicleId,
        description: order.description,
        orderNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const [newOrder] = await db.insert(serviceOrders).values(orderData).returning();
      return newOrder;
    } catch (error) {
      console.error('Error creating service order:', error);
      throw error;
    }
  }

  async updateServiceOrder(id: number, updates: Partial<ServiceOrder>): Promise<ServiceOrder | undefined> {
    try {
      const [updated] = await db
        .update(serviceOrders)
        .set(updates)
        .where(eq(serviceOrders.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error('Error updating service order:', error);
      return undefined;
    }
  }

  async getServiceOrderCount(): Promise<number> {
    try {
      const [result] = await db.select({ count: count() }).from(serviceOrders);
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting service order count:', error);
      return 0;
    }
  }

  // Users
  async getUsers(): Promise<any[]> {
    try {
      return await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(asc(users.username));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async getUserById(id: number): Promise<any | undefined> {
    try {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      return result;
    } catch (error) {
      console.error('Error getting user by id:', error);
      return undefined;
    }
  }

  // Método para obtener usuario por username (para login)
  async getUserByUsername(username: string): Promise<any | undefined> {
    try {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return result;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  // Método para obtener usuario por email
  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return result;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  // Método para obtener usuario por número de documento
  async getUserByDocumentNumber(documentNumber: string): Promise<any | undefined> {
    try {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.documentNumber, documentNumber));
      return result;
    } catch (error) {
      console.error('Error getting user by document number:', error);
      return undefined;
    }
  }

  // Método para obtener usuario (alias de getUserById)
  async getUser(id: number): Promise<any | undefined> {
    return this.getUserById(id);
  }

  // Método para crear usuario
  async createUser(userData: any): Promise<any> {
    try {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Método para crear usuario con número de documento
  async createUserWithDocumentNumber(userData: any): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(userData.documentNumber, 10);
      const result = await db.insert(users).values({
        ...userData,
        password: hashedPassword,
        isActive: true,
        firstLogin: true as any
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user with document:', error);
      throw error;
    }
  }

  // Método para crear cliente
  async createClient(clientData: any): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(clientData.documentNumber, 10);
      const result = await db.insert(users).values({
        ...clientData,
        password: hashedPassword,
        role: 'client',
        isActive: true,
        firstLogin: true as any
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Método para actualizar contraseña de usuario
  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  // Método para marcar primera sesión como completada
  async markFirstLoginCompleted(userId: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({ firstLogin: false } as any)
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error marking first login completed:', error);
      throw error;
    }
  }

  // Clients
  async getClients(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(clients)
        .where(eq(clients.isActive, true))
        .orderBy(asc(clients.firstName));
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  }

  // Vehicles
  async getVehicles(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.isActive, true))
        .orderBy(asc(vehicles.brand));
    } catch (error) {
      console.error('Error getting vehicles:', error);
      return [];
    }
  }

  // Notifications
  async getNotifications(params?: { userId?: number; unreadOnly?: boolean; limit?: number }): Promise<any[]> {
    try {
      let conditions = [];
      
      if (params?.userId) {
        conditions.push(eq(notifications.toUserId, params.userId));
      }
      
      if (params?.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }
      
      let result;
      
      if (conditions.length > 0) {
        result = await db
          .select()
          .from(notifications)
          .where(and(...conditions))
          .orderBy(desc(notifications.createdAt))
          .limit(params?.limit || 100);
      } else {
        result = await db
          .select()
          .from(notifications)
          .orderBy(desc(notifications.createdAt))
          .limit(params?.limit || 100);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async createNotification(notification: any): Promise<any> {
    try {
      const result = await db.insert(notifications).values(notification).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<void> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Company Settings methods
  async getCompanySettings(): Promise<any | null> {
    try {
      const [result] = await db
        .select()
        .from(companySettings)
        .limit(1);
      return result || null;
    } catch (error) {
      console.error('Error getting company settings:', error);
      return null;
    }
  }

  // Workers/Operators methods
  async getWorkers(): Promise<any[]> {
    try {
      return await db
        .select()
        .from(users)
        .where(and(
          eq(users.isActive, true),
          or(eq(users.role, 'operator'), eq(users.role, 'worker'))
        ))
        .orderBy(asc(users.firstName));
    } catch (error) {
      console.error('Error getting workers:', error);
      return [];
    }
  }

  // Active clients count
  async getActiveClientsCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(clients)
        .where(eq(clients.isActive, true));
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting active clients count:', error);
      return 0;
    }
  }

  // Additional notification methods
  async getNotificationsForUser(userId: number, category?: string): Promise<any[]> {
    try {
      let conditions = [eq(notifications.toUserId, userId)];
      
      if (category) {
        conditions.push(eq(notifications.category, category));
      }
      
      return await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications for user:', error);
      return [];
    }
  }

  async getNotificationsFromUser(userId: number, category?: string): Promise<any[]> {
    try {
      let conditions = [eq(notifications.fromUserId, userId)];
      
      if (category) {
        conditions.push(eq(notifications.category, category));
      }
      
      return await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications from user:', error);
      return [];
    }
  }

  async getNotificationsForAdmins(category?: string): Promise<any[]> {
    try {
      let conditions = [eq(notifications.toUserId, null)]; // null = para todos los admins
      
      if (category) {
        conditions.push(eq(notifications.category, category));
      }
      
      return await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications for admins:', error);
      return [];
    }
  }

  async updateCompanySettings(settings: any): Promise<any> {
    try {
      const existingSettings = await this.getCompanySettings();
      if (existingSettings) {
        const [result] = await db
          .update(companySettings)
          .set({
            ...settings,
            updatedAt: new Date()
          })
          .where(eq(companySettings.id, existingSettings.id))
          .returning();
        return result;
      } else {
        const [result] = await db
          .insert(companySettings)
          .values({
            ...settings,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
        return result;
      }
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }
}

export const dbStorage = new DatabaseStorage();
