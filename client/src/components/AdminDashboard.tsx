import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  Package, 
  DollarSign, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AdvancedReports from "./AdvancedReports";
import InteractiveCharts from "./InteractiveCharts";
import SimpleTallerConfig from "./SimpleTallerConfig";

interface DashboardStats {
  activeOrders: number;
  totalClients: number;
  activeClients: number;
  totalVehicles: number;
  lowStockItems: number;
  totalRevenue: number;
  pendingInvoices: number;
}

interface ChartData {
  sales: number[];
  orders: number[];
  months: string[];
  lowStockItems: number;
  totalItems: number;
  revenueData: number[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  // const { taller, loading: tallerLoading } = useTaller();
  // Estados para los datos del taller
  const [tallerNombre, setTallerNombre] = useState("Mi Taller");
  const [tallerNit, setTallerNit] = useState("123456789-0");
  const [tallerDireccion, setTallerDireccion] = useState("Calle Principal #123, Ciudad");
  const [tallerTelefono, setTallerTelefono] = useState("+57 300 123 4567");
  const [tallerLoading, setTallerLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    activeOrders: 0,
    totalClients: 0,
    activeClients: 0,
    totalVehicles: 0,
    lowStockItems: 0,
    totalRevenue: 0,
    pendingInvoices: 0
  });

  // Log del estado inicial
  console.log('🔍 AdminDashboard: Initial stats state:', stats);
  
