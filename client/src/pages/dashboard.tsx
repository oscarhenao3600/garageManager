import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Car, DollarSign, HardHat, Plus, UserPlus, Package, BarChart3, ArrowUp, Clock, Users, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import NewOrderModal from "@/components/modals/new-order-modal";
import NewClientModal from "@/components/modals/new-client-modal";
import AdminDashboard from "@/components/AdminDashboard";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const { user } = useAuth();

  // Verificar roles de usuario
  const isClient = user?.role === 'user' || user?.role === 'client';
  const isOperator = user?.role === 'operator';
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';
  const canViewAllStats = !isClient && !isOperator; // Solo admin ve stats generales

  // Debug: Log del usuario y roles
  console.log('🔍 Dashboard User Debug:', {
    user,
    userRole: user?.role,
    isAdmin,
    isClient,
    isOperator,
    canViewAllStats
  });

  // Si es administrador, mostrar el dashboard administrativo
  if (isAdmin) {
    console.log('✅ Redirigiendo a AdminDashboard');
    return <AdminDashboard />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000,
  });

  // Debug: Log de las estadísticas recibidas
  console.log('🔍 Dashboard Debug:', {
    userRole: user?.role,
    isClient,
    isOperator,
    canViewAllStats,
    stats,
    statsKeys: stats ? Object.keys(stats) : 'No stats'
  });

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/service-orders', { 
      limit: 5, 
      userId: user?.id, 
      userRole: user?.role,
      // Para clientes, solo mostrar órdenes activas (pending, in_progress)
      status: (user?.role === 'user' || user?.role === 'client') ? 'active' : undefined
    }],
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications', { limit: 10, unreadOnly: true, userId: user?.id, userRole: user?.role }],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'billed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'billed': return 'Facturado';
      default: return status;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'soat_expiry': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'technical_inspection': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'low_stock': return <Package className="h-4 w-4 text-orange-500" />;
      case 'order_update': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVehicleIcon = (description: string) => {
    if (description.toLowerCase().includes('moto')) return <Car className="h-4 w-4 text-blue-600" />;
    if (description.toLowerCase().includes('camión') || description.toLowerCase().includes('truck')) return <Car className="h-4 w-4 text-blue-600" />;
    return <Car className="h-4 w-4 text-blue-600" />;
  };

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats para Admin - Métricas generales del sistema */}
          {canViewAllStats && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Órdenes Activas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeOrders || 0}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        +12% vs mes anterior
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vehículos en Taller</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.vehiclesInShop || 0}</p>
                      <p className="text-sm text-orange-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {stats?.pendingDelivery || 0} próximos a entregar
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Car className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Facturación Mensual</p>
                      <p className="text-3xl font-bold text-gray-900">${stats?.monthlyRevenue || '0'}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        +8.2% vs mes anterior
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Operarios Activos</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.activeWorkers || 0}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        de {stats?.totalWorkers || 0} total
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <HardHat className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Stats para Operarios - Métricas de su trabajo */}
          {isOperator && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mis Órdenes Pendientes</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myPendingOrders || 0}</p>
                      <p className="text-sm text-orange-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Requieren atención
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vehículos Entregados</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myCompletedOrders || 0}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Esta semana
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Car className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myAvgTime || '2.5h'}</p>
                      <p className="text-sm text-blue-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Por orden
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Eficiencia</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myEfficiency || '95%'}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Cumplimiento
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Stats para Clientes - Métricas básicas */}
          {isClient && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mis Órdenes</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myOrders || 0}</p>
                      <p className="text-sm text-blue-600 flex items-center">
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Total
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Proceso</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myPendingOrders || 0}</p>
                      <p className="text-sm text-orange-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendientes
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completadas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myCompletedOrders || 0}</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Este mes
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vehículos</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.myVehicles || 0}</p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Car className="h-3 w-3 mr-1" />
                        Registrados
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Car className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Orders and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isClient ? 'Mis Órdenes Activas' : 'Órdenes Recientes'}
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    {isClient ? 'Ver Historial' : 'Ver todas'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay órdenes recientes
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {recentOrders.map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {getVehicleIcon(order.vehicle?.brand || '')}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {order.vehicle?.brand} {order.vehicle?.model} {order.vehicle?.year}
                            </p>
                            <p className="text-sm text-gray-600">{order.vehicle?.plate}</p>
                            {!isClient && (
                              <p className="text-sm text-gray-500">
                                {order.client?.firstName} {order.client?.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                          {order.operator && (
                            <p className="text-sm text-gray-500 mt-1">
                              {order.operator.firstName} {order.operator.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay notificaciones pendientes
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {notifications.map((notification: any) => (
                    <div key={notification.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      notification.priority === 'high' ? 'bg-red-50 border-red-200' :
                      notification.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Solo para administradores */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => setShowNewOrderModal(true)}
                  className="flex items-center space-x-3 p-4 h-auto justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                  variant="outline"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Nueva Orden</p>
                    <p className="text-sm opacity-75">Crear orden de servicio</p>
                  </div>
                </Button>

                <Button
                  onClick={() => setShowNewClientModal(true)}
                  className="flex items-center space-x-3 p-4 h-auto justify-start bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  variant="outline"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Nuevo Cliente</p>
                    <p className="text-sm opacity-75">Registrar cliente</p>
                  </div>
                </Button>

                <Button
                  className="flex items-center space-x-3 p-4 h-auto justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                  variant="outline"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Inventario</p>
                    <p className="text-sm opacity-75">Gestionar repuestos</p>
                  </div>
                </Button>

                <Button
                  className="flex items-center space-x-3 p-4 h-auto justify-start bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                  variant="outline"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Reportes</p>
                    <p className="text-sm opacity-75">Generar informes</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <NewOrderModal 
        open={showNewOrderModal} 
        onOpenChange={setShowNewOrderModal} 
      />
      
      <NewClientModal 
        open={showNewClientModal} 
        onOpenChange={setShowNewClientModal} 
      />
    </>
  );
}
