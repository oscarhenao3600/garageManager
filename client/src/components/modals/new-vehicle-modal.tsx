import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

// Esquema de validación para vehículos
const vehicleSchema = z.object({
  clientId: z.number().min(1, "Debe seleccionar un cliente"),
  plate: z.string().min(1, "La placa es obligatoria"),
  brand: z.string().min(1, "La marca es obligatoria"),
  model: z.string().min(1, "El modelo es obligatorio"),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  vehicleType: z.string().min(1, "El tipo de vehículo es obligatorio"),
  color: z.string().nullable().optional(),
  vin: z.string().nullable().optional(),
  engineNumber: z.string().nullable().optional(),
  soatExpiry: z.string().nullable().optional(),
  technicalInspectionExpiry: z.string().nullable().optional(),
  mileage: z.number().int().min(0, "El kilometraje debe ser un número positivo").nullable().optional(),
  isActive: z.boolean(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface NewVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewVehicleModal({ open, onOpenChange }: NewVehicleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener la lista de clientes para el selector
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Obtener la lista de tipos de vehículos para el selector
  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['/api/vehicle-types'],
  });

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      clientId: undefined as any,
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      vehicleType: "",
      color: "",
      vin: "",
      engineNumber: "",
      soatExpiry: "",
      technicalInspectionExpiry: "",
      mileage: undefined,
      isActive: true,
    },
  });

  // Observar el año del vehículo para determinar si requiere revisión técnica
  const vehicleYear = form.watch("year");
  const currentYear = new Date().getFullYear();
  const yearsSinceManufacture = currentYear - vehicleYear;
  const isExemptFromTechnicalInspection = yearsSinceManufacture <= 5;

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const response = await apiRequest('POST', '/api/vehicles', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el vehículo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehículo creado",
        description: "El vehículo ha sido registrado exitosamente.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el vehículo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    console.log('Datos del vehículo a crear:', data);
    
    // Si el vehículo está exento de revisión técnica, limpiar esa fecha
    if (isExemptFromTechnicalInspection) {
      data.technicalInspectionExpiry = null;
    }
    
    createVehicleMutation.mutate(data);
  };

  // Función para formatear fecha para input type="date"
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Vehículo</DialogTitle>
          <DialogDescription>
            Registrar un nuevo vehículo en el sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cliente */}
            <FormItem>
              <FormLabel>Cliente Propietario *</FormLabel>
              <Controller
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <Select 
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(clients as any[]).map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.firstName} {client.lastName} - {client.documentNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMessage />
            </FormItem>

            {/* Información básica del vehículo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormItem>
                <FormLabel>Placa *</FormLabel>
                <Controller
                  control={form.control}
                  name="plate"
                  render={({ field }) => (
                    <FormControl>
                      <Input {...field} placeholder="ABC123" />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Marca *</FormLabel>
                <Controller
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormControl>
                      <Input {...field} placeholder="Toyota" />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormItem>
                <FormLabel>Modelo *</FormLabel>
                <Controller
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormControl>
                      <Input {...field} placeholder="Corolla" />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Año *</FormLabel>
                <Controller
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Tipo de Vehículo *</FormLabel>
                <Controller
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(vehicleTypes as any[]).map((type: any) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormMessage />
              </FormItem>
            </div>

            {/* Información sobre exoneración de revisión técnica */}
            {isExemptFromTechnicalInspection && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <strong>Exonerado de Revisión Técnica:</strong> Este vehículo ({vehicleYear}) tiene {5 - yearsSinceManufacture} año(s) restante(s) de exoneración. 
                  No es necesario establecer fecha de vencimiento de revisión técnica.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormItem>
                <FormLabel>Color</FormLabel>
                <Controller
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Blanco"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>Número VIN</FormLabel>
                <Controller
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="1HGBH41JXMN109186"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Número de Motor</FormLabel>
              <Controller
                control={form.control}
                name="engineNumber"
                render={({ field }) => (
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="ABC123456789"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                )}
              />
              <FormMessage />
            </FormItem>

            {/* Campo de Kilometraje */}
            <FormItem>
              <FormLabel>Kilometraje</FormLabel>
              <Controller
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej: 123456"
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                    />
                  </FormControl>
                )}
              />
              <FormMessage />
            </FormItem>

            {/* Fechas de vencimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormItem>
                <FormLabel>Vencimiento SOAT</FormLabel>
                <Controller
                  control={form.control}
                  name="soatExpiry"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="date" 
                        value={formatDateForInput(field.value)}
                        onChange={(e) => {
                          const date = e.target.value;
                          if (date) {
                            const selectedDate = new Date(date);
                            // Asegurar que la fecha se guarde en formato ISO
                            field.onChange(selectedDate.toISOString());
                          } else {
                            field.onChange(null);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                      />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel>
                  Vencimiento Revisión Técnica
                  {isExemptFromTechnicalInspection && (
                    <Badge variant="secondary" className="ml-2">Exonerado</Badge>
                  )}
                </FormLabel>
                <Controller
                  control={form.control}
                  name="technicalInspectionExpiry"
                  render={({ field }) => (
                    <FormControl>
                      <Input 
                        type="date" 
                        value={formatDateForInput(field.value)}
                        onChange={(e) => {
                          const date = e.target.value;
                          if (date) {
                            const selectedDate = new Date(date);
                            field.onChange(selectedDate.toISOString());
                          } else {
                            field.onChange(null);
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                        disabled={isExemptFromTechnicalInspection}
                        className={isExemptFromTechnicalInspection ? "opacity-50 cursor-not-allowed" : ""}
                      />
                    </FormControl>
                  )}
                />
                <FormMessage />
              </FormItem>
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
                disabled={createVehicleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createVehicleMutation.isPending ? "Creando..." : "Crear Vehículo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 