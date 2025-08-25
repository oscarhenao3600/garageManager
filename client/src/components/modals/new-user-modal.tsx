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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "El apellido es obligatorio"),
  documentNumber: z.string().min(1, "El número de documento es obligatorio"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  role: z.enum(["admin", "operator"]),
});

interface NewUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewUserModal({ open, onOpenChange }: NewUserModalProps) {
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
      role: "operator",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      console.log('🚀 Enviando datos al servidor:', data);
      const response = await apiRequest('POST', '/api/users', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el usuario');
      }
      
      return response.json();
    },
    onSuccess: (response: any) => {
      console.log('✅ Usuario creado exitosamente:', response);
      
      // Mostrar información de acceso
      toast({
        title: "✅ Usuario creado exitosamente",
        description: (
          <div className="space-y-2">
            <p><strong>Usuario:</strong> {response.data.username}</p>
            <p><strong>Contraseña inicial:</strong> {response.data.initialPassword}</p>
            <p><strong>Rol:</strong> {response.data.role}</p>
            <p className="text-sm text-orange-600">
              ⚠️ El usuario deberá cambiar esta contraseña en su primera sesión
            </p>
          </div>
        ),
        duration: 10000, // Mostrar por más tiempo
      });
      
      // Cerrar modal y refrescar lista
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/workers'] });
      form.reset();
    },
    onError: (error: Error) => {
      console.error('❌ Error en la mutación:', error);
      toast({
        title: "❌ Error al crear usuario",
        description: error.message || "Ocurrió un error al crear el usuario",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log('📝 Formulario enviado con datos:', data);
    createUserMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Complete los datos para crear un nuevo usuario del sistema.
            La contraseña inicial será el número de documento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Primer nombre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Primer apellido" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Documento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="CC, CE, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="correo@ejemplo.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="300 123 4567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="operator">Operario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">ℹ️ Información importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>El username se generará automáticamente (primer nombre + primer apellido)</li>
                  <li>La contraseña inicial será el número de documento</li>
                  <li>El usuario deberá cambiar la contraseña en su primera sesión</li>
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
              
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createUserMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creando...
                  </>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
