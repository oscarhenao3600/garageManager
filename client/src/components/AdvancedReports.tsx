import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Car, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface ReportData {
  sales?: any[];
  inventory?: any[];
  expiringDocs?: any[];
  operatorPerformance?: any[];
  topClients?: any[];
  popularServices?: any[];
  pnl?: any;
  billingStatus?: any;
}

interface AdvancedReportsProps {
  // Props opcionales para personalización
}

// Componente memoizado para evitar re-renders innecesarios
const AdvancedReports = memo(({}: AdvancedReportsProps) => {
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Memoizar datos calculados para evitar recálculos
  const calculatedStats = useMemo(() => {
    if (!reportData.inventory) return null;
    
    return {
      totalItems: reportData.inventory.totalItems || 0,
      lowStockItems: reportData.inventory.lowStockItems || 0,
      outOfStock: reportData.inventory.outOfStock || 0,
      stockNormal: (reportData.inventory.totalItems || 0) - (reportData.inventory.lowStockItems || 0) - (reportData.inventory.outOfStock || 0),
      hasLowStock: (reportData.inventory.lowStockItems || 0) > 0,
      hasOutOfStock: (reportData.inventory.outOfStock || 0) > 0
    };
  }, [reportData.inventory]);

  // Memoizar el estado de las alertas
  const alertState = useMemo(() => ({
    hasExpiringDocs: (reportData.expiringDocs?.length || 0) > 0,
    hasLowStock: calculatedStats?.hasLowStock || false,
    hasOutOfStock: calculatedStats?.hasOutOfStock || false,
    totalAlerts: (calculatedStats?.hasLowStock ? 1 : 0) + 
                 (calculatedStats?.hasOutOfStock ? 1 : 0) + 
                 (reportData.expiringDocs?.length || 0)
  }), [reportData.expiringDocs, calculatedStats]);

  // Función para cargar datos de reportes (memoizada)
  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar datos del dashboard principal como base
      const dashboardResponse = await fetch('/api/dashboard/stats', { headers });
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        
        // Simular datos de reportes avanzados basados en datos reales
        const mockReportData: ReportData = {
          sales: [
            { month: 'Enero', revenue: dashboardData.totalRevenue || 0, orders: dashboardData.activeOrders || 0 },
            { month: 'Febrero', revenue: Math.floor((dashboardData.totalRevenue || 0) * 0.9), orders: Math.floor((dashboardData.activeOrders || 0) * 0.8) },
            { month: 'Marzo', revenue: Math.floor((dashboardData.totalRevenue || 0) * 1.1), orders: Math.floor((dashboardData.activeOrders || 0) * 1.2) }
          ],
          inventory: {
            totalItems: Math.floor(Math.random() * 100 + 50),
            lowStockItems: dashboardData.lowStockItems || 0,
            outOfStock: Math.floor(Math.random() * 5),
            categories: ['Repuestos', 'Herramientas', 'Consumibles', 'Equipos']
          },
          expiringDocs: [
            { plate: 'ABC123', type: 'SOAT', daysUntilExpiry: 15, client: 'Juan Pérez' },
            { plate: 'XYZ789', type: 'Revisión Técnica', daysUntilExpiry: 8, client: 'María García' },
            { plate: 'DEF456', type: 'SOAT', daysUntilExpiry: 22, client: 'Carlos López' }
          ],
          operatorPerformance: [
            { name: 'Operario 1', ordersCompleted: dashboardData.activeOrders || 0, avgCompletionTime: '2.5 días', efficiency: 95 },
            { name: 'Operario 2', ordersCompleted: Math.floor((dashboardData.activeOrders || 0) * 0.8), avgCompletionTime: '3.1 días', efficiency: 87 },
            { name: 'Operario 3', ordersCompleted: Math.floor((dashboardData.activeOrders || 0) * 0.6), avgCompletionTime: '3.8 días', efficiency: 78 }
          ],
          topClients: [
            { name: 'Cliente Premium 1', ordersCount: 15, totalSpent: dashboardData.totalRevenue || 0, lastVisit: '2024-01-15' },
            { name: 'Cliente Premium 2', ordersCount: 12, totalSpent: Math.floor((dashboardData.totalRevenue || 0) * 0.8), lastVisit: '2024-01-10' },
            { name: 'Cliente Regular 1', ordersCount: 8, totalSpent: Math.floor((dashboardData.totalRevenue || 0) * 0.6), lastVisit: '2024-01-08' }
          ],
          popularServices: [
            { name: 'Cambio de Aceite', count: 45, revenue: Math.floor((dashboardData.totalRevenue || 0) * 0.3) },
            { name: 'Frenos', count: 32, revenue: Math.floor((dashboardData.totalRevenue || 0) * 0.4) },
            { name: 'Suspensión', count: 28, revenue: Math.floor((dashboardData.totalRevenue || 0) * 0.25) },
            { name: 'Motor', count: 15, revenue: Math.floor((dashboardData.totalRevenue || 0) * 0.5) }
          ],
          pnl: {
            totalRevenue: dashboardData.totalRevenue || 0,
            totalExpenses: Math.floor((dashboardData.totalRevenue || 0) * 0.3),
            netProfit: Math.floor((dashboardData.totalRevenue || 0) * 0.7),
            profitMargin: 70
          },
          billingStatus: [
            { status: 'Pagadas', count: Math.floor(Math.random() * 50 + 30), color: 'green' },
            { status: 'Pendientes', count: dashboardData.pendingInvoices || 0, color: 'yellow' },
            { status: 'Vencidas', count: Math.floor(Math.random() * 5), color: 'red' },
            { status: 'En Proceso', count: Math.floor(Math.random() * 10 + 5), color: 'blue' }
          ]
        };

        setReportData(mockReportData);
        setLastUpdated(new Date());
      } else {
        setError('Error cargando datos del dashboard');
      }

    } catch (error) {
      console.error('Error cargando reportes:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Cargar datos al montar el componente y cuando cambie el rango de fechas
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleExport = useCallback((type: string) => {
    console.log(`Exportando reporte de ${type}`);
    // Aquí se implementaría la exportación real a PDF/Excel
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'pagadas': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pendientes': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'vencidas': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'en proceso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  // Si hay error, mostrar mensaje de error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar los reportes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={loadReportData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes Avanzados</h2>
          <p className="text-gray-600 dark:text-gray-400">Análisis detallado del rendimiento del taller</p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Año</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={loadReportData}
            disabled={loading}
            className="transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Reporte de Ventas */}
      <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-gray-900 dark:text-white">Ventas por Período</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleExport('sales')} className="transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportData.sales?.map((sale, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <div className="text-sm text-gray-600 dark:text-gray-400">{sale.month}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${sale.revenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {sale.orders} órdenes
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reporte de Inventario */}
      <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Estado del Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          {calculatedStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200">
                <div className="text-2xl font-bold text-blue-600">{calculatedStats.totalItems}</div>
                <div className="text-sm text-blue-600">Total Items</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200">
                <div className="text-2xl font-bold text-green-600">{calculatedStats.stockNormal}</div>
                <div className="text-sm text-green-600">Stock Normal</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors duration-200">
                <div className="text-2xl font-bold text-yellow-600">{calculatedStats.lowStockItems}</div>
                <div className="text-sm text-yellow-600">Stock Bajo</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200">
                <div className="text-2xl font-bold text-red-600">{calculatedStats.outOfStock}</div>
                <div className="text-sm text-red-600">Sin Stock</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              Cargando datos del inventario...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos por Vencer */}
      <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Documentos por Vencer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.expiringDocs?.map((doc, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${doc.daysUntilExpiry <= 10 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{doc.plate}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.type} - {doc.client}
                    </div>
                  </div>
                </div>
                <Badge variant="destructive" className="animate-pulse">
                  {doc.daysUntilExpiry} días
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rendimiento de Operarios */}
      <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Rendimiento de Operarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.operatorPerformance?.map((operator, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{operator.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {operator.ordersCompleted} órdenes completadas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{operator.avgCompletionTime}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Eficiencia: {operator.efficiency}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estado de Facturación */}
      <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Estado de Facturación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportData.billingStatus?.map((status, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status.status}</span>
                <Badge variant="outline" className={getStatusColor(status.status)}>
                  {status.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Alertas */}
      {alertState.totalAlerts > 0 && (
        <Card className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Resumen de Alertas ({alertState.totalAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
              {alertState.hasLowStock && (
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Stock bajo detectado en inventario
                </div>
              )}
              {alertState.hasOutOfStock && (
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Productos sin stock disponible
                </div>
              )}
              {alertState.hasExpiringDocs && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Documentos próximos a vencer
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// Agregar displayName para debugging
AdvancedReports.displayName = 'AdvancedReports';

export default AdvancedReports;
