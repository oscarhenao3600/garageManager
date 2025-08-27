import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, Car, FileText, DollarSign, AlertTriangle } from "lucide-react";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
}

export default function OrderDetailsModal({ 
  open, 
  onOpenChange, 
  orderId 
}: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'procedures'>('details');

  // Obtener detalles de la orden
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['/api/service-orders', orderId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/service-orders/${orderId}`);
      return response.json();
    },
    enabled: open && !!orderId,
  });

  // Obtener historial de estados
  const { data: statusHistory = [] } = useQuery({
    queryKey: ['/api/service-orders', orderId, 'history'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/service-orders/${orderId}/history`);
      return response.json();
    },
    enabled: open && !!orderId && activeTab === 'history',
  });

  // Obtener items de la orden
  const { data: orderItems = [] } = useQuery({
    queryKey: ['/api/service-orders', orderId, 'items'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/service-orders/${orderId}/items`);
        if (response.ok) {
          return response.json();
        }
        return [];
      } catch (error) {
        console.error('Error fetching order items:', error);
        return [];
      }
    },
    enabled: open && !!orderId && activeTab === 'procedures',
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !order) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center p-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar los detalles</h3>
            <p className="text-gray-600">No se pudieron cargar los detalles de la orden</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Orden de Servicio: {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la orden de servicio
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 border-b">
          <Button
            variant={activeTab === 'details' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('details')}
          >
            Detalles
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
          >
            Historial
          </Button>
          <Button
            variant={activeTab === 'procedures' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('procedures')}
          >
            Items
          </Button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
                <Badge className={getPriorityColor(order.priority)}>
                  {getPriorityText(order.priority)}
                </Badge>
              </div>

              {/* Client and Vehicle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nombre</p>
                      <p className="text-sm">{order.client?.firstName} {order.client?.lastName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Documento</p>
                      <p className="text-sm">{order.client?.documentNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Teléfono</p>
                      <p className="text-sm">{order.client?.phone}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Información del Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Placa</p>
                      <p className="text-sm">{order.vehicle?.plate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Marca/Modelo</p>
                      <p className="text-sm">{order.vehicle?.brand} {order.vehicle?.model} {order.vehicle?.year}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Color</p>
                      <p className="text-sm">{order.vehicle?.color || 'No especificado'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Descripción del Servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.description}</p>
                </CardContent>
              </Card>

              {/* Operator and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Operario Asignado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {order.operator ? (
                      <p className="text-sm">{order.operator.firstName} {order.operator.lastName}</p>
                    ) : (
                      <p className="text-sm text-gray-500">Sin asignar</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fechas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Creada</p>
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.startDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Iniciada</p>
                        <p className="text-sm">{formatDate(order.startDate)}</p>
                      </div>
                    )}
                    {order.completionDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Completada</p>
                        <p className="text-sm">{formatDate(order.completionDate)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Costs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Información de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Costo Estimado</p>
                      <p className="text-sm">
                        {order.estimatedCost ? formatCurrency(order.estimatedCost) : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Costo Final</p>
                      <p className="text-sm">
                        {order.finalCost ? formatCurrency(order.finalCost) : 'No especificado'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tiempos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Información de Tiempos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tiempo Estimado</p>
                      <p className="text-sm">
                        {order.estimatedTime ? 
                          `${Math.floor(order.estimatedTime / 60)}h ${order.estimatedTime % 60}min` : 
                          'No especificado'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tiempo Real</p>
                      <p className="text-sm">
                        {order.actualTime ? 
                          `${Math.floor(order.actualTime / 60)}h ${order.actualTime % 60}min` : 
                          'No especificado'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Toma de Orden */}
              {(order.takenBy || order.takenAt) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información de Toma de Orden
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.takenBy && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Tomada Por</p>
                          <p className="text-sm">ID: {order.takenBy}</p>
                        </div>
                      )}
                      {order.takenAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Fecha de Toma</p>
                          <p className="text-sm">{formatDate(order.takenAt)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historial de Estados</h3>
              {statusHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay historial disponible</p>
              ) : (
                <div className="space-y-3">
                  {statusHistory.map((entry: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(entry.newStatus)}>
                              {getStatusText(entry.newStatus)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {entry.oldStatus && `de ${getStatusText(entry.oldStatus)}`}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        {entry.comment && (
                          <p className="text-sm text-gray-600 mt-2">{entry.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'procedures' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Items de la Orden</h3>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay items registrados para esta orden</p>
              ) : (
                <div className="space-y-3">
                  {orderItems.map((item: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-700">
                              {item.itemType === 'service' ? 'Servicio' : 
                               item.itemType === 'part' ? 'Repuesto' : 
                               item.itemType === 'material' ? 'Material' : item.itemType}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {item.description}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${item.totalPrice}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} x ${item.unitPrice}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Orden:</span> {item.orderIndex}
                          </div>
                          <div>
                            <span className="font-medium">Creado:</span> {new Date(item.createdAt).toLocaleDateString('es-CO')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 