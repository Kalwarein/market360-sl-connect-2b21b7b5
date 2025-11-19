import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ProductCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-0">
      <Skeleton className="aspect-square w-full animate-shimmer" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-24" />
      </div>
    </CardContent>
  </Card>
);

export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const LoadingSkeleton = () => (
  <div className="p-4 space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);
