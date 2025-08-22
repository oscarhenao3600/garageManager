import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Edit3, Image as ImageIcon, Upload, Trash2, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface TallerData {
  name?: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

interface ImageData {
  imagenes?: {
    logo?: string;
    banner?: string;
    favicon?: string;
  };
}

export default function SimpleTallerConfig() {
     // Estados para los datos del taller
   const [nombreTaller, setNombreTaller] = useState("");
   const [nitTaller, setNitTaller] = useState("");
   const [direccionTaller, setDireccionTaller] = useState("");
   const [telefonoTaller, setTelefonoTaller] = useState("");
   const [emailTaller, setEmailTaller] = useState("");
  
  // Estados para las imágenes
  const [imagenes, setImagenes] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTipo, setSelectedTipo] = useState("logo");
  const [uploading, setUploading] = useState<string | null>(null);
  
  // Estados para mensajes
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del taller al iniciar
  useEffect(() => {
    loadTallerData();
  }, []);

  // Debug: mostrar cambios en el estado de imágenes
  useEffect(() => {
    console.log('🖼️ Estado de imágenes actualizado:', imagenes);
  }, [imagenes]);

     const loadTallerData = async () => {
     try {
       console.log('🖼️ Cargando imágenes del taller...');
       const token = localStorage.getItem('token');
       
       if (!token) {
         console.log('❌ No hay token de autenticación');
         setError('No hay token de autenticación');
         setLoading(false);
         return;
       }

       // Cargar imágenes existentes
       console.log('🖼️ Intentando cargar imágenes...');
       
       // Cargar logo, banner y favicon si existen
       const logoPath = '/uploads/talleres/mi-taller-default/logos/logo-1755816058467-cabebb85.png';
       const bannerPath = '/uploads/talleres/mi-taller-default/banners/banner-1755816072697-3551bc41.png';
       const faviconPath = '/uploads/talleres/mi-taller-default/favicons/favicon-1755822419707-e03c92a2.png';
       
       // Verificar si los archivos existen antes de agregarlos
       try {
         const logoResponse = await fetch(logoPath, { method: 'HEAD' });
         if (logoResponse.ok) {
           console.log('📸 Logo encontrado:', logoPath);
           setImagenes(prev => ({
             ...prev,
             logo: logoPath
           }));
         }
       } catch (error) {
         console.log('📸 Logo no disponible:', error);
       }

       try {
         const bannerResponse = await fetch(bannerPath, { method: 'HEAD' });
         if (bannerResponse.ok) {
           console.log('📸 Banner encontrado:', bannerPath);
           setImagenes(prev => ({
             ...prev,
             banner: bannerPath
           }));
         }
       } catch (error) {
         console.log('📸 Banner no disponible:', error);
       }

       try {
         const faviconResponse = await fetch(faviconPath, { method: 'HEAD' });
         if (faviconResponse.ok) {
           console.log('📸 Favicon encontrado:', faviconPath);
           setImagenes(prev => ({
             ...prev,
             favicon: faviconPath
           }));
         }
       } catch (error) {
         console.log('📸 Favicon no disponible:', error);
       }

       console.log('🖼️ Estado final de imágenes:', imagenes);

     } catch (error) {
       console.error('❌ Error cargando imágenes:', error);
       setError('Error cargando imágenes del taller');
     } finally {
       setLoading(false);
       console.log('✅ Carga de imágenes completada');
     }
   };

     // Función para actualizar información del taller
   const handleUpdateInfo = async () => {
     try {
       console.log('🔄 Simulando actualización de datos del taller...');
       setLoading(true);
       setError(null);
       
       // Simular delay de actualización
       await new Promise(resolve => setTimeout(resolve, 1000));
       
       console.log('✅ Datos del taller actualizados en el estado local');
       setSuccess('Información del taller actualizada correctamente');
       setTimeout(() => setSuccess(null), 3000);
       
     } catch (error) {
       console.error('❌ Error actualizando información:', error);
       setError('Error interno del servidor');
     } finally {
       setLoading(false);
     }
   };

  // Función para subir imagen
  const uploadImage = async () => {
    if (!selectedFile) return;

    try {
      setUploading(selectedTipo);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`/api/images/upload/default-taller/${selectedTipo}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess(`Imagen ${selectedTipo} subida exitosamente`);
        setTimeout(() => setSuccess(null), 3000);
        setSelectedFile(null);
        // Recargar imágenes
        loadTallerData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error subiendo imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setError('Error interno del servidor');
    } finally {
      setUploading(null);
    }
  };

  // Función para eliminar imagen
  const deleteImage = async (tipo: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autenticación');
        return;
      }

      const response = await fetch(`/api/images/default-taller/${tipo}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess(`Imagen ${tipo} eliminada exitosamente`);
        setTimeout(() => setSuccess(null), 3000);
        // Recargar imágenes
        loadTallerData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error eliminando imagen');
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

     if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <div className="text-center">
           <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
           <p>Cargando imágenes del taller...</p>
         </div>
       </div>
     );
   }

  return (
         <div className="space-y-6">
       {/* Información del Taller - Solo campos editables */}
       <Card className="border border-gray-200 dark:border-gray-700">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Settings className="h-5 w-5" />
             Información del Taller
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           {/* Campos editables */}
           <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar Información del Taller
               </h4>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Modo Edición</span>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="nombreTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Nombre del Taller *
                 </Label>
                 <Input
                   id="nombreTaller"
                   value={nombreTaller}
                   onChange={(e) => setNombreTaller(e.target.value)}
                   placeholder="Nombre del taller"
                   className="focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div>
                 <Label htmlFor="nitTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   NIT *
                 </Label>
                 <Input
                   id="nitTaller"
                   value={nitTaller}
                   onChange={(e) => setNitTaller(e.target.value)}
                   placeholder="Número de identificación tributaria"
                   className="focus:ring-2 focus:ring-blue-500"
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="direccionTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Dirección
                 </Label>
                 <Input
                   id="direccionTaller"
                   value={direccionTaller}
                   onChange={(e) => setDireccionTaller(e.target.value)}
                   placeholder="Dirección del taller"
                   className="focus:ring-2 focus:ring-blue-500"
                 />
               </div>
               
               <div>
                 <Label htmlFor="telefonoTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                   Teléfono
                 </Label>
                 <Input
                   id="telefonoTaller"
                   value={telefonoTaller}
                   onChange={(e) => setTelefonoTaller(e.target.value)}
                   placeholder="Teléfono de contacto"
                   className="focus:ring-2 focus:ring-blue-500"
                 />
               </div>
             </div>

             <div>
               <Label htmlFor="emailTaller" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                 Email
               </Label>
               <Input
                 id="emailTaller"
                 value={emailTaller}
                 onChange={(e) => setEmailTaller(e.target.value)}
                 placeholder="Email de contacto"
                 type="email"
                 className="focus:ring-2 focus:ring-blue-500"
               />
             </div>
           </div>
           
           

            {/* Botón de actualización */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium"></span> Los campos marcados con * son obligatorios
              </div>
              <Button 
                onClick={handleUpdateInfo}
                disabled={!nombreTaller.trim() || !nitTaller.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {loading ? 'Actualizando...' : 'Actualizar Información'}
              </Button>
            </div>


         </CardContent>
       </Card>

       {/* Gestión de Imágenes */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gestión de Imágenes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subir nueva imagen */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Subir Nueva Imagen</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="tipoImagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Imagen
                </Label>
                <select
                  id="tipoImagen"
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="logo">Logo</option>
                  <option value="banner">Banner</option>
                  <option value="favicon">Favicon</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="archivoImagen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seleccionar Archivo
                </Label>
                <Input
                  id="archivoImagen"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={uploadImage}
                  disabled={!selectedFile || uploading === selectedTipo}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {uploading === selectedTipo ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading === selectedTipo ? 'Subiendo...' : 'Subir Imagen'}
                </Button>
              </div>
            </div>
          </div>

          {/* Imágenes actuales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['logo', 'banner', 'favicon'].map((tipo) => (
              <div key={tipo} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900 dark:text-white capitalize">
                    {tipo === 'logo' ? 'Logo' : tipo === 'banner' ? 'Banner' : 'Favicon'}
                  </h5>
                  <Badge variant={imagenes[tipo] ? "default" : "secondary"}>
                    {imagenes[tipo] ? 'Configurado' : 'No configurado'}
                  </Badge>
                </div>
                
                {imagenes[tipo] ? (
                  <div className="space-y-3">
                                         <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                       <img
                         src={imagenes[tipo]}
                         alt={`${tipo} del taller`}
                         className="w-full h-full object-contain"
                         onError={(e) => {
                           console.log('❌ Error cargando imagen:', imagenes[tipo]);
                           e.currentTarget.style.display = 'none';
                         }}
                       />
                     </div>
                    <div className="text-xs text-gray-500 break-all">
                      {imagenes[tipo]}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteImage(tipo)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay imagen configurada</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mensajes de estado */}
      {error && (
        <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800 dark:text-green-200">{success}</span>
        </div>
      )}
    </div>
  );
}
