import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Share2, MessageCircle, Facebook, Twitter, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    stores: {
      store_name: string;
    };
  };
}

export function ShareDialog({ open, onOpenChange, product }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://market-360sl.vercel.app';
  // Use edge function URL for server-rendered OG tags
  const shareUrl = `https://rhtqsqpdvawlfqxlagxw.supabase.co/functions/v1/share-product?id=${product.id}&domain=${encodeURIComponent(currentOrigin)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied! 🎉', {
        description: 'Share this link anywhere - it shows a rich preview card with product details'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Link copied! 🎉');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out this product: ${product.title} - Le ${product.price.toLocaleString()}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    onOpenChange(false);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${product.title} - Le ${product.price.toLocaleString()} on Market360`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`${product.title} - Le ${product.price.toLocaleString()}`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    onOpenChange(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `${product.title} - Le ${product.price.toLocaleString()} | ${product.stores.store_name}`,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border/50 shadow-xl animate-scale-in">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            Share Product
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share with rich preview on all platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Compact Preview Card */}
          <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm animate-fade-in">
            <div className="aspect-[2/1] w-full bg-muted relative overflow-hidden">
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs h-5 px-2">
                ✨ Preview
              </Badge>
            </div>
            <div className="p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {product.stores.store_name}
              </p>
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                {product.title}
              </h4>
              <p className="text-lg font-bold text-primary">
                Le {product.price.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Compact Share Buttons */}
          <div className="space-y-2.5 animate-fade-in">
            <p className="text-xs font-medium text-muted-foreground text-center">Share via</p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 justify-start h-9 hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all rounded-lg text-sm group"
                onClick={shareToWhatsApp}
              >
                <MessageCircle className="h-3.5 w-3.5 text-green-600 group-hover:scale-110 transition-transform" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 justify-start h-9 hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all rounded-lg text-sm group"
                onClick={shareToFacebook}
              >
                <Facebook className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 justify-start h-9 hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all rounded-lg text-sm group"
                onClick={shareToTwitter}
              >
                <Twitter className="h-3.5 w-3.5 text-sky-500 group-hover:scale-110 transition-transform" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 justify-start h-9 hover:bg-accent hover:text-accent-foreground hover:border-primary/50 transition-all rounded-lg text-sm group"
                onClick={shareToTelegram}
              >
                <Send className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                Telegram
              </Button>
            </div>

            {navigator.share && (
              <Button 
                variant="default" 
                size="sm"
                className="w-full gap-2 h-9 rounded-lg shadow-sm text-sm font-medium"
                onClick={shareNative}
              >
                <Share2 className="h-3.5 w-3.5" />
                More Options
              </Button>
            )}
          </div>

          {/* Compact Copy Link */}
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs font-medium text-muted-foreground text-center">Or copy link</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                {shareUrl.replace('https://', '').substring(0, 35)}...
              </div>
              <Button 
                variant={copied ? "default" : "outline"}
                size="icon"
                onClick={copyToClipboard}
                className={`shrink-0 h-9 w-9 rounded-lg transition-all ${
                  copied ? 'bg-primary shadow-md scale-105' : 'hover:bg-accent hover:border-primary/50'
                }`}
              >
                {copied ? (
                  <Check className="h-4 w-4 animate-scale-in" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
