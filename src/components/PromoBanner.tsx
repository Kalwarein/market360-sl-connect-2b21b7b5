import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  color: string;
}

const banners: Banner[] = [
  {
    id: '1',
    title: 'Summer Sale',
    subtitle: 'Up to 50% off on electronics',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800',
    cta: 'Shop Now',
    color: 'from-blue-600 to-purple-600',
  },
  {
    id: '2',
    title: 'New Arrivals',
    subtitle: 'Fresh products every week',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
    cta: 'Explore',
    color: 'from-green-600 to-teal-600',
  },
  {
    id: '3',
    title: 'Fast Shipping',
    subtitle: 'Same-day delivery available',
    image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800',
    cta: 'Learn More',
    color: 'from-orange-600 to-red-600',
  },
];

export const PromoBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="relative">
      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4">
        {banners.map((banner, index) => (
          <Card
            key={banner.id}
            className={`
              min-w-full snap-start rounded-3xl overflow-hidden shadow-lg border-0 
              transition-opacity duration-300
              ${index === currentIndex ? 'opacity-100' : 'opacity-70'}
            `}
            onClick={() => setCurrentIndex(index)}
          >
            <div className={`relative h-44 bg-gradient-to-r ${banner.color} p-6 flex flex-col justify-between`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-1">{banner.title}</h3>
                <p className="text-white/90 text-sm">{banner.subtitle}</p>
              </div>

              <Button 
                className="relative z-10 w-fit bg-white text-foreground hover:bg-white/90 rounded-full px-6 ripple"
              >
                {banner.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              h-2 rounded-full transition-all duration-300
              ${index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'}
            `}
          />
        ))}
      </div>
    </div>
  );
};
