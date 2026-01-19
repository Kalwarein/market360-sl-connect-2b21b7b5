import { useEffect, useState, useMemo } from "react";
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
import { ArrowLeft, MapPin, Wallet, AlertCircle, Shield, Loader2 } from "lucide-react";
import { NumericInput } from "@/components/NumericInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIERRA_LEONE_REGIONS, getAllDistricts } from "@/lib/sierraLeoneData";
import { sendOrderConfirmationEmail, sendNewOrderSellerEmail } from "@/lib/emailService";
import FrozenWalletOverlay from "@/components/FrozenWalletOverlay";

// Generate a stable idempotency key based on cart contents
function generateIdempotencyKey(userId: string, items: Array<{ id: string; quantity: number }>): string {
  const itemsHash = items
    .map(i => `${i.id}:${i.quantity}`)
    .sort()
    .join('|');
  // Use a simple hash to create a stable key
  let hash = 0;
  const str = `${userId}-${itemsHash}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${Math.abs(hash).toString(36)}-${Date.now().toString(36)}`;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [checkingFreeze, setCheckingFreeze] = useState(true);
  
  // CRITICAL: Stable idempotency key generated ONCE per checkout session
  // This prevents duplicate orders on retries while allowing new checkouts
  const [idempotencyKey] = useState(() => 
    user ? generateIdempotencyKey(user.id, items.map(i => ({ id: i.id, quantity: i.quantity }))) : ''
  );
  
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
    checkFrozenStatus();
  }, [items, navigate]);

  const checkFrozenStatus = async () => {
    if (!user) {
      setCheckingFreeze(false);
      return;
    }
    
    try {
      // Use RPC function for consistent freeze check
      const { data: isFrozenResult, error } = await supabase
        .rpc('is_wallet_frozen', { p_user_id: user.id });
      
      if (error) {
        console.error('Error checking freeze status:', error);
        // Fallback to direct query if RPC fails
        const { data: frozen } = await supabase
          .from('wallet_freezes')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        setIsFrozen(!!frozen);
      } else {
        setIsFrozen(!!isFrozenResult);
      }
    } catch (error) {
      console.error('Error checking freeze status:', error);
    } finally {
      setCheckingFreeze(false);
    }
  };

  const loadWalletBalance = async () => {
    if (!user) return;
    
    try {
      // Use RPC for ledger-based balance - returns value in CENTS
      const { data: balanceInCents, error } = await supabase
        .rpc('get_wallet_balance', { p_user_id: user.id });

      if (error) {
        console.error('Wallet balance error:', error);
        setWalletBalance(0);
        return;
      }

      // CRITICAL: Convert from cents to whole currency (SLE)
      setWalletBalance((balanceInCents || 0) / 100);
    } catch (error) {
      console.error("Error loading wallet:", error);
      setWalletBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePlaceOrder = async () => {
    // ========================================
    // CRITICAL: Prevent double-clicks
    // ========================================
    if (isProcessing || loading) {
      console.log('Order already processing, ignoring click');
      return;
    }

    // Check if wallet is frozen
    if (isFrozen) {
      toast({
        title: "Wallet Frozen",
        description: "Your wallet is frozen. Please contact support.",
        variant: "destructive",
      });
      return;
    }

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

    // Lock the button IMMEDIATELY to prevent double-clicks
    setIsProcessing(true);
    setLoading(true);

    try {
      // ========================================
      // ATOMIC ORDER PLACEMENT via RPC
      // Single database transaction: orders + wallet deduction
      // If ANY step fails, EVERYTHING rolls back
      // ========================================
      const itemsPayload = items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const { data: result, error: rpcError } = await supabase.rpc('place_order_batch', {
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

      if (rpcError) {
        console.error('RPC error:', rpcError);
        
        // Handle specific error messages
        const errorMsg = rpcError.message || '';
        if (errorMsg.includes('insufficient balance')) {
          // Refresh balance and show modal
          const { data: freshBalanceInCents } = await supabase
            .rpc('get_wallet_balance', { p_user_id: user.id });
          if (freshBalanceInCents !== null) {
            setWalletBalance(freshBalanceInCents / 100);
          }
          setShowInsufficientModal(true);
          toast({
            title: "Insufficient balance",
            description: "Please top up your wallet to complete this order.",
            variant: "destructive",
          });
          return;
        }
        
        if (errorMsg.includes('unauthorized')) {
          toast({
            title: "Session expired",
            description: "Please log in again to place your order.",
            variant: "destructive",
          });
          return;
        }
        
        if (errorMsg.includes('product not available') || errorMsg.includes('store not available')) {
          toast({
            title: "Product unavailable",
            description: "One or more items in your cart are no longer available.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorMsg || "Failed to place order. Please try again.");
      }

      // Extract order IDs from the result
      const orderIds: string[] = result?.[0]?.order_ids || [];
      const totalAmount: number = result?.[0]?.total_amount || totalPrice;

      if (orderIds.length === 0) {
        throw new Error("No orders were created. Please try again.");
      }

      // ========================================
      // SUCCESS: Cart cleared, navigate to orders
      // ========================================
      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `${orderIds.length} order(s) created. Le ${totalAmount.toLocaleString()} deducted. Payment is in escrow.`,
      });

      // Navigate immediately - user sees success
      navigate("/orders");

      // ========================================
      // Send notifications in background (fire-and-forget)
      // These run AFTER navigation, won't block or cause errors
      // ========================================
      const sendNotifications = async () => {
        try {
          // Get buyer profile once
          const { data: buyerProfile } = await supabase
            .from("profiles")
            .select("email, name, phone")
            .eq("id", user.id)
            .single();

          // Fetch created orders with product/store info
          const { data: createdOrders } = await supabase
            .from("orders")
            .select(`
              id, 
              product_id, 
              total_amount, 
              seller_id, 
              quantity,
              products(title, images, store_id, stores(store_name, owner_id))
            `)
            .in("id", orderIds);

          if (!createdOrders) return;

          for (const order of createdOrders) {
            const product = order.products as { title: string; images: string[]; store_id: string; stores: { store_name: string; owner_id: string } } | null;
            if (!product) continue;
            
            const orderNumber = `#360-${order.id.substring(0, 8).toUpperCase()}`;
            const productImage = product.images?.[0] || '/placeholder.svg';
            const deliveryFullAddress = `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.region}`;
            const storeName = product.stores?.store_name || 'Store';
            const sellerId = order.seller_id;

            // Get seller profile
            const { data: sellerProfile } = await supabase
              .from("profiles")
              .select("email, name, phone")
              .eq("id", sellerId)
              .single();

            // Fire notifications (non-blocking)
            supabase.functions.invoke('create-order-notification', {
              body: {
                user_id: sellerId,
                type: 'order',
                title: '🛒 New Order Received!',
                body: `${buyerProfile?.name || 'A customer'} placed an order for ${product.title}`,
                link_url: `/seller/order/${order.id}`,
                image_url: productImage,
                metadata: { order_id: order.id, product_title: product.title }
              }
            }).catch(e => console.error('Notification error:', e));

            if (sellerProfile?.phone) {
              supabase.functions.invoke('send-sms', {
                body: {
                  to: sellerProfile.phone,
                  message: `🛒 Market360 - New Order!\n${buyerProfile?.name || 'Customer'} ordered ${product.title}\nOrder: ${orderNumber}\nAmount: Le ${order.total_amount.toLocaleString()}`
                }
              }).catch(e => console.error('SMS error:', e));
            }

            if (buyerProfile?.email) {
              sendOrderConfirmationEmail(buyerProfile.email, {
                orderNumber,
                orderId: order.id,
                productName: product.title,
                productImage,
                quantity: order.quantity,
                totalAmount: order.total_amount,
                deliveryAddress: deliveryFullAddress,
                storeName,
              }, user.id).catch(e => console.error('Email error:', e));
            }

            if (sellerProfile?.email) {
              sendNewOrderSellerEmail(sellerProfile.email, {
                orderNumber,
                orderId: order.id,
                productName: product.title,
                productImage,
                quantity: order.quantity,
                totalAmount: order.total_amount,
                buyerName: buyerProfile?.name || 'Customer',
                deliveryAddress: deliveryFullAddress,
              }, sellerId).catch(e => console.error('Email error:', e));
            }
          }
        } catch (notifError) {
          console.error('Notification batch error:', notifError);
        }
      };

      // Fire and forget - don't await
      sendNotifications();

    } catch (error) {
      console.error("Error placing order:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to place order";
      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Loading state
  if (checkingFreeze) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isBalanceSufficient = walletBalance >= totalPrice && !isFrozen;

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
        <Card className={`p-4 border-2 ${isFrozen ? 'border-blue-300 bg-blue-50/50' : 'border-primary bg-primary/5'} relative overflow-hidden`}>
          {isFrozen && <FrozenWalletOverlay message="Your wallet is frozen. You cannot place orders." />}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${isFrozen ? 'bg-blue-500' : 'bg-primary'} flex items-center justify-center`}>
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
          disabled={loading || loadingBalance || !isBalanceSufficient || isProcessing}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {loading || isProcessing ? "Processing..." : `Pay Le ${totalPrice.toLocaleString()}`}
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