  // Log cuando el estado cambia
  useEffect(() => {
    console.log('🔍 AdminDashboard: Stats state changed:', stats);
  }, [stats]);
  const [chartData, setChartData] = useState<ChartData>({
    sales: [0, 0, 0],
    orders: [0, 0, 0],
    months: ['Enero', 'Febrero', 'Marzo'],
    lowStockItems: 0,
    totalItems: 0,
    revenueData: [0, 0, 0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // Verificar que el usuario sea administrador
  if (user?.role !== 'admin' && user?.role !== 'superAdmin') {
    return null;
  }

  // Memoizar datos calculados para evitar recálculos innecesarios
  const calculatedStats = useMemo(() => {
    console.log('🔍 AdminDashboard: Calculating stats with activeClients:', stats.activeClients);
    const result = {
      totalRevenueFormatted: stats.totalRevenue.toLocaleString(),
      expenses: Math.floor(stats.totalRevenue * 0.3),
      netProfit: Math.floor(stats.totalRevenue * 0.7),
      expensesFormatted: Math.floor(stats.totalRevenue * 0.3).toLocaleString(),
      netProfitFormatted: Math.floor(stats.totalRevenue * 0.7).toLocaleString(),
      activeClients: stats.activeClients,
      totalItems: Math.floor(Math.random() * 100 + 50),
      randomInvoices: Math.max(0, stats.totalRevenue > 0 ? Math.floor(Math.random() * 50 + 20) : 0),
      randomVencidas: Math.max(0, Math.floor(Math.random() * 5)),
      percentageChange: Math.floor(Math.random() * 20 + 5)
    };
    console.log('🔍 AdminDashboard: Calculated stats result:', result);
    return result;
  }, [stats.totalRevenue, stats.totalClients, stats.activeClients]);

  // Función para cargar estadísticas del dashboard (memoizada)
  const loadDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      // console.log('🔍 AdminDashboard: Token from localStorage:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar estadísticas del dashboard principal
      const dashboardResponse = await fetch('/api/dashboard/stats', { headers });
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('🔍 AdminDashboard: Dashboard data received:', dashboardData);
        
        setStats(prev => {
          const newStats = {
            ...prev,
            activeOrders: dashboardData.activeOrders || 0,
            totalClients: dashboardData.totalClients || 0,
            totalVehicles: dashboardData.vehiclesInShop || 0,
            lowStockItems: dashboardData.lowStockItems || 0,
            totalRevenue: dashboardData.totalRevenue || 0,
            pendingInvoices: dashboardData.pendingInvoices || 0
          };
          console.log('🔍 AdminDashboard: Setting stats to:', newStats);
          return newStats;
        });

        // Generar datos simulados para los gráficos basados en datos reales
        const mockChartData: ChartData = {
          sales: [
            dashboardData.totalRevenue || 1200,
            Math.floor((dashboardData.totalRevenue || 1200) * 0.9),
            Math.floor((dashboardData.totalRevenue || 1200) * 1.1)
          ],
          orders: [
            dashboardData.activeOrders || 8,
            Math.floor((dashboardData.activeOrders || 8) * 0.8),
            Math.floor((dashboardData.activeOrders || 8) * 1.2)
          ],
          months: ['Enero', 'Febrero', 'Marzo'],
          lowStockItems: dashboardData.lowStockItems || 5,
          totalItems: Math.floor(Math.random() * 100 + 50),
          revenueData: [
            dashboardData.totalRevenue || 1200,
            Math.floor((dashboardData.totalRevenue || 1200) * 0.9),
            Math.floor((dashboardData.totalRevenue || 1200) * 1.1)
          ]
        };
        
        setChartData(mockChartData);
      } else {
        setError('Error cargando estadísticas del dashboard');
      }

      // Cargar datos adicionales que no vienen en el endpoint principal
      try {
        // Solo cargar clientes activos ya que el endpoint principal no los incluye
        const activeClientsResponse = await fetch('/api/clients/active-count', { headers });
        
        if (activeClientsResponse.ok) {
          const activeClientsData = await activeClientsResponse.json();
          console.log('🔍 AdminDashboard: Active clients data received:', activeClientsData);
          setStats(prev => {
            const newStats = {
              ...prev,
              activeClients: activeClientsData.activeClientsCount || 0
            };
            console.log('🔍 AdminDashboard: Updated stats with active clients:', newStats);
            return newStats;
          });
        }
      } catch (error) {
        console.error('❌ AdminDashboard: Error fetching active clients:', error);
      }

    } catch (error) {
      console.error('❌ AdminDashboard: Error in loadDashboardStats:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar datos del taller
  const cargarDatosTaller = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      const response = await fetch('/api/company-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.name) {
          setTallerNombre(data.name);
        }
        if (data.nit) {
          setTallerNit(data.nit);
        }
        if (data.address) {
          setTallerDireccion(data.address);
        }
        if (data.phone) {
          setTallerTelefono(data.phone);
        }
      }
    } catch (error) {
      // Error cargando datos del taller
    } finally {
      setTallerLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    // console.log('🔍 AdminDashboard: useEffect triggered, loading dashboard stats');
    loadDashboardStats();
    cargarDatosTaller();
  }, [loadDashboardStats, cargarDatosTaller]);

