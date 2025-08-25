import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  category?: string;
  userId?: number;
  requiresResponse?: boolean;
  data?: any;
}

export interface UserConnection {
  userId: number;
  role: string;
  socketId: string;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private io: SocketIOServer | null = null;
  private userConnections: Map<number, UserConnection> = new Map();
  private adminConnections: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Inicializar WebSocket con el servidor HTTP
   */
  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  /**
   * Configurar manejadores de eventos
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {

      // Autenticación del usuario
      socket.on('authenticate', (data: { userId: number; role: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Unirse a sala de administradores
      socket.on('join-admin-room', () => {
        this.handleJoinAdminRoom(socket);
      });

      // Unirse a sala de usuario específico
      socket.on('join-user-room', (userId: number) => {
        this.handleJoinUserRoom(socket, userId);
      });

      // Desconexión
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Respuesta a notificación
      socket.on('notification-response', (data: { notificationId: string; response: string }) => {
        this.handleNotificationResponse(socket, data);
      });
    });
  }

  /**
   * Manejar autenticación del usuario
   */
  private handleAuthentication(socket: any, data: { userId: number; role: string }): void {
    const { userId, role } = data;
    
    // Guardar conexión del usuario
    this.userConnections.set(userId, {
      userId,
      role,
      socketId: socket.id
    });

    // Unirse a sala de usuario
    socket.join(`user-${userId}`);
    
    // Si es admin, unirse a sala de administradores
    if (role === 'admin' || role === 'superAdmin') {
      socket.join('admin-room');
      this.adminConnections.add(socket.id);
    }

    // Enviar confirmación
    socket.emit('authenticated', { success: true, userId, role });
  }

  /**
   * Manejar unión a sala de administradores
   */
  private handleJoinAdminRoom(socket: any): void {
    socket.join('admin-room');
    this.adminConnections.add(socket.id);
  }

  /**
   * Manejar unión a sala de usuario específico
   */
  private handleJoinUserRoom(socket: any, userId: number): void {
    socket.join(`user-${userId}`);
  }

  /**
   * Manejar desconexión
   */
  private handleDisconnect(socket: any): void {
    // Remover de conexiones de admin
    if (this.adminConnections.has(socket.id)) {
      this.adminConnections.delete(socket.id);
    }

    // Remover de conexiones de usuario
    for (const [userId, connection] of this.userConnections.entries()) {
      if (connection.socketId === socket.id) {
        this.userConnections.delete(userId);
        break;
      }
    }

  }

  /**
   * Enviar notificación a un usuario específico
   */
  public sendNotificationToUser(userId: number, notification: NotificationData): void {
    if (!this.io) return;

    const userConnection = this.userConnections.get(userId);
    if (userConnection) {
      this.io.to(`user-${userId}`).emit('notification', notification);
    } else {
      // TODO: Implementar cola de notificaciones para usuarios offline
    }
  }

  /**
   * Enviar notificación a todos los administradores
   */
  public sendNotificationToAdmins(notification: NotificationData): void {
    if (!this.io) return;

    this.io.to('admin-room').emit('admin-notification', notification);
  }

  /**
   * Enviar notificación del sistema a todos los usuarios
   */
  public sendSystemNotification(notification: NotificationData): void {
    if (!this.io) return;

    this.io.emit('system-notification', notification);
  }

  /**
   * Enviar actualización de dashboard en tiempo real
   */
  public sendDashboardUpdate(userId: number, data: any): void {
    if (!this.io) return;

    const userConnection = this.userConnections.get(userId);
    if (userConnection) {
      this.io.to(`user-${userId}`).emit('dashboard-update', data);
    }
  }

  /**
   * Enviar actualización de inventario a administradores
   */
  public sendInventoryUpdate(data: any): void {
    if (!this.io) return;

    this.io.to('admin-room').emit('inventory-update', data);
  }

  /**
   * Enviar actualización de órdenes de servicio
   */
  public sendServiceOrderUpdate(userId: number, data: any): void {
    if (!this.io) return;

    const userConnection = this.userConnections.get(userId);
    if (userConnection) {
      this.io.to(`user-${userId}`).emit('service-order-update', data);
    }
  }

  /**
   * Manejar respuesta a notificación
   */
  private handleNotificationResponse(socket: any, data: { notificationId: string; response: string }): void {
    // TODO: Implementar lógica para procesar respuestas
    // Por ejemplo, actualizar estado de la notificación en la base de datos
    
    // Notificar a administradores sobre la respuesta
    this.sendNotificationToAdmins({
      id: `response-${Date.now()}`,
      type: 'info',
      title: 'Respuesta a Notificación',
      message: `Usuario respondió: ${data.response}`,
      category: 'notification-response',
      data: data
    });
  }

  /**
   * Obtener estadísticas de conexiones
   */
  public getConnectionStats(): any {
    return {
      totalConnections: this.userConnections.size,
      adminConnections: this.adminConnections.size,
      connectedUsers: Array.from(this.userConnections.values()).map(conn => ({
        userId: conn.userId,
        role: conn.role
      }))
    };
  }

  /**
   * Limpiar conexiones (útil para testing)
   */
  public clearConnections(): void {
    this.userConnections.clear();
    this.adminConnections.clear();
  }
}

export const websocketManager = WebSocketManager.getInstance();
export default WebSocketManager;
