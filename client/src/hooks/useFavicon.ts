import { useEffect } from 'react';
import { useTaller } from '@/contexts/TallerContext';

export const useFavicon = () => {
  const { taller } = useTaller();

  useEffect(() => {
    if (taller?.favicon) {
      // Actualizar favicon
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = taller.favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [taller?.favicon]);
};
