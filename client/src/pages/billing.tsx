import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Download, Eye, DollarSign, Calendar, AlertTriangle } from "lucide-react";

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: invoices = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/invoices', { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      
      const response = await fetch(`/api/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las facturas");
      }

      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700';
      case 'paid': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagada';
      case 'overdue': return 'Vencida';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      refetch();
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  };

  const handleGeneratePDF = async (id: number) => {
    try {
      const response = await fetch(`/api/invoices/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al generar el PDF");
      }

      // Aquí se podría manejar la descarga del PDF
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  };

  const handleSendInvoice = async (id: number) => {
    try {
      const response = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al enviar la factura");
      }

      // Mostrar mensaje de éxito
    } catch (error) {
      console.error("Error al enviar la factura:", error);
    }
  };

  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.serviceOrder?.client?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.serviceOrder?.client?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.serviceOrder?.vehicle?.plate.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPending = invoices
    .filter((inv: any) => inv.status === 'pending')
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);

  const totalPaid = invoices
    .filter((inv: any) => inv.status === 'paid')
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);

  const overdueCount = invoices
    .filter((inv: any) => inv.status === 'pending' && isOverdue(inv.dueDate)).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(5)].map((_, i) => (
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600">Gestiona facturas y pagos del taller</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cobrado</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facturas Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
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
                  placeholder="Buscar por número de factura, cliente o placa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                                          <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="overdue">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron facturas</p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice: any) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {invoice.invoiceNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Orden: {invoice.serviceOrder?.orderNumber}
                        </p>
                      </div>
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                      {invoice.status === 'pending' && isOverdue(invoice.dueDate) && (
                        <Badge className="bg-red-100 text-red-700">
                          Vencida
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cliente</p>
                        <p className="text-sm text-gray-900">
                          {invoice.serviceOrder?.client?.firstName} {invoice.serviceOrder?.client?.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{invoice.serviceOrder?.client?.documentNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Vehículo</p>
                        <p className="text-sm text-gray-900">
                          {invoice.serviceOrder?.vehicle?.brand} {invoice.serviceOrder?.vehicle?.model}
                        </p>
                        <p className="text-xs text-gray-600">{invoice.serviceOrder?.vehicle?.plate}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Vencimiento</p>
                        <p className="text-sm text-gray-900">
                          {new Date(invoice.dueDate).toLocaleDateString('es-CO')}
                        </p>
                        {invoice.paidDate && (
                          <p className="text-xs text-green-600">
                            Pagada: {new Date(invoice.paidDate).toLocaleDateString('es-CO')}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(parseFloat(invoice.total))}
                        </p>
                      </div>
                    </div>

                    {/* Invoice Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(invoice.subtotal))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Impuestos:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(invoice.tax))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Total:</span>
                          <span className="font-bold">{formatCurrency(parseFloat(invoice.total))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Creada: {new Date(invoice.createdAt).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGeneratePDF(invoice.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSendInvoice(invoice.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                    {invoice.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Marcar como pagada
                      </Button>
                    )}
                    {invoice.status === 'pending' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Marcar Pagada
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
