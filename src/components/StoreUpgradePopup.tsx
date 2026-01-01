import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StoreUpgradePopupProps {
  open: boolean;
  onClose: () => void;
}

export const StoreUpgradePopup = ({ open, onClose }: StoreUpgradePopupProps) => {
  const navigate = useNavigate();

  const handleOpenPerks = () => {
    onClose();
    navigate('/perks');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">Upgrade Your Store</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Boost your store by buying perks like Verified Badge, Product Boosts, and more
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Verified Badge</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <Zap className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">Product Boosts</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/5 border border-secondary/20">
            <Sparkles className="h-5 w-5 text-secondary-foreground" />
            <span className="text-sm font-medium">Featured Spotlight</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleOpenPerks}
            className="w-full rounded-xl bg-primary hover:bg-primary-hover"
          >
            <Crown className="h-4 w-4 mr-2" />
            Open Perks Page
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full rounded-xl"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
