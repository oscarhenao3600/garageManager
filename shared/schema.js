import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
// Users table for authentication and roles (solo para autenticación)
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull().default("user"), // superAdmin, admin, operator, user, guest
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    documentNumber: text("document_number").unique(),
    isActive: boolean("is_active").notNull().default(true),
    firstLogin: boolean("first_login").notNull().default(true), // Para primera sesión
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Clients table - Restaurada como tabla separada
export const clients = pgTable("clients", {
    id: serial("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    documentNumber: text("document_number").unique(),
    address: text("address"),
    city: text("city"),
    department: text("department"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Company Settings table - Estructura real de la base de datos
export const companySettings = pgTable("company_settings", {
    id: serial("id").primaryKey(),
    name: text("name"),
    nit: text("nit"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    logo: text("logo"),
    banner: text("banner"),
    favicon: text("favicon"),
    bankInfo: jsonb("bank_info"),
    electronicInvoiceSettings: jsonb("electronic_invoice_settings"),
    invoiceFooter: text("invoice_footer"),
    invoiceNotes: text("invoice_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Vehicles table - Restaurada para usar clients.id
export const vehicles = pgTable("vehicles", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id), // Restaurada referencia a clients.id
    plate: text("plate").notNull().unique(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    year: integer("year").notNull(),
    color: text("color"),
    vin: text("vin"),
    engineNumber: text("engine_number"),
    vehicleType: text("vehicle_type").notNull().default("sedan"),
    soatExpiry: timestamp("soat_expiry"),
    technicalInspectionExpiry: timestamp("technical_inspection_expiry"),
    mileage: integer("mileage"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Vehicle Types table
export const vehicleTypes = pgTable("vehicle_types", {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(), // moto, sedan, hatchback, camioneta, etc.
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Checklist Items table
export const checklistItems = pgTable("checklist_items", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // pre-service, post-service, safety, quality
    estimatedTime: integer("estimated_time"), // in minutes
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Service Orders table
export const serviceOrders = pgTable("service_orders", {
    id: serial("id").primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    clientId: integer("client_id").notNull().references(() => clients.id),
    vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
    operatorId: integer("operator_id").references(() => users.id),
    description: text("description").notNull(),
    status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
    priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
    estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
    finalCost: decimal("final_cost", { precision: 10, scale: 2 }),
    estimatedTime: integer("estimated_time"), // en minutos
    actualTime: integer("actual_time"), // en minutos
    startDate: timestamp("start_date"),
    completionDate: timestamp("completion_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    takenBy: integer("taken_by").references(() => users.id),
    takenAt: timestamp("taken_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Service Order Items table
export const serviceOrderItems = pgTable("service_order_items", {
    id: serial("id").primaryKey(),
    serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
    itemType: text("item_type").notNull(), // service, part, material
    itemId: integer("item_id"), // reference to service_procedures.id, inventory_items.id, etc.
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Service Procedures table
export const serviceProcedures = pgTable("service_procedures", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    estimatedTime: integer("estimated_time"), // in minutes
    estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
    category: text("category"), // mantenimiento, reparacion, diagnostico, etc.
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Inventory Items table - Estructura real de la base de datos
export const inventoryItems = pgTable("inventory_items", {
    id: serial("id").primaryKey(),
    code: text("code"),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // parts, materials, tools, consumables
    brand: text("brand"),
    unit: text("unit"), // piece, liter, meter, etc.
    currentStock: integer("current_stock").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    maxStock: integer("max_stock"),
    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
    supplier: text("supplier"),
    location: text("location"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Notifications table - Estructura real de la base de datos
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(), // info, warning, error, success
    category: text("category"), // system, order, vehicle, payment, etc.
    priority: text("priority"), // low, normal, high, urgent
    fromUserId: integer("from_user_id").references(() => users.id),
    toUserId: integer("to_user_id").references(() => users.id),
    serviceOrderId: integer("service_order_id").references(() => serviceOrders.id),
    status: text("status"), // unread, read, archived
    isRead: boolean("is_read").notNull().default(false),
    requiresResponse: boolean("requires_response").default(false),
    responseToId: integer("response_to_id").references(() => notifications.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Invoices table
export const invoices = pgTable("invoices", {
    id: serial("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
    clientId: integer("client_id").notNull().references(() => clients.id),
    vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }), // alias for total
    status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled
    dueDate: timestamp("due_date"),
    paidDate: timestamp("paid_date"),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Service Order Checklist table
export const serviceOrderChecklist = pgTable("service_order_checklist", {
    id: serial("id").primaryKey(),
    serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
    checklistItemId: integer("checklist_item_id").notNull().references(() => checklistItems.id),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedBy: integer("completed_by").references(() => users.id),
    completedAt: timestamp("completed_at"),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Service Order Status History table
export const serviceOrderStatusHistory = pgTable("service_order_status_history", {
    id: serial("id").primaryKey(),
    serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
    previousStatus: text("previous_status").notNull(), // oldStatus renamed to previousStatus
    newStatus: text("new_status").notNull(),
    changedBy: integer("changed_by").notNull().references(() => users.id),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
    timestamp: timestamp("timestamp"), // alias for changedAt
    reason: text("reason"),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// System Audit Log table
export const systemAuditLog = pgTable("system_audit_log", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    action: text("action").notNull(), // login, logout, create, update, delete, etc.
    tableName: text("table_name"), // name of the table affected
    recordId: integer("record_id"), // ID of the record affected
    oldValues: jsonb("old_values"), // previous values
    newValues: jsonb("new_values"), // new values
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// User Activity Log table
export const userActivityLog = pgTable("user_activity_log", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    activity: text("activity").notNull(), // page_view, action_performed, etc.
    details: jsonb("details"), // additional information about the activity
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Checklist Validation Rules table
export const checklistValidationRules = pgTable("checklist_validation_rules", {
    id: serial("id").primaryKey(),
    checklistItemId: integer("checklist_item_id").notNull().references(() => checklistItems.id),
    ruleType: text("rule_type").notNull(), // required, conditional, optional
    condition: text("condition"), // condition that must be met
    message: text("message"), // error message if validation fails
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Relations
export const usersRelations = relations(users, ({ many }) => ({
    vehicles: many(vehicles),
    serviceOrders: many(serviceOrders),
    notifications: many(notifications),
    auditLogs: many(systemAuditLog),
    activityLogs: many(userActivityLog),
}));
export const clientsRelations = relations(clients, ({ many }) => ({
    vehicles: many(vehicles),
    serviceOrders: many(serviceOrders),
}));
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
    client: one(clients, {
        fields: [vehicles.clientId],
        references: [clients.id],
    }),
    serviceOrders: many(serviceOrders),
}));
export const serviceOrdersRelations = relations(serviceOrders, ({ one, many }) => ({
    client: one(clients, {
        fields: [serviceOrders.clientId],
        references: [clients.id],
    }),
    vehicle: one(vehicles, {
        fields: [serviceOrders.vehicleId],
        references: [vehicles.id],
    }),
    operator: one(users, {
        fields: [serviceOrders.operatorId],
        references: [users.id],
    }),
    items: many(serviceOrderItems),
    checklist: many(serviceOrderChecklist),
    statusHistory: many(serviceOrderStatusHistory),
    invoices: many(invoices),
}));
export const notificationsRelations = relations(notifications, ({ one }) => ({
// Solo incluir relaciones para campos que existen y son obligatorios
}));
// Insert schemas
export const insertUserSchema = createInsertSchema(users);
// Client insert schema (using users table)
export const insertClientSchema = createInsertSchema(clients);
// Vehicle insert schema
export const insertVehicleSchema = createInsertSchema(vehicles);
// Service Order insert schema
export const insertServiceOrderSchema = createInsertSchema(serviceOrders);
// Inventory Item insert schema
export const insertInventoryItemSchema = createInsertSchema(inventoryItems);
// Service Order Item insert schema
export const insertServiceOrderItemSchema = createInsertSchema(serviceOrderItems);
// Service Procedure insert schema
export const insertServiceProcedureSchema = createInsertSchema(serviceProcedures);
// Notification insert schema
export const insertNotificationSchema = createInsertSchema(notifications);
// Vehicle Type insert schema
export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes);
// Checklist Item insert schema
export const insertChecklistItemSchema = createInsertSchema(checklistItems);
// Service Order Checklist insert schema
export const insertServiceOrderChecklistSchema = createInsertSchema(serviceOrderChecklist);
// Invoice insert schema
export const insertInvoiceSchema = createInsertSchema(invoices);
// Service Order Status History insert schema
export const insertServiceOrderStatusHistorySchema = createInsertSchema(serviceOrderStatusHistory);
// System Audit Log insert schema
export const insertSystemAuditLogSchema = createInsertSchema(systemAuditLog);
// User Activity Log insert schema
export const insertUserActivityLogSchema = createInsertSchema(userActivityLog);
// Checklist Validation Rule insert schema
export const insertChecklistValidationRuleSchema = createInsertSchema(checklistValidationRules);
// Company Setting insert schema
export const insertCompanySettingSchema = createInsertSchema(companySettings);
