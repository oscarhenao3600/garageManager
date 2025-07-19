import { 
  users, clients, vehicles, serviceOrders, inventoryItems, serviceOrderItems, 
  serviceProcedures, notifications, invoices,
  type User, type InsertUser, type Client, type InsertClient, 
  type Vehicle, type InsertVehicle, type ServiceOrder, type InsertServiceOrder,
  type InventoryItem, type InsertInventoryItem, type ServiceOrderItem, type InsertServiceOrderItem,
  type ServiceProcedure, type InsertServiceProcedure, type Notification, type InsertNotification,
  type Invoice, type InsertInvoice
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, and, count, desc, asc, lte, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Company Settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getWorkers(): Promise<User[]>;

  // Dashboard
  getDashboardStats(): Promise<any>;

  // Service Orders
  getServiceOrders(params: { status?: string; limit?: number }): Promise<ServiceOrder[]>;
  getServiceOrderById(id: number): Promise<ServiceOrder | undefined>;
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

  // Clients
  getClients(params: { search?: string; limit?: number }): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  getVehiclesByClientId(clientId: number): Promise<Vehicle[]>;

  // Vehicles
  getVehicles(params: { search?: string; limit?: number }): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  searchVehicles(query: string): Promise<any[]>;

  // Inventory
  getInventoryItems(params: { category?: string; lowStock?: boolean; limit?: number }): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;

  // Notifications
  getNotifications(params: { userId?: number; unreadOnly?: boolean; limit?: number }): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Invoices
  getInvoices(params: { status?: string; limit?: number; fromDate?: Date; toDate?: Date }): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoiceCount(): Promise<number>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string, paidDate?: Date): Promise<Invoice | undefined>;

  // Invoices
  getInvoices(params: { status?: string; limit?: number }): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  // Public methods
  getPublicVehicleHistory(params: { documentNumber?: string; plate?: string }): Promise<any[]>;
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

  async getServiceOrders(params: { status?: string; limit?: number }): Promise<ServiceOrder[]> {
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

    if (params.status) {
      query.where(eq(serviceOrders.status, params.status));
    }

    query.orderBy(desc(serviceOrders.createdAt));

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query;
  }

  async getServiceOrderById(id: number): Promise<ServiceOrder | undefined> {
    const [order] = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
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

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification || undefined;
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
}

export const storage = new DatabaseStorage();
