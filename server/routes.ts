import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { dbStorage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertClientSchema, insertVehicleSchema, insertServiceOrderSchema, insertInventoryItemSchema, insertNotificationSchema, insertVehicleTypeSchema, insertChecklistItemSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { generateInvoicePDF } from "./utils/pdfGenerator";
import { sendInvoiceEmail } from "./utils/emailSender";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { requirePasswordChange, requireCompletedFirstLogin } from "./middleware/firstLoginMiddleware";
import { authenticateToken, isAdmin, isSuperAdmin, isOperatorOrHigher, canAccessResource, type AuthenticatedRequest } from "./middleware/authMiddleware";
import reportsRouter from "./routes/reports";
import imagesRouter from "./routes/images";
import exportRouter from "./routes/export";

// La interfaz AuthenticatedRequest ahora se importa desde authMiddleware

interface InvoiceItem {
  quantity: number;
  price: number;
  description: string;
}

interface InvoiceWithItems {
  id: number;
  createdAt: Date;
  status: string;
  serviceOrderId: number;
  invoiceNumber: string;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  dueDate: Date;
  paidDate: Date | null;
  items: InvoiceItem[];
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Definir __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten archivos de imagen (jpg, jpeg, png)"));
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// El middleware de autenticación ahora se importa desde authMiddleware

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  
  // Register report routes
  app.use("/api/reports", reportsRouter);
  
  // Register image management routes
  app.use("/api/images", imagesRouter);
  
  // Register export routes
  app.use("/api/export", exportRouter);
  
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await dbStorage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false,
          message: "Se requieren todos los campos: usuario, email y contraseña" 
        });
      }

      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ 
            success: false,
            message: "Formato de email inválido" 
          });
        }

        if (password.length < 6) {
          return res.status(400).json({ 
            success: false,
            message: "La contraseña debe tener al menos 6 caracteres" 
          });
        }

        const existingUser = await dbStorage.getUserByUsername(username);
        if (existingUser) {
          return res.status(409).json({ 
            success: false,
            message: "El nombre de usuario ya está registrado" 
          });
        }

        const existingEmail = await dbStorage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ 
            success: false,
            message: "El email ya está registrado" 
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
          username,
          email,
          password: hashedPassword,
          role: "user",
          isActive: true,
          firstName: username,
          lastName: "Usuario",
          documentNumber: null,
          phone: null
        };

        const user = await dbStorage.createUser(userData);

        if (!user || !user.id) {
          throw new Error("Error al crear el usuario en la base de datos");
        }

        const { password: _, ...userResponse } = user;
        
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.status(201).json({
          success: true,
          message: "Usuario registrado exitosamente",
          user: userResponse,
          token
        });

      } catch (error) {
        console.error("Error específico de la base de datos:", error);
        return res.status(500).json({
          success: false,
          message: "Error al procesar el registro en la base de datos",
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      return res.status(500).json({ 
        success: false,
        message: "Error interno del servidor al registrar el usuario",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await dbStorage.getUser(authReq.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ruta para verificar si es primera sesión
  app.get("/api/auth/first-login", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await dbStorage.getUser(authReq.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        isFirstLogin: user.firstLogin,
        requiresPasswordChange: user.firstLogin 
      });
    } catch (error) {
      console.error("Check first login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ruta para cambiar contraseña en primera sesión
  app.post("/api/auth/change-password", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Se requieren la contraseña actual y la nueva contraseña" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "La nueva contraseña debe tener al menos 6 caracteres" 
        });
      }

      const user = await dbStorage.getUser(authReq.user.id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Verificar que sea primera sesión
      if (!user.firstLogin) {
        return res.status(400).json({ 
          message: "Solo se puede cambiar la contraseña en la primera sesión" 
        });
      }

      // Verificar contraseña actual (número de cédula)
      const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidCurrentPassword) {
        return res.status(401).json({ 
          message: "La contraseña actual es incorrecta" 
        });
      }

      // Encriptar nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y marcar primera sesión como completada
      await dbStorage.updateUserPassword(authReq.user.id, hashedNewPassword);
      await dbStorage.markFirstLoginCompleted(authReq.user.id);

      res.json({ 
        message: "Contraseña cambiada exitosamente. Primera sesión completada." 
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
  });

  // Ruta para crear usuario con número de cédula como contraseña inicial
  app.post("/api/auth/create-user-with-document", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo SuperAdmin puede crear usuarios con documento
      if (authReq.user.role !== "superAdmin") {
        return res.status(403).json({ 
          message: "Solo el SuperAdmin puede crear usuarios con documento" 
        });
      }

      const { username, email, firstName, lastName, role, documentNumber, phone } = req.body;

      if (!username || !email || !firstName || !lastName || !role || !documentNumber) {
        return res.status(400).json({ 
          message: "Se requieren todos los campos obligatorios" 
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: "Formato de email inválido" 
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await dbStorage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "El nombre de usuario ya está en uso" 
        });
      }

      // Verificar si el email ya existe
      const existingEmail = await dbStorage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ 
          message: "El email ya está registrado" 
        });
      }

      // Verificar si el documento ya existe
      const existingDocument = await dbStorage.getUserByDocumentNumber(documentNumber);
      if (existingDocument) {
        return res.status(409).json({ 
          message: "El número de documento ya está registrado" 
        });
      }

      // Crear usuario con número de cédula como contraseña inicial
      const userData = {
        username,
        email,
        firstName,
        lastName,
        role,
        documentNumber,
        phone: phone || null,
        isActive: true
      };

      const newUser = await dbStorage.createUserWithDocumentNumber(userData);

      // No devolver la contraseña en la respuesta
      const { password, ...userResponse } = newUser;

      res.status(201).json({
        message: "Usuario creado exitosamente. Debe cambiar la contraseña en la primera sesión.",
        user: userResponse,
        initialPassword: documentNumber // Solo para SuperAdmin
      });
    } catch (error) {
      console.error("Create user with document error:", error);
      res.status(500).json({ 
        message: "Error al crear el usuario",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { user } = authReq;

      let stats;
      
      if (user.role === 'operator') {
        // Para operarios, obtener estadísticas específicas de su trabajo
        stats = await dbStorage.getOperatorDashboardStats(user.id);
      } else if (user.role === 'user' || user.role === 'client') {
        // Para clientes, obtener estadísticas específicas de su cuenta
        stats = await dbStorage.getClientDashboardStats(user.id);
      } else {
        // Para admins, obtener estadísticas generales del sistema
        stats = await dbStorage.getDashboardStats();
      }

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Service Orders routes
    app.get("/api/service-orders", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const { status, limit = 50 } = req.query;
      const authReq = req as AuthenticatedRequest;
      
      const orders = await dbStorage.getServiceOrders({
        status: status?.toString(),
        limit: parseInt(limit.toString()),
        userId: authReq.user.id,
        userRole: authReq.user.role,
      });
      res.json(orders);
    } catch (error) {
      console.error("Get service orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint de depuración para clientes (solo para desarrollo)
  app.get("/api/debug/client/:clientId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const authReq = req as AuthenticatedRequest;
      
      // Solo permitir acceso a admins o al propio cliente
      if (authReq.user.role !== 'admin' && authReq.user.id !== clientId) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const debugInfo = await dbStorage.debugClientOrders(clientId);
      res.json(debugInfo);
    } catch (error) {
      console.error("Debug client orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/service-orders/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const authReq = req as AuthenticatedRequest;
      
      const order = await dbStorage.getServiceOrderById(orderId, authReq.user.id, authReq.user.role);
      
      if (!order) {
        return res.status(404).json({ message: "Orden de servicio no encontrada" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Get service order by id error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/service-orders/:id/history", authenticateToken, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const history = await dbStorage.getServiceOrderStatusHistory(orderId);
      res.json(history);
    } catch (error) {
      console.error("Get service order history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/service-orders", authenticateToken, async (req: Request, res: Response) => {
    try {
      const orderData = insertServiceOrderSchema.parse(req.body);
      
      const orderCount = await dbStorage.getServiceOrderCount();
      const orderNumber = `SO-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;
      
      const order = await dbStorage.createServiceOrder({
        ...orderData,
        orderNumber,
      });

      // Generar checklist automáticamente basado en el tipo de vehículo
      if (order.vehicleId) {
        try {
          const vehicle = await dbStorage.getVehicleById(order.vehicleId);
          if (vehicle && vehicle.vehicleType) {
            const vehicleType = await dbStorage.getVehicleTypeByName(vehicle.vehicleType);
            if (vehicleType) {
              const checklistItems = await dbStorage.getChecklistItemsByVehicleType(vehicleType.id);
              
              // Crear checklist para cada item
              for (const item of checklistItems) {
                await dbStorage.createServiceOrderChecklist({
                  serviceOrderId: order.id,
                  checklistItemId: item.id,
                  isCompleted: false,
                  notes: null,
                  completedBy: null,
                  completedAt: null
                });
              }
            }
          }
        } catch (checklistError) {
          console.error("Error generating checklist:", checklistError);
          // No fallar la creación de la orden si hay error en el checklist
        }
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create service order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/service-orders/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const order = await dbStorage.getServiceOrderById(parseInt(req.params.id), authReq.user.id, authReq.user.role);
      if (!order) {
        return res.status(404).json({ message: "Service order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get service order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/service-orders/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const order = await dbStorage.updateServiceOrder(parseInt(req.params.id), req.body);
      if (!order) {
        return res.status(404).json({ message: "Service order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update service order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para cambiar el estado de una orden de servicio
  app.patch("/api/service-orders/:id/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status, comment } = req.body;
      const authReq = req as AuthenticatedRequest;

      // Validar el nuevo estado
      const validStatuses = ["pending", "in_progress", "completed", "billed", "closed"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Estado inválido. Los estados válidos son: " + validStatuses.join(", ") 
        });
      }

      // Obtener la orden actual
      const currentOrder = await dbStorage.getServiceOrderById(orderId, authReq.user.id, authReq.user.role);
      if (!currentOrder) {
        return res.status(404).json({ message: "Orden de servicio no encontrada" });
      }

      // Validar la transición de estado
      const validTransitions: { [key: string]: string[] } = {
        pending: ["in_progress", "closed"],
        in_progress: ["completed", "closed"],
        completed: ["billed", "closed"],
        billed: ["closed"],
        closed: []
      };

      if (!validTransitions[currentOrder.status]?.includes(status)) {
        return res.status(400).json({ 
          message: `No se puede cambiar el estado de ${currentOrder.status} a ${status}` 
        });
      }

      // Actualizar el estado
      const updatedOrder = await dbStorage.updateServiceOrderStatus(
        orderId, 
        status, 
        status === "completed" ? new Date() : undefined
      );

      // Registrar el cambio en el historial
      await dbStorage.createStatusHistory({
        serviceOrderId: orderId,
        oldStatus: currentOrder.status,
        newStatus: status,
        comment: comment || undefined,
        userId: authReq.user.id
      });

      // Si el estado cambia a completed, crear una notificación
      if (status === "completed") {
        await dbStorage.createNotification({
          userId: currentOrder.clientId, // Notificar al cliente
          type: "service_order_completed",
          title: "Orden de servicio completada",
          message: `La orden de servicio ${currentOrder.orderNumber} ha sido completada`,
          isRead: false
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Update service order status error:", error);
      res.status(500).json({ message: "Error al actualizar el estado de la orden" });
    }
  });

  // Clients routes - Ahora consolidados en users
  app.get("/api/clients", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { search, limit = 50 } = req.query;
      const clients = await dbStorage.getClients({ 
        search: search?.toString(), 
        limit: parseInt(limit.toString()) 
      });
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clients", authenticateToken, async (req: Request, res: Response) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await dbStorage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/clients/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updated = await dbStorage.updateClient(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update client error:", error);
      res.status(500).json({ message: "Error al actualizar el cliente" });
    }
  });

  // Ruta para obtener vehículos de un cliente (ahora desde users)
  app.get("/api/users/:id/vehicles", authenticateToken, async (req: Request, res: Response) => {
    try {
      const vehicles = await dbStorage.getVehiclesByClientId(parseInt(req.params.id));
      res.json(vehicles);
    } catch (error) {
      console.error("Get client vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mantener la ruta anterior por compatibilidad temporal
  app.get("/api/clients/:id/vehicles", authenticateToken, async (req: Request, res: Response) => {
    try {
      const vehicles = await dbStorage.getVehiclesByClientId(parseInt(req.params.id));
      res.json(vehicles);
    } catch (error) {
      console.error("Get client vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vehicles routes
  app.get("/api/vehicles", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { search, limit = 50 } = req.query;
      const vehicles = await dbStorage.getVehicles({ 
        search: search?.toString(), 
        limit: parseInt(limit.toString()) 
      });
      res.json(vehicles);
    } catch (error) {
      console.error("Get vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/vehicles", authenticateToken, async (req: Request, res: Response) => {
    try {
      console.log("Datos recibidos para crear vehículo:", req.body);
      const vehicleData = insertVehicleSchema.parse(req.body);
      
      // Convertir fechas de string ISO a Date si están presentes
      const processedData = {
        ...vehicleData,
        soatExpiry: vehicleData.soatExpiry ? new Date(vehicleData.soatExpiry) : null,
        technicalInspectionExpiry: vehicleData.technicalInspectionExpiry ? new Date(vehicleData.technicalInspectionExpiry) : null,
      };
      
      console.log("Datos procesados:", processedData);
      const vehicle = await dbStorage.createVehicle(processedData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Create vehicle error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/vehicles/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      // Convertir fechas si vienen como string
      if (updates.soatExpiry) {
        updates.soatExpiry = new Date(updates.soatExpiry);
      }
      if (updates.technicalInspectionExpiry) {
        updates.technicalInspectionExpiry = new Date(updates.technicalInspectionExpiry);
      }
      const updated = await dbStorage.updateVehicle(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update vehicle error:", error);
      res.status(500).json({ message: "Error al actualizar el vehículo" });
    }
  });

  app.get("/api/vehicles/search", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const results = await dbStorage.searchVehicles(query.toString());
      res.json(results);
    } catch (error) {
      console.error("Search vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { category, lowStock, limit = 50 } = req.query;
      const items = await dbStorage.getInventoryItems({ 
        category: category?.toString(), 
        lowStock: lowStock === 'true',
        limit: parseInt(limit.toString()) 
      });
      res.json(items);
    } catch (error) {
      console.error("Get inventory error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/inventory", authenticateToken, async (req: Request, res: Response) => {
    try {
      console.log("Datos recibidos:", req.body);
      const itemData = insertInventoryItemSchema.parse(req.body);
      console.log("Datos validados:", itemData);
      const item = await dbStorage.createInventoryItem(itemData);
      console.log("Item creado:", item);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create inventory item error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/inventory/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const item = await dbStorage.updateInventoryItem(parseInt(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Update inventory item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vehicle Types routes
  app.get("/api/vehicle-types", authenticateToken, async (req: Request, res: Response) => {
    try {
      const vehicleTypes = await dbStorage.getVehicleTypes();
      res.json(vehicleTypes);
    } catch (error) {
      console.error("Get vehicle types error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/vehicle-types", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo administradores pueden crear tipos de vehículo
      if (!["admin", "superAdmin"].includes(authReq.user.role)) {
        return res.status(403).json({ 
          message: "Solo los administradores pueden crear tipos de vehículo" 
        });
      }

      const vehicleTypeData = insertVehicleTypeSchema.parse(req.body);
      const vehicleType = await dbStorage.createVehicleType(vehicleTypeData);
      res.status(201).json(vehicleType);
    } catch (error) {
      console.error("Create vehicle type error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/vehicle-types/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo administradores pueden modificar tipos de vehículo
      if (!["admin", "superAdmin"].includes(authReq.user.role)) {
        return res.status(403).json({ 
          message: "Solo los administradores pueden modificar tipos de vehículo" 
        });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;
      const updated = await dbStorage.updateVehicleType(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Tipo de vehículo no encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update vehicle type error:", error);
      res.status(500).json({ message: "Error al actualizar el tipo de vehículo" });
    }
  });

  // Checklist Items routes
  app.get("/api/checklist-items/:vehicleTypeId", authenticateToken, async (req: Request, res: Response) => {
    try {
      const vehicleTypeId = parseInt(req.params.vehicleTypeId);
      const items = await dbStorage.getChecklistItemsByVehicleType(vehicleTypeId);
      res.json(items);
    } catch (error) {
      console.error("Get checklist items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/checklist-items", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo administradores pueden crear items de checklist
      if (!["admin", "superAdmin"].includes(authReq.user.role)) {
        return res.status(403).json({ 
          message: "Solo los administradores pueden crear items de checklist" 
        });
      }

      const itemData = insertChecklistItemSchema.parse(req.body);
      const item = await dbStorage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create checklist item error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/checklist-items/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo administradores pueden modificar items de checklist
      if (!["admin", "superAdmin"].includes(authReq.user.role)) {
        return res.status(403).json({ 
          message: "Solo los administradores pueden modificar items de checklist" 
        });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;
      const updated = await dbStorage.updateChecklistItem(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Item de checklist no encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update checklist item error:", error);
      res.status(500).json({ message: "Error al actualizar el item de checklist" });
    }
  });

  // Service Order Checklist routes
  app.get("/api/service-orders/:id/checklist", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const checklist = await dbStorage.getServiceOrderChecklist(parseInt(id));
      res.json(checklist);
    } catch (error) {
      console.error("Get service order checklist error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Operario toma una orden
  app.post("/api/service-orders/:id/take", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { notes } = req.body;

      // Verificar que el usuario sea operario
      if (authReq.user.role !== "operator" && authReq.user.role !== "admin" && authReq.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Solo los operarios pueden tomar órdenes" });
      }

      const serviceOrderId = parseInt(id);
      const operatorId = authReq.user.id;

      // Verificar si puede tomar la orden
      const canTake = await dbStorage.canOperatorTakeOrder(serviceOrderId, operatorId);
      if (!canTake) {
        return res.status(400).json({ 
          message: "No puede tomar esta orden. Ya está asignada a otro operario." 
        });
      }

      // Tomar la orden
      const updatedOrder = await dbStorage.takeServiceOrder(serviceOrderId, operatorId);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Orden de servicio no encontrada" });
      }

      // Registrar en el historial
      await dbStorage.addStatusHistoryEntry({
        serviceOrderId,
        previousStatus: "pending",
        newStatus: "in_progress",
        changedBy: operatorId,
        notes: notes || "Orden tomada por operario",
        operatorAction: "take"
      });

      res.json({
        message: "Orden tomada exitosamente",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Take service order error:", error);
      res.status(500).json({ message: "Error al tomar la orden" });
    }
  });

  // Operario libera una orden (solo si la tiene tomada)
  app.post("/api/service-orders/:id/release", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { notes } = req.body;

      // Verificar que el usuario sea operario
      if (authReq.user.role !== "operator" && authReq.user.role !== "admin" && authReq.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Solo los operarios pueden liberar órdenes" });
      }

      const serviceOrderId = parseInt(id);
      const operatorId = authReq.user.id;

      // Verificar si puede liberar la orden
      const canRelease = await dbStorage.canOperatorReleaseOrder(serviceOrderId, operatorId);
      if (!canRelease) {
        return res.status(400).json({ 
          message: "No puede liberar esta orden. No la tiene tomada." 
        });
      }

      // Liberar la orden
      const updatedOrder = await dbStorage.releaseServiceOrder(serviceOrderId, operatorId);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Orden de servicio no encontrada" });
      }

      // Registrar en el historial
      await dbStorage.addStatusHistoryEntry({
        serviceOrderId,
        previousStatus: "in_progress",
        newStatus: "pending",
        changedBy: operatorId,
        notes: notes || "Orden liberada por operario",
        operatorAction: "release"
      });

      res.json({
        message: "Orden liberada exitosamente",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Release service order error:", error);
      res.status(500).json({ message: "Error al liberar la orden" });
    }
  });

  // Obtener órdenes asignadas a un operario
  app.get("/api/operator/orders", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { status } = req.query;

      // Verificar que el usuario sea operario
      if (authReq.user.role !== "operator" && authReq.user.role !== "admin" && authReq.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const operatorId = authReq.user.id;
      
      // Si es operario, solo ver sus órdenes asignadas
      if (authReq.user.role === "operator") {
        const orders = await dbStorage.getOperatorAssignedOrders(operatorId);
        res.json(orders);
      } else {
        // Admin y SuperAdmin pueden ver todas las órdenes
        const orders = await dbStorage.getServiceOrdersByOperator(operatorId, status?.toString());
        res.json(orders);
      }
    } catch (error) {
      console.error("Get operator orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Obtener órdenes disponibles para tomar (solo operarios)
  app.get("/api/operator/available-orders", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Solo operarios pueden ver órdenes disponibles
      if (authReq.user.role !== "operator") {
        return res.status(403).json({ message: "Acceso denegado. Solo operarios pueden ver órdenes disponibles." });
      }

      const operatorId = authReq.user.id;
      const orders = await dbStorage.getAvailableOrdersForOperator(operatorId);
      res.json(orders);
    } catch (error) {
      console.error("Get available orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Obtener historial de vehículo para operarios (con restricciones)
  app.get("/api/operator/vehicle-history/:vehicleId", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { vehicleId } = req.params;

      // Solo operarios pueden acceder a esta ruta
      if (authReq.user.role !== "operator") {
        return res.status(403).json({ message: "Acceso denegado. Solo operarios pueden acceder al historial de vehículos." });
      }

      const operatorId = authReq.user.id;
      const history = await dbStorage.getVehicleHistoryForOperator(operatorId, parseInt(vehicleId));
      res.json(history);
    } catch (error) {
      console.error("Get vehicle history for operator error:", error);
      if (error instanceof Error && error.message.includes("No tienes permisos")) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Obtener historial de estados de una orden
  app.get("/api/service-orders/:id/status-history", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const history = await dbStorage.getServiceOrderStatusHistory(parseInt(id));
      res.json(history);
    } catch (error) {
      console.error("Get service order status history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sistema de Auditoría - Logs del sistema
  app.get("/api/audit/system-logs", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo Admin y SuperAdmin pueden ver logs del sistema
      if (authReq.user.role !== "admin" && authReq.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden ver logs del sistema." });
      }

      const { userId, action, severity, limit = 100 } = req.query;
      const logs = await dbStorage.getSystemAuditLogs({
        userId: userId ? parseInt(userId.toString()) : undefined,
        action: action?.toString(),
        severity: severity?.toString(),
        limit: parseInt(limit.toString())
      });

      res.json(logs);
    } catch (error) {
      console.error("Get system audit logs error:", error);
      res.status(500).json({ message: "Error al obtener logs del sistema" });
    }
  });

  // Sistema de Auditoría - Actividad de usuario
  app.get("/api/audit/user-activity/:userId", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      // Solo Admin, SuperAdmin o el propio usuario pueden ver su actividad
      if (authReq.user.role !== "admin" && authReq.user.role !== "superAdmin" && authReq.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: "Acceso denegado. Solo puede ver su propia actividad." });
      }

      const logs = await dbStorage.getUserActivityLogs(parseInt(userId), parseInt(limit.toString()));
      res.json(logs);
    } catch (error) {
      console.error("Get user activity logs error:", error);
      res.status(500).json({ message: "Error al obtener logs de actividad del usuario" });
    }
  });

  // Validación de Checklist - Verificar si está completo
  app.get("/api/service-orders/:id/checklist-validation", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validation = await dbStorage.validateChecklistCompletion(parseInt(id));
      res.json(validation);
    } catch (error) {
      console.error("Checklist validation error:", error);
      res.status(500).json({ message: "Error al validar checklist" });
    }
  });

  // Validación de Checklist - Verificar si puede cambiar estado
  app.post("/api/service-orders/:id/validate-status-change", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newStatus } = req.body;

      if (!newStatus) {
        return res.status(400).json({ message: "Se requiere el nuevo estado" });
      }

      const validation = await dbStorage.canChangeServiceOrderStatus(parseInt(id), newStatus);
      res.json(validation);
    } catch (error) {
      console.error("Status change validation error:", error);
      res.status(500).json({ message: "Error al validar cambio de estado" });
    }
  });

  // Gestión de Reglas de Validación de Checklist
  app.get("/api/checklist-validation-rules/:vehicleTypeId", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const { vehicleTypeId } = req.params;
      const rules = await dbStorage.getChecklistValidationRules(parseInt(vehicleTypeId));
      res.json(rules);
    } catch (error) {
      console.error("Get checklist validation rules error:", error);
      res.status(500).json({ message: "Error al obtener reglas de validación" });
    }
  });

  app.post("/api/checklist-validation-rules", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo Admin y SuperAdmin pueden crear reglas de validación
      if (authReq.user.role !== "admin" && authReq.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden crear reglas de validación." });
      }

      const ruleData = req.body;
      const newRule = await dbStorage.createChecklistValidationRule(ruleData);
      res.status(201).json(newRule);
    } catch (error) {
      console.error("Create checklist validation rule error:", error);
      res.status(500).json({ message: "Error al crear regla de validación" });
    }
  });

  app.patch("/api/checklist-validation-rules/:id", authenticateToken, requirePasswordChange, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      // Solo Admin y SuperAdmin pueden modificar reglas de validación
      if (authReq.user.role !== "admin" && authReq.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Acceso denegado. Solo administradores pueden modificar reglas de validación." });
      }

      const { id } = req.params;
      const updates = req.body;
      const updatedRule = await dbStorage.updateChecklistValidationRule(parseInt(id), updates);
      
      if (!updatedRule) {
        return res.status(404).json({ message: "Regla de validación no encontrada" });
      }

      res.json(updatedRule);
    } catch (error) {
      console.error("Update checklist validation rule error:", error);
      res.status(500).json({ message: "Error al actualizar regla de validación" });
    }
  });

  app.post("/api/service-orders/:id/checklist", authenticateToken, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const authReq = req as AuthenticatedRequest;
      
      // Solo operarios y administradores pueden crear checklist
      if (!["admin", "superAdmin", "operator"].includes(authReq.user.role)) {
        return res.status(403).json({ 
          message: "No tienes permisos para crear checklist" 
        });
      }

      const checklistData = {
        ...req.body,
        serviceOrderId: orderId
      };
      
      const checklist = await dbStorage.createServiceOrderChecklist(checklistData);
      res.status(201).json(checklist);
    } catch (error) {
      console.error("Create service order checklist error:", error);
      res.status(500).json({ message: "Error al crear el checklist" });
    }
  });

  app.patch("/api/checklist/:id/complete", authenticateToken, async (req: Request, res: Response) => {
    try {
      const checklistId = parseInt(req.params.id);
      const authReq = req as AuthenticatedRequest;
      const { notes } = req.body;
      
      // Solo operarios y administradores pueden completar checklist
      if (!["admin", "superAdmin", "operator"].includes(authReq.user.role)) {
        return res.status(403).json({ 
          message: "No tienes permisos para completar checklist" 
        });
      }

      const updated = await dbStorage.completeChecklistItem(checklistId, authReq.user.id, notes);
      if (!updated) {
        return res.status(404).json({ message: "Item de checklist no encontrado" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Complete checklist item error:", error);
      res.status(500).json({ message: "Error al completar el item de checklist" });
    }
  });

  // Workers/Operators routes
  app.get("/api/workers", authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const workers = await dbStorage.getWorkers();
      res.json(workers);
    } catch (error) {
      console.error("Get workers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/workers", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Solo administradores pueden crear operarios
    if (authReq.user.role !== "Admin") {
      return res.status(403).json({ 
        message: "Solo los administradores pueden crear operarios" 
      });
    }

    // Validar los datos de entrada
    const workerData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone || null,
      role: req.body.role || "operator",
      password: req.body.password,
      isActive: req.body.isActive !== false, // Por defecto true
      documentNumber: req.body.documentNumber || null
    };

    // Validaciones básicas
    if (!workerData.firstName || !workerData.lastName || !workerData.username || !workerData.email || !workerData.password) {
      return res.status(400).json({ 
        message: "Nombre, apellido, usuario, email y contraseña son requeridos" 
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await dbStorage.getUserByUsername(workerData.username);
    if (existingUser) {
      return res.status(409).json({ 
        message: "El nombre de usuario ya está en uso" 
      });
    }

    // Verificar si el email ya existe
    const existingEmail = await dbStorage.getUserByEmail(workerData.email);
    if (existingEmail) {
      return res.status(409).json({ 
        message: "El email ya está registrado" 
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(workerData.password, 10);

    // Crear el operario en la base de datos
    const newWorker = await dbStorage.createUser({
      ...workerData,
      password: hashedPassword
    });

    // No devolver la contraseña en la respuesta
    const { password, ...workerResponse } = newWorker;

    res.status(201).json(workerResponse);
  } catch (error) {
    console.error("Create worker error:", error);
    res.status(500).json({ 
      message: "Error al crear el operario",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { userId, unreadOnly, limit = 20 } = req.query;
      const authReq = req as AuthenticatedRequest;
      const notifications = await dbStorage.getNotifications({
        userId: userId ? parseInt(userId.toString()) : authReq.user.id,
        unreadOnly: unreadOnly === 'true',
        limit: parseInt(limit.toString())
      });
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { title, message, type, priority, category, serviceOrderId, toUserId, requiresResponse } = req.body;
      const fromUserId = req.user.id;

      // Validar campos requeridos
      if (!title || !message || !type || !category) {
        return res.status(400).json({ message: 'Campos requeridos: title, message, type, category' });
      }

      // Validar categoría
      const validCategories = ['operator_to_admin', 'admin_to_operator', 'system'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Categoría inválida' });
      }

      // Validar tipo
      const validTypes = ['order_issue', 'order_update', 'order_completion', 'admin_response', 'system_alert'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Tipo inválido' });
      }

      // Validar prioridad
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority || 'medium')) {
        return res.status(400).json({ message: 'Prioridad inválida' });
      }

      // Crear notificación
      const notification = await dbStorage.createNotification({
        fromUserId,
        toUserId: toUserId || null, // null = para todos los admins
        serviceOrderId: serviceOrderId || null,
        type,
        title,
        message,
        priority: priority || 'medium',
        status: 'open',
        category,
        requiresResponse: requiresResponse || false,
        responseToId: null,
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.get('/api/notifications/user/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const { category } = req.query;
      const requestingUser = req.user;

      // Verificar permisos
      if (requestingUser.id !== parseInt(userId) && requestingUser.role !== 'admin' && requestingUser.role !== 'superAdmin') {
        return res.status(403).json({ message: 'No tienes permisos para ver estas notificaciones' });
      }

      const notifications = await dbStorage.getNotificationsForUser(parseInt(userId), category as string);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.get('/api/notifications/from/:userId', authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const { category } = req.query;
      const requestingUser = req.user;

      // Verificar permisos
      if (requestingUser.id !== parseInt(userId) && requestingUser.role !== 'admin' && requestingUser.role !== 'superAdmin') {
        return res.status(403).json({ message: 'No tienes permisos para ver estas notificaciones' });
      }

      const notifications = await dbStorage.getNotificationsFromUser(parseInt(userId), category as string);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting notifications from user:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.get('/api/notifications/admins', authenticateToken, async (req, res) => {
    try {
      const requestingUser = req.user;
      const { category } = req.query;

      // Solo admins pueden ver notificaciones para admins
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superAdmin') {
        return res.status(403).json({ message: 'No tienes permisos para ver estas notificaciones' });
      }

      const notifications = await dbStorage.getNotificationsForAdmins(category as string);
      res.json(notifications);
    } catch (error) {
      console.error('Error getting admin notifications:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.get('/api/notifications/:id/responses', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUser = req.user;

      // Verificar permisos - cualquier usuario autenticado puede ver respuestas
      const responses = await dbStorage.getNotificationResponses(parseInt(id));
      res.json(responses);
    } catch (error) {
      console.error('Error getting notification responses:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.post('/api/notifications/:id/respond', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, priority } = req.body;
      const fromUserId = req.user.id;

      // Validar campos requeridos
      if (!title || !message) {
        return res.status(400).json({ message: 'Campos requeridos: title, message' });
      }

      // Obtener la notificación original
      const originalNotification = await dbStorage.getNotificationById(parseInt(id));
      if (!originalNotification) {
        return res.status(404).json({ message: 'Notificación no encontrada' });
      }

      // Crear respuesta
      const response = await dbStorage.createNotification({
        fromUserId,
        toUserId: originalNotification.fromUserId, // Responder al remitente original
        serviceOrderId: originalNotification.serviceOrderId,
        type: 'admin_response',
        title,
        message,
        priority: priority || 'medium',
        status: 'open',
        category: 'admin_to_operator',
        requiresResponse: false,
        responseToId: parseInt(id),
      });

      // Marcar la notificación original como respondida
      await dbStorage.updateNotificationStatus(parseInt(id), 'in_progress');

      res.status(201).json(response);
    } catch (error) {
      console.error('Error responding to notification:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const requestingUser = req.user;

      // Verificar permisos - cualquier usuario autenticado puede marcar como leída
      await dbStorage.markNotificationAsRead(parseInt(id));
      res.json({ message: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  app.patch('/api/notifications/:id/status', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const requestingUser = req.user;

      // Solo admins pueden cambiar el estado
      if (requestingUser.role !== 'admin' && requestingUser.role !== 'superAdmin') {
        return res.status(403).json({ message: 'No tienes permisos para cambiar el estado' });
      }

      // Validar estado
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }

      await dbStorage.updateNotificationStatus(parseInt(id), status);
      res.json({ message: 'Estado actualizado' });
    } catch (error) {
      console.error('Error updating notification status:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  // Public client portal route (no auth required for client vehicle lookup)
  app.get("/api/public/vehicle-history", async (req: Request, res: Response) => {
    try {
      const { documentNumber, plate } = req.query;
      
      if (!documentNumber && !plate) {
        return res.status(400).json({ message: "Document number or plate required" });
      }

      const history = await dbStorage.getPublicVehicleHistory({
        documentNumber: documentNumber?.toString(),
        plate: plate?.toString()
      });
      
      res.json(history);
    } catch (error) {
      console.error("Get vehicle history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoices routes
  app.get("/api/invoices", authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const { status, limit = 50, fromDate, toDate } = req.query;
      const invoices = await dbStorage.getInvoices({ 
        status: status?.toString(),
        limit: parseInt(limit.toString()),
        fromDate: fromDate ? new Date(fromDate.toString()) : undefined,
        toDate: toDate ? new Date(toDate.toString()) : undefined,
        items: true
      });
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Error al obtener las facturas" });
    }
  });

  app.get("/api/invoices/:id", authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const invoice = await dbStorage.getInvoiceById(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Error al obtener la factura" });
    }
  });

  app.post("/api/invoices", authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const { serviceOrderId, items } = req.body as { serviceOrderId: number, items: InvoiceItem[] };

      if (!serviceOrderId || !items?.length) {
        return res.status(400).json({
          message: "Se requiere el ID de la orden de servicio y los items a facturar"
        });
      }

      const authReq = req as AuthenticatedRequest;
      const serviceOrder = await dbStorage.getServiceOrderById(serviceOrderId, authReq.user.id, authReq.user.role);
      if (!serviceOrder) {
        return res.status(404).json({ message: "Orden de servicio no encontrada" });
      }

      const invoiceCount = await dbStorage.getInvoiceCount();
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(6, '0')}`;

      const subtotal = items.reduce((sum: number, item: InvoiceItem) => sum + (item.quantity * item.price), 0);
      const tax = subtotal * 0.19;
      const total = subtotal + tax;

      const invoice = await dbStorage.createInvoice({
        serviceOrderId,
        invoiceNumber,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        status: "pending",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items
      });

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Error al crear la factura" });
    }
  });

  app.patch("/api/invoices/:id/status", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      
      if (!status || !["pending", "paid", "cancelled", "overdue"].includes(status)) {
        return res.status(400).json({ message: "Estado de factura inválido" });
      }

      const invoice = await dbStorage.updateInvoiceStatus(
        parseInt(req.params.id),
        status,
        status === "paid" ? new Date() : undefined
      );

      if (!invoice) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Update invoice status error:", error);
      res.status(500).json({ message: "Error al actualizar el estado de la factura" });
    }
  });

  app.get("/api/invoices/:id/pdf", authenticateToken, async (req: Request, res: Response) => {
    try {
      const invoice = await dbStorage.getInvoiceById(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      // Asumiendo que getInvoiceById ya devuelve un objeto InvoiceWithItems
      const pdfPath = await generateInvoicePDF(invoice as InvoiceWithItems);

      res.download(pdfPath, `factura-${invoice.invoiceNumber}.pdf`, (err) => {
        if (err) {
          console.error("Download error:", err);
          fs.unlink(pdfPath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file:", unlinkErr);
          });
        } else {
          fs.unlink(pdfPath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file:", unlinkErr);
          });
        }
      });
    } catch (error) {
      console.error("Generate invoice PDF error:", error);
      res.status(500).json({ message: "Error al generar el PDF de la factura" });
    }
  });

  app.post("/api/invoices/:id/send", authenticateToken, async (req: Request, res: Response) => {
    try {
      const invoice = await dbStorage.getInvoiceById(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Se requiere el email del destinatario" });
      }

      await sendInvoiceEmail(invoice as InvoiceWithItems, email);
      res.json({ message: "Factura enviada correctamente" });
    } catch (error) {
      console.error("Send invoice error:", error);
      res.status(500).json({ message: "Error al enviar la factura" });
    }
  });

  // Company Settings routes
  app.get("/api/company-settings", authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await dbStorage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Get company settings error:", error);
      res.status(500).json({ message: "Error al obtener la configuración" });
    }
  });

  app.patch("/api/company-settings", authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== "admin") {
        return res.status(403).json({ 
          message: "Solo los administradores pueden modificar la configuración" 
        });
      }

      const settings = await dbStorage.updateCompanySettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update company settings error:", error);
      res.status(500).json({ message: "Error al actualizar la configuración" });
    }
  });

  // Logo upload route
  app.post("/api/company-settings/logo", authenticateToken, isAdmin, upload.single("logo"), async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== "admin") {
        return res.status(403).json({ 
          message: "Solo los administradores pueden modificar el logo" 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No se ha proporcionado ningún archivo" });
      }

      const settings = await dbStorage.updateCompanySettings({
        name: "Mi Taller", // Nombre por defecto
        nit: "000000000", // NIT por defecto para evitar constraint violation
        address: "Dirección del Taller", // Dirección por defecto
        phone: "000-000-0000", // Teléfono por defecto
        email: "taller@ejemplo.com", // Email por defecto
        logo: `/uploads/${req.file.filename}`
      });

      res.json(settings);
    } catch (error) {
      console.error("Upload logo error:", error);
      res.status(500).json({ message: "Error al subir el logo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
