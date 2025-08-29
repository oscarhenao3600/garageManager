import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import CreateMessageModal from "@/components/modals/create-message-modal";

interface Message {
  id: number;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  fromUserId: number;
  toUserId: number;
  serviceOrderId?: number;
  isRead: boolean;
  requiresResponse: boolean;
  createdAt: string;
  fromUser?: {
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  toUser?: {
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export default function Messaging() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Obtener notificaciones/mensajes
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications'],
  });

  // Obtener usuarios para conversaciones
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  // Obtener operarios
  const { data: operators = [] } = useQuery({
    queryKey: ['/api/operators'],
  });

  // Obtener clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  // Scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation, notifications]);

  // Agrupar mensajes por conversación
  const getConversations = () => {
    const conversations = new Map<number, Message[]>();
    
    notifications.forEach((notification: Message) => {
      const conversationId = notification.fromUserId === user?.id 
        ? notification.toUserId 
        : notification.fromUserId;
      
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, []);
      }
      conversations.get(conversationId)!.push(notification);
    });

    return Array.from(conversations.entries()).map(([userId, messages]) => ({
      userId,
      messages: messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      lastMessage: messages[messages.length - 1],
      unreadCount: messages.filter(m => !m.isRead && m.toUserId === user?.id).length
    }));
  };

  // Filtrar conversaciones
  const filteredConversations = getConversations().filter(conv => {
    const userInfo = users.find(u => u.id === conv.userId) || 
                    operators.find(o => o.id === conv.userId) || 
                    clients.find(c => c.id === conv.userId);
    
    if (!userInfo) return false;
    
    const name = userInfo.username || 
                 `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 
                 userInfo.email;
    
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filterType !== "all") {
      if (filterType === "unread" && conv.unreadCount === 0) return false;
      if (filterType === "operators" && !operators.find(o => o.id === conv.userId)) return false;
      if (filterType === "clients" && !clients.find(c => c.id === conv.userId)) return false;
    }
    
    return true;
  });

  // Obtener conversación seleccionada
  const selectedConversationData = selectedConversation 
    ? getConversations().find(conv => conv.userId === selectedConversation)
    : null;

  // Obtener información del usuario de la conversación
  const getConversationUser = (userId: number) => {
    return users.find(u => u.id === userId) || 
           operators.find(o => o.id === userId) || 
           clients.find(c => c.id === userId);
  };

  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !newMessage.trim()) return;
      
      await apiRequest('POST', '/api/notifications', {
        title: `Mensaje de ${user?.username || 'Usuario'}`,
        message: newMessage,
        type: 'user_message',
        category: 'user_to_user',
        priority: 'medium',
        toUserId: selectedConversation,
        requiresResponse: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setNewMessage("");
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const getUserDisplayName = (userInfo: any) => {
    if (userInfo.username) return userInfo.username;
    if (userInfo.firstName && userInfo.lastName) return `${userInfo.firstName} ${userInfo.lastName}`;
    if (userInfo.email) return userInfo.email;
    return `Usuario ${userInfo.id}`;
  };

  const getUserInitials = (userInfo: any) => {
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName[0]}${userInfo.lastName[0]}`.toUpperCase();
    }
    if (userInfo.username) return userInfo.username[0].toUpperCase();
    if (userInfo.email) return userInfo.email[0].toUpperCase();
    return 'U';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de conversaciones */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Mensajes</h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
            >
              Todos
            </Button>
            <Button
              variant={filterType === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("unread")}
            >
              No leídos
            </Button>
            <Button
              variant={filterType === "operators" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("operators")}
            >
              Operarios
            </Button>
            <Button
              variant={filterType === "clients" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("clients")}
            >
              Clientes
            </Button>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const userInfo = getConversationUser(conversation.userId);
            if (!userInfo) return null;
            
            return (
              <div
                key={conversation.userId}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.userId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.userId)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getUserInitials(userInfo)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">
                        {getUserDisplayName(userInfo)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {conversation.lastMessage.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">Alta</Badge>
                      )}
                      {conversation.lastMessage.priority === 'urgent' && (
                        <Badge variant="destructive" className="text-xs">Urgente</Badge>
                      )}
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {getConversationUser(selectedConversation) && 
                     getUserInitials(getConversationUser(selectedConversation)!)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="font-semibold">
                    {getConversationUser(selectedConversation) && 
                     getUserDisplayName(getConversationUser(selectedConversation)!)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {getConversationUser(selectedConversation)?.role || 'Usuario'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {selectedConversationData?.messages.map((message) => {
                const isOwnMessage = message.fromUserId === user?.id;
                const messageUser = getConversationUser(message.fromUserId);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && (
                        <Avatar className="h-6 w-6 mb-1">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs">
                            {messageUser && getUserInitials(messageUser)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {isOwnMessage && (
                            <span>✓</span>
                          )}
                        </div>
                      </div>
                      
                      {message.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          Alta Prioridad
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Estado vacío */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona una conversación
              </h3>
              <p className="text-gray-500">
                Elige una conversación del panel izquierdo para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación de mensaje */}
      <CreateMessageModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}

