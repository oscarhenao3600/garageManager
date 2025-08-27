import { useEffect } from 'react';

export const useFavicon = (faviconUrl?: string) => {
  useEffect(() => {
    if (faviconUrl) {
      // Actualizar favicon
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [faviconUrl]);
};
