import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Share2, MessageCircle, Facebook, Twitter, Send, Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: {
    id: string;
    store_name: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    city?: string;
    region?: string;
  };
  productCount?: number;
}

export function ShareStoreDialog({ open, onOpenChange, store, productCount = 0 }: ShareStoreDialogProps) {
  const [copied, setCopied] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://market-360sl.vercel.app';
  // Use edge function URL for server-rendered OG tags
  const shareUrl = `https://rhtqsqpdvawlfqxlagxw.supabase.co/functions/v1/share-store?id=${store.id}&domain=${encodeURIComponent(currentOrigin)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied! 🎉', {
        description: 'Share this link anywhere - it shows a rich preview card with store details'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
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
    const text = encodeURIComponent(`Check out ${store.store_name} on Market360!`);
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
    const text = encodeURIComponent(`${store.store_name} on Market360 - ${productCount} products available`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`${store.store_name} on Market360`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    onOpenChange(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: store.store_name,
          text: `${store.store_name} - ${productCount} products | Market360`,
          url: shareUrl,
        });
        onOpenChange(false);
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const storeImage = store.logo_url || store.banner_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-background border-border/50 shadow-xl animate-scale-in">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            Share Store
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Share with rich preview on all platforms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Compact Preview Card */}
          <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm animate-fade-in">
            <div className="aspect-[2/1] w-full bg-muted relative overflow-hidden">
              {storeImage ? (
                <img 
                  src={storeImage} 
                  alt={store.store_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Store className="h-12 w-12 text-primary/50" />
                </div>
              )}
              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs h-5 px-2">
                ✨ Preview
              </Badge>
            </div>
            <div className="p-3 space-y-1">
              <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                {store.store_name}
              </h4>
              {(store.city || store.region) && (
                <p className="text-xs text-muted-foreground">
                  📍 {[store.city, store.region].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {productCount} Products Available
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
