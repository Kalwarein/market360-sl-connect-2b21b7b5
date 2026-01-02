import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface ScrollPosition {
  x: number;
  y: number;
}

interface CacheContextType {
  // Data caching
  getCache: <T>(key: string) => T | null;
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  invalidateCache: (key: string) => void;
  invalidateCachePattern: (pattern: string) => void;
  
  // Image tracking
  isImageLoaded: (url: string) => boolean;
  markImageLoaded: (url: string) => void;
  
  // Scroll position
  getScrollPosition: (route: string) => ScrollPosition | null;
  setScrollPosition: (route: string, position: ScrollPosition) => void;
  
  // Request deduplication
  getInflightRequest: <T>(key: string) => Promise<T> | null;
  setInflightRequest: <T>(key: string, promise: Promise<T>) => void;
  clearInflightRequest: (key: string) => void;
  
  // Initial load tracking
  hasInitiallyLoaded: (key: string) => boolean;
  markInitiallyLoaded: (key: string) => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_KEY = 'market360_loaded_images';
const DATA_CACHE_KEY = 'market360_data_cache';

export const CacheProvider = ({ children }: { children: ReactNode }) => {
  const [memoryCache, setMemoryCache] = useState<Map<string, CacheEntry<any>>>(new Map());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [scrollPositions, setScrollPositions] = useState<Map<string, ScrollPosition>>(new Map());
  const [inflightRequests, setInflightRequests] = useState<Map<string, Promise<any>>>(new Map());
  const [initialLoads, setInitialLoads] = useState<Set<string>>(new Set());

  // Load cached images from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(IMAGE_CACHE_KEY);
      if (cached) {
        const urls = JSON.parse(cached) as string[];
        setLoadedImages(new Set(urls.slice(-500))); // Keep last 500 images
      }
    } catch (e) {
      console.error('Error loading image cache:', e);
    }

    // Load data cache from localStorage
    try {
      const cached = localStorage.getItem(DATA_CACHE_KEY);
      if (cached) {
        const entries = JSON.parse(cached) as [string, CacheEntry<any>][];
        const validEntries = entries.filter(([_, entry]) => 
          Date.now() - entry.timestamp < DEFAULT_TTL * 2
        );
        setMemoryCache(new Map(validEntries));
      }
    } catch (e) {
      console.error('Error loading data cache:', e);
    }
  }, []);

  // Persist loaded images to localStorage
  const persistImageCache = useCallback((images: Set<string>) => {
    try {
      const urls = Array.from(images).slice(-500);
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(urls));
    } catch (e) {
      console.error('Error persisting image cache:', e);
    }
  }, []);

  // Persist data cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const entries = Array.from(memoryCache.entries()).slice(-100);
        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(entries));
      } catch (e) {
        console.error('Error persisting data cache:', e);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [memoryCache]);

  const getCache = useCallback(<T,>(key: string): T | null => {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    
    // Check if expired (use 2x TTL for stale-while-revalidate pattern)
    if (Date.now() - entry.timestamp > DEFAULT_TTL * 2) {
      return null;
    }
    
    return entry.data as T;
  }, [memoryCache]);

  const setCache = useCallback(<T,>(key: string, data: T, ttl?: number) => {
    setMemoryCache(prev => {
      const newMap = new Map(prev);
      newMap.set(key, {
        data,
        timestamp: Date.now(),
        version: (prev.get(key)?.version || 0) + 1
      });
      return newMap;
    });
  }, []);

  const invalidateCache = useCallback((key: string) => {
    setMemoryCache(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const invalidateCachePattern = useCallback((pattern: string) => {
    setMemoryCache(prev => {
      const newMap = new Map(prev);
      for (const key of newMap.keys()) {
        if (key.includes(pattern)) {
          newMap.delete(key);
        }
      }
      return newMap;
    });
  }, []);

  const isImageLoaded = useCallback((url: string): boolean => {
    return loadedImages.has(url);
  }, [loadedImages]);

  const markImageLoaded = useCallback((url: string) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(url);
      persistImageCache(newSet);
      return newSet;
    });
  }, [persistImageCache]);

  const getScrollPosition = useCallback((route: string): ScrollPosition | null => {
    return scrollPositions.get(route) || null;
  }, [scrollPositions]);

  const setScrollPosition = useCallback((route: string, position: ScrollPosition) => {
    setScrollPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(route, position);
      return newMap;
    });
  }, []);

  const getInflightRequest = useCallback(<T,>(key: string): Promise<T> | null => {
    return inflightRequests.get(key) as Promise<T> | null;
  }, [inflightRequests]);

  const setInflightRequest = useCallback(<T,>(key: string, promise: Promise<T>) => {
    setInflightRequests(prev => {
      const newMap = new Map(prev);
      newMap.set(key, promise);
      return newMap;
    });
  }, []);

  const clearInflightRequest = useCallback((key: string) => {
    setInflightRequests(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const hasInitiallyLoaded = useCallback((key: string): boolean => {
    return initialLoads.has(key);
  }, [initialLoads]);

  const markInitiallyLoaded = useCallback((key: string) => {
    setInitialLoads(prev => new Set(prev).add(key));
  }, []);

  return (
    <CacheContext.Provider
      value={{
        getCache,
        setCache,
        invalidateCache,
        invalidateCachePattern,
        isImageLoaded,
        markImageLoaded,
        getScrollPosition,
        setScrollPosition,
        getInflightRequest,
        setInflightRequest,
        clearInflightRequest,
        hasInitiallyLoaded,
        markInitiallyLoaded,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
};
