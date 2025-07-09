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
  clientId: z.string().min(1, "Cliente requerido"),
  vehicleId: z.string().min(1, "Vehículo requerido"),
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
      clientId: "",
      vehicleId: "",
      description: "",
      priority: "medium",
      operatorId: "",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/clients', selectedClientId, 'vehicles'],
    enabled: !!selectedClientId,
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['/api/workers'],
    enabled: open,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest('POST', '/api/service-orders', {
        ...data,
        clientId: parseInt(data.clientId),
        vehicleId: parseInt(data.vehicleId),
        operatorId: data.operatorId ? parseInt(data.operatorId) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Orden creada",
        description: "La orden de servicio ha sido creada exitosamente.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la orden de servicio.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createOrderMutation.mutate(data);
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    form.setValue("clientId", clientId);
    form.setValue("vehicleId", ""); // Reset vehicle selection
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Servicio</DialogTitle>
          <DialogDescription>
            Crear una nueva orden de servicio para un vehículo
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
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={handleClientChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
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
                    <FormLabel>Vehículo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar vehículo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.brand} {vehicle.model} {vehicle.year} - {vehicle.plate}
                          </SelectItem>
                        ))}
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
                  <FormLabel>Descripción del Problema</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa el problema reportado por el cliente..."
                      rows={4}
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
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Asignar más tarde" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Asignar más tarde</SelectItem>
                        {operators.map((operator: any) => (
                          <SelectItem key={operator.id} value={operator.id.toString()}>
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
                onClick={() => onOpenChange(false)}
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
