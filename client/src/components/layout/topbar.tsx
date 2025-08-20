import { useState } from "react";
import { Search, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import NewOrderModal from "@/components/modals/new-order-modal";
import { useAuth } from "@/hooks/use-auth";

export default function Topbar() {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  // Verificar permisos
  const isClient = user?.role === 'user';
  const isOperator = user?.role === 'operator';
  const canCreateOrders = user?.role === 'admin'; // Solo admin puede crear órdenes

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    select: (data) => data?.filter((n: any) => !n.isRead) || [],
  });

  const unreadCount = notifications?.length || 0;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // TODO: Implement search functionality
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Resumen general del taller</p>
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
