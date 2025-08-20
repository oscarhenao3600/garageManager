import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and roles
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
  firstLogin: boolean("first_login").notNull().default(true), // Nuevo campo para primera sesión
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Company Settings table
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nit: text("nit").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  logo: text("logo"), // URL or path to the logo file
  invoiceFooter: text("invoice_footer"),
  invoiceNotes: text("invoice_notes"),
  bankInfo: jsonb("bank_info"), // JSON with bank account details
  electronicInvoiceSettings: jsonb("electronic_invoice_settings"), // JSON with electronic invoice settings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  documentNumber: text("document_number").notNull().unique(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  vin: text("vin"),
  engineNumber: text("engine_number"),
  vehicleType: text("vehicle_type").notNull().default("sedan"), // nuevo campo
  soatExpiry: timestamp("soat_expiry"),
  technicalInspectionExpiry: timestamp("technical_inspection_expiry"),
  mileage: integer("mileage"), // <-- NUEVO CAMPO
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Vehicle Types table
export const vehicleTypes = pgTable("vehicle_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // moto, sedan, hatchback, camioneta, etc.
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Checklist Items table
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  vehicleTypeId: integer("vehicle_type_id").notNull().references(() => vehicleTypes.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // motor, frenos, electricidad, etc.
  isRequired: boolean("is_required").notNull().default(true),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service Order Checklist table
export const serviceOrderChecklist = pgTable("service_order_checklist", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
  checklistItemId: integer("checklist_item_id").notNull().references(() => checklistItems.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  notes: text("notes"),
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service Order Status History table
export const serviceOrderStatusHistory = pgTable("service_order_status_history", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  notes: text("notes"), // Notas sobre el cambio
  operatorAction: text("operator_action"), // take, release, complete, etc.
});

// System Audit Log table
export const systemAuditLog = pgTable("system_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, logout, password_change, data_access, etc.
  resource: text("resource"), // users, service_orders, vehicles, etc.
  resourceId: integer("resource_id"), // ID del recurso afectado
  details: text("details"), // Detalles adicionales de la acción
  ipAddress: text("ip_address"), // Dirección IP del usuario
  userAgent: text("user_agent"), // Navegador/dispositivo
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  severity: text("severity").notNull().default("info"), // info, warning, error, critical
});

// User Activity Log table
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: text("session_id"), // ID de sesión
  action: text("action").notNull(), // page_view, api_call, data_export, etc.
  page: text("page"), // Página o endpoint accedido
  duration: integer("duration"), // Duración de la sesión en segundos
  dataAccessed: text("data_accessed"), // Datos accedidos
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  success: boolean("success").notNull().default(true), // Si la acción fue exitosa
  errorMessage: text("error_message"), // Mensaje de error si falló
});

