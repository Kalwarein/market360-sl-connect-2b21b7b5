import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, ShoppingCart, Share2, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  brand: string;
  model_number: string;
  category: string;
  tags: string[];
  material: string;
  origin: string;
  warranty: string;
  hs_code: string;
  moq: number;
  inquiry_only: boolean;
  product_code: string;
  stores: {
    id: string;
    store_name: string;
    logo_url: string;
    owner_id: string;
  };
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(id, store_name, logo_url, owner_id)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!product) return;

    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to chat with seller',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', product.stores.owner_id)
        .eq('product_id', product.id)
        .single();

      if (existing) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: user.id,
          seller_id: product.stores.owner_id,
          product_id: product.id,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${newConvo.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0] || '',
      store_name: product.stores.store_name,
      product_code: product.product_code,
    });

    toast({
      title: 'Added to cart',
      description: `${product.title} has been added to your cart`,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.title,
      text: product?.description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Product link copied to clipboard',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Image Carousel */}
      <div className="px-4">
        <Carousel className="w-full">
          <CarouselContent>
            {product.images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="aspect-square">
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {product.images.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
          <div className="flex items-center gap-2 mb-3">
            <Badge>{product.category}</Badge>
            <span className="text-sm text-muted-foreground">{product.product_code}</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            Le {Number(product.price).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            MOQ: {product.moq} unit{product.moq > 1 ? 's' : ''}
          </p>
        </div>

        {/* Store Info */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(`/store/${product.stores.id}`)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {product.stores.logo_url ? (
                <img
                  src={product.stores.logo_url}
                  alt={product.stores.store_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <Store className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{product.stores.store_name}</h3>
              <p className="text-sm text-muted-foreground">Visit Store</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3">
            <Card>
              <CardContent className="p-4 space-y-3">
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand</span>
                    <span className="font-medium">{product.brand}</span>
                  </div>
                )}
                {product.model_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">{product.model_number}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material</span>
                    <span className="font-medium">{product.material}</span>
                  </div>
                )}
                {product.origin && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin</span>
                    <span className="font-medium">{product.origin}</span>
                  </div>
                )}
                {product.warranty && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warranty</span>
                    <span className="font-medium">{product.warranty}</span>
                  </div>
                )}
                {product.hs_code && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HS Code</span>
                    <span className="font-medium">{product.hs_code}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="description">
            <Card>
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap">{product.description || 'No description available'}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleChat}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat Now
        </Button>
        {!product.inquiry_only && (
          <Button
            className="flex-1"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
