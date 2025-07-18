import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertClientSchema, insertVehicleSchema, insertServiceOrderSchema, insertInventoryItemSchema, insertNotificationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateInvoicePDF } from "./utils/pdfGenerator";
import { sendInvoiceEmail } from "./utils/emailSender";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

// Extender la interfaz Request de Express
interface AuthenticatedRequest extends Request<ParamsDictionary, any, any, ParsedQs> {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

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

// Middleware de autenticación mejorado
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    (req as AuthenticatedRequest).user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const stats = await dbStorage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Service Orders routes
  app.get("/api/service-orders", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { status, limit = 50 } = req.query;
      const orders = await dbStorage.getServiceOrders({ 
        status: status?.toString(), 
        limit: parseInt(limit.toString()) 
      });
      res.json(orders);
    } catch (error) {
      console.error("Get service orders error:", error);
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
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create service order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/service-orders/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const order = await dbStorage.getServiceOrderById(parseInt(req.params.id));
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

  // Clients routes
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
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await dbStorage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Create vehicle error:", error);
      res.status(500).json({ message: "Internal server error" });
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
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await dbStorage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create inventory item error:", error);
      res.status(500).json({ message: "Internal server error" });
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

  // Workers/Operators routes
  app.get("/api/workers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const workers = await dbStorage.getWorkers();
      res.json(workers);
    } catch (error) {
      console.error("Get workers error:", error);
      res.status(500).json({ message: "Internal server error" });
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
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await dbStorage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: Request, res: Response) => {
    try {
      const notification = await dbStorage.markNotificationAsRead(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Internal server error" });
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
  app.get("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
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

  app.get("/api/invoices/:id", authenticateToken, async (req: Request, res: Response) => {
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

  app.post("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { serviceOrderId, items } = req.body as { serviceOrderId: number, items: InvoiceItem[] };

      if (!serviceOrderId || !items?.length) {
        return res.status(400).json({
          message: "Se requiere el ID de la orden de servicio y los items a facturar"
        });
      }

      const serviceOrder = await dbStorage.getServiceOrderById(serviceOrderId);
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
  app.get("/api/company-settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      const settings = await dbStorage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Get company settings error:", error);
      res.status(500).json({ message: "Error al obtener la configuración" });
    }
  });

  app.patch("/api/company-settings", authenticateToken, async (req: Request, res: Response) => {
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
  app.post("/api/company-settings/logo", authenticateToken, upload.single("logo"), async (req: Request, res: Response) => {
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
