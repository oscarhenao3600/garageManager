import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  operatorId: z.number().min(1, "Debe seleccionar un operario"),
}).refine((data) => data.operatorId && data.operatorId > 0, {
  message: "Debe seleccionar un operario",
  path: ["operatorId"],
});

interface AssignOperatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderNumber: string;
  onSuccess?: () => void;
}

export default function AssignOperatorModal({ 
  open, 
  onOpenChange, 
  orderId, 
  orderNumber,
  onSuccess 
}: AssignOperatorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operatorId: undefined,
    },
  });

  // Obtener lista de operarios
  const { data: workers = [], isLoading: workersLoading, error: workersError } = useQuery({
    queryKey: ['/api/operators'],
    queryFn: async () => {
      console.log('Obteniendo operarios...');
      console.log('Token:', localStorage.getItem('token'));
      try {
        const response = await apiRequest('GET', '/api/operators');
        const data = await response.json();
        console.log('Operarios obtenidos:', data);
        return data;
      } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Mutación para asignar operario e iniciar la orden
  const assignOperatorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Primero asignar el operario
      await apiRequest('PATCH', `/api/service-orders/${orderId}`, {
        operatorId: data.operatorId
      });
      
      // Luego iniciar la orden
      const response = await apiRequest('PATCH', `/api/service-orders/${orderId}/status`, {
        status: 'in_progress',
        comment: 'Orden iniciada con operario asignado'
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      toast({
        title: "Operario asignado",
        description: `El operario ha sido asignado y la orden ${orderNumber} ha sido iniciada exitosamente.`,
      });
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error al asignar operario:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el operario e iniciar la orden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    assignOperatorMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Operario</DialogTitle>
          <DialogDescription>
            Selecciona el operario que estará a cargo de la orden {orderNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="operatorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operario</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value ? field.value.toString() : ""}
                    disabled={workersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar operario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workersLoading && (
                        <SelectItem value="loading" disabled>
                          Cargando operarios...
                        </SelectItem>
                      )}
                      {workersError && (
                        <SelectItem value="error" disabled>
                          Error al cargar operarios
                        </SelectItem>
                      )}
                      {!workersLoading && !workersError && workers.length === 0 && (
                        <SelectItem value="empty" disabled>
                          No hay operarios disponibles
                        </SelectItem>
                      )}
                      {workers.map((worker: any) => (
                        <SelectItem key={worker.id} value={worker.id.toString()}>
                          {worker.firstName} {worker.lastName} - {worker.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={assignOperatorMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={assignOperatorMutation.isPending || workersLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {assignOperatorMutation.isPending ? "Asignando..." : "Asignar e Iniciar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 