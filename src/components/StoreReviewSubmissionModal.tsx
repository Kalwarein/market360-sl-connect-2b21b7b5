import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StoreReviewSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onReviewSubmitted: () => void;
}

export const StoreReviewSubmissionModal = ({ open, onOpenChange, storeId, onReviewSubmitted }: StoreReviewSubmissionModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5 - images.length);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImages([...images, ...files]);
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`store-reviews/${fileName}`, image);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`store-reviews/${fileName}`);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Check if user has ordered from this store
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('seller_id', (await supabase.from('stores').select('owner_id').eq('id', storeId).single()).data?.owner_id || '')
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .limit(1);

      const verifiedPurchase = orders && orders.length > 0;

      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      // Submit review
      const { error } = await supabase
        .from('store_reviews')
        .insert({
          store_id: storeId,
          user_id: user.id,
          rating,
          review_text: reviewText || null,
          review_images: imageUrls.length > 0 ? imageUrls : null,
          verified_purchase: verifiedPurchase,
        });

      if (error) throw error;

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });

      // Cleanup
      previews.forEach(preview => URL.revokeObjectURL(preview));
      setRating(0);
      setReviewText('');
      setImages([]);
      setPreviews([]);
      onOpenChange(false);
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Write a Store Review</DialogTitle>
          <DialogDescription>Share your experience with this store</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review (Optional)</label>
            <Textarea
              placeholder="Tell others about your experience with this store..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Photos (Optional)</label>
            <div className="space-y-3">
              {previews.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {images.length < 5 && (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Upload Photos ({images.length}/5)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
