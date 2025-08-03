import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package, AlertTriangle, TrendingDown } from "lucide-react";
import NewItemModal from "@/components/modals/new-item-modal";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showNewItemModal, setShowNewItemModal] = useState(false);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/inventory', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) {
          throw new Error("Error al cargar el inventario");
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching inventory:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  const getStockStatus = (item: any) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    
    if (item.currentStock <= item.minStock) {
      return { status: 'critical', text: 'Stock Crítico', color: 'bg-red-100 text-red-700' };
    }
    if (percentage <= 20) {
      return { status: 'low', text: 'Stock Bajo', color: 'bg-orange-100 text-orange-700' };
    }
    if (percentage <= 50) {
      return { status: 'medium', text: 'Stock Medio', color: 'bg-yellow-100 text-yellow-700' };
    }
    return { status: 'good', text: 'Stock Normal', color: 'bg-green-100 text-green-700' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Aplicar filtros a los datos
  const filteredInventory = inventory.filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    const matchesStock = stockFilter === 'all' || 
      (stockFilter === 'low' && getStockStatus(item).status === 'low') ||
      (stockFilter === 'normal' && getStockStatus(item).status === 'good');
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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

  if (!inventory || inventory.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-600">Gestiona repuestos y materiales del taller</p>
          </div>
          <Button 
            onClick={() => setShowNewItemModal(true)} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Item
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay items en el inventario</h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando repuestos y materiales al inventario del taller
            </p>
            <Button 
              onClick={() => setShowNewItemModal(true)} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Item
            </Button>
          </CardContent>
        </Card>

        <NewItemModal 
          open={showNewItemModal} 
          onOpenChange={setShowNewItemModal} 
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600">Gestiona repuestos y materiales del taller</p>
        </div>
        <Button 
          onClick={() => setShowNewItemModal(true)} 
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-purple-600">{inventory.length}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Crítico</p>
                <p className="text-2xl font-bold text-red-600">
                  {inventory.filter((item: any) => getStockStatus(item).status === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">
                  {inventory.filter((item: any) => getStockStatus(item).status === 'low').length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(inventory.reduce((sum: number, item: any) => 
                    sum + (item.currentStock * item.unitCost), 0
                  ))}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código, nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                                          <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="frenos">Frenos</SelectItem>
                  <SelectItem value="suspension">Suspensión</SelectItem>
                  <SelectItem value="electricidad">Electricidad</SelectItem>
                  <SelectItem value="carroceria">Carrocería</SelectItem>
                  <SelectItem value="lubricantes">Lubricantes</SelectItem>
                  <SelectItem value="filtros">Filtros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado del stock" />
                </SelectTrigger>
                <SelectContent>
                                          <SelectItem value="all">Todos los stocks</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="normal">Stock normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {filteredInventory.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {inventory.length === 0 ? "No se encontraron items en el inventario" : "No hay items que coincidan con los filtros"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredInventory.map((item: any) => {
            const stockStatus = getStockStatus(item);
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {item.name}
                        </CardTitle>
                        <p className="text-xs text-gray-600">{item.code}</p>
                      </div>
                    </div>
                    <Badge className={stockStatus.color} variant="secondary">
                      {stockStatus.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stock Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Stock actual</span>
                      <span className="font-medium">{item.currentStock} {item.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stockStatus.status === 'critical' ? 'bg-red-500' :
                          stockStatus.status === 'low' ? 'bg-orange-500' :
                          stockStatus.status === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Min: {item.minStock}</span>
                      <span>Max: {item.maxStock}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Costo</span>
                      <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Precio venta</span>
                      <span className="font-medium text-green-600">{formatCurrency(item.sellingPrice)}</span>
                    </div>
                  </div>

                  {/* Category and Supplier */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Categoría</span>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    {item.supplier && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Proveedor</span>
                        <span className="text-gray-700">{item.supplier}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implementar edición
                        console.log('Editar item:', item.id);
                      }}
                    >
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        // TODO: Implementar gestión de stock
                        console.log('Gestionar stock:', item.id);
                      }}
                    >
                      Stock
                    </Button>
                  </div>

                  {/* Low Stock Warning */}
                  {(stockStatus.status === 'critical' || stockStatus.status === 'low') && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-700">
                          {stockStatus.status === 'critical' ? 'Reabastecer urgente' : 'Stock bajo'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
