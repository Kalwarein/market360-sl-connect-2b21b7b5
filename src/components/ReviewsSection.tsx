import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ReviewForm } from './ReviewForm';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  review_images: string[];
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url: string;
  };
}

interface ReviewsSectionProps {
  productId: string;
}

export const ReviewsSection = ({ productId }: ReviewsSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadReviews();
    if (user) {
      checkCanReview();
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_reviews',
          filter: `product_id=eq.${productId}`
        },
        () => {
          loadReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, user]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          id,
          rating,
          review_text,
          review_images,
          verified_purchase,
          helpful_count,
          created_at,
          user_id
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            profiles: profile || { name: 'Anonymous', avatar_url: '' },
          };
        })
      );

      setReviews(reviewsWithProfiles);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    if (!user) return;

    try {
      // Check if user has completed order for this product
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .limit(1);

      // Check if user hasn't reviewed yet
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .limit(1);

      setCanReview(!!orders && orders.length > 0 && !existingReview);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const voteHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on reviews',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('review_votes')
        .upsert({
          review_id: reviewId,
          user_id: user.id,
          is_helpful: isHelpful,
        });

      if (error) throw error;

      // Refresh reviews to update counts
      loadReviews();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            {canReview && (
              <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                Write a Review
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Rating Summary */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-6 mb-6 pb-6 border-b">
              <div className="text-center">
                <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                {renderStars(Math.round(averageRating), 'lg')}
                <p className="text-sm text-muted-foreground mt-2">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              
              {/* Rating Distribution */}
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter((r) => r.rating === stars).length;
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 mb-1">
                      <span className="text-sm w-8">{stars}★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <ReviewForm
              productId={productId}
              onSuccess={() => {
                setShowReviewForm(false);
                loadReviews();
                checkCanReview();
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              reviews.map((review) => (
                <Card key={review.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={review.profiles?.avatar_url} />
                        <AvatarFallback>
                          {review.profiles?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.profiles?.name || 'Anonymous'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(review.rating)}
                              {review.verified_purchase && (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>

                        {review.review_text && (
                          <p className="text-foreground mb-3">{review.review_text}</p>
                        )}

                        {review.review_images && review.review_images.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {review.review_images.map((image, idx) => (
                              <img
                                key={idx}
                                src={image}
                                alt={`Review ${idx + 1}`}
                                className="h-20 w-20 object-cover rounded-md"
                              />
                            ))}
                          </div>
                        )}

                        {/* Helpful Voting */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Was this helpful?</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteHelpful(review.id, true)}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {review.helpful_count}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteHelpful(review.id, false)}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
