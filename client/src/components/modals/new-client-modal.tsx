import { useForm } from "react-hook-form";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import { insertClientFromAdminSchema } from "@shared/schema";

// Esquema local simple para probar
const formSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  documentNumber: z.string().min(1, "El número de documento es obligatorio"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewClientModal({ open, onOpenChange }: NewClientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      documentNumber: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      department: "",
      isActive: true,
    },
  });

  const handleSuccess = (response: any) => {
    console.log('✅ Cliente creado exitosamente:', response);
    console.log('🔍 Estructura de la respuesta:', {
      hasData: !!response.data,
      responseKeys: Object.keys(response),
      dataKeys: response.data ? Object.keys(response.data) : 'undefined'
    });
    
    // Verificar que la respuesta tenga la estructura esperada
    if (!response || !response.data) {
      console.error('❌ Respuesta del servidor no tiene la estructura esperada:', response);
      toast({
        title: "⚠️ Cliente creado pero con estructura inesperada",
        description: "El cliente se creó exitosamente, pero la respuesta del servidor no tiene el formato esperado.",
        variant: "destructive",
      });
      
      // Cerrar modal y refrescar lista de todas formas
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      return;
    }
    
    // Mostrar información de acceso
    toast({
      title: "✅ Cliente creado exitosamente",
      description: (
        <div className="space-y-2">
          <p><strong>Usuario:</strong> {response.data.username}</p>
          <p><strong>Contraseña inicial:</strong> {response.data.initialPassword}</p>
          <p className="text-sm text-orange-600">
            ⚠️ El usuario deberá cambiar esta contraseña en su primera sesión
          </p>
        </div>
      ),
      duration: 10000, // Mostrar por más tiempo
    });
    
    // Cerrar modal y refrescar lista
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
  };

  const createClientMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      console.log('🚀 Enviando datos al servidor:', data);
      const response = await apiRequest('POST', '/api/clients', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el cliente');
      }
      
      return response.json();
    },
    onSuccess: handleSuccess,
    onError: (error: Error) => {
      console.error('❌ Error en la mutación:', error);
      toast({
        title: "❌ Error al crear cliente",
        description: error.message || "Ocurrió un error al crear el cliente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('📝 Formulario enviado con datos:', data);
    console.log('🔍 Validación del esquema:', formSchema.safeParse(data));
    
    try {
      // Validar el esquema
      const validationResult = formSchema.safeParse(data);
      if (!validationResult.success) {
        console.error('❌ Datos del formulario no válidos según el esquema:', validationResult.error);
        toast({
          title: "Error de validación",
          description: "Los datos del formulario no son válidos. Revisa los campos.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Datos validados correctamente, iniciando mutación...');
      createClientMutation.mutate(data);
    } catch (error) {
      console.error('❌ Error en onSubmit:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar el formulario.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Registrar un nuevo cliente en el sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log('🔄 Formulario enviado, previniendo recarga...');
            form.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="documentNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Documento</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">ℹ️ Información importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>El username se generará automáticamente (primer nombre + primer apellido)</li>
                  <li>La contraseña inicial será el número de documento</li>
                  <li>El cliente deberá cambiar la contraseña en su primera sesión</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              
              {/* Botón de prueba para verificar datos */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const formData = form.getValues();
                  console.log('🔍 Datos del formulario:', formData);
                  console.log('🔍 Validación del esquema:', formSchema.safeParse(formData));
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Verificar Datos
              </Button>
              
              <Button
                type="submit"
                disabled={createClientMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createClientMutation.isPending ? "Creando..." : "Crear Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
