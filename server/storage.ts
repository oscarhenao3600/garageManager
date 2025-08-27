import { 
  users, clients, vehicles, serviceOrders, serviceOrderStatusHistory, inventoryItems, serviceOrderItems, 
  serviceProcedures, notifications, invoices, companySettings, vehicleTypes, checklistItems, serviceOrderChecklist,
  type User, type InsertUser, type Client, type InsertClient, 
  type Vehicle, type InsertVehicle, type ServiceOrder, type InsertServiceOrder,
  type InventoryItem, type InsertInventoryItem, type ServiceOrderItem, type InsertServiceOrderItem,
  type ServiceProcedure, type InsertServiceProcedure, type Notification, type InsertNotification,
  type Invoice, type InsertInvoice, type CompanySettings, type VehicleType, type InsertVehicleType,
  type ChecklistItem, type InsertChecklistItem, type ServiceOrderChecklist, type InsertServiceOrderChecklist,
  type ServiceOrderStatusHistory, type InsertServiceOrderStatusHistory,
  type SystemAuditLog, type InsertSystemAuditLog, type UserActivityLog, type InsertUserActivityLog,
  type ChecklistValidationRule, type InsertChecklistValidationRule
} from "../shared/schema";

// Las tablas se usan directamente sin alias
import { db } from "./db";
import { eq, like, or, and, count, desc, asc, lte, gte, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // Company Settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDocumentNumber(documentNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getWorkers(): Promise<User[]>;
  updateUserPassword(id: number, newPassword: string): Promise<User | undefined>;
  markFirstLoginCompleted(id: number): Promise<User | undefined>;
  createUserWithDocumentNumber(userData: Omit<InsertUser, 'password'> & { documentNumber: string }): Promise<User>;

  // Dashboard
  getDashboardStats(): Promise<any>;
  getOperatorDashboardStats(operatorId: number): Promise<any>;
  getClientDashboardStats(clientId: number): Promise<any>;

  // Service Orders
  getServiceOrders(params: { status?: string; limit?: number; userId?: number; userRole?: string }): Promise<ServiceOrder[]>;
  getServiceOrderById(id: number, userId?: number, userRole?: string): Promise<ServiceOrder | undefined>;
  debugClientOrders(clientId: number): Promise<any>;
  createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder>;
  updateServiceOrder(id: number, updates: Partial<ServiceOrder>): Promise<ServiceOrder | undefined>;
  getServiceOrderCount(): Promise<number>;
  updateServiceOrderStatus(id: number, status: string, completionDate?: Date): Promise<ServiceOrder | undefined>;
  createStatusHistory(history: { 
    serviceOrderId: number;
    oldStatus: string;
    newStatus: string;
    comment?: string;
    userId: number;
  }): Promise<void>;
  getServiceOrderStatusHistory(serviceOrderId: number): Promise<any[]>;
  
  // Operator actions
  canOperatorTakeOrder(serviceOrderId: number, operatorId: number): Promise<boolean>;
  takeServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined>;
  canOperatorReleaseOrder(serviceOrderId: number, operatorId: number): Promise<boolean>;
  releaseServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined>;
  addStatusHistoryEntry(history: { 
    serviceOrderId: number;
    previousStatus: string;
    newStatus: string;
    changedBy: number;
    notes?: string;
    operatorAction?: string;
  }): Promise<void>;
  
  // Operator specific queries
  getOperatorAssignedOrders(operatorId: number): Promise<ServiceOrder[]>;
  getServiceOrdersByOperator(operatorId: number): Promise<ServiceOrder[]>;

  // Clients - Tabla separada
  getClients(params: { search?: string; limit?: number }): Promise<Client[]>;
  getActiveClientsCount(): Promise<number>;
  createClient(client: InsertClient): Promise<Client>;
  getVehiclesByClientId(clientId: number): Promise<Vehicle[]>;
  updateClient(id: number, updates: Partial<typeof clients.$inferInsert>): Promise<Client | undefined>;

  // Vehicles
  getVehicles(params: { search?: string; limit?: number }): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  searchVehicles(query: string): Promise<any[]>;
  updateVehicle(id: number, updates: Partial<typeof vehicles.$inferInsert>): Promise<Vehicle | undefined>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;

  // Inventory
  getInventoryItems(params: { category?: string; lowStock?: boolean; limit?: number }): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;

  // Notifications
  getNotifications(params: { userId?: number; unreadOnly?: boolean; limit?: number }): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  updateNotificationStatus(notificationId: number, status: string): Promise<void>;
  getNotificationsForUser(userId: number, category?: string): Promise<any[]>;
  getNotificationsFromUser(userId: number, category?: string): Promise<any[]>;
  getNotificationsForAdmins(category?: string): Promise<any[]>;
  getNotificationResponses(notificationId: number): Promise<any[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;

  // Invoices
  getInvoices(params: { status?: string; limit?: number; fromDate?: Date; toDate?: Date }): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoiceCount(): Promise<number>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string, paidDate?: Date): Promise<Invoice | undefined>;

  // Vehicle Types
  getVehicleTypes(): Promise<VehicleType[]>;
  createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType>;
  updateVehicleType(id: number, updates: Partial<VehicleType>): Promise<VehicleType | undefined>;
  getVehicleTypeByName(name: string): Promise<VehicleType | undefined>;

  // Checklist Items
  getChecklistItemsByVehicleType(vehicleTypeId: number): Promise<ChecklistItem[]>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  updateChecklistItem(id: number, updates: Partial<ChecklistItem>): Promise<ChecklistItem | undefined>;

  // Service Order Checklist
  getServiceOrderChecklist(serviceOrderId: number): Promise<ServiceOrderChecklist[]>;
  createServiceOrderChecklist(item: InsertServiceOrderChecklist): Promise<ServiceOrderChecklist>;
  updateServiceOrderChecklist(id: number, updates: Partial<ServiceOrderChecklist>): Promise<ServiceOrderChecklist | undefined>;

  // Service Procedures
  getServiceProcedures(): Promise<ServiceProcedure[]>;
  createServiceProcedure(procedure: InsertServiceProcedure): Promise<ServiceProcedure>;
  updateServiceProcedure(id: number, updates: Partial<ServiceProcedure>): Promise<ServiceProcedure | undefined>;

  // System Audit Log
  createSystemAuditLog(log: InsertSystemAuditLog): Promise<void>;
  getUserActivityLog(userId: number, limit?: number): Promise<UserActivityLog[]>;

  // Checklist Validation Rules
  getChecklistValidationRules(): Promise<ChecklistValidationRule[]>;
  createChecklistValidationRule(rule: InsertChecklistValidationRule): Promise<ChecklistValidationRule>;
  updateChecklistValidationRule(id: number, updates: Partial<ChecklistValidationRule>): Promise<ChecklistValidationRule | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Company Settings
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    try {
      const [settings] = await db.select().from(companySettings).limit(1);
      
      if (!settings) {
        // Retornar configuración por defecto si no hay configuración
        return {
          name: 'Mi Taller',
          nit: 'No configurado',
          address: 'No configurado',
          phone: 'No configurado',
          email: 'No configurado',
          website: '',
          logo: '',
          bankInfo: null,
          invoiceFooter: '',
          invoiceNotes: '',
          electronicInvoiceSettings: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return settings;
    } catch (error) {
      console.error('Error getting company settings:', error);
      
      // Retornar configuración por defecto en caso de error
      return {
        name: 'Mi Taller',
        nit: 'No configurado',
        address: 'No configurado',
        phone: 'No configurado',
        email: 'No configurado',
        website: '',
        logo: '',
        bankInfo: null,
        invoiceFooter: '',
        invoiceNotes: '',
        electronicInvoiceSettings: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const [updated] = await db
      .update(companySettings)
      .set({ ...settings, updatedAt: new Date() })
      .returning();
    return updated;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByDocumentNumber(documentNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.documentNumber, documentNumber));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getWorkers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(or(eq(users.role, 'admin'), eq(users.role, 'operator')))
      .orderBy(asc(users.firstName));
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async markFirstLoginCompleted(id: number): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ firstLogin: false })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async createUserWithDocumentNumber(userData: Omit<InsertUser, 'password'> & { documentNumber: string }): Promise<User> {
    const user = {
      ...userData,
      password: userData.documentNumber, // Usar documento como contraseña temporal
      role: 'client' as const
    };
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    console.log('🔍 Storage: getDashboardStats called - fetching comprehensive stats');
    
    try {
      // 1. Total de usuarios (solo clientes)
      const [totalClientsResult] = await db
        .select({ count: count() })
        .from(users)
        .where(and(eq(users.isActive, true), eq(users.role, 'client')));
      
      // 2. Total de vehículos
      const [totalVehiclesResult] = await db
        .select({ count: count() })
        .from(vehicles);
      
      // 3. Órdenes activas (pending + in_progress)
      const [activeOrdersResult] = await db
        .select({ count: count() })
        .from(serviceOrders)
        .where(or(
          eq(serviceOrders.status, 'pending'),
          eq(serviceOrders.status, 'in_progress')
        ));
      
      // 4. Total de órdenes
      const [totalOrdersResult] = await db
        .select({ count: count() })
        .from(serviceOrders);
      
      // 5. Vehículos en el taller (órdenes activas)
      const [vehiclesInShopResult] = await db
        .select({ count: count() })
        .from(serviceOrders)
        .where(or(
          eq(serviceOrders.status, 'pending'),
          eq(serviceOrders.status, 'in_progress')
        ));
      
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
        .select({ 
          total: sql<number>`COALESCE(SUM(CAST(${serviceOrders.finalCost} AS DECIMAL)), 0)` 
        })
        .from(serviceOrders)
        .where(eq(serviceOrders.status, 'completed'));
      
      // 9. Facturas pendientes
      const [pendingInvoicesResult] = await db
        .select({ count: count() })
        .from(invoices)
        .where(eq(invoices.status, 'pending'));

      const stats = {
        totalClients: totalClientsResult.count,
        totalVehicles: totalVehiclesResult.count,
        activeOrders: activeOrdersResult.count,
        totalOrders: totalOrdersResult.count,
        vehiclesInShop: vehiclesInShopResult.count,
        lowStockItems: lowStockResult.count,
        totalItems: totalItemsResult.count,
        totalRevenue: Number(totalRevenueResult.total) || 0,
        pendingInvoices: pendingInvoicesResult.count
      };

      console.log('🔍 Storage: getDashboardStats result:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Storage: getDashboardStats error:', error);
      // Retornar valores por defecto en caso de error
    return {
        totalClients: 0,
        totalVehicles: 0,
        activeOrders: 0,
        totalOrders: 0,
        vehiclesInShop: 0,
        lowStockItems: 0,
        totalItems: 0,
        totalRevenue: 0,
        pendingInvoices: 0
      };
    }
  }

  async getOperatorDashboardStats(operatorId: number): Promise<any> {
    const [orderCount] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(eq(serviceOrders.operatorId, operatorId));

    const [pendingOrders] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.operatorId, operatorId),
        eq(serviceOrders.status, 'pending')
      ));

    return {
      totalOrders: orderCount.count,
      pendingOrders: pendingOrders.count
    };
  }

  async getClientDashboardStats(clientId: number): Promise<any> {
    const [vehicleCount] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.clientId, clientId));

    const [orderCount] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(eq(serviceOrders.clientId, clientId));

    return {
      totalVehicles: vehicleCount.count,
      totalOrders: orderCount.count
    };
  }

  // Service Orders
  async getServiceOrders(params: { status?: string; limit?: number; userId?: number; userRole?: string }): Promise<ServiceOrder[]> {
    console.log('🔍 Storage: getServiceOrders called with params:', params);

    try {
      let query = db
        .select({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
          priority: serviceOrders.priority,
          estimatedTime: serviceOrders.estimatedTime,
          actualTime: serviceOrders.actualTime,
          startDate: serviceOrders.startDate,
          completionDate: serviceOrders.completionDate,
          createdAt: serviceOrders.createdAt,
          clientId: serviceOrders.clientId,
          vehicleId: serviceOrders.vehicleId,
          operatorId: serviceOrders.operatorId,
          client: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            documentNumber: users.documentNumber,
          },
          vehicle: {
            id: vehicles.id,
            plate: vehicles.plate,
            brand: vehicles.brand,
            model: vehicles.model,
            year: vehicles.year,
          }
        })
        .from(serviceOrders)
        .leftJoin(users, eq(serviceOrders.clientId, users.id))
        .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id));

    // Filtrar por rol del usuario
    
    if ((params.userRole === 'user' || params.userRole === 'client') && params.userId) {
      
      // Los clientes solo pueden ver órdenes donde son el cliente (clientId = userId)
      // o órdenes de sus propios vehículos
      const clientVehicles = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.clientId, params.userId));
      
      const vehicleIds = clientVehicles.map(v => v.id);
      
      if (vehicleIds.length > 0) {
        // Filtrar por clientId (usuario actual) O por vehicleId (vehículos del usuario)
        query = query.where(
          or(
            eq(serviceOrders.clientId, params.userId),
            sql`${serviceOrders.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`
          )
        );
      } else {
        // Si el cliente no tiene vehículos, solo puede ver órdenes donde es el cliente
        query = query.where(eq(serviceOrders.clientId, params.userId));
      }
    } else if (params.userRole === 'operator' && params.userId) {
      // Los operarios solo pueden ver órdenes asignadas a ellos
      query = query.where(eq(serviceOrders.operatorId, params.userId));
    }

    // Filtrar por estado
    if (params.status) {
      if (params.status === 'active' && (params.userRole === 'user' || params.userRole === 'client')) {
        // Para clientes, 'active' significa órdenes pendientes o en proceso
        query = query.where(
          or(
            eq(serviceOrders.status, 'pending'),
            eq(serviceOrders.status, 'in_progress')
          )
        );
      } else {
        // Para otros roles, filtro normal por estado
        query = query.where(eq(serviceOrders.status, params.status));
      }
    }

    query.orderBy(desc(serviceOrders.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

      const result = await query;
      console.log('🔍 Storage: getServiceOrders result:', result.length, 'orders found');
      return result;
    } catch (error) {
      console.error('❌ Storage: getServiceOrders error:', error);
      // Fallback: retornar array vacío en caso de error
      return [];
    }
  }

  async getServiceOrderById(id: number, userId?: number, userRole?: string): Promise<ServiceOrder | undefined> {
    try {
      const query = db
        .select({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
          priority: serviceOrders.priority,
          estimatedTime: serviceOrders.estimatedTime,
          actualTime: serviceOrders.actualTime,
          startDate: serviceOrders.startDate,
          completionDate: serviceOrders.completionDate,
          createdAt: serviceOrders.createdAt,
          clientId: serviceOrders.clientId,
          vehicleId: serviceOrders.vehicleId,
          operatorId: serviceOrders.operatorId,
          client: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            documentNumber: users.documentNumber,
          },
          vehicle: {
            id: vehicles.id,
            plate: vehicles.plate,
            brand: vehicles.brand,
            model: vehicles.model,
            year: vehicles.year,
          }
        })
        .from(serviceOrders)
        .leftJoin(users, eq(serviceOrders.clientId, users.id))
        .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
        .where(eq(serviceOrders.id, id));

      // Filtrar por rol del usuario
      if ((userRole === 'user' || userRole === 'client') && userId) {
        // Los clientes solo pueden ver órdenes donde son el cliente (clientId = userId)
        // o órdenes de sus propios vehículos
        const clientVehicles = await db
          .select({ id: vehicles.id })
          .from(vehicles)
          .where(eq(vehicles.clientId, userId));
        
        const vehicleIds = clientVehicles.map(v => v.id);
        
        if (vehicleIds.length > 0) {
          // Filtrar por clientId (usuario actual) O por vehicleId (vehículos del usuario)
          query = query.where(
            or(
              eq(serviceOrders.clientId, userId),
              sql`${serviceOrders.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`
            )
          );
        } else {
          // Si el cliente no tiene vehículos, solo puede ver órdenes donde es el cliente
          query = query.where(eq(serviceOrders.clientId, userId));
        }
      } else if (userRole === 'operator' && userId) {
        // Los operarios solo pueden ver órdenes asignadas a ellos
        query = query.where(eq(serviceOrders.operatorId, userId));
      }

      const [result] = await query;
      return result;
    } catch (error) {
      return undefined;
    }
  }

  async debugClientOrders(clientId: number): Promise<any> {
    // Verificar si el cliente existe
    const [client] = await db
      .select()
      .from(users)
      .where(eq(users.id, clientId));
    
    // Verificar vehículos del cliente
    const clientVehicles = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.clientId, clientId));
    
    // Verificar órdenes de servicio del cliente
    const clientOrders = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.clientId, clientId));
    
    return {
      client,
      vehicles: clientVehicles,
      orders: clientOrders
    };
  }

  async createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder> {
    try {
      console.log('🔍 Storage: Creating service order with data:', order);
      
      // Validar campos obligatorios
      if (!order.clientId || !order.vehicleId || !order.description) {
        throw new Error('clientId, vehicleId y description son campos obligatorios');
      }

      // Generar orderNumber automáticamente
      let orderCount = await this.getServiceOrderCount();
      console.log('📊 Storage: Current order count:', orderCount);
      
      if (orderCount === null || orderCount === undefined) {
        orderCount = 0;
      }
      
      const orderNumber = `OS-${String(orderCount + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
      console.log('🏷️ Storage: Generated order number:', orderNumber);
      
      const orderData = {
        ...order,
        orderNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('💾 Storage: Final order data to insert:', orderData);
      
      const [newOrder] = await db.insert(serviceOrders).values(orderData).returning();
      console.log('✅ Storage: Order created successfully:', newOrder);
      return newOrder;
    } catch (error) {
      console.error('❌ Storage: Error creating service order:', error);
      throw error;
    }
  }

  async updateServiceOrder(id: number, updates: Partial<ServiceOrder>): Promise<ServiceOrder | undefined> {
    const [updated] = await db
      .update(serviceOrders)
      .set(updates)
      .where(eq(serviceOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async getServiceOrderCount(): Promise<number> {
    try {
      const [result] = await db.select({ count: count() }).from(serviceOrders);
      
      if (!result || result.count === null || result.count === undefined) {
        return 0;
      }
      
      return Number(result.count);
    } catch (error) {
      return 0;
    }
  }

  async updateServiceOrderStatus(id: number, status: string, completionDate?: Date): Promise<ServiceOrder | undefined> {
    const updates: Partial<ServiceOrder> = { status };
    if (completionDate) {
      updates.completionDate = completionDate;
    }
    
    const [updated] = await db
      .update(serviceOrders)
      .set(updates)
      .where(eq(serviceOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async createStatusHistory(history: { 
    serviceOrderId: number;
    oldStatus: string;
    newStatus: string;
    comment?: string;
    userId: number;
  }): Promise<void> {
    await db.insert(serviceOrderStatusHistory).values({
      serviceOrderId: history.serviceOrderId,
      previousStatus: history.oldStatus,
      newStatus: history.newStatus,
      comment: history.comment,
      changedBy: history.userId,
      timestamp: new Date()
    });
  }

  async getServiceOrderStatusHistory(serviceOrderId: number): Promise<any[]> {
    return await db
      .select()
      .from(serviceOrderStatusHistory)
      .where(eq(serviceOrderStatusHistory.serviceOrderId, serviceOrderId))
      .orderBy(desc(serviceOrderStatusHistory.timestamp));
  }

  // Clientes - Tabla separada
  async getActiveClientsCount(): Promise<number> {
    // console.log('🔍 Storage: getActiveClientsCount called');
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.isActive, true), eq(users.role, 'client')));
    // console.log('🔍 Storage: getActiveClientsCount result:', result.count);
    return result.count;
  }

  async getClients(params: { search?: string; limit?: number }): Promise<Client[]> {
    let query = db.select().from(users).where(and(eq(users.isActive, true), eq(users.role, 'client')));

    if (params.search) {
      query = query.where(
        and(
          eq(users.isActive, true),
          eq(users.role, 'client'),
          or(
            like(users.firstName, `%${params.search}%`),
            like(users.lastName, `%${params.search}%`),
            like(users.documentNumber, `%${params.search}%`),
            like(users.phone, `%${params.search}%`)
          )
        )
      );
    }

    query = query.orderBy(asc(users.firstName));

    if (params.limit) {
      query = query.limit(params.limit);
    }

    return await query;
  }

  async createClient(client: InsertClient): Promise<Client> {
    // Validar campos obligatorios
    if (!client.firstName || !client.lastName || !client.email) {
      throw new Error('firstName, lastName y email son campos obligatorios');
    }
    
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, updates: Partial<typeof clients.$inferInsert>): Promise<Client | undefined> {
    const [updated] = await db
      .update(clients)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async getVehiclesByClientId(clientId: number): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.clientId, clientId), eq(vehicles.isActive, true)))
      .orderBy(asc(vehicles.brand));
  }

  // Vehicles
  async getVehicles(params: { search?: string; limit?: number }): Promise<Vehicle[]> {
    try {
      let query = db
        .select({
          id: vehicles.id,
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
          color: vehicles.color,
          vin: vehicles.vin,
          engineNumber: vehicles.engineNumber,
          vehicleType: vehicles.vehicleType,
          mileage: vehicles.mileage,
          isActive: vehicles.isActive,
          createdAt: vehicles.createdAt,
          client: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            documentNumber: users.documentNumber,
          }
        })
        .from(vehicles)
        .leftJoin(users, eq(vehicles.clientId, users.id));

      if (params.search) {
        query = query.where(
          or(
            like(vehicles.plate, `%${params.search}%`),
            like(users.documentNumber, `%${params.search}%`)
          )
        );
      }

      query = query.orderBy(asc(vehicles.brand));

      if (params.limit) {
        query = query.limit(params.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting vehicles:', error);
      // Fallback: intentar con select básico
      try {
        return await db
          .select({
            id: vehicles.id,
            plate: vehicles.plate,
            brand: vehicles.brand,
            model: vehicles.model,
            year: vehicles.year,
            color: vehicles.color,
            vehicleType: vehicles.vehicleType,
            isActive: vehicles.isActive,
            createdAt: vehicles.createdAt,
          })
          .from(vehicles)
          .orderBy(asc(vehicles.brand));
      } catch (fallbackError) {
        console.error('Fallback error getting vehicles:', fallbackError);
        return [];
      }
    }
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    // Validar campos obligatorios
    if (!vehicle.clientId || !vehicle.plate || !vehicle.brand || !vehicle.model || !vehicle.year) {
      throw new Error('clientId, plate, brand, model y year son campos obligatorios');
    }

    // Procesar las fechas antes de insertar
    const processedVehicle = {
      ...vehicle,
      soatExpiry: vehicle.soatExpiry ? new Date(vehicle.soatExpiry) : null,
      technicalInspectionExpiry: vehicle.technicalInspectionExpiry ? new Date(vehicle.technicalInspectionExpiry) : null,
      createdAt: new Date()
    };

    const [newVehicle] = await db.insert(vehicles).values(processedVehicle).returning();
    return newVehicle;
  }

  async searchVehicles(query: string): Promise<any[]> {
    return await db
      .select({
        id: vehicles.id,
        plate: vehicles.plate,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        color: vehicles.color,
        mileage: vehicles.mileage,
        client: {
          firstName: users.firstName,
          lastName: users.lastName,
          documentNumber: users.documentNumber,
        }
      })
      .from(vehicles)
      .leftJoin(clients, eq(vehicles.clientId, users.id))
      .where(
        or(
          like(vehicles.plate, `%${query}%`),
          like(users.documentNumber, `%${query}%`)
        )
      )
      .orderBy(asc(vehicles.brand));
  }

  async updateVehicle(id: number, updates: Partial<typeof vehicles.$inferInsert>): Promise<Vehicle | undefined> {
    const [updated] = await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  // Inventory
  async getInventoryItems(params: { category?: string; lowStock?: boolean; limit?: number }): Promise<InventoryItem[]> {
    try {
      let query = db.select().from(inventoryItems);

      if (params.category) {
        query = query.where(eq(inventoryItems.category, params.category));
      }

      if (params.lowStock) {
        query = query.where(lte(inventoryItems.currentStock, inventoryItems.minStock));
      }

      query = query.orderBy(asc(inventoryItems.name));

      if (params.limit) {
        query = query.limit(params.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting inventory items:', error);
      
      // Fallback: verificar qué columnas existen realmente
      try {
        const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory_items'`);
        console.log('Available columns in inventory_items:', result);
        
        // Intentar con select básico sin columnas problemáticas
        return await db
          .select({
            id: inventoryItems.id,
            name: inventoryItems.name,
            description: inventoryItems.description,
            category: inventoryItems.category,
            currentStock: inventoryItems.currentStock,
            minStock: inventoryItems.minStock,
            unitCost: inventoryItems.unitCost,
            isActive: inventoryItems.isActive,
            createdAt: inventoryItems.createdAt,
          })
          .from(inventoryItems)
          .orderBy(asc(inventoryItems.name));
      } catch (fallbackError) {
        console.error('Fallback error getting inventory items:', fallbackError);
        return [];
      }
    }
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    // Validar campos obligatorios
    if (!item.name || !item.category || !item.currentStock || !item.unitCost) {
      throw new Error('name, category, currentStock y unitCost son campos obligatorios');
    }
    
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db
      .update(inventoryItems)
      .set(updates)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated || undefined;
  }

  // Notifications
  async getNotifications(params: { userId?: number; unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    try {
      let query = db.select().from(notifications);

      if (params.userId) {
        query = query.where(eq(notifications.toUserId, params.userId));
      }

      if (params.unreadOnly) {
        query = query.where(eq(notifications.isRead, false));
      }

      query = query.orderBy(desc(notifications.createdAt));

      if (params.limit) {
        query = query.limit(params.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting notifications:', error);
      
      // Fallback: verificar qué columnas existen realmente
      try {
        const result = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'notifications'`);
        console.log('Available columns in notifications:', result);
        
        // Intentar con select básico
        return await db
          .select({
            id: notifications.id,
            title: notifications.title,
            message: notifications.message,
            type: notifications.type,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
          })
          .from(notifications)
          .orderBy(desc(notifications.createdAt));
      } catch (fallbackError) {
        console.error('Fallback error getting notifications:', fallbackError);
        return [];
      }
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async updateNotificationStatus(notificationId: number, status: string): Promise<void> {
    await db
      .update(notifications)
      .set({ status })
      .where(eq(notifications.id, notificationId));
  }

  async getNotificationsForUser(userId: number, category?: string): Promise<any[]> {
    try {
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.toUserId, userId));

      if (category) {
        query = query.where(eq(notifications.category, category));
      }

      return await query.orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications for user:', error);
      return [];
    }
  }

  async getNotificationsFromUser(userId: number, category?: string): Promise<any[]> {
    try {
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.fromUserId, userId));

      if (category) {
        query = query.where(eq(notifications.category, category));
      }

      return await query.orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications from user:', error);
      return [];
    }
  }

  async getNotificationsForAdmins(category?: string): Promise<any[]> {
    try {
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.toRole, 'admin'));

      if (category) {
        query = query.where(eq(notifications.category, category));
      }

      return await query.orderBy(desc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notifications for admins:', error);
      return [];
    }
  }

  async getNotificationResponses(notificationId: number): Promise<any[]> {
    try {
      return await db
        .select()
        .from(notifications)
        .where(eq(notifications.responseToId, notificationId))
        .orderBy(asc(notifications.createdAt));
    } catch (error) {
      console.error('Error getting notification responses:', error);
      return [];
    }
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  // Invoices
  async getInvoices(params: { status?: string; limit?: number; fromDate?: Date; toDate?: Date }): Promise<Invoice[]> {
    try {
      let query = db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          amount: invoices.total,
          status: invoices.status,
          dueDate: invoices.dueDate,
          paidDate: invoices.paidDate,
          createdAt: invoices.createdAt,
          serviceOrder: {
            orderNumber: serviceOrders.orderNumber,
            client: {
              firstName: users.firstName,
              lastName: users.lastName,
              documentNumber: users.documentNumber,
            },
            vehicle: {
              plate: vehicles.plate,
              brand: vehicles.brand,
              model: vehicles.model,
            }
          }
        })
        .from(invoices)
        .leftJoin(serviceOrders, eq(invoices.serviceOrderId, serviceOrders.id))
        .leftJoin(users, eq(serviceOrders.clientId, users.id))
        .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id));

      if (params.status) {
        query = query.where(eq(invoices.status, params.status));
      }

      if (params.fromDate) {
        query = query.where(gte(invoices.createdAt, params.fromDate));
      }

      if (params.toDate) {
        query = query.where(lte(invoices.createdAt, params.toDate));
      }

      query = query.orderBy(desc(invoices.createdAt));

      if (params.limit) {
        query = query.limit(params.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting invoices:', error);
      // Fallback: intentar con select básico
      try {
        return await db
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            status: invoices.status,
            dueDate: invoices.dueDate,
            paidDate: invoices.paidDate,
            createdAt: invoices.createdAt,
          })
          .from(invoices)
          .orderBy(desc(invoices.createdAt));
      } catch (fallbackError) {
        console.error('Fallback error getting invoices:', fallbackError);
        return [];
      }
    }
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(invoices);
    return result.count;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    // Validar campos obligatorios
    if (!invoice.serviceOrderId || !invoice.clientId || !invoice.vehicleId || !invoice.invoiceNumber || !invoice.subtotal || !invoice.total) {
      throw new Error('serviceOrderId, clientId, vehicleId, invoiceNumber, subtotal y total son campos obligatorios');
    }
    
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoiceStatus(id: number, status: string, paidDate?: Date): Promise<Invoice | undefined> {
    const updates: Partial<Invoice> = { status };
    if (paidDate) {
      updates.paidDate = paidDate;
    }
    
    const [updated] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updated || undefined;
  }

  // Vehicle Types
  async getVehicleTypes(): Promise<VehicleType[]> {
    try {
      return await db
        .select()
        .from(vehicleTypes)
        .orderBy(asc(vehicleTypes.name));
    } catch (error) {
      console.error('Error en getVehicleTypes:', error);
      // Si falla, intentar con select básico
      return await db
        .select({
          id: vehicleTypes.id,
          name: vehicleTypes.name,
          description: vehicleTypes.description,
          createdAt: vehicleTypes.createdAt
        })
        .from(vehicleTypes)
        .orderBy(asc(vehicleTypes.name));
    }
  }

  async createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType> {
    // Validar campos obligatorios
    if (!vehicleType.name) {
      throw new Error('name es un campo obligatorio');
    }
    
    const [newType] = await db.insert(vehicleTypes).values(vehicleType).returning();
    return newType;
  }

  async updateVehicleType(id: number, updates: Partial<VehicleType>): Promise<VehicleType | undefined> {
    const [updated] = await db
      .update(vehicleTypes)
      .set(updates)
      .where(eq(vehicleTypes.id, id))
      .returning();
    return updated || undefined;
  }

  async getVehicleTypeByName(name: string): Promise<VehicleType | undefined> {
    const [type] = await db
      .select()
      .from(vehicleTypes)
      .where(eq(vehicleTypes.name, name));
    return type;
  }

  // Checklist Items
  async getChecklistItemsByVehicleType(vehicleTypeId: number): Promise<ChecklistItem[]> {
    return await db
      .select()
      .from(checklistItems)
      .where(and(
        eq(checklistItems.vehicleTypeId, vehicleTypeId),
        eq(checklistItems.isActive, true)
      ))
      .orderBy(asc(checklistItems.order));
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    // Validar campos obligatorios
    if (!item.name || !item.category) {
      throw new Error('name y category son campos obligatorios');
    }
    
    const [newItem] = await db.insert(checklistItems).values(item).returning();
    return newItem;
  }

  async updateChecklistItem(id: number, updates: Partial<ChecklistItem>): Promise<ChecklistItem | undefined> {
    const [updated] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, id))
      .returning();
    return updated || undefined;
  }

  // Service Order Checklist
  async getServiceOrderChecklist(serviceOrderId: number): Promise<ServiceOrderChecklist[]> {
    return await db
      .select()
      .from(serviceOrderChecklist)
      .where(eq(serviceOrderChecklist.serviceOrderId, serviceOrderId))
      .orderBy(asc(serviceOrderChecklist.order));
  }

  async createServiceOrderChecklist(item: InsertServiceOrderChecklist): Promise<ServiceOrderChecklist> {
    // Validar campos obligatorios
    if (!item.serviceOrderId || !item.checklistItemId) {
      throw new Error('serviceOrderId y checklistItemId son campos obligatorios');
    }
    
    const [newItem] = await db.insert(serviceOrderChecklist).values(item).returning();
    return newItem;
  }

  async updateServiceOrderChecklist(id: number, updates: Partial<ServiceOrderChecklist>): Promise<ServiceOrderChecklist | undefined> {
    const [updated] = await db
      .update(serviceOrderChecklist)
      .set(updates)
      .where(eq(serviceOrderChecklist.id, id))
      .returning();
    return updated || undefined;
  }

  // Service Procedures
  async getServiceProcedures(): Promise<ServiceProcedure[]> {
    return await db
      .select()
      .from(serviceProcedures)
      .where(eq(serviceProcedures.isActive, true))
      .orderBy(asc(serviceProcedures.name));
  }

  async createServiceProcedure(procedure: InsertServiceProcedure): Promise<ServiceProcedure> {
    // Validar campos obligatorios
    if (!procedure.name) {
      throw new Error('name es un campo obligatorio');
    }
    
    const [newProcedure] = await db
      .insert(serviceProcedures)
      .values(procedure)
      .returning();
    return newProcedure;
  }

  async updateServiceProcedure(id: number, updates: Partial<ServiceProcedure>): Promise<ServiceProcedure | undefined> {
    const [updated] = await db
      .update(serviceProcedures)
      .set(updates)
      .where(eq(serviceProcedures.id, id))
      .returning();
    return updated || undefined;
  }

  // System Audit Log
  async createSystemAuditLog(log: InsertSystemAuditLog): Promise<void> {
    await db.insert(systemAuditLog).values(log);
  }

  async getUserActivityLog(userId: number, limit?: number): Promise<UserActivityLog[]> {
    const query = db
      .select()
      .from(userActivityLog)
      .where(eq(userActivityLog.userId, userId))
      .orderBy(desc(userActivityLog.timestamp));

    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  // Checklist Validation Rules
  async getChecklistValidationRules(): Promise<ChecklistValidationRule[]> {
    return await db
      .select()
      .from(checklistValidationRules)
      .where(eq(checklistValidationRules.isActive, true))
      .orderBy(asc(checklistValidationRules.name));
  }

  async createChecklistValidationRule(rule: InsertChecklistValidationRule): Promise<ChecklistValidationRule> {
    const [newRule] = await db
      .insert(checklistValidationRules)
      .values(rule)
      .returning();
    return newRule;
  }

  async updateChecklistValidationRule(id: number, updates: Partial<ChecklistValidationRule>): Promise<ChecklistValidationRule | undefined> {
    const [updated] = await db
      .update(checklistValidationRules)
      .set(updates)
      .where(eq(checklistValidationRules.id, id))
      .returning();
    return updated || undefined;
  }

  // Operator actions
  async canOperatorTakeOrder(serviceOrderId: number, operatorId: number): Promise<boolean> {
    try {
      const [order] = await db
        .select({ status: serviceOrders.status, operatorId: serviceOrders.operatorId })
        .from(serviceOrders)
        .where(eq(serviceOrders.id, serviceOrderId));
      
      if (!order) return false;
      
      // Solo puede tomar si está pendiente y no tiene operario asignado
      return order.status === 'pending' && !order.operatorId;
    } catch (error) {
      return false;
    }
  }

  async takeServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined> {
    try {
      const [updated] = await db
        .update(serviceOrders)
        .set({ 
          operatorId, 
          status: 'in_progress',
          startDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(serviceOrders.id, serviceOrderId))
        .returning();
      
      return updated;
    } catch (error) {
      return undefined;
    }
  }

  async canOperatorReleaseOrder(serviceOrderId: number, operatorId: number): Promise<boolean> {
    try {
      const [order] = await db
        .select({ status: serviceOrders.status, operatorId: serviceOrders.operatorId })
        .from(serviceOrders)
        .where(eq(serviceOrders.id, serviceOrderId));
      
      if (!order) return false;
      
      // Solo puede liberar si está en progreso y es el operario asignado
      return order.status === 'in_progress' && order.operatorId === operatorId;
    } catch (error) {
      return false;
    }
  }

  async releaseServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined> {
    try {
      const [updated] = await db
        .update(serviceOrders)
        .set({ 
          operatorId: null, 
          status: 'pending',
          updatedAt: new Date()
        })
        .where(eq(serviceOrders.id, serviceOrderId))
        .returning();
      
      return updated;
    } catch (error) {
      return undefined;
    }
  }

  async addStatusHistoryEntry(history: { 
    serviceOrderId: number;
    previousStatus: string;
    newStatus: string;
    changedBy: number;
    notes?: string;
    operatorAction?: string;
  }): Promise<void> {
    try {
      await db.insert(serviceOrderStatusHistory).values({
        serviceOrderId: history.serviceOrderId,
        previousStatus: history.previousStatus,
        newStatus: history.newStatus,
        comment: history.notes || '',
        changedBy: history.changedBy,
        timestamp: new Date()
      });
    } catch (error) {
      // Silently fail - no critical for main functionality
    }
  }

  // Operator specific queries
  async getOperatorAssignedOrders(operatorId: number): Promise<ServiceOrder[]> {
    try {
      return await db
        .select({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
          priority: serviceOrders.priority,
          estimatedTime: serviceOrders.estimatedTime,
          actualTime: serviceOrders.actualTime,
          startDate: serviceOrders.startDate,
          completionDate: serviceOrders.completionDate,
          createdAt: serviceOrders.createdAt,
          clientId: serviceOrders.clientId,
          vehicleId: serviceOrders.vehicleId,
          operatorId: serviceOrders.operatorId,
          client: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            documentNumber: users.documentNumber,
          },
          vehicle: {
            id: vehicles.id,
            plate: vehicles.plate,
            brand: vehicles.brand,
            model: vehicles.model,
            year: vehicles.year,
          }
        })
        .from(serviceOrders)
        .leftJoin(users, eq(serviceOrders.clientId, users.id))
        .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
        .where(eq(serviceOrders.operatorId, operatorId))
        .orderBy(desc(serviceOrders.createdAt));
    } catch (error) {
      return [];
    }
  }

  async getServiceOrdersByOperator(operatorId: number): Promise<ServiceOrder[]> {
    try {
      return await db
        .select({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
          priority: serviceOrders.priority,
          estimatedTime: serviceOrders.estimatedTime,
          actualTime: serviceOrders.actualTime,
          startDate: serviceOrders.startDate,
          completionDate: serviceOrders.completionDate,
          createdAt: serviceOrders.createdAt,
          clientId: serviceOrders.clientId,
          vehicleId: serviceOrders.vehicleId,
          operatorId: serviceOrders.operatorId,
          client: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            documentNumber: users.documentNumber,
          },
          vehicle: {
            id: vehicles.id,
            plate: vehicles.plate,
            brand: vehicles.brand,
            model: vehicles.model,
            year: vehicles.year,
          }
        })
        .from(serviceOrders)
        .leftJoin(users, eq(serviceOrders.clientId, users.id))
        .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
        .where(eq(serviceOrders.operatorId, operatorId))
        .orderBy(desc(serviceOrders.createdAt));
    } catch (error) {
      return [];
    }
  }
}

export const dbStorage = new DatabaseStorage();
