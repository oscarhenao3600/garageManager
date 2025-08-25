import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import CreateNotificationModal from "@/components/CreateNotificationModal";
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Car, 
  Calendar,
  DollarSign,
  FileText,
  History,
  Bell
} from "lucide-react";

interface ServiceOrder {
  id: number;
  orderNumber: string;
  description: string;
  status: string;
  priority: string;
  estimatedCost?: string;
  finalCost?: string;
  startDate?: string;
  completionDate?: string;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    documentNumber: string;
  };
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year: number;
  };
  operator: {
    firstName: string;
    lastName: string;
  };
}

interface StatusHistoryEntry {
  id: number;
  previousStatus: string;
  newStatus: string;
  changedBy: number;
  changedAt: string;
  notes?: string;
  operatorAction?: string;
}

export default function OperatorOrderManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showTakeDialog, setShowTakeDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showVehicleHistoryDialog, setShowVehicleHistoryDialog] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'assigned' | 'available'>('assigned');

  // Obtener órdenes asignadas al operario
  const { data: assignedOrders, isLoading: loadingAssignedOrders } = useQuery({
    queryKey: ['/api/operator/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/operator/orders');
      if (!response.ok) {
        throw new Error('Error al obtener órdenes asignadas');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'operator',
  });

  // Obtener órdenes disponibles para tomar
  const { data: availableOrders, isLoading: loadingAvailableOrders } = useQuery({
    queryKey: ['/api/operator/available-orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/operator/available-orders');
      if (!response.ok) {
        throw new Error('Error al obtener órdenes disponibles');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'operator',
  });

  // Obtener historial de vehículo
  const { data: vehicleHistory, isLoading: loadingVehicleHistory } = useQuery({
    queryKey: ['/api/operator/vehicle-history', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return [];
      const response = await apiRequest('GET', `/api/operator/vehicle-history/${selectedVehicleId}`);
      if (!response.ok) {
        throw new Error('Error al obtener historial del vehículo');
      }
      return response.json();
    },
    enabled: !!selectedVehicleId,
  });

  // Obtener historial de estados de una orden
  const { data: statusHistory } = useQuery({
    queryKey: ['/api/service-orders', selectedOrder?.id, 'status-history'],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const response = await apiRequest('GET', `/api/service-orders/${selectedOrder.id}/status-history`);
      if (!response.ok) {
        throw new Error('Error al obtener historial');
      }
      return response.json();
    },
    enabled: !!selectedOrder,
  });

  // Mutación para tomar una orden
  const takeOrderMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/service-orders/${orderId}/take`, { notes });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al tomar la orden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Orden tomada exitosamente",
        description: "La orden ha sido asignada a usted.",
      });
      setShowTakeDialog(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/operator/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al tomar la orden",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para liberar una orden
  const releaseOrderMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/service-orders/${orderId}/release`, { notes });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al liberar la orden');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Orden liberada exitosamente",
        description: "La orden ha sido liberada y está disponible para otros operarios.",
      });
      setShowReleaseDialog(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/operator/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al liberar la orden",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTakeOrder = async (orderId: number) => {
    setSelectedOrder(assignedOrders?.find((o: ServiceOrder) => o.id === orderId) || availableOrders?.find((o: ServiceOrder) => o.id === orderId) || null);
    setShowTakeDialog(true);
  };

  const handleReleaseOrder = async (orderId: number) => {
    setSelectedOrder(assignedOrders?.find((o: ServiceOrder) => o.id === orderId) || null);
    setShowReleaseDialog(true);
  };

  const handleViewStatusHistory = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowHistoryDialog(true);
  };

  const handleViewVehicleHistory = (vehiclePlate: string) => {
    // Por ahora, usamos un ID temporal basado en la placa
    // En una implementación real, necesitarías buscar el ID del vehículo por placa
    setSelectedVehicleId(vehiclePlate.length); // ID temporal basado en la longitud de la placa
    setShowVehicleHistoryDialog(true);
  };

  const handleTakeOrderConfirm = async () => {
    if (!selectedOrder || !notes.trim()) return;
    
    setIsLoading(true);
    try {
      await takeOrderMutation.mutateAsync({ orderId: selectedOrder.id, notes: notes.trim() });
      setShowTakeDialog(false);
      setNotes("");
      setSelectedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseOrderConfirm = async () => {
    if (!selectedOrder || !notes.trim()) return;
    
    setIsLoading(true);
    try {
      await releaseOrderMutation.mutateAsync({ orderId: selectedOrder.id, notes: notes.trim() });
      setShowReleaseDialog(false);
      setNotes("");
      setSelectedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingAssignedOrders || loadingAvailableOrders || loadingVehicleHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assignedOrders || assignedOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Mis Órdenes Asignadas
          </CardTitle>
          <CardDescription>
            No tienes órdenes asignadas en este momento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Gestión de Órdenes de Servicio
          </CardTitle>
          <CardDescription>
            Gestiona las órdenes asignadas y toma nuevas órdenes disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pestañas para navegar entre órdenes asignadas y disponibles */}
          <div className="flex space-x-1 mb-6">
            <Button
              variant={activeTab === 'assigned' ? 'default' : 'outline'}
              onClick={() => setActiveTab('assigned')}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mis Órdenes Asignadas ({assignedOrders?.length || 0})
            </Button>
            <Button
              variant={activeTab === 'available' ? 'default' : 'outline'}
              onClick={() => setActiveTab('available')}
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              Órdenes Disponibles ({availableOrders?.length || 0})
            </Button>
          </div>

          {/* Contenido de las pestañas */}
          {activeTab === 'assigned' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Órdenes Asignadas a Mí</h3>
              {assignedOrders && assignedOrders.length > 0 ? (
                <div className="grid gap-4">
                  {assignedOrders.map((order: ServiceOrder) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onTakeOrder={() => {}} // No se puede tomar una orden ya asignada
                      onReleaseOrder={() => handleReleaseOrder(order.id)}
                      onViewHistory={() => handleViewStatusHistory(order)}
                      onViewVehicleHistory={() => handleViewVehicleHistory(order.vehicle?.plate || '')}
                      showTakeButton={false}
                      showReleaseButton={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes órdenes asignadas actualmente</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'available' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Órdenes Disponibles para Tomar</h3>
              {availableOrders && availableOrders.length > 0 ? (
                <div className="grid gap-4">
                  {availableOrders.map((order: ServiceOrder) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onTakeOrder={() => handleTakeOrder(order.id)}
                      onReleaseOrder={() => {}} // No se puede liberar una orden no tomada
                      onViewHistory={() => {}} // No hay historial para órdenes no tomadas
                      onViewVehicleHistory={() => {}} // No hay acceso al historial del vehículo
                      showTakeButton={true}
                      showReleaseButton={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay órdenes disponibles para tomar</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para tomar orden */}
      <Dialog open={showTakeDialog} onOpenChange={setShowTakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tomar Orden #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea tomar esta orden? Una vez tomada, no podrá ser liberada por otros operarios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                placeholder="Agregue notas sobre la orden..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTakeDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleTakeOrderConfirm}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Tomando...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Tomar Orden
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para liberar orden */}
      <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar Orden #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea liberar esta orden? Se volverá a poner en estado pendiente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo de liberación *</label>
              <Textarea
                placeholder="Explique por qué libera esta orden..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReleaseDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleReleaseOrderConfirm}
                disabled={isLoading || !notes.trim()}
                variant="destructive"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Liberando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Liberar Orden
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para historial */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de Estados - #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Historial completo de cambios de estado de esta orden.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {statusHistory && statusHistory.length > 0 ? (
              <div className="space-y-3">
                {statusHistory.map((entry: StatusHistoryEntry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {entry.previousStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span>→</span>
                        <Badge>
                          {entry.newStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {entry.operatorAction && (
                          <Badge variant="secondary" className="text-xs">
                            {entry.operatorAction}
                          </Badge>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mb-1">{entry.notes}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(entry.changedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay historial disponible para esta orden.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para historial de vehículo */}
      <Dialog open={showVehicleHistoryDialog} onOpenChange={setShowVehicleHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de Vehículo - {selectedVehicleId ? 'Placa: ' + selectedVehicleId : ''}</DialogTitle>
            <DialogDescription>
              Historial completo de mantenimientos y reparaciones del vehículo.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {vehicleHistory && vehicleHistory.length > 0 ? (
              <div className="space-y-3">
                {vehicleHistory.map((entry: any) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {entry.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span>→</span>
                        <Badge>
                          {entry.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{entry.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay historial de vehículo disponible para esta orden.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para crear notificaciones */}
      <CreateNotificationModal
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
        serviceOrderId={selectedOrder?.id}
        orderNumber={selectedOrder?.orderNumber}
        orderDescription={selectedOrder?.description}
      />
    </div>
  );
}

// Componente OrderCard para mostrar información de órdenes
interface OrderCardProps {
  order: ServiceOrder;
  onTakeOrder: () => void;
  onReleaseOrder: () => void;
  onViewHistory: () => void;
  onViewVehicleHistory: () => void;
  showTakeButton: boolean;
  showReleaseButton: boolean;
}

function OrderCard({
  order,
  onTakeOrder,
  onReleaseOrder,
  onViewHistory,
  onViewVehicleHistory,
  showTakeButton,
  showReleaseButton
}: OrderCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; text: string }> = {
      pending: { variant: "outline", text: "Pendiente" },
      in_progress: { variant: "default", text: "En Progreso" },
      completed: { variant: "secondary", text: "Completada" },
      billed: { variant: "outline", text: "Facturada" },
      closed: { variant: "secondary", text: "Cerrada" }
    };
    
    const config = statusConfig[status] || { variant: "outline", text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; text: string }> = {
      low: { variant: "outline", text: "Baja" },
      medium: { variant: "default", text: "Media" },
      high: { variant: "destructive", text: "Alta" },
      urgent: { variant: "destructive", text: "Urgente" }
    };
    
    const config = priorityConfig[priority] || { variant: "outline", text: priority };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              #{order.orderNumber}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {order.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            {getStatusBadge(order.status)}
            {getPriorityBadge(order.priority)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Cliente */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium">
            {order.client.firstName} {order.client.lastName}
          </span>
          <Badge variant="outline" className="text-xs">
            {order.client.documentNumber}
          </Badge>
        </div>

        {/* Vehículo */}
        <div className="flex items-center gap-2 text-sm">
          <Car className="h-4 w-4 text-gray-500" />
          <span>
            {order.vehicle.brand} {order.vehicle.model} ({order.vehicle.year})
          </span>
          <Badge variant="outline" className="text-xs">
            {order.vehicle.plate}
          </Badge>
        </div>

        {/* Fechas */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>
            Creada: {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        {order.startDate && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-blue-600">
              Iniciada: {new Date(order.startDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Costos */}
        <div className="flex items-center gap-4 text-sm">
          {order.estimatedCost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span>Estimado: ${order.estimatedCost}</span>
            </div>
          )}
          {order.finalCost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Final: ${order.finalCost}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          {showTakeButton && (
            <Button
              size="sm"
              onClick={onTakeOrder}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Wrench className="h-4 w-4 mr-1" />
              Tomar
            </Button>
          )}

          {showReleaseButton && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onReleaseOrder}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Liberar
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onViewHistory}
          >
            <History className="h-4 w-4 mr-1" />
            Historial
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onViewVehicleHistory}
          >
            <Car className="h-4 w-4 mr-1" />
            Vehículo
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {}} // Removed handleCreateNotification
            className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300"
          >
            <Bell className="h-4 w-4 mr-1" />
            Notificar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