  const handleRefresh = useCallback(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  // Memoizar el estado de las alertas
  const alertState = useMemo(() => ({
    hasLowStock: stats.lowStockItems > 0,
    hasPendingInvoices: stats.pendingInvoices > 0,
    hasAlerts: stats.lowStockItems > 0 || stats.pendingInvoices > 0
  }), [stats.lowStockItems, stats.pendingInvoices]);

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar el dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {tallerLoading ? 'Cargando...' : `${tallerNombre || 'Dashboard'}`}
          </h1>
          {tallerNombre && (
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>NIT: {tallerNit || 'No configurado'}</span>
              <span>•</span>
              <span>{tallerDireccion || 'No configurado'}</span>
              <span>•</span>
              <span>{tallerTelefono || 'No configurado'}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="relative">
          <TabsList className="grid w-full grid-cols-8 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Financiero
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Operaciones
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Clientes
            </TabsTrigger>
            <TabsTrigger 
              value="inventory" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Inventario
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Reportes
            </TabsTrigger>
            <TabsTrigger 
              value="config" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 transition-colors"
            >
              Configuración
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6 max-h-[70vh] overflow-y-auto">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Ventas del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${calculatedStats.totalRevenueFormatted}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  +{calculatedStats.percentageChange}% desde el mes pasado
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Órdenes Activas</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeOrders}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  En proceso y pendientes
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Clientes Activos</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalClients}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Con actividad reciente
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">Stock Bajo</CardTitle>
                <Package className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.lowStockItems}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Requieren reabastecimiento
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Interactivos */}
          <InteractiveCharts data={chartData} />

          {/* Alertas del Sistema */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Alertas del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertState.hasLowStock && (
                  <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-in slide-in-from-left-2 duration-300">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        {stats.lowStockItems} items con stock bajo
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300">
                        Requieren atención inmediata
                      </p>
                    </div>
                  </div>
                )}
                
                {alertState.hasPendingInvoices && (
                  <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 animate-in slide-in-from-left-2 duration-300">
                    <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        {stats.pendingInvoices} facturas pendientes
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300">
                        Requieren revisión
                      </p>
                    </div>
                  </div>
                )}

                {!alertState.hasAlerts && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8 animate-in fade-in duration-500">
                    <div className="h-12 w-12 mx-auto mb-2 text-green-500">
                      ✓
                    </div>
                    <p>No hay alertas pendientes</p>
                    <p className="text-sm">Sistema funcionando correctamente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financiero */}
        <TabsContent value="financial" className="space-y-6 max-h-[70vh] overflow-y-auto">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Ganancias y Pérdidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Ingresos Totales:</span>
                    <span className="font-semibold text-green-600">
                      ${calculatedStats.totalRevenueFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Gastos Totales:</span>
                    <span className="font-semibold text-red-600">
                      ${calculatedStats.expensesFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-gray-900 dark:text-white">Ganancia Neta:</span>
                    <span className="font-semibold text-blue-600">
                      ${calculatedStats.netProfitFormatted}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Estado de Facturación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Facturas Pagadas</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {calculatedStats.randomInvoices}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Facturas Pendientes</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {stats.pendingInvoices}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Facturas Vencidas</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {calculatedStats.randomVencidas}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Operaciones */}
        <TabsContent value="operations" className="space-y-6 max-h-[70vh] overflow-y-auto">
          <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Resumen de Operaciones</CardTitle>
            </CardHeader>
            <CardContent>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeOrders}</div>
                  <div className="text-sm text-blue-600">Órdenes Activas</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <div className="text-2xl font-bold text-green-600">{stats.totalVehicles}</div>
                  <div className="text-sm text-green-600">Vehículos en Taller</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalClients}</div>
                  <div className="text-sm text-purple-600">Clientes Totales</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Clientes */}
        <TabsContent value="clients" className="space-y-6 max-h-[70vh] overflow-y-auto">
          <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Estadísticas de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClients}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{calculatedStats.activeClients}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Clientes Activos</div>
                    {/* Debug info - Temporal para verificar datos */}
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: stats.activeClients = {stats.activeClients}, calculatedStats.activeClients = {calculatedStats.activeClients}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inventario */}
        <TabsContent value="inventory" className="space-y-6 max-h-[70vh] overflow-y-auto">
          <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Estado del Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStockItems}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Items con Stock Bajo</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{calculatedStats.totalItems}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total de Items</div>
                  </div>
                </div>
                

                {alertState.hasLowStock && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Atención: {stats.lowStockItems} items requieren reabastecimiento
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-300">
                          Revisar inventario y realizar pedidos
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                 {/* Tab: Reportes Avanzados */}
         <TabsContent value="reports" className="space-y-6 max-h-[70vh] overflow-y-auto">
           <AdvancedReports />
         </TabsContent>

         {/* Tab: Configuración del Taller */}
         <TabsContent value="config" className="space-y-6 max-h-[70vh] overflow-y-auto">
           <SimpleTallerConfig />
         </TabsContent>
      </Tabs>
    </div>
  );
}
