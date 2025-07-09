import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, HardHat, Phone, Mail, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Workers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['/api/workers'],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/service-orders'],
  });

  // Calculate worker statistics
  const getWorkerStats = (workerId: number) => {
    const workerOrders = orders.filter((order: any) => order.operatorId === workerId);
    const activeOrders = workerOrders.filter((order: any) => 
      order.status === 'in_progress' || order.status === 'pending'
    );
    const completedOrders = workerOrders.filter((order: any) => order.status === 'completed');
    
    return {
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      totalOrders: workerOrders.length
    };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'operator': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'operator': return 'Operario';
      default: return role;
    }
  };

  const filteredWorkers = workers.filter((worker: any) => {
    if (!searchQuery) return true;
    
    const fullName = `${worker.firstName} ${worker.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchLower) || 
           worker.username.toLowerCase().includes(searchLower) ||
           worker.email.toLowerCase().includes(searchLower);
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operarios</h1>
          <p className="text-gray-600">Gestiona el equipo de trabajo del taller</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Operario
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, usuario o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <HardHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron operarios</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredWorkers.map((worker: any) => {
            const stats = getWorkerStats(worker.id);
            
            return (
              <Card key={worker.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <HardHat className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {worker.firstName} {worker.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-600">@{worker.username}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getRoleColor(worker.role)}>
                        {getRoleText(worker.role)}
                      </Badge>
                      <Badge variant={worker.isActive ? "default" : "secondary"}>
                        {worker.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{worker.email}</span>
                      </div>
                      
                      {worker.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{worker.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Work Statistics */}
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-900 mb-3">Estadísticas de Trabajo</p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center space-x-1">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span className="text-lg font-bold text-gray-900">{stats.activeOrders}</span>
                          </div>
                          <p className="text-xs text-gray-600">Activas</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-lg font-bold text-gray-900">{stats.completedOrders}</span>
                          </div>
                          <p className="text-xs text-gray-600">Completadas</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center space-x-1">
                            <AlertCircle className="h-3 w-3 text-blue-500" />
                            <span className="text-lg font-bold text-gray-900">{stats.totalOrders}</span>
                          </div>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="border-t pt-4">
                      {stats.activeOrders > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-orange-700 font-medium">
                              Trabajando en {stats.activeOrders} orden{stats.activeOrders > 1 ? 'es' : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-700 font-medium">
                              Disponible para nuevas órdenes
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        Desde {new Date(worker.createdAt).toLocaleDateString('es-CO')}
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Ver Órdenes
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
