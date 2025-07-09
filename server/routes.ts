import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertClientSchema, insertVehicleSchema, insertServiceOrderSchema, insertInventoryItemSchema, insertNotificationSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware for authentication
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
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

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Service Orders routes
  app.get("/api/service-orders", authenticateToken, async (req: any, res) => {
    try {
      const { status, limit = 50 } = req.query;
      const orders = await storage.getServiceOrders({ status, limit: parseInt(limit) });
      res.json(orders);
    } catch (error) {
      console.error("Get service orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/service-orders", authenticateToken, async (req: any, res) => {
    try {
      const orderData = insertServiceOrderSchema.parse(req.body);
      
      // Generate order number
      const orderCount = await storage.getServiceOrderCount();
      const orderNumber = `SO-${Date.now()}-${(orderCount + 1).toString().padStart(4, '0')}`;
      
      const order = await storage.createServiceOrder({
        ...orderData,
        orderNumber,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create service order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/service-orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const order = await storage.getServiceOrderById(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Service order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get service order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/service-orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const order = await storage.updateServiceOrder(parseInt(req.params.id), req.body);
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
  app.get("/api/clients", authenticateToken, async (req: any, res) => {
    try {
      const { search, limit = 50 } = req.query;
      const clients = await storage.getClients({ search, limit: parseInt(limit) });
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/clients", authenticateToken, async (req: any, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      console.error("Create client error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/clients/:id/vehicles", authenticateToken, async (req: any, res) => {
    try {
      const vehicles = await storage.getVehiclesByClientId(parseInt(req.params.id));
      res.json(vehicles);
    } catch (error) {
      console.error("Get client vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Vehicles routes
  app.get("/api/vehicles", authenticateToken, async (req: any, res) => {
    try {
      const { search, limit = 50 } = req.query;
      const vehicles = await storage.getVehicles({ search, limit: parseInt(limit) });
      res.json(vehicles);
    } catch (error) {
      console.error("Get vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/vehicles", authenticateToken, async (req: any, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Create vehicle error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/vehicles/search", authenticateToken, async (req: any, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      
      const results = await storage.searchVehicles(query.toString());
      res.json(results);
    } catch (error) {
      console.error("Search vehicles error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", authenticateToken, async (req: any, res) => {
    try {
      const { category, lowStock, limit = 50 } = req.query;
      const items = await storage.getInventoryItems({ 
        category, 
        lowStock: lowStock === 'true',
        limit: parseInt(limit) 
      });
      res.json(items);
    } catch (error) {
      console.error("Get inventory error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/inventory", authenticateToken, async (req: any, res) => {
    try {
      const itemData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create inventory item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/inventory/:id", authenticateToken, async (req: any, res) => {
    try {
      const item = await storage.updateInventoryItem(parseInt(req.params.id), req.body);
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
  app.get("/api/workers", authenticateToken, async (req: any, res) => {
    try {
      const workers = await storage.getWorkers();
      res.json(workers);
    } catch (error) {
      console.error("Get workers error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const { userId, unreadOnly, limit = 20 } = req.query;
      const notifications = await storage.getNotifications({
        userId: userId ? parseInt(userId.toString()) : req.user.id,
        unreadOnly: unreadOnly === 'true',
        limit: parseInt(limit.toString())
      });
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(parseInt(req.params.id));
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
  app.get("/api/public/vehicle-history", async (req, res) => {
    try {
      const { documentNumber, plate } = req.query;
      
      if (!documentNumber && !plate) {
        return res.status(400).json({ message: "Document number or plate required" });
      }

      const history = await storage.getPublicVehicleHistory({
        documentNumber: documentNumber?.toString(),
        plate: plate?.toString()
      });
      
      res.json(history);
    } catch (error) {
      console.error("Get vehicle history error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
