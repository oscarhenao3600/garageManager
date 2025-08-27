import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Car, AlertTriangle } from "lucide-react";
import NewVehicleModal from "@/components/modals/new-vehicle-modal";
import EditVehicleModal from "@/components/modals/edit-vehicle-modal";
import { useAuth } from "@/hooks/use-auth";

export default function Vehicles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewVehicleModalOpen, setIsNewVehicleModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any | null>(null); // Nuevo estado para edición
  const { user } = useAuth();

  // Verificar permisos
  const isClient = user?.role === 'user';
  const canManageVehicles = !isClient; // Solo admin, operator, etc. pueden gestionar vehículos

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  // Filtrar vehículos
  const filteredVehicles = (vehicles as any[]).filter((vehicle: any) => {
    const matchesPlate = vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOwner = `${vehicle.client?.firstName} ${vehicle.client?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlate || matchesBrand || matchesModel || matchesOwner;
  });

  const getDocumentStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { status: 'unknown', text: 'Sin fecha', color: 'bg-gray-100 text-gray-700' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Vencido', color: 'bg-red-100 text-red-700' };
    if (diffDays <= 30) return { status: 'warning', text: 'Por vencer', color: 'bg-orange-100 text-orange-700' };
    return { status: 'valid', text: 'Vigente', color: 'bg-green-100 text-green-700' };
  };

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
          <h1 className="text-3xl font-bold text-gray-900">
            {isClient ? 'Vehículos del Sistema' : 'Vehículos'}
          </h1>
          <p className="text-gray-600">
            {isClient 
              ? 'Consulta la información de vehículos registrados' 
              : 'Gestiona la información de todos los vehículos registrados'
            }
          </p>
        </div>
        {canManageVehicles && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsNewVehicleModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por placa, marca, modelo o propietario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No se encontraron vehículos</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredVehicles.map((vehicle: any) => {
            const soatStatus = getDocumentStatus(vehicle.soatExpiry);
            const techStatus = getDocumentStatus(vehicle.technicalInspectionExpiry);
            
            return (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {vehicle.brand} {vehicle.model}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{vehicle.plate}</p>
                      </div>
                    </div>
                    <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                      {vehicle.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Vehicle Info */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Año</p>
                        <p className="font-medium">{vehicle.year}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Color</p>
                        <p className="font-medium">{vehicle.color || 'No especificado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kilometraje</p>
                        <p className="font-medium">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'No especificado'}</p>
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="border-t pt-3">
                      <p className="text-xs text-gray-500 mb-1">Propietario</p>
                      <p className="text-sm font-medium">
                        {vehicle.client?.firstName} {vehicle.client?.lastName}
                      </p>
                      <p className="text-xs text-gray-600">{vehicle.client?.documentNumber}</p>
                    </div>

                    {/* Document Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">SOAT</span>
                        <Badge className={soatStatus.color} variant="secondary">
                          {soatStatus.text}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Revisión Técnica</span>
                        <Badge className={techStatus.color} variant="secondary">
                          {techStatus.text}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-xs text-gray-500">
                        Registro: {new Date(vehicle.createdAt).toLocaleDateString('es-CO')}
                      </span>
                      {canManageVehicles && (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            Ver Historial
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditVehicle(vehicle)}>
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Alerts */}
                    {(soatStatus.status === 'expired' || soatStatus.status === 'warning' ||
                      techStatus.status === 'expired' || techStatus.status === 'warning') && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-700 font-medium">
                            Documentos requieren atención
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal para nuevo vehículo */}
      <NewVehicleModal 
        open={isNewVehicleModalOpen} 
        onOpenChange={setIsNewVehicleModalOpen} 
      />
      <EditVehicleModal
        open={!!editVehicle}
        onOpenChange={(open) => {
          if (!open) setEditVehicle(null);
        }}
        vehicle={editVehicle}
      />
    </div>
  );
}
