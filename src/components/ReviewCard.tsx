import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: {
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
  };
  onVote: () => void;
}

export const ReviewCard = ({ review, onVote }: ReviewCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(review.helpful_count);
  const [showAllImages, setShowAllImages] = useState(false);

  const handleHelpful = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote on reviews',
        variant: 'destructive',
      });
      return;
    }

    if (hasVoted) return;

    try {
      // Check if already voted
      const { data: existing } = await supabase
        .from('review_votes')
        .select('id')
        .eq('review_id', review.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setHasVoted(true);
        return;
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('review_votes')
        .insert({
          review_id: review.id,
          user_id: user.id,
          is_helpful: true,
        });

      if (voteError) throw voteError;

      // Update helpful count
      const { error: updateError } = await supabase
        .from('product_reviews')
        .update({ helpful_count: localHelpfulCount + 1 })
        .eq('id', review.id);

      if (updateError) throw updateError;

      setLocalHelpfulCount(localHelpfulCount + 1);
      setHasVoted(true);
      onVote();

      toast({
        title: 'Thanks for your feedback!',
        description: 'Your vote has been recorded',
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your vote',
        variant: 'destructive',
      });
    }
  };

  const displayImages = showAllImages 
    ? review.review_images 
    : review.review_images?.slice(0, 3);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={review.profiles.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
              {review.profiles.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{review.profiles.name || 'Anonymous'}</span>
              {review.verified_purchase && (
                <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                  <CheckCircle className="h-3 w-3" />
                  Verified Purchase
                </Badge>
              )}
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Review Text */}
        {review.review_text && (
          <p className="text-sm text-foreground leading-relaxed">
            {review.review_text}
          </p>
        )}

        {/* Review Images */}
        {review.review_images && review.review_images.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {displayImages?.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                  onClick={() => window.open(image, '_blank')}
                >
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
            
            {review.review_images.length > 3 && !showAllImages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllImages(true)}
                className="text-primary hover:text-primary/90"
              >
                +{review.review_images.length - 3} more photos
              </Button>
            )}
          </div>
        )}

        {/* Helpful Button */}
        <div className="flex items-center pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpful}
            disabled={hasVoted}
            className={`gap-2 ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <ThumbsUp className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
            <span>Helpful ({localHelpfulCount})</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
