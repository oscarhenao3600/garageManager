import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertServiceOrderSchema } from "@shared/schema";

const formSchema = insertServiceOrderSchema.extend({
  clientId: z.coerce.number().min(1, "Debe seleccionar un cliente"),
  vehicleId: z.coerce.number().min(1, "Debe seleccionar un vehículo"),
  operatorId: z.string().nullable().transform(val => val === "none" ? null : val),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
});

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewOrderModal({ open, onOpenChange }: NewOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: 0,
      vehicleId: 0,
      description: "",
      priority: "medium",
      operatorId: "none",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open,
    select: (data: any[]) => data.filter(client => client.isActive)
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/clients', selectedClientId, 'vehicles'],
    enabled: !!selectedClientId,
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiRequest('GET', `/api/clients/${selectedClientId}/vehicles`);
      return response.json();
    },
    select: (data: any[]) => data.filter(vehicle => vehicle.isActive)
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['/api/workers'],
    enabled: open,
    select: (data: any[]) => data.filter(operator => 
      operator.isActive && operator.role === "operator"
    )
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        ...data,
        operatorId: data.operatorId === "none" ? null : parseInt(data.operatorId || "")
      };

      const response = await apiRequest('POST', '/api/service-orders', payload);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear orden");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Orden creada",
        description: "La orden de servicio ha sido creada exitosamente.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes('JSON') 
          ? "Error en el formato de datos enviado" 
          : error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createOrderMutation.mutate(data);
  };

  const handleClientChange = (clientId: string) => {
    const clientIdNum = parseInt(clientId);
    setSelectedClientId(clientId);
    form.setValue("clientId", clientIdNum);
    form.setValue("vehicleId", 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Servicio</DialogTitle>
          <DialogDescription>
            Complete los datos para crear una nueva orden de servicio
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select 
                      onValueChange={handleClientChange} 
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem 
                            key={client.id} 
                            value={client.id.toString()}
                          >
                            {client.firstName} {client.lastName} - {client.documentNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                      disabled={!form.watch("clientId")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un vehículo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.length > 0 ? (
                          vehicles.map((vehicle) => (
                            <SelectItem 
                              key={vehicle.id} 
                              value={vehicle.id.toString()}
                            >
                              {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.plate}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="0" disabled>
                            {form.watch("clientId") ? "No hay vehículos registrados" : "Seleccione un cliente primero"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Problema *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa detalladamente el problema..."
                      rows={4}
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operario Asignado</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione operario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Asignar más tarde</SelectItem>
                        {operators.map((operator) => (
                          <SelectItem 
                            key={operator.id} 
                            value={operator.id.toString()}
                          >
                            {operator.firstName} {operator.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={createOrderMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createOrderMutation.isPending ? "Creando..." : "Crear Orden"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}