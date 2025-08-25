import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Car, 
  Package, 
  HardHat, 
  FileText, 
  Bell, 
  LogOut,
  Wrench
} from "lucide-react";

interface StatsSection {
  pending?: number;
  lowStock?: number;
}

interface DashboardStats {
  orders: StatsSection;
  inventory: StatsSection;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  role?: string;
}

const menuItems: MenuItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/orders", label: "Órdenes de Servicio", icon: ClipboardList, badge: "orders.pending" },
  { path: "/operator-order-management", label: "Mis Órdenes", icon: Wrench, role: "operator" },
  { path: "/clients", label: "Clientes", icon: Users, role: "admin" },
  { path: "/vehicles", label: "Vehículos", icon: Car, role: "admin" },
  { path: "/inventory", label: "Inventario", icon: Package, badge: "inventory.lowStock", role: "admin" },
  { path: "/workers", label: "Operarios", icon: HardHat, role: "admin" },
  { path: "/billing", label: "Facturación", icon: FileText, role: "admin" },
  { path: "/notifications", label: "Notificaciones", icon: Bell },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [tallerNombre, setTallerNombre] = useState("Mi Taller");
  const [tallerDescripcion, setTallerDescripcion] = useState("Gestión Integral");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getBadgeValue = (badgeKey: string | undefined): number | null => {
    if (!badgeKey || !stats) return null;
    
    const [section, key] = badgeKey.split('.');
    if (!section || !key) return null;

    const sectionData = stats[section as keyof DashboardStats];
    const value = sectionData?.[key as keyof StatsSection];
    
    return typeof value === 'number' && value > 0 ? value : null;
  };

  // Función para cargar datos del taller
  const cargarDatosTaller = async () => {
    try {
      console.log('🔄 Cargando datos del taller en Sidebar...');
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No hay token en Sidebar');
        return;
      }

      // Cargar datos de la empresa
      const companyResponse = await fetch('/api/company-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Respuesta de company-settings en Sidebar:', companyResponse.status);

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        console.log('📊 Datos de empresa recibidos en Sidebar:', companyData);
        
        if (companyData.name) {
          setTallerNombre(companyData.name);
          console.log('✅ Nombre del taller actualizado:', companyData.name);
        }
        if (companyData.address) {
          setTallerDescripcion(companyData.address);
          console.log('✅ Dirección del taller actualizada:', companyData.address);
        }
      }

      // Cargar imágenes del taller desde el endpoint de imágenes
      const imagesResponse = await fetch('/api/images/default-taller', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Respuesta de imágenes en Sidebar:', imagesResponse.status);

      if (imagesResponse.ok) {
        const imagesData = await imagesResponse.json();
        console.log('🖼️ Datos de imágenes recibidos en Sidebar:', imagesData);
        
        if (imagesData.imagenes && imagesData.imagenes.logo) {
          console.log('🖼️ Logo encontrado en imágenes (no se usa)');
        } else {
          console.log('❌ No hay logo en las imágenes del taller');
        }
      } else {
        console.log('❌ Error cargando imágenes:', imagesResponse.status);
      }
    } catch (error) {
      console.log('❌ Error cargando datos del taller en Sidebar:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Cargar datos del taller al montar el componente
  useEffect(() => {
    cargarDatosTaller();
  }, []);

  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tallerNombre}</h1>
            <p className="text-sm text-gray-600">{tallerDescripcion}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems
          .filter(item => {
            // Si no hay rol especificado, mostrar para todos
            if (!item.role) return true;
            
            // Si es superAdmin, mostrar todo
            if (user?.role === 'superAdmin') return true;
            
            // Si es admin, mostrar elementos de admin y elementos sin rol
            if (user?.role === 'admin') {
              return item.role === 'admin' || !item.role;
            }
            
            // Si es operator, mostrar elementos de operator y elementos sin rol
            if (user?.role === 'operator') {
              return item.role === 'operator' || !item.role;
            }
            
            // Si es client (user), mostrar solo elementos sin rol
            if (user?.role === 'user') {
              return !item.role;
            }
            
            return false;
          })
          .map((item) => {
            const isActive = location === item.path;
            const badgeValue = getBadgeValue(item.badge);
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-700 hover:bg-gray-100"
              )}>
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {badgeValue && (
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    isActive 
                      ? "bg-white text-blue-600"
                      : item.badge?.includes('lowStock') 
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                  )}>
                    {badgeValue}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
