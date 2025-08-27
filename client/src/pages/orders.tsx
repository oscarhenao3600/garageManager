import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Play, UserPlus, RefreshCw } from "lucide-react";
import NewOrderModal from "@/components/modals/new-order-modal";
import AssignOperatorModal from "@/components/modals/assign-operator-modal";
import OrderDetailsModal from "@/components/modals/order-details-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Orders() { 
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showAssignOperatorModal, setShowAssignOperatorModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar si el usuario es cliente (rol 'user')
  const isClient = user?.role === 'user';
  const canCreateOrders = !isClient; // Solo admin, operator, etc. pueden crear órdenes
  const canManageOrders = !isClient; // Solo admin, operator, etc. pueden gestionar órdenes

  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['service-orders', { status: statusFilter, userId: user?.id, userRole: user?.role }],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Para clientes, no aplicar filtro de estado para mostrar historial completo
      if (statusFilter && !isClient) {
        params.append('status', statusFilter);
      }
      // Agregar userId y userRole para filtrado en el backend
      if (user?.id) {
        params.append('userId', user.id.toString());
      }
      if (user?.role) {
        params.append('userRole', user.role);
      }
      try {
        console.log('🔍 Fetching orders...', { params: params.toString(), user: user?.id, role: user?.role });
        const response = await apiRequest('GET', `/api/service-orders?${params}`);
        const data = await response.json();
        console.log('✅ Orders received:', data);
        return data;
      } catch (err) {
        console.error('❌ Error fetching orders:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Debug logs
  console.log('📊 Orders state:', { 
    isLoading, 
    error, 
    ordersCount: orders?.length || 0,
    user: user?.id,
    userRole: user?.role 
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'billed': return 'bg-blue-100 text-blue-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
      case 'billed': return 'Facturado';
      case 'closed': return 'Cerrado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return priority;
    }
  };

  // Función para manejar el inicio de una orden
  const handleStartOrder = (order: any) => {
    if (!order.operator) {
      // Si no tiene operario asignado, abrir modal de asignación
      setSelectedOrder(order);
      setShowAssignOperatorModal(true);
    } else {
      // Si ya tiene operario, iniciar directamente
      startOrderMutation.mutate(order.id);
    }
  };

  // Función para manejar ver detalles de una orden
  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // Mutación para iniciar orden (cuando ya tiene operario asignado)
  const startOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest('PATCH', `/api/service-orders/${orderId}/status`, {
        status: 'in_progress',
        comment: 'Orden iniciada'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast({
        title: "Orden iniciada",
        description: "La orden de servicio ha sido iniciada exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error al iniciar orden:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo iniciar la orden.",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vehicle?.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Solo incluir búsqueda por cliente si no es un cliente
      (!isClient && order.client?.firstName && order.client?.lastName && 
       `${order.client.firstName} ${order.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold text-red-600 mb-2">Error al cargar las órdenes</h2>
              <p className="text-gray-600 mb-4">Se produjo un error al intentar cargar las órdenes de servicio</p>
              <div className="text-sm text-gray-500 space-y-2">
                <p>• Verifica que el backend esté funcionando</p>
                <p>• Revisa la consola del navegador para más detalles</p>
                <p>• Asegúrate de estar autenticado correctamente</p>
              </div>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => refetch()}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                >
                  Recargar Página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isClient ? 'Mis Órdenes de Servicio' : 'Órdenes de Servicio'}
            </h1>
            <p className="text-gray-600">
              {isClient 
                ? 'Consulta el estado de tus órdenes de servicio' 
                : 'Gestiona todas las órdenes de trabajo del taller'
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            {canCreateOrders && (
              <Button onClick={() => setShowNewOrderModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={isClient 
                      ? "Buscar por número de orden o placa..." 
                      : "Buscar por número de orden, placa o cliente..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_progress">En Proceso</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="billed">Facturado</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <p className="text-gray-500 text-lg">No se encontraron órdenes de servicio</p>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>• Verifica que tengas permisos para ver órdenes</p>
                    <p>• Asegúrate de que el backend esté funcionando</p>
                    <p>• Revisa la consola del navegador para errores</p>
                  </div>
                  {canCreateOrders && (
                    <Button 
                      onClick={() => setShowNewOrderModal(true)}
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Orden
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                        <Badge className={getPriorityColor(order.priority)}>
                          {getPriorityText(order.priority)}
                        </Badge>
                      </div>
                      
                      <div className={`grid gap-4 mb-4 ${!isClient ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {/* Solo mostrar información del cliente si no es un cliente */}
                        {!isClient && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Cliente</p>
                            <p className="text-sm text-gray-900">
                              {order.client?.firstName} {order.client?.lastName}
                            </p>
                            <p className="text-xs text-gray-600">{order.client?.documentNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-500">Vehículo</p>
                          <p className="text-sm text-gray-900">
                            {order.vehicle?.brand} {order.vehicle?.model} {order.vehicle?.year}
                          </p>
                          <p className="text-xs text-gray-600">{order.vehicle?.plate}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Operario</p>
                          <p className="text-sm text-gray-900">
                            {order.operator ? `${order.operator.firstName} ${order.operator.lastName}` : 'Sin asignar'}
                          </p>
                        </div>
                      </div>

                      {/* Información adicional del modelo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Tiempos */}
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Tiempos</p>
                          <div className="space-y-1">
                            {order.estimatedTime && (
                              <p className="text-xs text-gray-600">
                                Estimado: {Math.floor(order.estimatedTime / 60)}h {order.estimatedTime % 60}min
                              </p>
                            )}
                            {order.actualTime && (
                              <p className="text-xs text-gray-600">
                                Real: {Math.floor(order.actualTime / 60)}h {order.actualTime % 60}min
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Fechas importantes */}
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Fechas</p>
                          <div className="space-y-1">
                            {order.startDate && (
                              <p className="text-xs text-gray-600">
                                Inicio: {new Date(order.startDate).toLocaleDateString('es-CO')}
                              </p>
                            )}
                            {order.completionDate && (
                              <p className="text-xs text-gray-600">
                                Finalización: {new Date(order.completionDate).toLocaleDateString('es-CO')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">Descripción</p>
                        <p className="text-sm text-gray-700">{order.description}</p>
                      </div>

                      {/* Información de costos y toma de orden */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Creado: {new Date(order.createdAt).toLocaleDateString('es-CO')}</span>
                          {order.estimatedCost && (
                            <span>Costo estimado: ${order.estimatedCost}</span>
                          )}
                          {order.finalCost && (
                            <span className="font-medium text-green-600">
                              Costo final: ${order.finalCost}
                            </span>
                          )}
                        </div>
                        {order.takenBy && order.takenAt && (
                          <span className="text-blue-600">
                            Tomada por: {order.takenBy} - {new Date(order.takenAt).toLocaleDateString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        Ver Detalles
                      </Button>
                      
                      {/* Solo mostrar botones de gestión para usuarios que no son clientes */}
                      {canManageOrders && (
                        <>
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStartOrder(order)}
                              disabled={startOrderMutation.isPending}
                            >
                              {!order.operator ? (
                                <>
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Asignar e Iniciar
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-1" />
                                  Iniciar
                                </>
                              )}
                            </Button>
                          )}
                          {order.status === 'completed' && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              Facturar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <NewOrderModal 
        open={showNewOrderModal} 
        onOpenChange={setShowNewOrderModal} 
      />

      {selectedOrder && (
        <AssignOperatorModal
          open={showAssignOperatorModal}
          onOpenChange={setShowAssignOperatorModal}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.orderNumber}
          onSuccess={() => {
            setSelectedOrder(null);
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          open={showOrderDetailsModal}
          onOpenChange={setShowOrderDetailsModal}
          orderId={selectedOrder.id}
        />
      )}
    </>
  );
}
