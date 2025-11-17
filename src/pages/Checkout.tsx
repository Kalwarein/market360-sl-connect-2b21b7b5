import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Wallet, AlertCircle } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    country: "Sierra Leone",
    notes: ""
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
    loadWalletBalance();
  }, [items, navigate]);

  const loadWalletBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance_leones")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setWalletBalance(data.balance_leones || 0);
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place an order",
        variant: "destructive",
      });
      return;
    }

    // Validate delivery info
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.city) {
      toast({
        title: "Incomplete delivery information",
        description: "Please fill in all required delivery fields",
        variant: "destructive",
      });
      return;
    }

    // Check wallet balance
    if (walletBalance < totalPrice) {
      setShowInsufficientModal(true);
      return;
    }

    setLoading(true);

    try {
      // Create orders for each cart item
      const orderPromises = items.map(async (item) => {
        // Get product details including seller_id
        const { data: product } = await supabase
          .from("products")
          .select("store_id")
          .eq("id", item.id)
          .single();

        if (!product) throw new Error("Product not found");

        // Get store owner (seller)
        const { data: store } = await supabase
          .from("stores")
          .select("owner_id")
          .eq("id", product.store_id)
          .single();

        if (!store) throw new Error("Store not found");

        // Create order
        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            seller_id: store.owner_id,
            product_id: item.id,
            quantity: item.quantity,
            total_amount: item.price * item.quantity,
            escrow_status: "holding",
            escrow_amount: item.price * item.quantity,
            delivery_name: deliveryInfo.name,
            delivery_phone: deliveryInfo.phone,
            shipping_address: deliveryInfo.address,
            shipping_city: deliveryInfo.city,
            shipping_region: deliveryInfo.region,
            shipping_country: deliveryInfo.country,
            status: "pending"
          });

        if (orderError) throw orderError;

        // Send notification to seller
        await supabase.from("notifications").insert({
          user_id: store.owner_id,
          type: "order",
          title: "New Order Received",
          body: `You have a new order for ${item.title}`,
          link_url: "/seller-dashboard"
        });
      });

      await Promise.all(orderPromises);

      // Deduct from wallet
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance_leones: walletBalance - totalPrice })
        .eq("user_id", user.id);

      if (walletError) throw walletError;

      // Create transaction record
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (wallet) {
        await supabase.from("transactions").insert({
          wallet_id: wallet.id,
          type: "withdrawal",
          amount: -totalPrice,
          status: "completed",
          reference: `Order payment - ${items.length} items`
        });
      }

      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: "Your payment is in escrow. Track your orders in the Orders page.",
      });

      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Order failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isBalanceSufficient = walletBalance >= totalPrice;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cart")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Wallet Balance Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                {loadingBalance ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-lg font-bold">Le {walletBalance.toLocaleString()}</p>
                )}
              </div>
            </div>
            {!loadingBalance && !isBalanceSufficient && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Insufficient Balance</span>
              </div>
            )}
          </div>
        </Card>

        {/* Order Summary */}
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Order Summary</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.store_name}</p>
                  <p className="text-sm">
                    Le {item.price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    Le {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                Le {totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Delivery Information */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Delivery Information</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={deliveryInfo.name}
                  onChange={(e) =>
                    setDeliveryInfo({ ...deliveryInfo, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={deliveryInfo.phone}
                  onChange={(e) =>
                    setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })
                  }
                  placeholder="+232 XX XXX XXXX"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={deliveryInfo.address}
                onChange={(e) =>
                  setDeliveryInfo({ ...deliveryInfo, address: e.target.value })
                }
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City / District *</Label>
                <Input
                  id="city"
                  value={deliveryInfo.city}
                  onChange={(e) =>
                    setDeliveryInfo({ ...deliveryInfo, city: e.target.value })
                  }
                  placeholder="Freetown"
                />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={deliveryInfo.region}
                  onChange={(e) =>
                    setDeliveryInfo({ ...deliveryInfo, region: e.target.value })
                  }
                  placeholder="Western Area"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={deliveryInfo.notes}
                onChange={(e) =>
                  setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })
                }
                placeholder="Any special delivery instructions..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={loading || !isBalanceSufficient || loadingBalance}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {loading ? "Processing..." : `Place Order - Le ${totalPrice.toLocaleString()}`}
        </Button>

        {!isBalanceSufficient && !loadingBalance && (
          <p className="text-center text-sm text-muted-foreground">
            Top up your wallet to complete this purchase
          </p>
        )}
      </div>

      {/* Insufficient Balance Modal */}
      <Dialog open={showInsufficientModal} onOpenChange={setShowInsufficientModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Insufficient Wallet Balance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your wallet balance is insufficient to complete this purchase. Please top up
              your wallet to continue.
            </p>
            <div className="p-3 rounded-lg bg-muted">
              <div className="flex justify-between text-sm mb-1">
                <span>Current Balance:</span>
                <span className="font-semibold">Le {walletBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Order Total:</span>
                <span className="font-semibold">Le {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span>Need:</span>
                <span className="font-bold text-destructive">
                  Le {(totalPrice - walletBalance).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInsufficientModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => navigate("/wallet")}
                className="flex-1"
              >
                Top Up Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}