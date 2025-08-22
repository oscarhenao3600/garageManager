import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Phone, Mail, MapPin, Users } from "lucide-react";
import NewClientModal from "@/components/modals/new-client-modal";
import EditClientModal from "@/components/modals/edit-client-modal";
import { useAuth } from "@/hooks/use-auth";
import ClientVehicles from "@/components/client-vehicles";

export default function Clients() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editClient, setEditClient] = useState<any | null>(null); // Estado para edición
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showVehiclesModal, setShowVehiclesModal] = useState(false); // Estado para modal de vehículos
  const [selectedClientForVehicles, setSelectedClientForVehicles] = useState<any | null>(null); // Cliente seleccionado para ver vehículos
  const { user } = useAuth();

  // Verificar permisos
  const isClient = user?.role === 'user';
  const canManageClients = !isClient; // Solo admin, operator, etc. pueden gestionar clientes

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients', { search: searchQuery }],
  });

  // Filtrar clientes localmente
  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = !searchQuery || 
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.documentNumber.includes(searchQuery) ||
      client.phone.includes(searchQuery);
    
    const matchesCity = !filterCity || client.city === filterCity;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && client.isActive) ||
      (filterStatus === "inactive" && !client.isActive);
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  // Obtener ciudades únicas para el filtro
  const uniqueCities = [...new Set(clients.map((client: any) => client.city).filter(Boolean))];

  // Aplicar estilos personalizados del scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .clients-grid::-webkit-scrollbar {
        width: 12px !important;
        background-color: #f3f4f6 !important;
      }
      .clients-grid::-webkit-scrollbar-track {
        background-color: #f3f4f6 !important;
        border-radius: 6px !important;
      }
      .clients-grid::-webkit-scrollbar-thumb {
        background-color: #9ca3af !important;
        border-radius: 6px !important;
        border: 2px solid #f3f4f6 !important;
      }
      .clients-grid::-webkit-scrollbar-thumb:hover {
        background-color: #6b7280 !important;
      }
      .clients-grid {
        scrollbar-width: thin !important;
        scrollbar-color: #9ca3af #f3f4f6 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

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
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isClient ? 'Información de Clientes' : 'Clientes'}
            </h1>
            <p className="text-gray-600">
              {isClient 
                ? 'Consulta la información de clientes del sistema' 
                : 'Gestiona la información de todos los clientes'
              }
            </p>
          </div>
          {canManageClients && (
            <Button onClick={() => setShowNewClientModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          )}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, documento o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filtros Avanzados */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Ciudad:</span>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Todas las ciudades</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>📊 Mostrando</span>
                <Badge variant="outline" className="font-mono">
                  {filteredClients.length} de {clients.length}
                </Badge>
                <span>clientes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="space-y-4">
          {/* Indicador de scroll */}

          
          <div className="relative">
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              style={{ 
                maxHeight: '500px',
                overflowY: 'scroll',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fafafa'
              }}
            >
              {filteredClients.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-12 text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      {clients.length === 0 ? (
                        <>
                          <p className="text-gray-500 text-lg mb-2">No hay clientes registrados</p>
                          <p className="text-gray-400 text-sm mb-4">Comienza agregando tu primer cliente al sistema</p>
                          {canManageClients && (
                            <Button 
                              onClick={() => setShowNewClientModal(true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Crear Primer Cliente
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-gray-500 text-lg mb-2">No se encontraron resultados</p>
                          <p className="text-gray-400 text-sm mb-4">
                            No hay clientes que coincidan con los filtros aplicados
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setSearchQuery("");
                                setFilterCity("");
                                setFilterStatus("all");
                              }}
                              className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                              Limpiar Filtros
                            </Button>
                            {canManageClients && (
                              <Button 
                                onClick={() => setShowNewClientModal(true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Nuevo Cliente
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                filteredClients.map((client: any) => (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {client.firstName} {client.lastName}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs font-mono bg-gray-50">
                                {client.documentNumber}
                              </Badge>
                              <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
                                {client.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {client.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{client.phone}</span>
                          </div>
                        )}
                        
                        {client.email && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{client.email}</span>
                          </div>
                        )}
                        
                        {client.city && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {client.city}{client.department && `, ${client.department}`}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-xs text-gray-500">
                            Cliente desde {new Date(client.createdAt).toLocaleDateString('es-CO')}
                          </span>
                          {canManageClients && (
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedClientForVehicles(client);
                                  setShowVehiclesModal(true);
                                }}
                              >
                                Ver Vehículos
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setEditClient(client)}>
                                Editar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            {/* Indicador de scroll al final */}
            {filteredClients.length > 6 && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-xs text-gray-600">
                    ↑ Desliza hacia arriba para ver el inicio
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón flotante para ir al inicio */}
        {filteredClients.length > 12 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={() => {
                const gridElement = document.querySelector('.grid.overflow-y-auto');
                if (gridElement) {
                  gridElement.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 p-0 shadow-lg"
              title="Ir al inicio de la lista"
            >
              ↑
            </Button>
          </div>
        )}

        {/* Botón de prueba de scroll */}
        {filteredClients.length > 6 && (
          <div className="fixed bottom-6 left-6 z-50">
            <Button
              onClick={() => {
                const gridElement = document.querySelector('.grid.overflow-y-auto');
                if (gridElement) {
                  gridElement.scrollTo({ top: gridElement.scrollHeight, behavior: 'smooth' });
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 p-0 shadow-lg"
              title="Ir al final de la lista"
            >
              ↓
            </Button>
          </div>
        )}
      </div>

      <NewClientModal 
        open={showNewClientModal} 
        onOpenChange={setShowNewClientModal} 
      />
      <EditClientModal
        open={!!editClient}
        onOpenChange={(open) => {
          if (!open) setEditClient(null);
        }}
        client={editClient}
      />

      {/* Modal de Vehículos del Cliente */}
      {showVehiclesModal && selectedClientForVehicles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Vehículos de {selectedClientForVehicles.firstName} {selectedClientForVehicles.lastName}
                </h2>
                <p className="text-gray-600 mt-1">
                  Documento: {selectedClientForVehicles.documentNumber}
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowVehiclesModal(false);
                  setSelectedClientForVehicles(null);
                }}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ClientVehicles clientId={selectedClientForVehicles.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
