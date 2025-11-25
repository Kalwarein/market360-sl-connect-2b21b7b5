import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReviewCard } from './ReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  review_images: string[] | null;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  profiles: {
    name: string | null;
    avatar_url: string | null;
  };
}

interface ReviewListProps {
  productId: string;
  onReviewsLoaded?: (reviews: Review[]) => void;
}

export const ReviewList = ({ productId, onReviewsLoaded }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  useEffect(() => {
    loadReviews();
  }, [productId, sortBy, filterRating]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('product_reviews')
        .select(`
          *
        `)
        .eq('product_id', productId);

      // Apply rating filter
      if (filterRating !== 'all') {
        query = query.eq('rating', filterRating);
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'helpful') {
        query = query.order('helpful_count', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      }

      const { data: reviewsData, error } = await query;

      if (error) throw error;

      // Fetch user profiles separately
      if (reviewsData && reviewsData.length > 0) {
        const userIds = reviewsData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]));

        const enrichedReviews = reviewsData.map(review => ({
          ...review,
          profiles: {
            name: profileMap.get(review.user_id)?.name || null,
            avatar_url: profileMap.get(review.user_id)?.avatar_url || null,
          }
        }));

        setReviews(enrichedReviews);
        if (onReviewsLoaded) {
          onReviewsLoaded(enrichedReviews);
        }
      } else {
        setReviews([]);
        if (onReviewsLoaded) {
          onReviewsLoaded([]);
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Sorting */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-sm font-medium whitespace-nowrap">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Filter:</span>
            <Button
              variant={filterRating === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterRating('all')}
            >
              All
            </Button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filterRating === rating ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRating(rating)}
                className="gap-1"
              >
                {rating}
                <Star className="h-3 w-3 fill-current" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={loadReviews}
            />
          ))}
        </div>
      )}
    </div>
  );
};
