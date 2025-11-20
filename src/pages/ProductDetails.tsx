import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageSquare, ShoppingCart, Share2, Store as StoreIcon, Shield, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ProductImageCarousel from '@/components/ProductImageCarousel';
import ProductPerks from '@/components/ProductPerks';
import KeyAttributes from '@/components/KeyAttributes';
import ProductTags from '@/components/ProductTags';
import { CategoryCarousel } from '@/components/CategoryCard';
import { ShareDialog } from '@/components/ShareDialog';

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
  moq: number;
  inquiry_only: boolean;
  product_code: string;
  perks: Array<{ icon: string; label: string; color: string }>;
  category_cards: string[];
  condition: string;
  target_audience: string[];
  variants: any[];
  technical_specs: Record<string, string>;
  shipping_details: any;
  safety_tags: string[];
  enhancement_tags: string[];
  product_video_url: string;
  spin_images: string[];
  seo_keywords: string[];
  product_highlights: string[];
  search_phrases: string[];
  seller_story: string;
  warranty_type: string;
  support_contact: string;
  replacement_available: boolean;
  eco_badges: string[];
  included_in_box: string[];
  custom_labels: string[];
  product_requirements: string;
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
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, stores(id, store_name, logo_url, owner_id)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Product fetch error:', error);
        throw error;
      }

      if (!data) {
        console.error('Product not found:', id);
        setProduct(null);
        return;
      }
      
      console.log('Product loaded:', data);
      console.log('Product images:', data.images);
      
      const parsedData = {
        ...data,
        perks: Array.isArray(data.perks) ? data.perks : [],
        images: Array.isArray(data.images) ? data.images : [],
      };
      
      setProduct(parsedData as any);

      await supabase.from('product_views').insert({
        product_id: id,
        user_id: user?.id,
      });
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (isEnquiry = false) => {
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
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', product.stores.owner_id)
        .eq('product_id', product.id)
        .single();

      let conversationId = existing?.id;

      if (!existing) {
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
        conversationId = newConvo.id;
      }

      if (isEnquiry) {
        // Send enquiry card message
        const enquiryCard = {
          type: 'enquiry',
          product_id: product.id,
          product_name: product.title,
          product_image: product.images[0],
          product_price: product.price,
          store_name: product.stores.store_name,
          moq: product.moq,
        };

        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: "Hi, I'm interested in this product and would like to make an enquiry.",
          message_type: 'action',
          attachments: [JSON.stringify(enquiryCard)],
        });

        // Send follow-up message
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: "I would like to know more about this product. When can it be delivered and what is the final price?",
          message_type: 'text',
        });

        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      navigate(`/chat/${conversationId}`);
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
    setShowShareDialog(true);
  };

  const isSeller = user?.id === product?.stores.owner_id;

  useEffect(() => {
    if (isSeller && product) {
      navigate(`/product-management/${product.id}`);
    }
  }, [isSeller, product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="w-full aspect-square rounded-2xl" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              onClick={handleShare}
              className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-sm"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <ProductImageCarousel images={product.images} />

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>
            <Badge variant="secondary" className="shrink-0">
              {product.category}
            </Badge>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">
              Le {product.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              MOQ: {product.moq} units
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Product Code: {product.product_code}
          </p>
        </div>

        <Separator />

        <ProductPerks perks={product.perks} />

        {/* Target Audience */}
        {product.target_audience && product.target_audience.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Target Audience</h3>
              <div className="flex flex-wrap gap-2">
                {product.target_audience.map((audience, idx) => (
                  <Badge key={idx} variant="secondary">{audience}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Condition */}
        {product.condition && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Condition</h3>
              <Badge variant="outline" className="text-base">{product.condition}</Badge>
            </CardContent>
          </Card>
        )}

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Available Variants</h3>
              <div className="space-y-3">
                {product.variants.map((variant: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    {variant.image && (
                      <img src={variant.image} alt="variant" className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {variant.color && `${variant.color} `}
                        {variant.size && `- ${variant.size} `}
                        {variant.material && `- ${variant.material}`}
                      </p>
                      <p className="text-sm text-muted-foreground">Stock: {variant.quantity} | Price: Le {variant.price?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Specifications */}
        {product.technical_specs && Object.keys(product.technical_specs).length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Technical Specifications</h3>
              <div className="space-y-2">
                {Object.entries(product.technical_specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-0">
                    <span className="font-medium text-muted-foreground">{key}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping & Delivery */}
        {product.shipping_details && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Shipping & Delivery</h3>
              <div className="space-y-2 text-sm">
                {product.shipping_details.delivery_available && (
                  <p><strong>Delivery:</strong> Available</p>
                )}
                {product.shipping_details.estimated_delivery_time && (
                  <p><strong>Est. Delivery:</strong> {product.shipping_details.estimated_delivery_time}</p>
                )}
                {product.shipping_details.shipping_method && (
                  <p><strong>Method:</strong> {product.shipping_details.shipping_method}</p>
                )}
                {product.shipping_details.packaging_type && (
                  <p><strong>Packaging:</strong> {product.shipping_details.packaging_type}</p>
                )}
                {product.shipping_details.return_policy && (
                  <Badge variant="secondary" className="mt-2">Return Policy Available</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety & Compliance Tags */}
        {product.safety_tags && product.safety_tags.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Safety & Compliance</h3>
              <div className="flex flex-wrap gap-2">
                {product.safety_tags.map((tag, idx) => (
                  <Badge key={idx} variant="destructive">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhancement Tags */}
        {product.enhancement_tags && product.enhancement_tags.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Special Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.enhancement_tags.map((tag, idx) => (
                  <Badge key={idx} variant="default">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eco Badges */}
        {product.eco_badges && product.eco_badges.length > 0 && (
          <Card className="shadow-sm bg-green-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 text-green-700">Eco-Friendly</h3>
              <div className="flex flex-wrap gap-2">
                {product.eco_badges.map((badge, idx) => (
                  <Badge key={idx} className="bg-green-600">{badge}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Labels */}
        {product.custom_labels && product.custom_labels.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Product Options</h3>
              <div className="flex flex-wrap gap-2">
                {product.custom_labels.map((label, idx) => (
                  <Badge key={idx} variant="outline">{label}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Included in Box */}
        {product.included_in_box && product.included_in_box.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">What's Included</h3>
              <ul className="list-disc list-inside space-y-1">
                {product.included_in_box.map((item, idx) => (
                  <li key={idx} className="text-sm">{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Product Requirements */}
        {product.product_requirements && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Product Requirements</h3>
              <p className="text-sm text-muted-foreground">{product.product_requirements}</p>
            </CardContent>
          </Card>
        )}

        {/* Warranty Details */}
        {(product.warranty || product.warranty_type || product.support_contact) && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Warranty & Support</h3>
              <div className="space-y-1 text-sm">
                {product.warranty && <p><strong>Warranty:</strong> {product.warranty}</p>}
                {product.warranty_type && <p><strong>Type:</strong> {product.warranty_type}</p>}
                {product.support_contact && <p><strong>Support:</strong> {product.support_contact}</p>}
                {product.replacement_available && (
                  <Badge variant="secondary" className="mt-2">Replacement Available</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seller Story */}
        {product.seller_story && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">About This Product</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{product.seller_story}</p>
            </CardContent>
          </Card>
        )}

        {/* Product Highlights */}
        {product.product_highlights && product.product_highlights.length > 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Key Highlights</h3>
              <ul className="list-disc list-inside space-y-1">
                {product.product_highlights.map((highlight, idx) => (
                  <li key={idx} className="text-sm">{highlight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/store/${product.stores.id}`)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {product.stores.logo_url ? (
                <img src={product.stores.logo_url} alt={product.stores.store_name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <StoreIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{product.stores.store_name}</p>
                <p className="text-sm text-muted-foreground">Visit Store</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <KeyAttributes attributes={{ brand: product.brand, material: product.material, origin: product.origin, warranty: product.warranty, model_number: product.model_number, category: product.category }} />

        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        </Card>

        <ProductTags tags={product.tags} />

        {product.category_cards && product.category_cards.length > 0 && (
          <div className="my-4">
            <CategoryCarousel categoryIds={product.category_cards} />
          </div>
        )}

        <Card className="shadow-sm cursor-pointer hover:shadow-md transition-all bg-primary/5 border-primary/20" onClick={() => navigate('/security-info')}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Market360 Secure Shopping</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Buyer protection, verified sellers, and secure payments
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!product.inquiry_only && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-3 z-20">
          <Button variant="outline" className="flex-1" onClick={() => handleChat(false)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => handleChat(true)}>
            Enquiry
          </Button>
          <Button className="flex-1" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      )}
      
      {product.inquiry_only && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
          <Button className="w-full" onClick={() => handleChat(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Enquire Now
          </Button>
        </div>
      )}

      {product && (
        <ShareDialog 
          open={showShareDialog} 
          onOpenChange={setShowShareDialog}
          product={product}
        />
      )}
    </div>
  );
};

export default ProductDetails;
