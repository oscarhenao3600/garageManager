import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Wrench, Info, AlertCircle } from "lucide-react";

interface CreateNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId?: number;
  orderNumber?: string;
  orderDescription?: string;
}

export default function CreateNotificationModal({
  open,
  onOpenChange,
  serviceOrderId,
  orderNumber,
  orderDescription
}: CreateNotificationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "order_issue",
    priority: "medium",
    requiresResponse: true
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/notifications', {
        ...data,
        category: 'operator_to_admin',
        serviceOrderId: serviceOrderId || null
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la notificación');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Notificación enviada",
        description: "La notificación ha sido enviada a los administradores.",
      });
      onOpenChange(false);
      setFormData({
        title: "",
        message: "",
        type: "order_issue",
        priority: "medium",
        requiresResponse: true
      });
      // Invalidar consultas de notificaciones
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al enviar notificación",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: "❌ Campos requeridos",
        description: "Por favor complete todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createNotificationMutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order_issue': return <AlertTriangle className="h-4 w-4" />;
      case 'order_update': return <Info className="h-4 w-4" />;
      case 'order_completion': return <Wrench className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Crear Notificación
          </DialogTitle>
          <DialogDescription>
            Envía una notificación a los administradores sobre esta orden de servicio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información de la orden */}
          {serviceOrderId && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Orden Relacionada</h4>
              <div className="text-sm text-blue-800">
                <p><strong>Número:</strong> {orderNumber}</p>
                <p><strong>Descripción:</strong> {orderDescription}</p>
              </div>
            </div>
          )}

          {/* Tipo de notificación */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Notificación *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order_issue">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Problema con la Orden
                  </div>
                </SelectItem>
                <SelectItem value="order_update">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Actualización de la Orden
                  </div>
                </SelectItem>
                <SelectItem value="order_completion">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-green-500" />
                    Completación de la Orden
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione la prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Título descriptivo de la notificación"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={100}
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje Detallado *</Label>
            <Textarea
              id="message"
              placeholder="Describe detalladamente la situación, problema o actualización..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {formData.message.length}/500 caracteres
            </p>
          </div>

          {/* Requiere respuesta */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requiresResponse"
              checked={formData.requiresResponse}
              onChange={(e) => setFormData(prev => ({ ...prev, requiresResponse: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="requiresResponse" className="text-sm">
              Esta notificación requiere respuesta de un administrador
            </Label>
          </div>

          {/* Vista previa */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Vista Previa</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {getTypeIcon(formData.type)}
                <span className="font-medium">{formData.title || "Título de la notificación"}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                  {formData.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600">
                {formData.message || "Mensaje de la notificación aparecerá aquí..."}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim() || !formData.message.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Enviar Notificación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

