import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReviewForm = ({ productId, onSuccess, onCancel }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Check if order is completed
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .limit(1);

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          review_text: reviewText.trim() || null,
          verified_purchase: !!orders && orders.length > 0,
        });

      if (error) throw error;

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 border-2 border-primary/20">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
        
        {/* Star Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rating *</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
          <Textarea
            placeholder="Share your experience with this product..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
