import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Calendar, MapPin, Gauge, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface ClientVehiclesProps {
  clientId: number;
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  engineNumber: string;
  vehicleType: string;
  soatExpiry: string | null;
  technicalInspectionExpiry: string | null;
  mileage: number | null;
  isActive: boolean;
  createdAt: string;
}

export default function ClientVehicles({ clientId }: ClientVehiclesProps) {
  const { data: vehicles = [], isLoading, error } = useQuery({
    queryKey: ['/api/clients', clientId, 'vehicles'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');
      
      // Ahora los vehículos se obtienen desde users.id en lugar de clients.id
      const response = await fetch(`/api/users/${clientId}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar vehículos');
      }
      
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-2">Error al cargar vehículos</p>
        <p className="text-gray-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8">
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">Este cliente no tiene vehículos registrados</p>
        <p className="text-gray-400 text-sm">Los vehículos aparecerán aquí cuando se registren</p>
      </div>
    );
  }

  // Función para verificar si una fecha está vencida
  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // Función para formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No configurada';
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Total de Vehículos: {vehicles.length}
        </h3>
        <Badge variant={vehicles.some(v => v.isActive) ? "default" : "secondary"}>
          {vehicles.filter(v => v.isActive).length} Activos
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((vehicle: Vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {vehicle.plate}
                      </Badge>
                      <Badge variant={vehicle.isActive ? "default" : "secondary"} className="text-xs">
                        {vehicle.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Información básica */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{vehicle.year}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{vehicle.color || 'N/A'}</span>
                  </div>
                </div>

                {/* Kilometraje */}
                {vehicle.mileage && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Gauge className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                )}

                {/* SOAT */}
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">SOAT:</span>
                  <span className={`font-medium ${
                    isExpired(vehicle.soatExpiry) ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatDate(vehicle.soatExpiry)}
                  </span>
                  {isExpired(vehicle.soatExpiry) && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Revisión Técnica */}
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">Revisión Técnica:</span>
                  <span className={`font-medium ${
                    isExpired(vehicle.technicalInspectionExpiry) ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatDate(vehicle.technicalInspectionExpiry)}
                  </span>
                  {isExpired(vehicle.technicalInspectionExpiry) && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                {/* Información adicional */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>VIN: {vehicle.vin || 'N/A'}</div>
                    <div>Motor: {vehicle.engineNumber || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
