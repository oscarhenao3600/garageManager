import { useMemo, memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DollarSign, BarChart3, Package, AlertTriangle } from 'lucide-react';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface ChartData {
  sales: number[];
  orders: number[];
  months: string[];
  lowStockItems: number;
  totalItems: number;
  revenueData: number[];
}

interface InteractiveChartsProps {
  data: ChartData;
}

// Componente memoizado para evitar re-renders innecesarios
const InteractiveCharts = memo(({ data }: InteractiveChartsProps) => {
  
  // Memoizar datos calculados para evitar recálculos
  const calculatedData = useMemo(() => ({
    totalSales: data.sales.reduce((a, b) => a + b, 0),
    totalOrders: data.orders.reduce((a, b) => a + b, 0),
    stockNormal: data.totalItems - data.lowStockItems,
    hasData: data.sales.some(sale => sale > 0) || data.orders.some(order => order > 0)
  }), [data.sales, data.orders, data.totalItems, data.lowStockItems]);

  // Configuración para gráfico de barras de ventas (memoizada)
  const salesChartData = useMemo(() => ({
    labels: data.months,
    datasets: [
      {
        label: 'Ventas ($)',
        data: data.sales,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        tension: 0.4,
      },
      {
        label: 'Órdenes',
        data: data.orders,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        tension: 0.4,
      },
    ],
  }), [data.months, data.sales, data.orders]);

  const salesChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Ventas y Órdenes por Mes',
        color: '#111827',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }), []);

  // Configuración para gráfico de dona del inventario (memoizada)
  const inventoryChartData = useMemo(() => ({
    labels: ['Stock Bajo', 'Stock Normal'],
    datasets: [
      {
        data: [data.lowStockItems, calculatedData.stockNormal],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 3,
        cutout: '60%',
        hoverOffset: 8,
      },
    ],
  }), [data.lowStockItems, calculatedData.stockNormal]);

  const inventoryChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Estado del Inventario',
        color: '#111827',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  }), []);



  // Si no hay datos, mostrar mensaje
  if (!calculatedData.hasData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="h-16 w-16 mx-auto mb-4 text-gray-400">
            📊
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay datos disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Los gráficos se mostrarán cuando haya datos de ventas y órdenes
          </p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Datos recibidos:</p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 text-left overflow-auto max-h-40">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ventas y Órdenes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="h-80">
            {(() => {
              try {
                return <Bar data={salesChartData} options={salesChartOptions} />;
              } catch (error) {
                console.error('Error renderizando gráfico de ventas:', error);
                return (
                  <div className="flex items-center justify-center h-full text-red-500">
                    Error al cargar gráfico
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* Gráfico de Inventario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="h-80">
            {(() => {
              try {
                return <Doughnut data={inventoryChartData} options={inventoryChartOptions} />;
              } catch (error) {
                console.error('Error renderizando gráfico de inventario:', error);
                return (
                  <div className="flex items-center justify-center h-full text-red-500">
                    Error al cargar gráfico
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>

                              {/* Estadísticas Rápidas */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 relative">
             <div className="absolute top-3 right-3">
               <DollarSign className="h-5 w-5 text-green-600" />
             </div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               ${calculatedData.totalSales.toLocaleString()}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-400">Total Ventas</div>
           </div>
           
           <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 relative">
             <div className="absolute top-3 right-3">
               <BarChart3 className="h-5 w-5 text-blue-600" />
             </div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               {calculatedData.totalOrders}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-400">Total Órdenes</div>
           </div>
           
           <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 relative">
             <div className="absolute top-3 right-3">
               <Package className="h-5 w-5 text-purple-600" />
             </div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               {data.totalItems}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-400">Items en Inventario</div>
           </div>
           
           <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 relative">
             <div className="absolute top-3 right-3">
               <AlertTriangle className="h-5 w-5 text-red-600" />
             </div>
             <div className="text-2xl font-bold text-gray-900 dark:text-white">
               {data.lowStockItems}
             </div>
             <div className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</div>
           </div>
         </div>
    </div>
  );
});

// Agregar displayName para debugging
InteractiveCharts.displayName = 'InteractiveCharts';

export default InteractiveCharts;
