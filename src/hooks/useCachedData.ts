import { useState, useEffect, useCallback, useRef } from 'react';
import { useCache } from '@/contexts/CacheContext';

interface UseCachedDataOptions<T> {
  key: string;
  fetchFn: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  backgroundRefresh?: boolean;
}

interface UseCachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isStale: boolean;
  isFromCache: boolean;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useCachedData<T>({
  key,
  fetchFn,
  ttl = DEFAULT_TTL,
  enabled = true,
  onSuccess,
  backgroundRefresh = true,
}: UseCachedDataOptions<T>): UseCachedDataResult<T> {
  const { 
    getCache, 
    setCache, 
    getInflightRequest, 
    setInflightRequest, 
    clearInflightRequest,
    hasInitiallyLoaded,
    markInitiallyLoaded
  } = useCache();

  const [data, setData] = useState<T | null>(() => getCache<T>(key));
  const [loading, setLoading] = useState(!getCache<T>(key));
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isFromCache, setIsFromCache] = useState(!!getCache<T>(key));
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!enabled) return;

    // Check for existing inflight request (request deduplication)
    const existingRequest = getInflightRequest<T>(key);
    if (existingRequest) {
      try {
        const result = await existingRequest;
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          setIsFromCache(false);
        }
        return;
      } catch (e) {
        // Fall through to make a new request
      }
    }

    // Only show loading spinner if:
    // 1. Not a background refresh
    // 2. No cached data exists
    // 3. Never loaded before
    if (!isBackground && !getCache<T>(key) && !hasInitiallyLoaded(key)) {
      setLoading(true);
    }

    const fetchPromise = fetchFn();
    setInflightRequest(key, fetchPromise);

    try {
      const result = await fetchPromise;
      
      if (mountedRef.current) {
        setData(result);
        setCache(key, result, ttl);
        setLoading(false);
        setError(null);
        setIsStale(false);
        setIsFromCache(false);
        markInitiallyLoaded(key);
        onSuccess?.(result);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e as Error);
        setLoading(false);
      }
    } finally {
      clearInflightRequest(key);
    }
  }, [key, fetchFn, enabled, ttl, getCache, setCache, getInflightRequest, setInflightRequest, clearInflightRequest, hasInitiallyLoaded, markInitiallyLoaded, onSuccess]);

  useEffect(() => {
    mountedRef.current = true;

    // Check cache first
    const cachedData = getCache<T>(key);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      setIsFromCache(true);
      setIsStale(true); // Mark as stale so we can refresh in background
      
      // Background refresh if enabled
      if (backgroundRefresh && enabled) {
        fetchData(true);
      }
    } else if (enabled) {
      fetchData(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [key, enabled]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    isStale,
    isFromCache,
  };
}

// Hook for paginated/list data
export function useCachedList<T>({
  key,
  fetchFn,
  enabled = true,
}: {
  key: string;
  fetchFn: () => Promise<T[]>;
  enabled?: boolean;
}) {
  return useCachedData<T[]>({
    key,
    fetchFn,
    enabled,
    backgroundRefresh: true,
  });
}

// Hook for single item data
export function useCachedItem<T>({
  key,
  fetchFn,
  enabled = true,
}: {
  key: string;
  fetchFn: () => Promise<T>;
  enabled?: boolean;
}) {
  return useCachedData<T>({
    key,
    fetchFn,
    enabled,
    backgroundRefresh: true,
  });
}
