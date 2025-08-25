import { useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Debe confirmar la nueva contraseña"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface FirstLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FirstLoginModal({ open, onOpenChange }: FirstLoginModalProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isChanging, setIsChanging] = useState(false);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const response = await apiRequest('POST', '/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cambiar la contraseña");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Contraseña cambiada exitosamente",
        description: "Su primera sesión ha sido completada. Bienvenido al sistema.",
      });
      
      // Invalidar queries para obtener datos actualizados
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/first-login'] });
      
      // Cerrar modal
      onOpenChange(false);
      
      // Opcional: hacer logout para que el usuario inicie sesión con la nueva contraseña
      setTimeout(() => {
        logout();
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error al cambiar la contraseña",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsChanging(true);
    try {
      await changePasswordMutation.mutateAsync(data);
    } finally {
      setIsChanging(false);
    }
  };

  const handleCancel = () => {
    // No permitir cancelar - debe cambiar la contraseña
    toast({
      title: "⚠️ Acción requerida",
      description: "Debe cambiar su contraseña antes de continuar usando el sistema.",
      variant: "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel} modal>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Primera Sesión - Cambio de Contraseña
          </DialogTitle>
          <DialogDescription className="text-base">
            Por seguridad, debe cambiar su contraseña inicial antes de continuar.
            <br />
            <span className="font-semibold text-blue-600">
              Contraseña actual: Su número de documento
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Acción Obligatoria</p>
              <p>
                Esta es su primera sesión en el sistema. Debe cambiar la contraseña 
                inicial (su número de documento) por una contraseña personal y segura.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña Actual (Número de Documento)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Ingrese su número de documento"
                      disabled={isChanging}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      disabled={isChanging}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Repita la nueva contraseña"
                      disabled={isChanging}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">💡 Consejos de Seguridad</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use al menos 6 caracteres</li>
                    <li>Combine letras, números y símbolos</li>
                    <li>Evite información personal fácil de adivinar</li>
                    <li>No comparta su contraseña con nadie</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                disabled={isChanging}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isChanging ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="text-xs text-gray-500 text-center mt-4">
          <p>Usuario: <span className="font-mono">{user?.username}</span></p>
          <p>Documento: <span className="font-mono">{user?.username || 'No disponible'}</span></p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
