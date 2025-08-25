import { useEffect, useState } from 'react';

interface TallerImages {
  logo?: string;
  banner?: string;
  favicon?: string;
}

export const useTallerImages = () => {
  const [images, setImages] = useState<TallerImages>({});
  const [loading, setLoading] = useState(true);

  // Función para aplicar el favicon
  const aplicarFavicon = (faviconUrl: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    
    // Remover favicon existente si hay uno
    const existingLink = document.querySelector("link[rel*='icon']");
    if (existingLink) {
      existingLink.remove();
    }
    
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  // Función para aplicar el banner
  const aplicarBanner = (bannerUrl: string) => {
    // Buscar elementos con clase 'banner' o 'header-banner' y aplicar la imagen
    const bannerElements = document.querySelectorAll('.banner, .header-banner, [data-banner]');
    bannerElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.backgroundImage = `url(${bannerUrl})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
      }
    });
  };

  // Función para aplicar el logo
  const aplicarLogo = (logoUrl: string) => {
    // Buscar elementos con clase 'logo' o 'header-logo' y aplicar la imagen
    const logoElements = document.querySelectorAll('.logo, .header-logo, [data-logo]');
    logoElements.forEach(element => {
      if (element instanceof HTMLImageElement) {
        element.src = logoUrl;
        element.alt = 'Logo del taller';
      }
    });
  };

  // Función para aplicar todas las imágenes
  const aplicarImagenes = (newImages: TallerImages) => {
    if (newImages.favicon) aplicarFavicon(newImages.favicon);
    if (newImages.banner) aplicarBanner(newImages.banner);
    if (newImages.logo) aplicarLogo(newImages.logo);
  };

  // Función para cargar las imágenes del taller
  const cargarImagenes = async () => {
    try {
      setLoading(true);
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
        const newImages: TallerImages = {
          logo: data.logo || undefined,
          banner: data.banner || undefined,
          favicon: data.favicon || undefined
        };
        
        setImages(newImages);
        aplicarImagenes(newImages);
      }
    } catch (error) {
      console.error('Error cargando imágenes del taller:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una imagen específica
  const actualizarImagen = (tipo: keyof TallerImages, url: string) => {
    const newImages = { ...images, [tipo]: url };
    setImages(newImages);
    
    // Aplicar la imagen específica
    if (tipo === 'favicon') {
      aplicarFavicon(url);
    } else if (tipo === 'banner') {
      aplicarBanner(url);
    } else if (tipo === 'logo') {
      aplicarLogo(url);
    }
  };

  // Función para eliminar una imagen específica
  const eliminarImagen = (tipo: keyof TallerImages) => {
    const newImages = { ...images };
    delete newImages[tipo];
    setImages(newImages);
    
    // Eliminar la aplicación de la imagen
    if (tipo === 'favicon') {
      document.querySelector("link[rel*='icon']")?.remove();
    } else if (tipo === 'banner') {
      const bannerElements = document.querySelectorAll('.banner, .header-banner, [data-banner]');
      bannerElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.style.backgroundImage = 'none';
        }
      });
    } else if (tipo === 'logo') {
      const logoElements = document.querySelectorAll('.logo, .header-logo, [data-logo]');
      logoElements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          element.src = '';
        }
      });
    }
  };

  // Cargar imágenes al montar el componente
  useEffect(() => {
    cargarImagenes();
  }, []);

  return {
    images,
    loading,
    cargarImagenes,
    actualizarImagen,
    eliminarImagen,
    aplicarImagenes
  };
};
