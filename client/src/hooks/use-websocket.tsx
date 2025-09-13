import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePushNotifications } from './use-push-notifications';

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  category?: string;
  userId?: number;
  requiresResponse?: boolean;
  data?: any;
}

export function useWebSocket() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showOrderNotification, showSystemNotification, requestPermission } = usePushNotifications();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Conectar al WebSocket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Eventos de conexión
    socket.on('connect', async () => {
      console.log('🔌 WebSocket conectado');
      setIsConnected(true);
      setConnectionError(null);
      
      // Solicitar permisos para notificaciones push
      await requestPermission();
      
      // Autenticar usuario
      socket.emit('authenticate', {
        userId: user.id,
        role: user.role
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket desconectado');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Eventos de autenticación
    socket.on('authenticated', (data) => {
      console.log('✅ Usuario autenticado en WebSocket:', data);
      
      // Unirse a salas según el rol
      if (user.role === 'admin' || user.role === 'superAdmin') {
        socket.emit('join-admin-room');
      }
      
      socket.emit('join-user-room', user.id);
    });

    // Eventos de notificaciones
    socket.on('notification', (notification: NotificationData) => {
      console.log('🔔 Notificación recibida:', notification);
      
      // Mostrar toast
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });

      // Mostrar notificación push
      if (notification.data?.orderNumber) {
        showOrderNotification(
          notification.data.orderNumber,
          notification.message,
          notification.data.priority || 'medium'
        );
      } else {
        showSystemNotification(
          notification.title,
          notification.message,
          notification.type === 'error' ? 'error' : 'info'
        );
      }

      // Actualizar cache de notificaciones
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    });

    socket.on('admin-notification', (notification: NotificationData) => {
      console.log('🔔 Notificación de admin recibida:', notification);
      
      // Solo mostrar si es admin
      if (user.role === 'admin' || user.role === 'superAdmin') {
        toast({
          title: `👑 ${notification.title}`,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default'
        });

        // Mostrar notificación push para admins
        showSystemNotification(
          `👑 ${notification.title}`,
          notification.message,
          notification.type === 'error' ? 'error' : 'warning'
        );
      }

      // Actualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    });

    socket.on('system-notification', (notification: NotificationData) => {
      console.log('🔔 Notificación del sistema:', notification);
      
      toast({
        title: `⚙️ ${notification.title}`,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });

      // Mostrar notificación push del sistema
      showSystemNotification(
        `⚙️ ${notification.title}`,
        notification.message,
        notification.type === 'error' ? 'error' : 'info'
      );

      // Actualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    });

    // Eventos de actualización de datos
    socket.on('dashboard-update', (data) => {
      console.log('📊 Actualización de dashboard:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    });

    socket.on('service-order-update', (data) => {
      console.log('🔧 Actualización de orden de servicio:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/operator/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/operator/available-orders'] });
    });

    socket.on('inventory-update', (data) => {
      console.log('📦 Actualización de inventario:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, token, toast, queryClient]);

  // Función para enviar notificación
  const sendNotification = (notification: Partial<NotificationData>) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('notification-response', notification);
    }
  };

  // Función para responder a notificación
  const respondToNotification = (notificationId: string, response: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('notification-response', {
        notificationId,
        response
      });
    }
  };

  return {
    isConnected,
    connectionError,
    sendNotification,
    respondToNotification,
    socket: socketRef.current
  };
}
