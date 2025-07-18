import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Settings, 
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
  { path: "/clients", label: "Clientes", icon: Users },
  { path: "/vehicles", label: "Vehículos", icon: Car },
  { path: "/inventory", label: "Inventario", icon: Package, badge: "inventory.lowStock" },
  { path: "/workers", label: "Operarios", icon: HardHat },
  { path: "/billing", label: "Facturación", icon: FileText },
  { path: "/notifications", label: "Notificaciones", icon: Bell },
  { path: "/settings", label: "Configuración", icon: Settings, role: "admin" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AutoTaller Pro</h1>
            <p className="text-sm text-gray-600">Gestión Integral</p>
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
          .filter(item => !item.role || item.role === user?.role)
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
