import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useTallerImages } from "@/hooks/useTallerImages";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Clients from "@/pages/clients";
import Vehicles from "@/pages/vehicles";
import Inventory from "@/pages/inventory";
import Workers from "@/pages/workers";
import Billing from "@/pages/billing";
import Notifications from "@/pages/notifications";
import Messaging from "@/pages/messaging";
import Settings from "@/pages/settings";
import OperatorOrderManagement from "@/components/OperatorOrderManagement";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import FirstLoginModal from "@/components/FirstLoginModal";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  // Usar el hook para cargar y aplicar las imágenes del taller globalmente
  useTallerImages();

  // Verificar si es primera sesión
  const { data: firstLoginData } = useQuery({
    queryKey: ['/api/auth/first-login'],
    enabled: !!user,
    refetchInterval: false,
    staleTime: Infinity,
  });

  // Mostrar modal si es primera sesión
  useEffect(() => {
    if (firstLoginData && typeof firstLoginData === 'object' && 'isFirstLogin' in firstLoginData && firstLoginData.isFirstLogin) {
      setShowFirstLoginModal(true);
    }
  }, [firstLoginData]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Modal de primera sesión */}
      <FirstLoginModal 
        open={showFirstLoginModal} 
        onOpenChange={setShowFirstLoginModal} 
      />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/clients" component={Clients} />
        <Route path="/vehicles" component={Vehicles} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/workers" component={Workers} />
        <Route path="/billing" component={Billing} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/messaging" component={Messaging} />
        <Route path="/settings" component={Settings} />
        <Route path="/operator-order-management" component={OperatorOrderManagement} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
