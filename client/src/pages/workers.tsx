import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, HardHat, Phone, Mail, CheckCircle, Clock, AlertCircle, Users, TrendingUp, Award } from "lucide-react";
import NewWorkerModal from "@/components/modals/new-worker-modal";

export default function Workers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);

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

  // Estadísticas generales del equipo
  const teamStats = {
    totalWorkers: workers.length,
    activeWorkers: workers.filter((w: any) => w.isActive).length,
    operators: workers.filter((w: any) => w.role === 'operator').length,
    admins: workers.filter((w: any) => w.role === 'admin').length,
    totalOrders: orders.length,
    activeOrders: orders.filter((o: any) => o.status === 'in_progress' || o.status === 'pending').length,
    completedOrders: orders.filter((o: any) => o.status === 'completed').length,
  };

  const filteredWorkers = workers.filter((worker: any) => {
    const matchesSearch = !searchQuery || 
      `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || worker.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && worker.isActive) ||
      (statusFilter === 'inactive' && !worker.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
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

  if (!workers || workers.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operarios</h1>
            <p className="text-gray-600">Gestiona el equipo de trabajo del taller</p>
          </div>
          <Button 
            onClick={() => setShowNewWorkerModal(true)} 
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Operario
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <HardHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay operarios registrados</h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando operarios al equipo del taller
            </p>
            <Button 
              onClick={() => setShowNewWorkerModal(true)} 
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Operario
            </Button>
          </CardContent>
        </Card>

        <NewWorkerModal 
          open={showNewWorkerModal} 
          onOpenChange={setShowNewWorkerModal} 
        />
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
        <Button 
          onClick={() => setShowNewWorkerModal(true)} 
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Operario
        </Button>
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Operarios</p>
                <p className="text-2xl font-bold text-orange-600">{teamStats.totalWorkers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{teamStats.activeWorkers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Órdenes Activas</p>
                <p className="text-2xl font-bold text-blue-600">{teamStats.activeOrders}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-purple-600">{teamStats.completedOrders}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, usuario o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="operator">Operarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                <p className="text-gray-500">
                  {workers.length === 0 ? "No se encontraron operarios" : "No hay operarios que coincidan con los filtros"}
                </p>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar vista de órdenes del operario
                            console.log('Ver órdenes del operario:', worker.id);
                          }}
                        >
                          Ver Órdenes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implementar edición del operario
                            console.log('Editar operario:', worker.id);
                          }}
                        >
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

      <NewWorkerModal 
        open={showNewWorkerModal} 
        onOpenChange={setShowNewWorkerModal} 
      />
    </div>
  );
}
