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
      <DialogContent className="max-w-md bg-card border-border shadow-floating animate-scale-in">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            Share Product
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share this amazing product with friends and on social media
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Preview Card */}
          <div className="border border-border rounded-2xl overflow-hidden bg-gradient-to-br from-background to-muted/20 shadow-card hover:shadow-elevated transition-smooth animate-fade-in">
            <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden group">
              <img 
                src={product.images[0]} 
                alt={product.title}
                className="w-full h-full object-cover transition-smooth group-hover:scale-105"
              />
              <Badge className="absolute top-3 right-3 bg-primary shadow-lg backdrop-blur-sm animate-scale-in">
                ✨ Rich Preview
              </Badge>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                {product.stores.store_name}
              </div>
              <div className="font-semibold text-foreground line-clamp-2 text-lg">
                {product.title}
              </div>
              <div className="text-2xl font-bold text-primary">
                Le {product.price.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                💫 This preview will appear on WhatsApp, Facebook, Twitter, and more!
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3 animate-fade-in">
            <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-border"></div>
              Share via
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="gap-2.5 justify-start h-12 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-500 transition-smooth rounded-xl group"
                onClick={shareToWhatsApp}
              >
                <MessageCircle className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium">WhatsApp</span>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2.5 justify-start h-12 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-600 transition-smooth rounded-xl group"
                onClick={shareToFacebook}
              >
                <Facebook className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Facebook</span>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2.5 justify-start h-12 hover:bg-sky-50 dark:hover:bg-sky-950 hover:border-sky-500 transition-smooth rounded-xl group"
                onClick={shareToTwitter}
              >
                <Twitter className="h-5 w-5 text-sky-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Twitter</span>
              </Button>
              <Button 
                variant="outline" 
                className="gap-2.5 justify-start h-12 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-smooth rounded-xl group"
                onClick={shareToTelegram}
              >
                <Send className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Telegram</span>
              </Button>
            </div>

            {navigator.share && (
              <Button 
                variant="default" 
                className="w-full gap-2.5 h-12 rounded-xl shadow-md hover:shadow-lg transition-smooth"
                onClick={shareNative}
              >
                <Share2 className="h-5 w-5" />
                <span className="font-semibold">More Share Options</span>
              </Button>
            )}
          </div>

          {/* Copy Link */}
          <div className="space-y-3 animate-fade-in">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="h-px flex-1 bg-border"></div>
              Or copy link
              <div className="h-px flex-1 bg-border"></div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm font-mono overflow-x-auto whitespace-nowrap text-muted-foreground">
                {shareUrl.replace('https://', '').substring(0, 40)}...
              </div>
              <Button 
                variant={copied ? "default" : "outline"}
                size="icon"
                onClick={copyToClipboard}
                className={`shrink-0 h-12 w-12 rounded-xl transition-all ${
                  copied ? 'bg-primary shadow-lg scale-105' : 'hover:bg-primary/10 hover:border-primary'
                }`}
              >
                {copied ? (
                  <Check className="h-5 w-5 animate-scale-in" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
