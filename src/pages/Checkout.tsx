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
import { ArrowLeft, MapPin, Wallet, AlertCircle, Shield } from "lucide-react";
import { NumericInput } from "@/components/NumericInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIERRA_LEONE_REGIONS, getAllDistricts } from "@/lib/sierraLeoneData";
import { sendOrderConfirmationEmail, sendNewOrderSellerEmail } from "@/lib/emailService";

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
      // Use RPC for ledger-based balance
      const { data: balance, error } = await supabase
        .rpc('get_wallet_balance', { p_user_id: user.id });

      if (error) {
        console.error('Wallet balance error:', error);
        setWalletBalance(0);
        return;
      }

      setWalletBalance(balance || 0);
    } catch (error) {
      console.error("Error loading wallet:", error);
      setWalletBalance(0);
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
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.city || !deliveryInfo.region) {
      toast({
        title: "Incomplete delivery information",
        description: "Please fill in all required delivery fields",
        variant: "destructive",
      });
      return;
    }

    // Validate MOQ for all items
    for (const item of items) {
      if (item.quantity < (item.moq || 1)) {
        toast({
          title: "Minimum order not met",
          description: `${item.title} requires a minimum order of ${item.moq || 1} units`,
          variant: "destructive",
        });
        return;
      }
    }

    // Check wallet balance (client-side check for UX, backend will verify atomically)
    if (walletBalance < totalPrice) {
      setShowInsufficientModal(true);
      return;
    }

    setLoading(true);

    try {
      // Generate idempotency key to prevent duplicate orders on retry
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare items for the RPC call
      const itemsPayload = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      // Call the atomic place_order_batch function
      // This handles: balance check → wallet deduction → order creation in one transaction
      const { data: batchResult, error: batchError } = await supabase.rpc('place_order_batch', {
        p_buyer_id: user.id,
        p_idempotency_key: idempotencyKey,
        p_items: itemsPayload,
        p_delivery_name: deliveryInfo.name,
        p_delivery_phone: deliveryInfo.phone,
        p_shipping_address: deliveryInfo.address,
        p_shipping_city: deliveryInfo.city,
        p_shipping_region: deliveryInfo.region,
        p_shipping_country: deliveryInfo.country,
        p_delivery_notes: deliveryInfo.notes || ''
      });

      if (batchError) {
        console.error('Order batch error:', batchError);
        
        // Handle specific error messages
        if (batchError.message?.includes('insufficient balance')) {
          setShowInsufficientModal(true);
          return;
        }
        
        throw new Error(batchError.message || 'Failed to place order');
      }

      if (!batchResult || batchResult.length === 0) {
        throw new Error('No order data returned');
      }

      const { order_ids, total_amount } = batchResult[0];

      // Send notifications for each order (non-blocking)
      const notificationPromises = order_ids.map(async (orderId: string, index: number) => {
        const item = items[index];
        if (!item) return;

        try {
          // Get product and store details for notifications
          const { data: product } = await supabase
            .from("products")
            .select("store_id, images")
            .eq("id", item.id)
            .single();

          if (!product) return;

          const { data: store } = await supabase
            .from("stores")
            .select("owner_id, store_name")
            .eq("id", product.store_id)
            .single();

          if (!store) return;

          const { data: buyerProfile } = await supabase
            .from("profiles")
            .select("email, name, phone")
            .eq("id", user.id)
            .single();

          const { data: sellerProfile } = await supabase
            .from("profiles")
            .select("email, name, phone")
            .eq("id", store.owner_id)
            .single();

          const orderNumber = `#360-${orderId.substring(0, 8).toUpperCase()}`;
          const deliveryFullAddress = `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.region}`;
          const productImage = product.images?.[0] || '/placeholder.svg';

          // Send notification to seller via edge function
          await supabase.functions.invoke('create-order-notification', {
            body: {
              user_id: store.owner_id,
              type: 'order',
              title: '🛒 New Order Received!',
              body: `${buyerProfile?.name || 'A customer'} placed an order for ${item.title}`,
              link_url: `/seller/order/${orderId}`,
              image_url: productImage,
              icon: '/pwa-192x192.png',
              requireInteraction: true,
              metadata: {
                order_id: orderId,
                product_title: item.title,
                buyer_name: buyerProfile?.name,
                amount: item.price * item.quantity
              }
            }
          });

          // Send SMS to seller
          if (sellerProfile?.phone) {
            await supabase.functions.invoke('send-sms', {
              body: {
                to: sellerProfile.phone,
                message: `🛒 Market360 - New Order Alert!\n\n${buyerProfile?.name || 'A customer'} placed an order for ${item.title}.\n\nOrder: ${orderNumber}\nAmount: Le ${(item.price * item.quantity).toLocaleString()}\n\nLogin to process: market360.app`
              }
            });
          }

          // Send email notifications
          if (buyerProfile?.email) {
            await sendOrderConfirmationEmail(buyerProfile.email, {
              orderNumber,
              orderId,
              productName: item.title,
              productImage,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              deliveryAddress: deliveryFullAddress,
              storeName: store.store_name,
            }, user.id);
          }

          if (sellerProfile?.email) {
            await sendNewOrderSellerEmail(sellerProfile.email, {
              orderNumber,
              orderId,
              productName: item.title,
              productImage,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              buyerName: buyerProfile?.name || 'Customer',
              deliveryAddress: deliveryFullAddress,
            }, store.owner_id);
          }
        } catch (notifError) {
          console.error('Failed to send notifications for order:', orderId, notifError);
        }
      });

      // Don't wait for notifications to complete - let them run in background
      Promise.all(notificationPromises).catch(err => 
        console.error('Some notifications failed:', err)
      );

      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `Le ${total_amount.toLocaleString()} deducted. Payment is in escrow until delivery.`,
      });

      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order';
      toast({
        title: "Order failed",
        description: errorMessage.includes('insufficient') 
          ? "Insufficient wallet balance. Please top up."
          : "Failed to place order. Please try again.",
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
        {/* Wallet Balance Card - Now the payment method */}
        <Card className="p-4 border-2 border-primary bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Paying with Market 360 Wallet</p>
                {loadingBalance ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-xl font-bold">Le {walletBalance.toLocaleString()}</p>
                )}
              </div>
            </div>
            {!loadingBalance && !isBalanceSufficient && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Insufficient</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure escrow payment • Funds held until delivery confirmed</span>
            </div>
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
                <NumericInput
                  id="phone"
                  value={deliveryInfo.phone}
                  onChange={(value) =>
                    setDeliveryInfo({ ...deliveryInfo, phone: value })
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
                <Label htmlFor="region">Region *</Label>
                <Select
                  value={deliveryInfo.region}
                  onValueChange={(value) =>
                    setDeliveryInfo({ ...deliveryInfo, region: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {SIERRA_LEONE_REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City / District *</Label>
                <Select
                  value={deliveryInfo.city}
                  onValueChange={(value) =>
                    setDeliveryInfo({ ...deliveryInfo, city: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select any city or district" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-[300px]">
                    {getAllDistricts().map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          disabled={loading || loadingBalance || !isBalanceSufficient}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {loading ? "Processing..." : `Pay Le ${totalPrice.toLocaleString()}`}
        </Button>

        {!isBalanceSufficient && !loadingBalance && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your wallet balance is insufficient
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/wallet")}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              Top Up Wallet
            </Button>
          </div>
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