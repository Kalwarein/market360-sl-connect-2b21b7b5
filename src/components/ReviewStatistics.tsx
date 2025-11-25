import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ReviewStatisticsProps {
  reviews: Array<{
    rating: number;
  }>;
}

export const ReviewStatistics = ({ reviews }: ReviewStatisticsProps) => {
  const totalReviews = reviews.length;
  
  if (totalReviews === 0) {
    return null;
  }

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;
  
  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  const ratingPercentages = ratingCounts.map(count => (count / totalReviews) * 100);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
        
        <div className="flex items-start gap-6 mb-6">
          {/* Average Rating */}
          <div className="flex flex-col items-center">
            <div className="text-5xl font-bold text-primary mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress 
                  value={ratingPercentages[rating - 1]} 
                  className="h-2 flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {ratingCounts[rating - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
