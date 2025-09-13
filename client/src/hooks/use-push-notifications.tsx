import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Este navegador no soporta notificaciones push');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions): void => {
    if (permission !== 'granted' || !isSupported) {
      console.warn('No se pueden mostrar notificaciones: permisos no concedidos o no soportado');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'autotaller-notification',
        requireInteraction: false,
        silent: false,
        ...options
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Manejar clicks en la notificación
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('Error mostrando notificación:', error);
    }
  };

  const showOrderNotification = (orderNumber: string, message: string, priority: string = 'medium') => {
    const icon = priority === 'high' || priority === 'urgent' ? '🔴' : '🔵';
    const title = `${icon} Orden ${orderNumber}`;
    
    showNotification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `order-${orderNumber}`,
      requireInteraction: priority === 'urgent',
      silent: priority === 'low'
    });
  };

  const showSystemNotification = (title: string, message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };

    showNotification(`${icons[type]} ${title}`, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'system-notification',
      requireInteraction: type === 'error'
    });
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showOrderNotification,
    showSystemNotification
  };
}
