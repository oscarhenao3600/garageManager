import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and roles (consolidada con clientes)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // superAdmin, admin, operator, client, user, guest
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  documentNumber: text("document_number").unique(),
  // Campos adicionales para clientes (consolidados desde tabla clients)
  address: text("address"),
  city: text("city"),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  firstLogin: boolean("first_login").notNull().default(true), // Para primera sesión
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

// Vehicles table - Actualizada para usar users.id en lugar de clients.id
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => users.id), // Ahora referencia users.id
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

// Service Orders table
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => users.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  operatorId: integer("operator_id").references(() => users.id),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  finalCost: decimal("final_cost", { precision: 10, scale: 2 }),
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
  inventoryItemId: integer("inventory_item_id").references(() => checklistItems.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service Procedures table
export const serviceProcedures = pgTable("service_procedures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // mantenimiento, reparación, diagnóstico, etc.
  estimatedTime: integer("estimated_time"), // en minutos
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Inventory Items table
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  unit: text("unit").notNull(), // pieza, litro, metro, etc.
  currentStock: integer("current_stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  maxStock: integer("max_stock"),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table - Corregido para evitar referencias circulares
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // low_stock, order_status, system_alert, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  serviceOrderId: integer("service_order_id").references(() => serviceOrders.id),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  responseToId: integer("response_to_id"), // ID de la notificación a la que responde
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrders.id),
  clientId: integer("client_id").notNull().references(() => users.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
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
  status: text("status").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System Audit Log table
export const systemAuditLog = pgTable("system_audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  tableName: text("table_name"),
  recordId: integer("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Activity Log table
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activity: text("activity").notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Checklist Validation Rules table
export const checklistValidationRules = pgTable("checklist_validation_rules", {
  id: serial("id").primaryKey(),
  checklistItemId: integer("checklist_item_id").notNull().references(() => checklistItems.id),
  ruleType: text("rule_type").notNull(), // required, conditional, etc.
  ruleCondition: jsonb("rule_condition"),
  errorMessage: text("error_message"),
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

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(users, {
    fields: [vehicles.clientId],
    references: [users.id],
  }),
  serviceOrders: many(serviceOrders),
}));

export const serviceOrdersRelations = relations(serviceOrders, ({ one, many }) => ({
  client: one(users, {
    fields: [serviceOrders.clientId],
    references: [users.id],
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
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [notifications.toUserId],
    references: [users.id],
  }),
  serviceOrder: one(serviceOrders, {
    fields: [notifications.serviceOrderId],
    references: [serviceOrders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(users).omit({ // Changed from clients to users
  id: true,
  createdAt: true,
  username: true, // Los clientes no necesitan username
  password: true, // Los clientes no necesitan password
  role: true,     // El rol se asigna automáticamente en el servidor
});

// Esquema específico para crear clientes desde el modal de admin
export const insertClientFromAdminSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  documentNumber: z.string().min(1, "El número de documento es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
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
  mileage: z.number().int().min(0, "El kilometraje debe ser un número positivo").nullable().optional(),
  isActive: z.boolean().default(true),
});

export const insertServiceOrderSchema = z.object({
  clientId: z.number(),
  vehicleId: z.number(),
  operatorId: z.number().optional(),
  description: z.string(),
  status: z.string().default("pending"),
  priority: z.string().default("normal"),
  estimatedCost: z.number().optional(),
  finalCost: z.number().optional(),
  startDate: z.date().optional(),
  completionDate: z.date().optional(),
  takenBy: z.number().optional(),
  takenAt: z.date().optional(),
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
export type Client = typeof users.$inferSelect; // Changed from clients to users
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

// Notification types (eliminando duplicados)
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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
