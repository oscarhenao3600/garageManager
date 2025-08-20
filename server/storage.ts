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
} from "@shared/schema";
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

  // Clients
  getClients(params: { search?: string; limit?: number }): Promise<Client[]>;
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
  createServiceOrderChecklist(checklist: InsertServiceOrderChecklist): Promise<ServiceOrderChecklist>;
  updateServiceOrderChecklist(id: number, updates: Partial<ServiceOrderChecklist>): Promise<ServiceOrderChecklist | undefined>;
  completeChecklistItem(id: number, userId: number, notes?: string): Promise<ServiceOrderChecklist | undefined>;

  // Service Order Management (New)
  takeServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined>;
  releaseServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined>;
  getServiceOrdersByOperator(operatorId: number, status?: string): Promise<ServiceOrder[]>;
  getServiceOrdersTakenByOperator(operatorId: number): Promise<ServiceOrder[]>;
  canOperatorTakeOrder(serviceOrderId: number, operatorId: number): Promise<boolean>;
  canOperatorReleaseOrder(serviceOrderId: number, operatorId: number): Promise<boolean>;
  
  // Service Order Status History
  addStatusHistoryEntry(entry: InsertServiceOrderStatusHistory): Promise<ServiceOrderStatusHistory>;
  getServiceOrderStatusHistory(serviceOrderId: number): Promise<ServiceOrderStatusHistory[]>;

  // System Audit and Logging
  logSystemAudit(entry: InsertSystemAuditLog): Promise<SystemAuditLog>;
  logUserActivity(entry: InsertUserActivityLog): Promise<UserActivityLog>;
  getSystemAuditLogs(params: { userId?: number; action?: string; severity?: string; limit?: number }): Promise<SystemAuditLog[]>;
  getUserActivityLogs(userId: number, limit?: number): Promise<UserActivityLog[]>;
  
  // Checklist Validation
  validateChecklistCompletion(serviceOrderId: number): Promise<{ isValid: boolean; missingItems: string[]; errors: string[] }>;
  canChangeServiceOrderStatus(serviceOrderId: number, newStatus: string): Promise<{ canChange: boolean; reason?: string; requiredActions?: string[] }>;
  getChecklistValidationRules(vehicleTypeId: number): Promise<ChecklistValidationRule[]>;
  createChecklistValidationRule(rule: InsertChecklistValidationRule): Promise<ChecklistValidationRule>;
  updateChecklistValidationRule(id: number, updates: Partial<ChecklistValidationRule>): Promise<ChecklistValidationRule | undefined>;

  // Public methods
  getPublicVehicleHistory(params: { documentNumber?: string; plate?: string }): Promise<any[]>;

  // Nuevos métodos para operarios con restricciones de permisos
  getAvailableOrdersForOperator(operatorId: number): Promise<ServiceOrder[]>;
  getOperatorAssignedOrders(operatorId: number): Promise<ServiceOrder[]>;
  canOperatorAccessVehicleHistory(operatorId: number, vehicleId: number): Promise<boolean>;
  getVehicleHistoryForOperator(operatorId: number, vehicleId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByDocumentNumber(documentNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.documentNumber, documentNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getWorkers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        or(eq(users.role, 'operator'), eq(users.role, 'admin')),
        eq(users.isActive, true)
      ))
      .orderBy(asc(users.firstName));
  }

  async updateUserPassword(id: number, newPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async markFirstLoginCompleted(id: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ firstLogin: false })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async createUserWithDocumentNumber(userData: Omit<InsertUser, 'password'> & { documentNumber: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      password: userData.documentNumber, // Usar número de cédula como contraseña inicial
      firstLogin: true,
    }).returning();
    return user;
  }

  async getDashboardStats(): Promise<any> {
    const [activeOrdersResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(or(eq(serviceOrders.status, 'pending'), eq(serviceOrders.status, 'in_progress')));

    const [vehiclesInShopResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(eq(serviceOrders.status, 'in_progress'));

    const [activeWorkersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'operator'), eq(users.isActive, true)));

    const [totalWorkersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'operator'));

    const [lowStockResult] = await db
      .select({ count: count() })
      .from(inventoryItems)
      .where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minStock}`);

    return {
      activeOrders: activeOrdersResult.count,
      vehiclesInShop: vehiclesInShopResult.count,
      monthlyRevenue: "45.8M",
      activeWorkers: activeWorkersResult.count,
      totalWorkers: totalWorkersResult.count,
      pendingDelivery: 5,
      lowStock: lowStockResult.count
    };
  }

  async getOperatorDashboardStats(operatorId: number): Promise<any> {
    // Órdenes pendientes del operario
    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.operatorId, operatorId),
        eq(serviceOrders.status, 'pending')
      ));

    // Órdenes completadas esta semana por el operario
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [completedOrdersResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.operatorId, operatorId),
        eq(serviceOrders.status, 'completed'),
        gte(serviceOrders.completionDate, oneWeekAgo)
      ));

    // Tiempo promedio por orden (simulado por ahora)
    const avgTime = "2.5h";

    // Eficiencia (simulada por ahora)
    const efficiency = "95%";

    return {
      myPendingOrders: pendingOrdersResult.count,
      myCompletedOrders: completedOrdersResult.count,
      myAvgTime: avgTime,
      myEfficiency: efficiency
    };
  }

  async getClientDashboardStats(clientId: number): Promise<any> {
    console.log('📊 Generando estadísticas para cliente:', clientId);
    
    // Total de órdenes del cliente
    const [totalOrdersResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(eq(serviceOrders.clientId, clientId));

    // Órdenes pendientes del cliente
    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.clientId, clientId),
        or(eq(serviceOrders.status, 'pending'), eq(serviceOrders.status, 'in_progress'))
      ));

    // Órdenes completadas este mes por el cliente
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const [completedOrdersResult] = await db
      .select({ count: count() })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.clientId, clientId),
        eq(serviceOrders.status, 'completed'),
        gte(serviceOrders.completionDate, oneMonthAgo)
      ));

    // Total de vehículos del cliente
    const [vehiclesResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.clientId, clientId));

    // Órdenes recientes del cliente (últimas 5)
    const recentOrders = await db
      .select({
        id: serviceOrders.id,
        orderNumber: serviceOrders.orderNumber,
        status: serviceOrders.status,
        createdAt: serviceOrders.createdAt,
        vehicle: {
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model
        }
      })
      .from(serviceOrders)
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .where(eq(serviceOrders.clientId, clientId))
      .orderBy(desc(serviceOrders.createdAt))
      .limit(5);

    const stats = {
      myOrders: totalOrdersResult.count,
      myPendingOrders: pendingOrdersResult.count,
      myCompletedOrders: completedOrdersResult.count,
      myVehicles: vehiclesResult.count,
      recentOrders: recentOrders
    };

    console.log('📈 Estadísticas del cliente:', {
      totalOrders: stats.myOrders,
      pendingOrders: stats.myPendingOrders,
      completedOrders: stats.myCompletedOrders,
      vehicles: stats.myVehicles,
      recentOrdersCount: stats.recentOrders.length
    });

    return stats;
  }

  async getServiceOrders(params: { status?: string; limit?: number; userId?: number; userRole?: string }): Promise<ServiceOrder[]> {
    const query = db
      .select({
        id: serviceOrders.id,
        clientId: serviceOrders.clientId,
        vehicleId: serviceOrders.vehicleId,
        operatorId: serviceOrders.operatorId,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCost: serviceOrders.estimatedCost,
        finalCost: serviceOrders.finalCost,
        startDate: serviceOrders.startDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
        },
        vehicle: {
          id: vehicles.id,
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
        },
        operator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(serviceOrders)
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .leftJoin(users, eq(serviceOrders.operatorId, users.id));

    // Filtrar por rol del usuario
    console.log('Filtrando órdenes por rol:', params.userRole, 'userId:', params.userId);
    
    if ((params.userRole === 'user' || params.userRole === 'client') && params.userId) {
      console.log('🔍 Filtrando para CLIENTE con userId:', params.userId);
      
      // Los clientes solo pueden ver órdenes donde son el cliente (clientId = userId)
      // o órdenes de sus propios vehículos
      const clientVehicles = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.clientId, params.userId));
      
      const vehicleIds = clientVehicles.map(v => v.id);
      console.log('🚗 Vehículos del cliente:', vehicleIds);
      
      if (vehicleIds.length > 0) {
        // Filtrar por clientId (usuario actual) O por vehicleId (vehículos del usuario)
        console.log('✅ Cliente tiene vehículos, aplicando filtro combinado');
        query.where(
          or(
            eq(serviceOrders.clientId, params.userId),
            sql`${serviceOrders.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`
          )
        );
      } else {
        // Si el cliente no tiene vehículos, solo puede ver órdenes donde es el cliente
        console.log('⚠️ Cliente NO tiene vehículos, solo filtrando por clientId');
        query.where(eq(serviceOrders.clientId, params.userId));
      }
      console.log('🔒 Filtro aplicado para cliente: clientId =', params.userId);
    } else if (params.userRole === 'operator' && params.userId) {
      // Los operarios solo pueden ver órdenes asignadas a ellos
      query.where(eq(serviceOrders.operatorId, params.userId));
      console.log('Filtro aplicado para operario: operatorId =', params.userId);
    } else if (params.userRole === 'admin') {
      console.log('Admin: sin filtros aplicados - acceso completo');
    } else {
      console.log('Rol no reconocido o sin userId:', params.userRole, params.userId);
    }

    // Filtrar por estado
    if (params.status) {
      if (params.status === 'active' && (params.userRole === 'user' || params.userRole === 'client')) {
        // Para clientes, 'active' significa órdenes pendientes o en proceso
        query.where(
          or(
            eq(serviceOrders.status, 'pending'),
            eq(serviceOrders.status, 'in_progress')
          )
        );
      } else {
        // Para otros roles, filtro normal por estado
        query.where(eq(serviceOrders.status, params.status));
      }
    }

    query.orderBy(desc(serviceOrders.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

    const result = await query;
    console.log(`📊 Resultado: ${result.length} órdenes encontradas para ${params.userRole} ${params.userId}`);
    if (result.length > 0) {
      console.log('📋 Primeras órdenes:', result.slice(0, 2).map(o => ({ id: o.id, clientId: o.clientId, vehicleId: o.vehicleId, status: o.status })));
    }
    
    return result;
  }

  async debugClientOrders(clientId: number): Promise<any> {
    console.log('🔍 DEBUG: Verificando órdenes para cliente:', clientId);
    
    // Verificar si el cliente existe
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId));
    
    console.log('👤 Cliente encontrado:', client ? { id: client.id, firstName: client.firstName, lastName: client.lastName } : 'NO ENCONTRADO');
    
    // Verificar vehículos del cliente
    const clientVehicles = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.clientId, clientId));
    
    console.log('🚗 Vehículos del cliente:', clientVehicles.map(v => ({ id: v.id, plate: v.plate, brand: v.brand })));
    
    // Verificar órdenes donde el cliente es el cliente
    const ordersAsClient = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.clientId, clientId));
    
    console.log('📋 Órdenes donde es cliente:', ordersAsClient.map(o => ({ id: o.id, status: o.status, vehicleId: o.vehicleId })));
    
    // Verificar órdenes de vehículos del cliente
    if (clientVehicles.length > 0) {
      const vehicleIds = clientVehicles.map(v => v.id);
      const ordersOfVehicles = await db
        .select()
        .from(serviceOrders)
        .where(sql`${serviceOrders.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`);
      
      console.log('🔧 Órdenes de vehículos del cliente:', ordersOfVehicles.map(o => ({ id: o.id, status: o.status, vehicleId: o.vehicleId })));
    }
    
    return {
      client,
      vehicles: clientVehicles,
      ordersAsClient,
      ordersOfVehicles: clientVehicles.length > 0 ? await db
        .select()
        .from(serviceOrders)
        .where(sql`${serviceOrders.vehicleId} IN (${sql.join(clientVehicles.map(v => sql`${v.id}`), sql`, `)})`) : []
    };
  }

  async getServiceOrderById(id: number, userId?: number, userRole?: string): Promise<ServiceOrder | undefined> {
    const query = db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, id));

    // Si es un cliente, verificar que tenga acceso a esta orden
    if ((userRole === 'user' || userRole === 'client') && userId) {
      const clientVehicles = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.clientId, userId));
      
      const vehicleIds = clientVehicles.map(v => v.id);
      
      if (vehicleIds.length > 0) {
        // Verificar que la orden pertenezca al cliente o a sus vehículos
        const [order] = await query.where(
          or(
            eq(serviceOrders.clientId, userId),
            sql`${serviceOrders.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`
          )
        );
        return order || undefined;
      } else {
        // Si no tiene vehículos, solo puede ver órdenes donde es el cliente
        const [order] = await query.where(eq(serviceOrders.clientId, userId));
        return order || undefined;
      }
    } else if (userRole === 'operator' && userId) {
      // Los operarios solo pueden ver órdenes asignadas a ellos
      const [order] = await query.where(eq(serviceOrders.operatorId, userId));
      return order || undefined;
    }

    // Para admin y otros roles, retornar la orden sin restricciones
    const [order] = await query;
    return order || undefined;
  }

  async createServiceOrder(order: InsertServiceOrder): Promise<ServiceOrder> {
    const [newOrder] = await db.insert(serviceOrders).values(order).returning();
    return newOrder;
  }

  async updateServiceOrder(id: number, updates: Partial<ServiceOrder>): Promise<ServiceOrder | undefined> {
    const [updatedOrder] = await db
      .update(serviceOrders)
      .set(updates)
      .where(eq(serviceOrders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async getServiceOrderCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(serviceOrders);
    return result.count;
  }

  async updateServiceOrderStatus(id: number, status: string, completionDate?: Date): Promise<ServiceOrder | undefined> {
    const updates: any = { status };
    
    if (status === 'in_progress') {
      updates.startDate = new Date();
    }
    
    if (completionDate) {
      updates.completionDate = completionDate;
    }

    const [updatedOrder] = await db
      .update(serviceOrders)
      .set(updates)
      .where(eq(serviceOrders.id, id))
      .returning();
    
    return updatedOrder || undefined;
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
      oldStatus: history.oldStatus,
      newStatus: history.newStatus,
      comment: history.comment,
      userId: history.userId,
    });
  }

  async getServiceOrderStatusHistory(serviceOrderId: number): Promise<any[]> {
    return await db
      .select({
        id: serviceOrderStatusHistory.id,
        oldStatus: serviceOrderStatusHistory.oldStatus,
        newStatus: serviceOrderStatusHistory.newStatus,
        comment: serviceOrderStatusHistory.comment,
        createdAt: serviceOrderStatusHistory.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(serviceOrderStatusHistory)
      .leftJoin(users, eq(serviceOrderStatusHistory.userId, users.id))
      .where(eq(serviceOrderStatusHistory.serviceOrderId, serviceOrderId))
      .orderBy(desc(serviceOrderStatusHistory.createdAt));
  }

  async getClients(params: { search?: string; limit?: number }): Promise<Client[]> {
    const query = db.select().from(clients);

    if (params.search) {
      query.where(
        or(
          like(clients.firstName, `%${params.search}%`),
          like(clients.lastName, `%${params.search}%`),
          like(clients.documentNumber, `%${params.search}%`),
          like(clients.phone, `%${params.search}%`)
        )
      );
    }

    query.orderBy(asc(clients.firstName));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, updates: Partial<typeof clients.$inferInsert>): Promise<Client | undefined> {
    const [updated] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
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

  async getVehicles(params: { search?: string; limit?: number }): Promise<Vehicle[]> {
    const query = db
      .select({
        id: vehicles.id,
        clientId: vehicles.clientId,
        plate: vehicles.plate,
        brand: vehicles.brand,
        model: vehicles.model,
        year: vehicles.year,
        color: vehicles.color,
        vin: vehicles.vin,
        engineNumber: vehicles.engineNumber,
        soatExpiry: vehicles.soatExpiry,
        technicalInspectionExpiry: vehicles.technicalInspectionExpiry,
        mileage: vehicles.mileage,
        isActive: vehicles.isActive,
        createdAt: vehicles.createdAt,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
        }
      })
      .from(vehicles)
      .leftJoin(clients, eq(vehicles.clientId, clients.id));

    if (params.search) {
      query.where(
        or(
          like(vehicles.plate, `%${params.search}%`),
          like(vehicles.brand, `%${params.search}%`),
          like(vehicles.model, `%${params.search}%`)
        )
      );
    }

    query.orderBy(desc(vehicles.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
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
        mileage: vehicles.mileage,
        client: {
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
        }
      })
      .from(vehicles)
      .leftJoin(clients, eq(vehicles.clientId, clients.id))
      .where(
        or(
          like(vehicles.plate, `%${query}%`),
          like(clients.documentNumber, `%${query}%`)
        )
      )
      .limit(10);
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
    return vehicle || undefined;
  }

  async getInventoryItems(params: { category?: string; lowStock?: boolean; limit?: number }): Promise<InventoryItem[]> {
    const query = db.select().from(inventoryItems);

    const conditions = [eq(inventoryItems.isActive, true)];

    if (params.category) {
      conditions.push(eq(inventoryItems.category, params.category));
    }

    if (params.lowStock) {
      conditions.push(sql`${inventoryItems.currentStock} <= ${inventoryItems.minStock}`);
    }

    query.where(and(...conditions));
    query.orderBy(asc(inventoryItems.name));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set(updates)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async getNotifications(params: { userId?: number; unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    const query = db.select().from(notifications);

    const conditions = [];

    if (params.userId) {
      conditions.push(
        or(
          eq(notifications.userId, params.userId),
          eq(notifications.userId, null) // Global notifications
        )
      );
    }

    if (params.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    query.orderBy(desc(notifications.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsForUser(userId: number, category?: string): Promise<any[]> {
    const query = db
      .select({
        id: notifications.id,
        fromUserId: notifications.fromUserId,
        toUserId: notifications.toUserId,
        serviceOrderId: notifications.serviceOrderId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        priority: notifications.priority,
        status: notifications.status,
        category: notifications.category,
        requiresResponse: notifications.requiresResponse,
        responseToId: notifications.responseToId,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
        toUser: {
          id: users2.id,
          firstName: users2.firstName,
          lastName: users2.lastName,
          role: users2.role,
        },
        serviceOrder: {
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .leftJoin(users as any, eq(notifications.toUserId, users.id), "users2")
      .leftJoin(serviceOrders, eq(notifications.serviceOrderId, serviceOrders.id));

    // Filtrar por usuario y categoría
    if (category) {
      query.where(and(
        or(
          eq(notifications.toUserId, userId),
          isNull(notifications.toUserId) // Notificaciones del sistema
        ),
        eq(notifications.category, category)
      ));
    } else {
      query.where(or(
        eq(notifications.toUserId, userId),
        isNull(notifications.toUserId) // Notificaciones del sistema
      ));
    }

    query.orderBy(desc(notifications.createdAt));
    return await query;
  }

  async getNotificationsFromUser(userId: number, category?: string): Promise<any[]> {
    const query = db
      .select({
        id: notifications.id,
        fromUserId: notifications.fromUserId,
        toUserId: notifications.toUserId,
        serviceOrderId: notifications.serviceOrderId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        priority: notifications.priority,
        status: notifications.status,
        category: notifications.category,
        requiresResponse: notifications.requiresResponse,
        responseToId: notifications.responseToId,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
        toUser: {
          id: users2.id,
          firstName: users2.firstName,
          lastName: users2.lastName,
          role: users2.role,
        },
        serviceOrder: {
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .leftJoin(users as any, eq(notifications.toUserId, users.id), "users2")
      .leftJoin(serviceOrders, eq(notifications.serviceOrderId, serviceOrders.id))
      .where(eq(notifications.fromUserId, userId));

    if (category) {
      query.where(eq(notifications.category, category));
    }

    query.orderBy(desc(notifications.createdAt));
    return await query;
  }

  async getNotificationsForAdmins(category?: string): Promise<any[]> {
    const query = db
      .select({
        id: notifications.id,
        fromUserId: notifications.fromUserId,
        toUserId: notifications.toUserId,
        serviceOrderId: notifications.serviceOrderId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        priority: notifications.priority,
        status: notifications.status,
        category: notifications.category,
        requiresResponse: notifications.requiresResponse,
        responseToId: notifications.responseToId,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
        toUser: {
          id: users2.id,
          firstName: users2.firstName,
          lastName: users2.lastName,
          role: users2.role,
        },
        serviceOrder: {
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .leftJoin(users as any, eq(notifications.toUserId, users.id), "users2")
      .leftJoin(serviceOrders, eq(notifications.serviceOrderId, serviceOrders.id))
      .where(or(
        isNull(notifications.toUserId), // Notificaciones del sistema
        eq(notifications.category, 'operator_to_admin') // Notificaciones de operarios a admins
      ));

    if (category) {
      query.where(eq(notifications.category, category));
    }

    query.orderBy(desc(notifications.createdAt));
    return await query;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async updateNotificationStatus(notificationId: number, status: string): Promise<void> {
    await db
      .update(notifications)
      .set({ status })
      .where(eq(notifications.id, notificationId));
  }

  async getNotificationResponses(notificationId: number): Promise<any[]> {
    return await db
      .select({
        id: notifications.id,
        fromUserId: notifications.fromUserId,
        toUserId: notifications.toUserId,
        serviceOrderId: notifications.serviceOrderId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        priority: notifications.priority,
        status: notifications.status,
        category: notifications.category,
        requiresResponse: notifications.requiresResponse,
        responseToId: notifications.responseToId,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
        },
        toUser: {
          id: users2.id,
          firstName: users2.firstName,
          lastName: users2.lastName,
          role: users2.role,
        },
        serviceOrder: {
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          description: serviceOrders.description,
          status: serviceOrders.status,
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .leftJoin(users as any, eq(notifications.toUserId, users.id), "users2")
      .leftJoin(serviceOrders, eq(notifications.serviceOrderId, serviceOrders.id))
      .where(eq(notifications.responseToId, notificationId))
      .orderBy(asc(notifications.createdAt));
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async getInvoices(params: { status?: string; limit?: number }): Promise<Invoice[]> {
    const query = db
      .select({
        id: invoices.id,
        serviceOrderId: invoices.serviceOrderId,
        invoiceNumber: invoices.invoiceNumber,
        subtotal: invoices.subtotal,
        tax: invoices.tax,
        total: invoices.total,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        createdAt: invoices.createdAt,
        serviceOrder: {
          orderNumber: serviceOrders.orderNumber,
          client: {
            firstName: clients.firstName,
            lastName: clients.lastName,
            documentNumber: clients.documentNumber,
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
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id));

    if (params.status) {
      query.where(eq(invoices.status, params.status));
    }

    query.orderBy(desc(invoices.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async getInvoices(params: { status?: string; limit?: number; fromDate?: Date; toDate?: Date }): Promise<Invoice[]> {
    const query = db.select().from(invoices);

    if (params.status) {
      query.where(eq(invoices.status, params.status));
    }

    if (params.fromDate) {
      query.where(gte(invoices.issueDate, params.fromDate));
    }

    if (params.toDate) {
      query.where(lte(invoices.issueDate, params.toDate));
    }

    query.orderBy(desc(invoices.issueDate));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);
    
    return invoice;
  }

  async getInvoiceCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices);
    return result?.count || 0;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoiceStatus(id: number, status: string, paidDate?: Date): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ 
        status,
        paidDate: status === "paid" ? paidDate : null
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return updatedInvoice;
  }

  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db
      .select()
      .from(companySettings)
      .limit(1);
    return settings;
  }

  async updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const [current] = await db.select().from(companySettings).limit(1);
    
    if (!current) {
      const [newSettings] = await db
        .insert(companySettings)
        .values({
          ...settings,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CompanySettings)
        .returning();
      return newSettings;
    }

    const [updatedSettings] = await db
      .update(companySettings)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(companySettings.id, current.id))
      .returning();
    
    return updatedSettings;
  }

  async getClientByServiceOrder(serviceOrderId: number): Promise<Client | undefined> {
    const [order] = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, serviceOrderId))
      .limit(1);

    if (!order) return undefined;

    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, order.clientId))
      .limit(1);

    return client;
  }

  async getVehicleTypes(): Promise<VehicleType[]> {
    return await db.select().from(vehicleTypes);
  }

  async createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType> {
    const [newVehicleType] = await db.insert(vehicleTypes).values(vehicleType).returning();
    return newVehicleType;
  }

  async updateVehicleType(id: number, updates: Partial<VehicleType>): Promise<VehicleType | undefined> {
    const [updatedVehicleType] = await db
      .update(vehicleTypes)
      .set(updates)
      .where(eq(vehicleTypes.id, id))
      .returning();
    return updatedVehicleType || undefined;
  }

  async getVehicleTypeByName(name: string): Promise<VehicleType | undefined> {
    const [vehicleType] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.name, name));
    return vehicleType || undefined;
  }

  async getChecklistItemsByVehicleType(vehicleTypeId: number): Promise<ChecklistItem[]> {
    return await db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.vehicleTypeId, vehicleTypeId));
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const [newItem] = await db.insert(checklistItems).values(item).returning();
    return newItem;
  }

  async updateChecklistItem(id: number, updates: Partial<ChecklistItem>): Promise<ChecklistItem | undefined> {
    const [updatedItem] = await db
      .update(checklistItems)
      .set(updates)
      .where(eq(checklistItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async getServiceOrderChecklist(serviceOrderId: number): Promise<ServiceOrderChecklist[]> {
    return await db
      .select()
      .from(serviceOrderChecklist)
      .where(eq(serviceOrderChecklist.serviceOrderId, serviceOrderId));
  }

  async createServiceOrderChecklist(checklist: InsertServiceOrderChecklist): Promise<ServiceOrderChecklist> {
    const [newChecklist] = await db.insert(serviceOrderChecklist).values(checklist).returning();
    return newChecklist;
  }

  async updateServiceOrderChecklist(id: number, updates: Partial<ServiceOrderChecklist>): Promise<ServiceOrderChecklist | undefined> {
    const [updatedChecklist] = await db
      .update(serviceOrderChecklist)
      .set(updates)
      .where(eq(serviceOrderChecklist.id, id))
      .returning();
    return updatedChecklist || undefined;
  }

  async completeChecklistItem(id: number, userId: number, notes?: string): Promise<ServiceOrderChecklist | undefined> {
    const [updatedChecklist] = await db
      .update(serviceOrderChecklist)
      .set({ completed: true, completedAt: new Date(), completedBy: userId, notes })
      .where(eq(serviceOrderChecklist.id, id))
      .returning();
    return updatedChecklist || undefined;
  }

  async takeServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined> {
    const [order] = await db
      .update(serviceOrders)
      .set({ 
        operatorId, 
        takenBy: operatorId,
        takenAt: new Date(),
        status: 'in_progress', 
        startDate: new Date() 
      })
      .where(eq(serviceOrders.id, serviceOrderId))
      .returning();
    return order || undefined;
  }

  async releaseServiceOrder(serviceOrderId: number, operatorId: number): Promise<ServiceOrder | undefined> {
    const [order] = await db
      .update(serviceOrders)
      .set({ 
        operatorId: null, 
        takenBy: null,
        takenAt: null,
        status: 'pending', 
        startDate: null, 
        completionDate: null 
      })
      .where(eq(serviceOrders.id, serviceOrderId))
      .returning();
    return order || undefined;
  }

  async getServiceOrdersByOperator(operatorId: number, status?: string): Promise<ServiceOrder[]> {
    const query = db
      .select({
        id: serviceOrders.id,
        clientId: serviceOrders.clientId,
        vehicleId: serviceOrders.vehicleId,
        operatorId: serviceOrders.operatorId,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCost: serviceOrders.estimatedCost,
        finalCost: serviceOrders.finalCost,
        startDate: serviceOrders.startDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
        },
        vehicle: {
          id: vehicles.id,
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
        },
        operator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(serviceOrders)
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .leftJoin(users, eq(serviceOrders.operatorId, users.id));

    if (status) {
      query.where(eq(serviceOrders.status, status));
    }

    query.where(eq(serviceOrders.operatorId, operatorId));
    query.orderBy(desc(serviceOrders.createdAt));

    return await query;
  }

  async getServiceOrdersTakenByOperator(operatorId: number): Promise<ServiceOrder[]> {
    return await db
      .select({
        id: serviceOrders.id,
        clientId: serviceOrders.clientId,
        vehicleId: serviceOrders.vehicleId,
        operatorId: serviceOrders.operatorId,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCost: serviceOrders.estimatedCost,
        finalCost: serviceOrders.finalCost,
        startDate: serviceOrders.startDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
        },
        vehicle: {
          id: vehicles.id,
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
        },
        operator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(serviceOrders)
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .leftJoin(users, eq(serviceOrders.operatorId, users.id))
      .where(eq(serviceOrders.operatorId, operatorId));
  }

  async canOperatorTakeOrder(serviceOrderId: number, operatorId: number): Promise<boolean> {
    const [order] = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, serviceOrderId))
      .limit(1);

    if (!order) return false;

    return order.operatorId === null;
  }

  async canOperatorReleaseOrder(serviceOrderId: number, operatorId: number): Promise<boolean> {
    const [order] = await db
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, serviceOrderId))
      .limit(1);

    if (!order) return false;

    return order.operatorId === operatorId;
  }

  async addStatusHistoryEntry(entry: InsertServiceOrderStatusHistory): Promise<ServiceOrderStatusHistory> {
    const [newEntry] = await db.insert(serviceOrderStatusHistory).values(entry).returning();
    return newEntry;
  }

  async getServiceOrderStatusHistory(serviceOrderId: number): Promise<ServiceOrderStatusHistory[]> {
    return await db
      .select()
      .from(serviceOrderStatusHistory)
      .where(eq(serviceOrderStatusHistory.serviceOrderId, serviceOrderId))
      .orderBy(desc(serviceOrderStatusHistory.createdAt));
  }

  async logSystemAudit(entry: InsertSystemAuditLog): Promise<SystemAuditLog> {
    const [newEntry] = await db.insert(systemAuditLog).values(entry).returning();
    return newEntry;
  }

  async logUserActivity(entry: InsertUserActivityLog): Promise<UserActivityLog> {
    const [newEntry] = await db.insert(userActivityLog).values(entry).returning();
    return newEntry;
  }

  async getSystemAuditLogs(params: { userId?: number; action?: string; severity?: string; limit?: number }): Promise<SystemAuditLog[]> {
    const query = db.select().from(systemAuditLog);

    if (params.userId) {
      query.where(eq(systemAuditLog.userId, params.userId));
    }

    if (params.action) {
      query.where(eq(systemAuditLog.action, params.action));
    }

    if (params.severity) {
      query.where(eq(systemAuditLog.severity, params.severity));
    }

    query.orderBy(desc(systemAuditLog.timestamp));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async getUserActivityLogs(userId: number, limit?: number): Promise<UserActivityLog[]> {
    const query = db.select().from(userActivityLog);

    if (userId) {
      query.where(eq(userActivityLog.userId, userId));
    }

    query.orderBy(desc(userActivityLog.timestamp));

    if (limit) {
      query.limit(limit);
    }

    return await query;
  }

  async validateChecklistCompletion(serviceOrderId: number): Promise<{ isValid: boolean; missingItems: string[]; errors: string[] }> {
    try {
      // Obtener la orden de servicio
      const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, serviceOrderId));
      if (!order) {
        return { isValid: false, missingItems: [], errors: ["Orden de servicio no encontrada"] };
      }

      // Obtener el checklist de la orden
      const checklist = await this.getServiceOrderChecklist(serviceOrderId);
      
      // Obtener el vehículo para saber el tipo
      const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId));
      if (!vehicle) {
        return { isValid: false, missingItems: [], errors: ["Vehículo no encontrado"] };
      }

      // Obtener los items de checklist requeridos para este tipo de vehículo
      const [vehicleType] = await db.select().from(vehicleTypes).where(eq(vehicleTypes.name, vehicle.vehicleType));
      if (!vehicleType) {
        return { isValid: false, missingItems: [], errors: ["Tipo de vehículo no encontrado"] };
      }

      const requiredItems = await db
        .select()
        .from(checklistItems)
        .where(and(
          eq(checklistItems.vehicleTypeId, vehicleType.id),
          eq(checklistItems.isRequired, true)
        ));

      const missingItems: string[] = [];
      const errors: string[] = [];

      // Verificar que todos los items requeridos estén completados
      for (const requiredItem of requiredItems) {
        const checklistItem = checklist.find(c => c.checklistItemId === requiredItem.id);
        
        if (!checklistItem) {
          missingItems.push(requiredItem.name);
        } else if (!checklistItem.isCompleted) {
          errors.push(`Item "${requiredItem.name}" no está completado`);
        }
      }

      return {
        isValid: missingItems.length === 0 && errors.length === 0,
        missingItems,
        errors
      };
    } catch (error) {
      console.error("Error validating checklist:", error);
      return { 
        isValid: false, 
        missingItems: [], 
        errors: ["Error interno al validar checklist"] 
      };
    }
  }

  async canChangeServiceOrderStatus(serviceOrderId: number, newStatus: string): Promise<{ canChange: boolean; reason?: string; requiredActions?: string[] }> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, serviceOrderId));
    if (!order) {
      return { canChange: false, reason: "Service order not found" };
    }

    if (order.status === newStatus) {
      return { canChange: false, reason: "Status is already " + newStatus };
    }

    const rules = await this.getChecklistValidationRules(order.vehicleTypeId);
    const checklist = await this.getServiceOrderChecklist(serviceOrderId);

    const missingItems: string[] = [];
    const errors: string[] = [];

    for (const rule of rules) {
      const item = checklist.find(c => c.checklistItemId === rule.checklistItemId);
      if (!item) {
        missingItems.push(rule.name);
      } else if (item.completed === false) {
        errors.push(`Item "${rule.name}" is not completed.`);
      }
    }

    if (missingItems.length > 0 || errors.length > 0) {
      return {
        canChange: false,
        reason: "Cannot change status to " + newStatus + " because some checklist items are not completed or missing.",
        requiredActions: ["Complete checklist items", "Fix checklist errors"]
      };
    }

    return { canChange: true };
  }

  async getChecklistValidationRules(vehicleTypeId: number): Promise<ChecklistValidationRule[]> {
    return await db
      .select()
      .from(checklistValidationRules)
      .where(eq(checklistValidationRules.vehicleTypeId, vehicleTypeId));
  }

  async createChecklistValidationRule(rule: InsertChecklistValidationRule): Promise<ChecklistValidationRule> {
    const [newRule] = await db.insert(checklistValidationRules).values(rule).returning();
    return newRule;
  }

  async updateChecklistValidationRule(id: number, updates: Partial<ChecklistValidationRule>): Promise<ChecklistValidationRule | undefined> {
    const [updatedRule] = await db
      .update(checklistValidationRules)
      .set(updates)
      .where(eq(checklistValidationRules.id, id))
      .returning();
    return updatedRule || undefined;
  }

  async getPublicVehicleHistory(params: { documentNumber?: string; plate?: string }): Promise<any[]> {
    const query = db
      .select({
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        createdAt: serviceOrders.createdAt,
        completionDate: serviceOrders.completionDate,
        vehicle: {
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model,
        }
      })
      .from(serviceOrders)
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id));

    const conditions = [];

    if (params.documentNumber) {
      conditions.push(eq(clients.documentNumber, params.documentNumber));
    }

    if (params.plate) {
      conditions.push(eq(vehicles.plate, params.plate));
    }

    if (conditions.length > 0) {
      query.where(or(...conditions));
    }

    query.orderBy(desc(serviceOrders.createdAt));

    return await query;
  }

  // Nuevos métodos para operarios con restricciones de permisos
  async getAvailableOrdersForOperator(operatorId: number): Promise<ServiceOrder[]> {
    // Solo órdenes que no están asignadas a ningún operario
    return await db
      .select({
        id: serviceOrders.id,
        clientId: serviceOrders.clientId,
        vehicleId: serviceOrders.vehicleId,
        operatorId: serviceOrders.operatorId,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCost: serviceOrders.estimatedCost,
        finalCost: serviceOrders.finalCost,
        startDate: serviceOrders.startDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
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
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .where(and(
        isNull(serviceOrders.operatorId),
        eq(serviceOrders.status, 'pending')
      ))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async getOperatorAssignedOrders(operatorId: number): Promise<ServiceOrder[]> {
    // Órdenes asignadas por admin o tomadas por el operario
    return await db
      .select({
        id: serviceOrders.id,
        clientId: serviceOrders.clientId,
        vehicleId: serviceOrders.vehicleId,
        operatorId: serviceOrders.operatorId,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCost: serviceOrders.estimatedCost,
        finalCost: serviceOrders.finalCost,
        startDate: serviceOrders.startDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        client: {
          id: clients.id,
          firstName: clients.firstName,
          lastName: clients.lastName,
          documentNumber: clients.documentNumber,
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
      .leftJoin(clients, eq(serviceOrders.clientId, clients.id))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .where(eq(serviceOrders.operatorId, operatorId))
      .orderBy(desc(serviceOrders.createdAt));
  }

  async canOperatorAccessVehicleHistory(operatorId: number, vehicleId: number): Promise<boolean> {
    // Verificar si el operario tiene alguna orden asignada o tomada para este vehículo
    const [order] = await db
      .select()
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.operatorId, operatorId),
        eq(serviceOrders.vehicleId, vehicleId)
      ))
      .limit(1);

    return !!order;
  }

  async getVehicleHistoryForOperator(operatorId: number, vehicleId: number): Promise<any[]> {
    // Solo si el operario tiene acceso al vehículo
    const hasAccess = await this.canOperatorAccessVehicleHistory(operatorId, vehicleId);
    if (!hasAccess) {
      throw new Error("No tienes permisos para ver el historial de este vehículo");
    }

    // Obtener historial del vehículo (órdenes de servicio)
    return await db
      .select({
        id: serviceOrders.id,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCost: serviceOrders.estimatedCost,
        finalCost: serviceOrders.finalCost,
        startDate: serviceOrders.startDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        operator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(serviceOrders)
      .leftJoin(users, eq(serviceOrders.operatorId, users.id))
      .where(eq(serviceOrders.vehicleId, vehicleId))
      .orderBy(desc(serviceOrders.createdAt));
  }
}

export const storage = new DatabaseStorage();
