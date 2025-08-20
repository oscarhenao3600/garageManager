import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Database,
  FileText,
  BarChart3,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";

interface SystemAuditLog {
  id: number;
  userId?: number;
  action: string;
  resource?: string;
  resourceId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: string;
  user?: {
    username: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

interface UserActivityLog {
  id: number;
  userId: number;
  sessionId?: string;
  action: string;
  page?: string;
  duration?: number;
  dataAccessed?: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  user?: {
    username: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export default function AuditDashboard() {
  const { user } = useAuth();
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [limit, setLimit] = useState<number>(100);

  // Obtener logs del sistema
  const { data: systemLogs, isLoading: loadingSystemLogs, refetch: refetchSystemLogs } = useQuery({
    queryKey: ['/api/audit/system-logs', selectedSeverity, selectedAction, selectedUser, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSeverity !== "all") params.append("severity", selectedSeverity);
      if (selectedAction !== "all") params.append("action", selectedAction);
      if (selectedUser !== "all") params.append("userId", selectedUser);
      params.append("limit", limit.toString());

      const response = await apiRequest('GET', `/api/audit/system-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al obtener logs del sistema');
      }
      return response.json();
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'superAdmin'),
  });

  // Obtener logs de actividad del usuario actual
  const { data: userActivity, isLoading: loadingUserActivity } = useQuery({
    queryKey: ['/api/audit/user-activity', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/audit/user-activity/${user?.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener logs de actividad');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      info: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      warning: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      error: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
      critical: { color: "bg-red-600 text-white", icon: AlertTriangle },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.info;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const actionConfig = {
      login: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      logout: { color: "bg-gray-100 text-gray-800", icon: Clock },
      password_change: { color: "bg-blue-100 text-blue-800", icon: Shield },
      data_access: { color: "bg-purple-100 text-purple-800", icon: Database },
      data_export: { color: "bg-orange-100 text-orange-800", icon: Download },
      page_view: { color: "bg-indigo-100 text-indigo-800", icon: Eye },
      api_call: { color: "bg-teal-100 text-teal-800", icon: BarChart3 },
    };

    const config = actionConfig[action as keyof typeof actionConfig] || { color: "bg-gray-100 text-gray-800", icon: FileText };
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {action.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const exportAuditLogs = () => {
    if (!systemLogs) return;

    const csvContent = [
      ['ID', 'Usuario', 'Acción', 'Recurso', 'Detalles', 'IP', 'Severidad', 'Timestamp'],
      ...systemLogs.map((log: SystemAuditLog) => [
        log.id,
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
        log.action,
        log.resource || 'N/A',
        log.details || 'N/A',
        log.ipAddress || 'N/A',
        log.severity,
        new Date(log.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dashboard de Auditoría
          </CardTitle>
          <CardDescription>
            Acceso denegado. Solo los administradores pueden acceder al dashboard de auditoría.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Dashboard de Auditoría del Sistema
        </h2>
        <div className="flex gap-2">
          <Button onClick={() => refetchSystemLogs()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={exportAuditLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Severidad</label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las severidades</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Acción</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="password_change">Cambio de contraseña</SelectItem>
                  <SelectItem value="data_access">Acceso a datos</SelectItem>
                  <SelectItem value="data_export">Exportación de datos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Usuario</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {/* Aquí se podrían agregar usuarios específicos */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Límite de registros</label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min="10"
                max="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registros de auditoría del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {systemLogs?.filter((log: SystemAuditLog) => log.severity === 'critical').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(systemLogs?.map((log: SystemAuditLog) => log.userId).filter(Boolean)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios con actividad registrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Actividad</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userActivity?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Registros de mi actividad
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Logs de Auditoría del Sistema
          </CardTitle>
          <CardDescription>
            Registro completo de todas las acciones del sistema para auditoría y seguridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSystemLogs ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : systemLogs && systemLogs.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {systemLogs.map((log: SystemAuditLog) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    {getSeverityBadge(log.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getActionBadge(log.action)}
                      {log.resource && (
                        <Badge variant="outline" className="text-xs">
                          {log.resource}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <p className="font-medium">
                        {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.username})` : 'Usuario no identificado'}
                      </p>
                      {log.details && (
                        <p className="text-gray-600 mt-1">{log.details}</p>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-gray-500 mt-1">IP: {log.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No hay logs de auditoría disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mi Actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Mi Actividad Reciente
          </CardTitle>
          <CardDescription>
            Registro de mi actividad en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUserActivity ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : userActivity && userActivity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {userActivity.slice(0, 10).map((activity: UserActivityLog) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getActionBadge(activity.action)}
                      {activity.page && (
                        <Badge variant="outline" className="text-xs">
                          {activity.page}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {activity.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        Duración: {activity.duration}s
                      </p>
                    )}
                    
                    {activity.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {activity.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No hay actividad registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
