import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save } from "lucide-react";
import { useTallerImages } from "@/hooks/useTallerImages";
import { useToast } from "@/hooks/use-toast";

export default function SimpleTallerConfig() {
  const [loading, setLoading] = useState(false);
   const [nombreTaller, setNombreTaller] = useState("");
   const [nitTaller, setNitTaller] = useState("");
   const [direccionTaller, setDireccionTaller] = useState("");
   const [telefonoTaller, setTelefonoTaller] = useState("");
   const [emailTaller, setEmailTaller] = useState("");
  const [websiteTaller, setWebsiteTaller] = useState("");
  const [tipo, setTipo] = useState<string>("logo");
  const [archivo, setArchivo] = useState<File | null>(null);
  
  // Usar el hook de toast estándar
  const { toast } = useToast();
  
  // Usar el hook personalizado para las imágenes
  const { images, actualizarImagen, eliminarImagen } = useTallerImages();
  
  // Debug: mostrar las imágenes cargadas
  useEffect(() => {
    console.log('🖼️ Imágenes cargadas en SimpleTallerConfig:', images);
  }, [images]);

  useEffect(() => {
    cargarDatosTaller();
  }, []);

  const cargarDatosTaller = async () => {
    try {
       const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/company-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNombreTaller(data.name || '');
        setNitTaller(data.nit || '');
        setDireccionTaller(data.address || '');
        setTelefonoTaller(data.phone || '');
        setEmailTaller(data.email || '');
        setWebsiteTaller(data.website || '');

       // Las imágenes se manejan automáticamente por el hook useTallerImages
         }
       } catch (error) {
      console.error('Error cargando datos del taller:', error);
    }
  };

  const guardarDatosTaller = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch('/api/company-info', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nombreTaller,
          nit: nitTaller,
          address: direccionTaller,
          phone: telefonoTaller,
          email: emailTaller,
          website: websiteTaller
        })
      });

      if (response.ok) {
        toast({
          title: "✅ Información actualizada",
          description: "La información del taller se ha actualizado correctamente",
        });
      } else {
        throw new Error('Error al actualizar la información');
      }
     } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al actualizar la información del taller",
        variant: "destructive",
      });
     } finally {
       setLoading(false);
     }
   };

  const subirImagen = async () => {
    if (!archivo) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const formData = new FormData();
      formData.append('image', archivo);
      formData.append('type', tipo);

      const response = await fetch('/api/company/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "✅ Imagen subida",
          description: "La imagen se ha subido correctamente",
        });
        setArchivo(null);

        // Actualizar la imagen usando el hook
        // Asegurar que la URL sea completa
        const imageUrl = data.url.startsWith('http') ? data.url : `http://localhost:5000${data.url}`;
        actualizarImagen(tipo as 'logo' | 'banner' | 'favicon', imageUrl);
      } else {
        throw new Error('Error al subir la imagen');
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al subir la imagen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarImagenLocal = async (tipoImagen: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`/api/company/delete-image/${tipoImagen}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "✅ Imagen eliminada",
          description: "La imagen se ha eliminado correctamente",
        });

        // Eliminar la imagen usando el hook
        eliminarImagen(tipoImagen as 'logo' | 'banner' | 'favicon');
      } else {
        throw new Error('Error al eliminar la imagen');
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error al eliminar la imagen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
         <div className="space-y-6">
      {/* Información del Taller */}
      <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
             Información del Taller
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
              <label htmlFor="nombreTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre del Taller
              </label>
                 <Input
                   id="nombreTaller"
                   value={nombreTaller}
                   onChange={(e) => setNombreTaller(e.target.value)}
                   placeholder="Nombre del taller"
                className="mt-1"
                 />
               </div>
               
               <div>
              <label htmlFor="nitTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                NIT
              </label>
                 <Input
                   id="nitTaller"
                   value={nitTaller}
                   onChange={(e) => setNitTaller(e.target.value)}
                placeholder="NIT del taller"
                className="mt-1"
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
              <label htmlFor="direccionTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Dirección
              </label>
                 <Input
                   id="direccionTaller"
                   value={direccionTaller}
                   onChange={(e) => setDireccionTaller(e.target.value)}
                   placeholder="Dirección del taller"
                className="mt-1"
                 />
               </div>
               
               <div>
              <label htmlFor="telefonoTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Teléfono
              </label>
                 <Input
                   id="telefonoTaller"
                   value={telefonoTaller}
                   onChange={(e) => setTelefonoTaller(e.target.value)}
                placeholder="Teléfono del taller"
                className="mt-1"
                 />
               </div>
             </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="emailTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                 Email
              </label>
               <Input
                 id="emailTaller"
                 value={emailTaller}
                 onChange={(e) => setEmailTaller(e.target.value)}
                placeholder="Email del taller"
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="websiteTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sitio Web
              </label>
              <Input
                id="websiteTaller"
                value={websiteTaller}
                onChange={(e) => setWebsiteTaller(e.target.value)}
                placeholder="Sitio web del taller"
                className="mt-1"
               />
             </div>
           </div>
           
              <Button 
            onClick={guardarDatosTaller}
            disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
            <Save className="h-4 w-4 mr-2" />
                {loading ? 'Actualizando...' : 'Actualizar Información'}
              </Button>
         </CardContent>
       </Card>

       {/* Gestión de Imágenes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestión de Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
              <label htmlFor="tipoImagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Imagen
              </label>
                <select
                  id="tipoImagen"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="logo">Logo</option>
                  <option value="banner">Banner</option>
                  <option value="favicon">Favicon</option>
                </select>
              </div>
              
              <div>
              <label htmlFor="archivoImagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seleccionar Archivo
              </label>
                <Input
                  id="archivoImagen"
                  type="file"
                  accept="image/*"
                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                className="mt-1"
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                onClick={subirImagen}
                disabled={!archivo || loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Subiendo...' : 'Subir Imagen'}
                </Button>
            </div>
          </div>

          {/* Vista previa de imágenes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(images).map(([tipoImagen, url]) => (
              <div key={tipoImagen} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">{tipoImagen}</span>
                  <Button
                    onClick={() => eliminarImagenLocal(tipoImagen)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                </div>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {url ? (
                    <img
                      src={url}
                      alt={tipoImagen}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        console.error(`Error cargando imagen ${tipoImagen}:`, url);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log(`✅ Imagen ${tipoImagen} cargada correctamente:`, url);
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">Sin imagen</div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500 truncate">
                  {url ? url.split('/').pop() : 'No hay archivo'}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(images).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay imágenes configuradas</p>
              <p className="text-sm">Sube imágenes para personalizar tu taller</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
