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
  // Add version parameter to bypass social media caching
  const shareUrl = `${window.location.origin}/share/product/${product.id}?v=${Date.now()}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied! 🎉', {
        description: 'If previewing on WhatsApp, delete and re-paste to see the rich product card'
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Product
          </DialogTitle>
          <DialogDescription>
            Share this product with friends and on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <div className="border rounded-xl overflow-hidden bg-muted/30">
            <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-primary">
                Rich Preview
              </Badge>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.stores.store_name}
              </div>
              <div className="font-semibold line-clamp-2">{product.title}</div>
              <div className="text-lg font-bold text-primary">
                Le {product.price.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                ✨ This preview will appear on WhatsApp, Facebook, Twitter, and more!
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Share via:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="gap-2 justify-start"
                onClick={shareToWhatsApp}
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 justify-start"
                onClick={shareToFacebook}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 justify-start"
                onClick={shareToTwitter}
              >
                <Twitter className="h-4 w-4 text-sky-500" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 justify-start"
                onClick={shareToTelegram}
              >
                <Send className="h-4 w-4 text-blue-500" />
                Telegram
              </Button>
            </div>

            {navigator.share && (
              <Button 
                variant="default" 
                className="w-full gap-2"
                onClick={shareNative}
              >
                <Share2 className="h-4 w-4" />
                More Options
              </Button>
            )}
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Or copy link:</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono overflow-x-auto whitespace-nowrap">
                {shareUrl.replace('https://', '').substring(0, 40)}...
              </div>
              <Button 
                variant={copied ? "default" : "outline"}
                size="icon"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
