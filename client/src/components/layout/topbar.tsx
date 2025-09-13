import { useState, useEffect } from "react";
import { Search, Plus, Bell, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import NewOrderModal from "@/components/modals/new-order-modal";
import { useAuth } from "@/hooks/use-auth";
import { useTallerImages } from "@/hooks/useTallerImages";
import { useWebSocket } from "@/hooks/use-websocket";
// import { useTaller } from "@/contexts/TallerContext";

export default function Topbar() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tallerNombre, setTallerNombre] = useState("Mi Taller");
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  
  // Usar el hook de imágenes del taller
  const { images } = useTallerImages();
  
  // Debug: mostrar las imágenes disponibles
  useEffect(() => {
    console.log('🖼️ Imágenes disponibles en Topbar:', images);
  }, [images]);
  
  // const { taller } = useTaller();
  const taller = { nombre: tallerNombre }; // Valor dinámico

  // Verificar permisos
  const canCreateOrders = user?.role === 'admin'; // Solo admin puede crear órdenes

  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    select: (data: any) => data?.filter((n: any) => !n.isRead) || [],
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  const unreadCount = notifications?.length || 0;

  // Función para cargar datos del taller
  const cargarDatosTaller = async () => {
    try {
      console.log(' Cargando datos del taller en Topbar...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No hay token en Topbar');
        return;
      }

      // Cargar datos de la empresa
      const companyResponse = await fetch('/api/company-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.name) {
          setTallerNombre(companyData.name);
          console.log('Nombre del taller actualizado en Topbar:', companyData.name);
        }
      }


    } catch (error) {
      console.log('Error cargando datos del taller en Topbar:', error);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosTaller();
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // TODO: Implement search functionality
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo del taller */}
            {images.logo ? (
              <img 
                src={images.banner} 
                alt={`Logo de ${tallerNombre}`}
                className="h-16 w-18 object-contain rounded-lg border border-gray-200 shadow-sm bg-white"
                onError={(e) => {
                  console.error('Error cargando logo del taller:', images.banner);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-16 w-18 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                {tallerNombre.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Información del taller */}
            <div className="flex items-center space-x-4">
              <div className="w-px h-12 bg-gray-300"></div>
              <h2 className="text-3xl font-bold text-gray-900">
                {taller ? taller.nombre : 'Dashboard'}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar por placa o cédula..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-80 pl-10 h-12 text-base"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            {/* Quick Actions */}
            {canCreateOrders && (
              <Button 
                onClick={() => setShowNewOrderModal(true)}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-6 text-base font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Orden
              </Button>
            )}
            
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative h-12 w-12">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
            
            {/* WebSocket Connection Status */}
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-12 w-12" title={isConnected ? "Conectado en tiempo real" : "Desconectado"}>
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <NewOrderModal 
        open={showNewOrderModal} 
        onOpenChange={setShowNewOrderModal} 
      />
    </>
  );
}
