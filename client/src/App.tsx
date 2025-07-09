import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Clients from "@/pages/clients";
import Vehicles from "@/pages/vehicles";
import Inventory from "@/pages/inventory";
import Workers from "@/pages/workers";
import Billing from "@/pages/billing";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
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
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
