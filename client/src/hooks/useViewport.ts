import { useEffect, useState } from 'react';

export type ViewportType = 'mobile' | 'tablet' | 'desktop';

export function useViewport(): ViewportType {
  const [viewport, setViewport] = useState<ViewportType>('desktop');

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;

      if (w <= 768) {
        setViewport('mobile');
      } else if (w <= 1280) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return viewport;
}

export function useIsMobileViewport() {
  return useViewport() === 'mobile';
}
