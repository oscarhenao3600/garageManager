import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { 
  Upload, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  CreditCard, 
  Settings 
} from "lucide-react";

interface CompanySettings {
  id?: number;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  website: string | null;
  logo: string | null;
  invoiceFooter: string | null;
  invoiceNotes: string | null;
  bankInfo: {
    bankName: string | null;
    accountType: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
  } | null;
  electronicInvoiceSettings: {
    enabled: boolean;
    email: {
      host: string | null;
      port: number | null;
      secure: boolean;
      auth: {
        user: string | null;
        pass: string | null;
      };
    };
  } | null;
  createdAt: string;
  updatedAt: string;
}



export default function CompanySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLogoFile] = useState<File | null>(null);

  // Redireccionar si el usuario no es admin
  if (user?.role !== "Admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-red-600">
          No tienes permiso para acceder a esta página.
        </p>
      </div>
    );
  }

  // Obtener configuración actual
  const { data: settings, refetch } = useQuery<CompanySettings, Error>({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const response = await fetch("/api/company-settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener la configuración");
      return response.json() as Promise<CompanySettings>;
    },
  });

  // Mutación para actualizar configuración
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CompanySettings>) => {
      const response = await fetch("/api/company-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error("Error al actualizar la configuración");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para subir logo
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/company-settings/logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Error al subir el logo");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logo actualizado",
        description: "El logo se ha actualizado correctamente",
      });
      setLogoFile(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Construir objeto de configuración
    const newSettings: Partial<CompanySettings> = {
      name: formData.get("name") as string,
      nit: formData.get("nit") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      website: formData.get("website") as string,
      invoiceFooter: formData.get("invoiceFooter") as string,
      invoiceNotes: formData.get("invoiceNotes") as string,
      bankInfo: {
        bankName: formData.get("bankName") as string,
        accountType: formData.get("accountType") as string,
        accountNumber: formData.get("accountNumber") as string,
        accountHolder: formData.get("accountHolder") as string,
      },
      electronicInvoiceSettings: {
        enabled: true,
        email: {
          host: formData.get("emailHost") as string,
          port: parseInt(formData.get("emailPort") as string),
          secure: (formData.get("emailSecure") as string) === "true",
          auth: {
            user: formData.get("emailUser") as string,
            pass: formData.get("emailPass") as string,
          },
        },
      },
    };

    updateSettings.mutate(newSettings);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      uploadLogo.mutate(file);
    }
  };

  if (!settings) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Configuración de la Empresa</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Logo de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.logo && (
              <div className="w-48 h-48 border rounded-lg overflow-hidden">
                <img
                  src={settings.logo}
                  alt="Logo de la empresa"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <Label htmlFor="logo">Subir nuevo logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleLogoChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Formatos permitidos: JPG, PNG. Tamaño máximo: 5MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={settings.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nit">NIT</Label>
                <Input
                  id="nit"
                  name="nit"
                  defaultValue={settings.nit}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                name="address"
                defaultValue={settings.address}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={settings.phone}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={settings.email}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">
                <Globe className="w-4 h-4 inline mr-1" />
                Sitio Web
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={settings.website ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información Bancaria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Información Bancaria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Banco</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  defaultValue={settings.bankInfo?.bankName ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="accountType">Tipo de Cuenta</Label>
                <Input
                  id="accountType"
                  name="accountType"
                  defaultValue={settings.bankInfo?.accountType ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Número de Cuenta</Label>
                <Input
                  id="accountNumber"
                  name="accountNumber"
                  defaultValue={settings.bankInfo?.accountNumber ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="accountHolder">Titular de la Cuenta</Label>
                <Input
                  id="accountHolder"
                  name="accountHolder"
                  defaultValue={settings.bankInfo?.accountHolder ?? ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Facturación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración de Facturación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoiceFooter">Pie de Factura</Label>
              <Textarea
                id="invoiceFooter"
                name="invoiceFooter"
                defaultValue={settings.invoiceFooter ?? ""}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="invoiceNotes">Notas Adicionales</Label>
              <Textarea
                id="invoiceNotes"
                name="invoiceNotes"
                defaultValue={settings.invoiceNotes ?? ""}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Configuración de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailHost">Servidor SMTP</Label>
                <Input
                  id="emailHost"
                  name="emailHost"
                  defaultValue={settings.electronicInvoiceSettings?.email.host ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="emailPort">Puerto</Label>
                <Input
                  id="emailPort"
                  name="emailPort"
                  type="number"
                  defaultValue={settings.electronicInvoiceSettings?.email.port?.toString() ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailUser">Usuario</Label>
                <Input
                  id="emailUser"
                  name="emailUser"
                  defaultValue={settings.electronicInvoiceSettings?.email.auth.user ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="emailPass">Contraseña</Label>
                <Input
                  id="emailPass"
                  name="emailPass"
                  type="password"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <Label>
                <Input
                  type="checkbox"
                  name="emailSecure"
                  className="mr-2"
                  defaultChecked={settings.electronicInvoiceSettings?.email.secure}
                />
                Usar conexión segura (SSL/TLS)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Guardar Cambios
        </Button>
      </form>
    </div>
  );
}
