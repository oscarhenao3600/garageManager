import { useState, useEffect } from "react";
import { Search, Plus, Bell, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import NewOrderModal from "@/components/modals/new-order-modal";
import { useAuth } from "@/hooks/use-auth";
// import { useTaller } from "@/contexts/TallerContext";

export default function Topbar() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tallerNombre, setTallerNombre] = useState("Mi Taller");
  const [tallerBanner, setTallerBanner] = useState("");
  const { user } = useAuth();
  // const { taller } = useTaller();
  const taller = { nombre: tallerNombre }; // Valor dinámico

  // Verificar permisos
  const isClient = user?.role === 'user';
  const isOperator = user?.role === 'operator';
  const canCreateOrders = user?.role === 'admin'; // Solo admin puede crear órdenes

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    select: (data) => data?.filter((n: any) => !n.isRead) || [],
  });

  const unreadCount = notifications?.length || 0;

  // Función para cargar datos del taller
  const cargarDatosTaller = async () => {
    try {
      console.log('🔄 Cargando datos del taller en Topbar...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No hay token en Topbar');
        return;
      }

      // Cargar datos de la empresa
      const companyResponse = await fetch('/api/company-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.name) {
          setTallerNombre(companyData.name);
          console.log('✅ Nombre del taller actualizado en Topbar:', companyData.name);
        }
      }

      // Cargar imágenes del taller
      const imagesResponse = await fetch('/api/images/default-taller', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        if (imagesData.imagenes && imagesData.imagenes.banner) {
          const bannerUrl = `/uploads/talleres/${imagesData.imagenes.banner}`;
          setTallerBanner(bannerUrl);
          console.log('🖼️ Banner encontrado en Topbar:', bannerUrl);
        }
      }
    } catch (error) {
      console.log('❌ Error cargando datos del taller en Topbar:', error);
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
            {tallerBanner ? (
              <img 
                src={tallerBanner} 
                alt={`Banner de ${tallerNombre}`}
                className="h-16 w-32 object-cover rounded-lg border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="h-16 w-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                Banner
              </div>
            )}
            
            {/* Información del taller */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
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
                className="w-80 pl-10"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Quick Actions */}
            {canCreateOrders && (
              <Button 
                onClick={() => setShowNewOrderModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            )}
            
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
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
