import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useCache } from '@/contexts/CacheContext';

export function useScrollRestoration() {
  const location = useLocation();
  const { getScrollPosition, setScrollPosition } = useCache();

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(location.pathname, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    // Debounce scroll saving
    let timeoutId: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', debouncedScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(timeoutId);
    };
  }, [location.pathname, setScrollPosition]);

  // Restore scroll position when returning to page
  useEffect(() => {
    const savedPosition = getScrollPosition(location.pathname);
    
    if (savedPosition) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition.y,
          left: savedPosition.x,
          behavior: 'instant',
        });
      });
    }
  }, [location.pathname, getScrollPosition]);
}

export function usePreserveScrollOnBack() {
  const { getScrollPosition, setScrollPosition } = useCache();
  const location = useLocation();

  const saveScroll = useCallback(() => {
    setScrollPosition(location.pathname, {
      x: window.scrollX,
      y: window.scrollY,
    });
  }, [location.pathname, setScrollPosition]);

  const restoreScroll = useCallback(() => {
    const pos = getScrollPosition(location.pathname);
    if (pos) {
      requestAnimationFrame(() => {
        window.scrollTo(pos.x, pos.y);
      });
    }
  }, [location.pathname, getScrollPosition]);

  return { saveScroll, restoreScroll };
}
