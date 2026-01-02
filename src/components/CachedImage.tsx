import { useState, useEffect, useRef, memo } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { cn } from '@/lib/utils';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
}

const DEFAULT_FALLBACK = '/placeholder.svg';

export const CachedImage = memo(({
  src,
  alt,
  className,
  fallback = DEFAULT_FALLBACK,
  onLoad,
  onError,
  priority = false,
}: CachedImageProps) => {
  const { isImageLoaded, markImageLoaded } = useCache();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image was previously loaded
  const wasPreviouslyLoaded = isImageLoaded(src);

  useEffect(() => {
    if (wasPreviouslyLoaded) {
      // Image was already loaded before - show immediately
      setShowImage(true);
      setLoaded(true);
      return;
    }

    // For new images, preload invisibly
    const img = new Image();
    
    img.onload = () => {
      markImageLoaded(src);
      setLoaded(true);
      // Small delay for smooth fade-in
      requestAnimationFrame(() => {
        setShowImage(true);
      });
      onLoad?.();
    };
    
    img.onerror = () => {
      setError(true);
      onError?.();
    };
    
    // Start loading
    if (priority) {
      img.fetchPriority = 'high';
    }
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, wasPreviouslyLoaded, markImageLoaded, onLoad, onError, priority]);

  const imageSrc = error ? fallback : src;

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        className,
        'transition-opacity duration-300',
        showImage || wasPreviouslyLoaded ? 'opacity-100' : 'opacity-0'
      )}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
});

CachedImage.displayName = 'CachedImage';

// Simpler version for avatars and small images
export const CachedAvatar = memo(({
  src,
  alt,
  className,
  fallback,
}: Pick<CachedImageProps, 'src' | 'alt' | 'className' | 'fallback'>) => {
  const { isImageLoaded, markImageLoaded } = useCache();
  const [error, setError] = useState(false);
  
  const wasPreviouslyLoaded = src ? isImageLoaded(src) : false;

  if (!src || error) {
    return fallback ? (
      <img src={fallback} alt={alt} className={className} />
    ) : null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        className,
        'transition-opacity duration-200',
        wasPreviouslyLoaded ? 'opacity-100' : 'opacity-0 animate-in fade-in duration-300'
      )}
      loading="lazy"
      onLoad={() => markImageLoaded(src)}
      onError={() => setError(true)}
    />
  );
});

CachedAvatar.displayName = 'CachedAvatar';