// Checklist Validation Rules table
export const checklistValidationRules = pgTable("checklist_validation_rules", {
  id: serial("id").primaryKey(),
  vehicleTypeId: integer("vehicle_type_id").notNull().references(() => vehicleTypes.id),
  ruleName: text("rule_name").notNull(), // Nombre de la regla
  ruleType: text("rule_type").notNull(), // required_before_status_change, sequential_completion, etc.
  description: text("description"), // Descripción de la regla
  conditions: text("conditions"), // Condiciones JSON para aplicar la regla
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service orders table
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  description: text("description").notNull(),
  operatorId: integer("operator_id").references(() => users.id), // Operario asignado
  takenBy: integer("taken_by").references(() => users.id), // Operario que tomó la orden
  takenAt: timestamp("taken_at"), // Cuándo fue tomada
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, billed, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  finalCost: decimal("final_cost", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  brand: text("brand"),
  unit: text("unit").notNull(), // unit, liter, kg, etc.
  currentStock: integer("current_stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  maxStock: integer("max_stock").notNull().default(100),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  supplier: text("supplier"),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service order items (parts/materials used)
export const serviceOrderItems = pgTable("service_order_items", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
  inventoryItemId: integer("inventory_item_id").notNull().references(() => inventoryItems.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service procedures table
export const serviceProcedures = pgTable("service_procedures", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
  operatorId: integer("operator_id").notNull().references(() => users.id),
  procedure: text("procedure").notNull(),
  diagnosis: text("diagnosis"),
  laborHours: decimal("labor_hours", { precision: 4, scale: 2 }),
  laborRate: decimal("labor_rate", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table - Mejorada para sistema bidireccional
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id), // Quien envía la notificación
  toUserId: integer("to_user_id").references(() => users.id), // Quien recibe (null = todos los admins)
  serviceOrderId: integer("service_order_id").references(() => serviceOrders.id), // Orden relacionada
  type: text("type").notNull(), // order_issue, order_update, order_completion, admin_response, system_alert
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  category: text("category").notNull(), // operator_to_admin, admin_to_operator, system
  requiresResponse: boolean("requires_response").notNull().default(false), // Si requiere respuesta
  responseToId: integer("response_to_id").references(() => notifications.id), // ID de la notificación a la que responde
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedOrders: many(serviceOrders),
  procedures: many(serviceProcedures),
  sentNotifications: many(notifications, { relationName: "fromUser" }),
  receivedNotifications: many(notifications, { relationName: "toUser" }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  vehicles: many(vehicles),
  serviceOrders: many(serviceOrders),
  notifications: many(notifications),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(clients, {
    fields: [vehicles.clientId],
    references: [clients.id],
  }),
  vehicleType: one(vehicleTypes, {
    fields: [vehicles.vehicleType],
    references: [vehicleTypes.name],
  }),
  serviceOrders: many(serviceOrders),
}));

export const vehicleTypesRelations = relations(vehicleTypes, ({ many }) => ({
  vehicles: many(vehicles),
  checklistItems: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  vehicleType: one(vehicleTypes, {
    fields: [checklistItems.vehicleTypeId],
    references: [vehicleTypes.id],
  }),
  serviceOrderChecklist: many(serviceOrderChecklist),
}));

export const serviceOrderChecklistRelations = relations(serviceOrderChecklist, ({ one }) => ({
  serviceOrder: one(serviceOrders, {
    fields: [serviceOrderChecklist.serviceOrderId],
    references: [serviceOrders.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [serviceOrderChecklist.checklistItemId],
    references: [checklistItems.id],
  }),
  completedBy: one(users, {
    fields: [serviceOrderChecklist.completedBy],
    references: [users.id],
  }),
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
  procedures: many(serviceProcedures),
  invoices: many(invoices),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  orderItems: many(serviceOrderItems),
}));

export const serviceOrderItemsRelations = relations(serviceOrderItems, ({ one }) => ({
  serviceOrder: one(serviceOrders, {
    fields: [serviceOrderItems.serviceOrderId],
    references: [serviceOrders.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [serviceOrderItems.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

export const serviceProceduresRelations = relations(serviceProcedures, ({ one }) => ({
  serviceOrder: one(serviceOrders, {
    fields: [serviceProcedures.serviceOrderId],
    references: [serviceOrders.id],
  }),
  operator: one(users, {
    fields: [serviceProcedures.operatorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [notifications.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
  serviceOrder: one(serviceOrders, {
    fields: [notifications.serviceOrderId],
    references: [serviceOrders.id],
  }),
  responses: many(notifications, { relationName: "responseTo" }),
  responseTo: one(notifications, {
    fields: [notifications.responseToId],
    references: [notifications.id],
    relationName: "responseTo",
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  serviceOrder: one(serviceOrders, {
    fields: [invoices.serviceOrderId],
    references: [serviceOrders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleSchema = z.object({
  clientId: z.number().min(1, "Debe seleccionar un cliente"),
  plate: z.string().min(1, "La placa es obligatoria"),
  brand: z.string().min(1, "La marca es obligatoria"),
  model: z.string().min(1, "El modelo es obligatorio"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  vehicleType: z.string().min(1, "El tipo de vehículo es obligatorio"),
  color: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  engineNumber: z.string().nullable().optional(),
  soatExpiry: z.string().nullable().optional(),
  technicalInspectionExpiry: z.string().nullable().optional(),
  mileage: z.number().int().min(0, "El kilometraje debe ser un número positivo").nullable().optional(), // <-- NUEVO CAMPO
  isActive: z.boolean().default(true),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({
  id: true,
  createdAt: true,
  orderNumber: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

export const insertServiceOrderItemSchema = createInsertSchema(serviceOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertServiceProcedureSchema = createInsertSchema(serviceProcedures).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleTypeSchema = createInsertSchema(vehicleTypes).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
  createdAt: true,
});

export const insertServiceOrderChecklistSchema = createInsertSchema(serviceOrderChecklist).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// Tipo para vehículos con fechas como Date (para la base de datos)
export type VehicleWithDateFields = Omit<InsertVehicle, 'soatExpiry' | 'technicalInspectionExpiry'> & {
  soatExpiry: Date | null;
  technicalInspectionExpiry: Date | null;
};
export type ServiceOrder = typeof serviceOrders.$inferSelect & {
  client?: User;
  vehicle?: Vehicle;
  operator?: User;
  takenByUser?: User;
  checklist?: ServiceOrderChecklist[];
  statusHistory?: ServiceOrderStatusHistory[];
};
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type ServiceOrderItem = typeof serviceOrderItems.$inferSelect;
export type InsertServiceOrderItem = z.infer<typeof insertServiceOrderItemSchema>;
export type ServiceProcedure = typeof serviceProcedures.$inferSelect;
export type InsertServiceProcedure = z.infer<typeof insertServiceProcedureSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// Nuevos tipos
export type VehicleType = typeof vehicleTypes.$inferSelect;
export type InsertVehicleType = z.infer<typeof insertVehicleTypeSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ServiceOrderChecklist = typeof serviceOrderChecklist.$inferSelect;
export type InsertServiceOrderChecklist = z.infer<typeof insertServiceOrderChecklistSchema>;

// Types for the new entities
export type ServiceOrderStatusHistory = typeof serviceOrderStatusHistory.$inferSelect;
export type InsertServiceOrderStatusHistory = typeof serviceOrderStatusHistory.$inferInsert;

// Audit and Validation types
export type SystemAuditLog = typeof systemAuditLog.$inferSelect;
export type InsertSystemAuditLog = typeof systemAuditLog.$inferInsert;
export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLog.$inferInsert;
export type ChecklistValidationRule = typeof checklistValidationRules.$inferSelect;
export type InsertChecklistValidationRule = typeof checklistValidationRules.$inferInsert;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Notification with relations
export interface NotificationWithRelations extends Notification {
  fromUser?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  toUser?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
  };
  serviceOrder?: {
    id: number;
    orderNumber: string;
    description: string;
    status: string;
  };
  responses?: NotificationWithRelations[];
  responseTo?: NotificationWithRelations;
}
