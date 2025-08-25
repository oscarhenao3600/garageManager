import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Esquema de validación flexible para edición (no requeridos)
const editVehicleSchema = z.object({
  clientId: z.number().optional(),
  plate: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  vehicleType: z.string().optional(),
  color: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  engineNumber: z.string().nullable().optional(),
  soatExpiry: z.string().nullable().optional(),
  technicalInspectionExpiry: z.string().nullable().optional(),
  mileage: z.number().int().min(0, "El kilometraje debe ser un número positivo").nullable().optional(),
  isActive: z.boolean().optional(),
});

type EditVehicleFormData = z.infer<typeof editVehicleSchema>;

interface EditVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: any; // Los datos actuales del vehículo
}

export default function EditVehicleModal({ open, onOpenChange, vehicle }: EditVehicleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditVehicleFormData>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      clientId: vehicle?.clientId,
      plate: vehicle?.plate,
      brand: vehicle?.brand,
      model: vehicle?.model,
      year: vehicle?.year,
      vehicleType: vehicle?.vehicleType,
      color: vehicle?.color ?? '',
      vin: vehicle?.vin ?? '',
      engineNumber: vehicle?.engineNumber ?? '',
      soatExpiry: vehicle?.soatExpiry ? vehicle.soatExpiry.slice(0, 10) : '',
      technicalInspectionExpiry: vehicle?.technicalInspectionExpiry ? vehicle.technicalInspectionExpiry.slice(0, 10) : '',
      mileage: vehicle?.mileage ?? null,
      isActive: vehicle?.isActive,
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const editVehicleMutation = useMutation({
    mutationFn: async (data: EditVehicleFormData) => {
      const response = await apiRequest('PATCH', `/api/vehicles/${vehicle.id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al editar el vehículo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehículo actualizado",
        description: "Los datos del vehículo han sido actualizados exitosamente.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo editar el vehículo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditVehicleFormData) => {
    // Convertir fechas a string ISO si existen
    const processed = {
      ...data,
      soatExpiry: data.soatExpiry ? new Date(data.soatExpiry).toISOString() : null,
      technicalInspectionExpiry: data.technicalInspectionExpiry ? new Date(data.technicalInspectionExpiry).toISOString() : null,
    };
    editVehicleMutation.mutate(processed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Vehículo</DialogTitle>
          <DialogDescription>
            Modifica los datos del vehículo y guarda los cambios
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input type="number" min={1900} max={new Date().getFullYear() + 1} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Vehículo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número VIN</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="engineNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Motor</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Kilometraje */}
            <Controller
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometraje</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={1} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Fechas de vencimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                control={form.control}
                name="soatExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento SOAT</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value || ''} onChange={e => field.onChange(e.target.value || undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Controller
                control={form.control}
                name="technicalInspectionExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento Revisión Técnica</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value || ''} onChange={e => field.onChange(e.target.value || undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Estado */}
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <select {...field} className="input" value={field.value ? "true" : "false"} onChange={(e) => field.onChange(e.target.value === "true")}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                disabled={editVehicleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editVehicleMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 