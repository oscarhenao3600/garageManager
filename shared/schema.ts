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
  role: text("role").notNull().default("user"), // admin, operator, user, guest
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  documentNumber: text("document_number").unique(),
  isActive: boolean("is_active").notNull().default(true),
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
  soatExpiry: timestamp("soat_expiry"),
  technicalInspectionExpiry: timestamp("technical_inspection_expiry"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Service orders table
export const serviceOrders = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  operatorId: integer("operator_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, billed, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  finalCost: decimal("final_cost", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  type: text("type").notNull(), // soat_expiry, technical_inspection, low_stock, order_update
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  priority: text("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  notifications: many(notifications),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [notifications.clientId],
    references: [clients.id],
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

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({
  id: true,
  createdAt: true,
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
export type ServiceOrder = typeof serviceOrders.$inferSelect;
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
