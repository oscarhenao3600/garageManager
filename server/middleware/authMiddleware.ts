import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extender la interfaz Request de Express
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

// Middleware de autenticación básica
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
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

// Middleware para verificar si el usuario es administrador
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (authReq.user.role !== 'admin' && authReq.user.role !== 'superAdmin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

// Middleware para verificar si el usuario es super administrador
export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (authReq.user.role !== 'superAdmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }

  next();
}

// Middleware para verificar si el usuario es operario o superior
export function isOperatorOrHigher(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const allowedRoles = ['operator', 'admin', 'superAdmin'];
  if (!allowedRoles.includes(authReq.user.role)) {
    return res.status(403).json({ message: 'Operator access or higher required' });
  }

  next();
}

// Middleware para verificar si el usuario puede acceder a recursos específicos
export function canAccessResource(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Los administradores pueden acceder a todo
  if (authReq.user.role === 'admin' || authReq.user.role === 'superAdmin') {
    return next();
  }

  // Los operarios pueden acceder a órdenes de servicio, inventario, etc.
  if (authReq.user.role === 'operator') {
    const allowedPaths = [
      '/api/service-orders',
      '/api/inventory',
      '/api/vehicles',
      '/api/clients',
      '/api/notifications'
    ];
    
    if (allowedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
  }

  // Los usuarios regulares solo pueden acceder a sus propios recursos
  if (authReq.user.role === 'user') {
    // Implementar lógica específica para recursos del usuario
    return next();
  }

  return res.status(403).json({ message: 'Access denied to this resource' });
}
