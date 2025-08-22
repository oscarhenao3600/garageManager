import React, { useMemo, memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
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
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: '600',
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
          weight: 'bold',
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
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: '600',
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
          weight: 'bold',
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

  // Configuración para gráfico de línea de tendencias (memoizada)
  const trendChartData = useMemo(() => ({
    labels: data.months,
    datasets: [
      {
        label: 'Tendencia de Ventas',
        data: data.revenueData,
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgba(147, 51, 234, 0.8)',
        pointHoverBorderColor: '#ffffff',
      },
    ],
  }), [data.months, data.revenueData]);

  const trendChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
            weight: '600',
          },
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Tendencia de Crecimiento',
        color: '#111827',
        font: {
          size: 16,
          weight: 'bold',
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
            <Bar data={salesChartData} options={salesChartOptions} />
          </div>
        </div>

        {/* Gráfico de Inventario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="h-80">
            <Doughnut data={inventoryChartData} options={inventoryChartOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="h-80">
          <Line data={trendChartData} options={trendChartOptions} />
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="text-2xl font-bold">
            ${calculatedData.totalSales.toLocaleString()}
          </div>
          <div className="text-sm opacity-90">Total Ventas</div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="text-2xl font-bold">
            {calculatedData.totalOrders}
          </div>
          <div className="text-sm opacity-90">Total Órdenes</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="text-2xl font-bold">
            {data.totalItems}
          </div>
          <div className="text-sm opacity-90">Items en Inventario</div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <div className="text-2xl font-bold">
            {data.lowStockItems}
          </div>
          <div className="text-sm opacity-90">Stock Bajo</div>
        </div>
      </div>
    </div>
  );
});

// Agregar displayName para debugging
InteractiveCharts.displayName = 'InteractiveCharts';

export default InteractiveCharts;
