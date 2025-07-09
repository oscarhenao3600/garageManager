CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"document_number" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"address" text,
	"city" text,
	"department" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"brand" text,
	"unit" text NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"max_stock" integer DEFAULT 100 NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"supplier" text,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_order_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"client_id" integer,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_order_id" integer NOT NULL,
	"inventory_item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"operator_id" integer,
	"order_number" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"estimated_cost" numeric(10, 2),
	"final_cost" numeric(10, 2),
	"start_date" timestamp,
	"completion_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "service_procedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_order_id" integer NOT NULL,
	"operator_id" integer NOT NULL,
	"procedure" text NOT NULL,
	"diagnosis" text,
	"labor_hours" numeric(4, 2),
	"labor_rate" numeric(10, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"document_number" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"plate" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"color" text,
	"vin" text,
	"engine_number" text,
	"soat_expiry" timestamp,
	"technical_inspection_expiry" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_order_items" ADD CONSTRAINT "service_order_items_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_procedures" ADD CONSTRAINT "service_procedures_service_order_id_service_orders_id_fk" FOREIGN KEY ("service_order_id") REFERENCES "public"."service_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_procedures" ADD CONSTRAINT "service_procedures_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;