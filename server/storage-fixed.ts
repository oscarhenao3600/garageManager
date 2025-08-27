import { 
  users, vehicles, serviceOrders, serviceOrderStatusHistory, inventoryItems, serviceOrderItems, 
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

  // Clients - Ahora consolidados en users
  getClients(params: { search?: string; limit?: number }): Promise<User[]>;
  createClient(client: InsertUser): Promise<User>;
  getVehiclesByClientId(clientId: number): Promise<Vehicle[]>;
  updateClient(id: number, updates: Partial<typeof users.$inferInsert>): Promise<User | undefined>;

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
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
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
    const [userCount] = await db.select({ count: count() }).from(users);
    const [vehicleCount] = await db.select({ count: count() }).from(vehicles);
    const [orderCount] = await db.select({ count: count() }).from(serviceOrders);
    const [invoiceCount] = await db.select({ count: count() }).from(invoices);

    return {
      totalUsers: userCount.count,
      totalVehicles: vehicleCount.count,
      totalOrders: orderCount.count,
      totalInvoices: invoiceCount.count
    };
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

    const query = db
      .select({
        id: serviceOrders.id,
        orderNumber: serviceOrders.orderNumber,
        description: serviceOrders.description,
        status: serviceOrders.status,
        priority: serviceOrders.priority,
        estimatedCompletionDate: serviceOrders.estimatedCompletionDate,
        completionDate: serviceOrders.completionDate,
        createdAt: serviceOrders.createdAt,
        client: {
          id: sql`client.id`,
          firstName: sql`client.first_name`,
          lastName: sql`client.last_name`,
          documentNumber: sql`client.document_number`,
        },
        vehicle: {
          id: vehicles.id,
          plate: vehicles.plate,
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
        },
        operator: {
          id: sql`operator.id`,
          firstName: sql`operator.first_name`,
          lastName: sql`operator.last_name`,
        }
      })
      .from(serviceOrders)
      .leftJoin(users.as('client'), eq(serviceOrders.clientId, sql`client.id`))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
      .leftJoin(users.as('operator'), eq(serviceOrders.operatorId, sql`operator.id`));

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
        query.where(
          or(
            eq(serviceOrders.clientId, params.userId),
            sql`${serviceOrders.vehicleId} IN (${sql.join(vehicleIds.map(id => sql`${id}`), sql`, `)})`
          )
        );
      } else {
        // Si el cliente no tiene vehículos, solo puede ver órdenes donde es el cliente
        query.where(eq(serviceOrders.clientId, params.userId));
      }
    } else if (params.userRole === 'operator' && params.userId) {
      // Los operarios solo pueden ver órdenes asignadas a ellos
      query.where(eq(serviceOrders.operatorId, params.userId));
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
    return result;
  }

  async debugClientOrders(clientId: number): Promise<any> {
    // Verificar si el cliente existe
    const [client] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, clientId), eq(users.role, 'client')));
    
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
    const [newOrder] = await db.insert(serviceOrders).values(order).returning();
    return newOrder;
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
    const [result] = await db.select({ count: count() }).from(serviceOrders);
    return result.count;
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
      oldStatus: history.oldStatus,
      newStatus: history.newStatus,
      comment: history.comment,
      userId: history.userId,
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

  // Clientes - Ahora consolidados en users
  async getClients(params: { search?: string; limit?: number }): Promise<User[]> {
    const query = db.select().from(users).where(eq(users.role, 'client'));

    if (params.search) {
      query.where(
        or(
          like(users.firstName, `%${params.search}%`),
          like(users.lastName, `%${params.search}%`),
          like(users.documentNumber, `%${params.search}%`),
          like(users.phone, `%${params.search}%`)
        )
      );
    }

    query.orderBy(asc(users.firstName));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async createClient(client: InsertUser): Promise<User> {
    // Asegurar que el rol sea 'client'
    const clientData = { ...client, role: 'client' };
    const [newClient] = await db.insert(users).values(clientData).returning();
    return newClient;
  }

  async updateClient(id: number, updates: Partial<typeof users.$inferInsert>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(and(eq(users.id, id), eq(users.role, 'client')))
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
    const query = db
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
        soatExpiry: vehicles.soatExpiry,
        technicalInspectionExpiry: vehicles.technicalInspectionExpiry,
        mileage: vehicles.mileage,
        isActive: vehicles.isActive,
        createdAt: vehicles.createdAt,
        client: {
          id: sql`client.id`,
          firstName: sql`client.first_name`,
          lastName: sql`client.last_name`,
          documentNumber: sql`client.document_number`,
        }
      })
      .from(vehicles)
      .leftJoin(users.as('client'), eq(vehicles.clientId, sql`client.id`));

    if (params.search) {
      query.where(
        or(
          like(vehicles.plate, `%${params.search}%`),
          like(users.documentNumber, `%${params.search}%`)
        )
      );
    }

    query.orderBy(asc(vehicles.brand));

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
        color: vehicles.color,
        mileage: vehicles.mileage,
        client: {
          firstName: sql`client.first_name`,
          lastName: sql`client.last_name`,
          documentNumber: sql`client.document_number`,
        }
      })
      .from(vehicles)
      .leftJoin(users.as('client'), eq(vehicles.clientId, sql`client.id`))
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
    const query = db.select().from(inventoryItems);

    if (params.category) {
      query.where(eq(inventoryItems.category, params.category));
    }

    if (params.lowStock) {
      query.where(lte(inventoryItems.quantity, inventoryItems.minStockLevel));
    }

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
    const [updated] = await db
      .update(inventoryItems)
      .set(updates)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated || undefined;
  }

  // Notifications
  async getNotifications(params: { userId?: number; unreadOnly?: boolean; limit?: number }): Promise<Notification[]> {
    const query = db.select().from(notifications);

    if (params.userId) {
      query.where(eq(notifications.toUserId, params.userId));
    }

    if (params.unreadOnly) {
      query.where(eq(notifications.isRead, false));
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
    const query = db
      .select()
      .from(notifications)
      .where(eq(notifications.toUserId, userId));

    if (category) {
      query.where(eq(notifications.category, category));
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async getNotificationsFromUser(userId: number, category?: string): Promise<any[]> {
    const query = db
      .select()
      .from(notifications)
      .where(eq(notifications.fromUserId, userId));

    if (category) {
      query.where(eq(notifications.category, category));
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async getNotificationsForAdmins(category?: string): Promise<any[]> {
    const query = db
      .select()
      .from(notifications)
      .where(eq(notifications.toRole, 'admin'));

    if (category) {
      query.where(eq(notifications.category, category));
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async getNotificationResponses(notificationId: number): Promise<any[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.responseToId, notificationId))
      .orderBy(asc(notifications.createdAt));
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  // Invoices
  async getInvoices(params: { status?: string; limit?: number; fromDate?: Date; toDate?: Date }): Promise<Invoice[]> {
    const query = db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        createdAt: invoices.createdAt,
        serviceOrder: {
          orderNumber: serviceOrders.orderNumber,
          client: {
            firstName: sql`client.first_name`,
            lastName: sql`client.last_name`,
            documentNumber: sql`client.document_number`,
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
      .leftJoin(users.as('client'), eq(serviceOrders.clientId, sql`client.id`))
      .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id));

    if (params.status) {
      query.where(eq(invoices.status, params.status));
    }

    if (params.fromDate) {
      query.where(gte(invoices.createdAt, params.fromDate));
    }

    if (params.toDate) {
      query.where(lte(invoices.createdAt, params.toDate));
    }

    query.orderBy(desc(invoices.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
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
    return await db
      .select()
      .from(vehicleTypes)
      .where(eq(vehicleTypes.isActive, true))
      .orderBy(asc(vehicleTypes.name));
  }

  async createVehicleType(vehicleType: InsertVehicleType): Promise<VehicleType> {
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
}

export const dbStorage = new DatabaseStorage();
