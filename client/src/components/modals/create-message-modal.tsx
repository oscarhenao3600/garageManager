import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, User, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface CreateMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateMessageModal({ open, onOpenChange }: CreateMessageModalProps) {
  const [recipientType, setRecipientType] = useState<string>("");
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [category, setCategory] = useState<string>("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener lista de operarios
  const { data: operators = [] } = useQuery({
    queryKey: ['/api/operators'],
  });

  // Obtener lista de clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Obtener lista de usuarios
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const createMessageMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedRecipients.map(recipientId => 
        apiRequest('POST', '/api/notifications', {
          title: `Mensaje de Administración`,
          message,
          type: 'admin_message',
          category: 'admin_to_operator',
          priority,
          toUserId: recipientId,
          requiresResponse: true,
        })
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Mensaje enviado",
        description: `Mensaje enviado a ${selectedRecipients.length} destinatario(s).`,
      });
      // Limpiar formulario
      setMessage("");
      setSelectedRecipients([]);
      setRecipientType("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    },
  });

  const handleRecipientToggle = (recipientId: number) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId) 
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || selectedRecipients.length === 0) {
      toast({
        title: "Error",
        description: "Por favor completa el mensaje y selecciona al menos un destinatario.",
        variant: "destructive",
      });
      return;
    }
    createMessageMutation.mutate();
  };

  const getRecipientsList = () => {
    if (recipientType === "operators") return operators;
    if (recipientType === "clients") return clients;
    if (recipientType === "users") return users;
    return [];
  };

  const getRecipientName = (recipient: any) => {
    if (recipient.username) return recipient.username;
    if (recipient.firstName && recipient.lastName) return `${recipient.firstName} ${recipient.lastName}`;
    if (recipient.email) return recipient.email;
    return `Usuario ${recipient.id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Crear Mensaje
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Destinatario */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Destinatario</label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de destinatario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operators">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Operarios
                  </div>
                </SelectItem>
                <SelectItem value="clients">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Clientes
                  </div>
                </SelectItem>
                <SelectItem value="users">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Todos los Usuarios
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Destinatarios */}
          {recipientType && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Destinatarios ({selectedRecipients.length} seleccionado(s))
              </label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {getRecipientsList().map((recipient: any) => (
                  <div
                    key={recipient.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                      selectedRecipients.includes(recipient.id) ? 'bg-blue-100 border border-blue-300' : ''
                    }`}
                    onClick={() => handleRecipientToggle(recipient.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <span className="text-sm">{getRecipientName(recipient)}</span>
                    {recipient.role && (
                      <Badge variant="secondary" className="text-xs">
                        {recipient.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioridad */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridad</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="work_order">Orden de Trabajo</SelectItem>
                <SelectItem value="maintenance">Mantenimiento</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="announcement">Anuncio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensaje</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMessageMutation.isPending || !message.trim() || selectedRecipients.length === 0}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {createMessageMutation.isPending ? "Enviando..." : "Enviar Mensaje"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

