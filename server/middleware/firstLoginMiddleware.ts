import { Request, Response, NextFunction } from "express";
import { dbStorage } from "../storage";

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}

/**
 * Middleware para verificar si el usuario debe cambiar su contraseña en la primera sesión
 * Bloquea el acceso a todas las rutas excepto las de cambio de contraseña
 */
export async function requirePasswordChange(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Obtener información del usuario
    const user = await dbStorage.getUser(authReq.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si es primera sesión, solo permitir acceso a rutas de cambio de contraseña
    if (user.firstLogin) {
      const allowedRoutes = [
        '/api/auth/me',
        '/api/auth/first-login',
        '/api/auth/change-password',
        '/api/auth/logout'
      ];

      if (!allowedRoutes.includes(req.path)) {
        return res.status(403).json({
          message: "Debe cambiar su contraseña antes de continuar",
          requiresPasswordChange: true,
          isFirstLogin: true
        });
      }
    }

    next();
  } catch (error) {
    console.error("First login middleware error:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

/**
 * Middleware para verificar si el usuario ya completó su primera sesión
 * Útil para rutas que solo deben ser accesibles después del cambio de contraseña
 */
export async function requireCompletedFirstLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Obtener información del usuario
    const user = await dbStorage.getUser(authReq.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si es primera sesión, no permitir acceso
    if (user.firstLogin) {
      return res.status(403).json({
        message: "Debe completar su primera sesión antes de acceder a esta funcionalidad",
        requiresPasswordChange: true,
        isFirstLogin: true
      });
    }

    next();
  } catch (error) {
    console.error("Completed first login middleware error:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
