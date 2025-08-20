import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Phone, Mail, MapPin } from "lucide-react";
import NewClientModal from "@/components/modals/new-client-modal";
import EditClientModal from "@/components/modals/edit-client-modal";
import { useAuth } from "@/hooks/use-auth";

export default function Clients() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editClient, setEditClient] = useState<any | null>(null); // Estado para edición
  const { user } = useAuth();

  // Verificar permisos
  const isClient = user?.role === 'user';
  const canManageClients = !isClient; // Solo admin, operator, etc. pueden gestionar clientes

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients', { search: searchQuery }],
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

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {clients.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron clientes</p>
                  {canManageClients && (
                    <Button 
                      onClick={() => setShowNewClientModal(true)}
                      className="mt-4 bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Cliente
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            clients.map((client: any) => (
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
                        <p className="text-sm text-gray-600">{client.documentNumber}</p>
                      </div>
                    </div>
                    <Badge variant={client.isActive ? "default" : "secondary"}>
                      {client.isActive ? "Activo" : "Inactivo"}
                    </Badge>
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
                          <Button variant="outline" size="sm">
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
    </>
  );
}
