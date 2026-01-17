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
import { ArrowLeft, MapPin, Wallet, AlertCircle, Shield, Loader2 } from "lucide-react";
import { NumericInput } from "@/components/NumericInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIERRA_LEONE_REGIONS, getAllDistricts } from "@/lib/sierraLeoneData";
import { sendOrderConfirmationEmail, sendNewOrderSellerEmail } from "@/lib/emailService";
import FrozenWalletOverlay from "@/components/FrozenWalletOverlay";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent double-clicks
  const [isFrozen, setIsFrozen] = useState(false);
  const [checkingFreeze, setCheckingFreeze] = useState(true);
  
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

    // ========================================
    // CRITICAL: Strict balance validation
    // Calculate exact total from cart items
    // ========================================
    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Verify totalPrice matches calculated total
    if (calculatedTotal !== totalPrice) {
      console.error('Price mismatch detected:', { calculatedTotal, totalPrice });
      toast({
        title: "Price calculation error",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
      return;
    }

    // Lock the button IMMEDIATELY to prevent double-clicks
    setIsProcessing(true);
    setLoading(true);

    // Re-fetch wallet balance to ensure it's current
    let currentBalance = walletBalance;
    try {
      const { data: freshBalanceInCents, error } = await supabase
        .rpc('get_wallet_balance', { p_user_id: user.id });
      
      if (!error && freshBalanceInCents !== null) {
        // CRITICAL: Convert from cents to whole currency
        currentBalance = freshBalanceInCents / 100;
      }
    } catch (e) {
      console.error('Error fetching fresh balance:', e);
      setIsProcessing(false);
      setLoading(false);
      toast({
        title: "Connection error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
      return;
    }

    // Strict balance check with exact comparison
    if (currentBalance < totalPrice) {
      setWalletBalance(currentBalance); // Update displayed balance
      setShowInsufficientModal(true);
      setIsProcessing(false);
      setLoading(false);
      toast({
        title: "Insufficient balance",
        description: `Your wallet has Le ${currentBalance.toLocaleString()} but you need Le ${totalPrice.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    // Generate unique order reference for idempotency
    const orderBatchRef = `checkout-${user.id}-${Date.now()}`;
    const paymentReference = `${orderBatchRef}-payment`;
    let paymentLedgerEntryId: string | null = null;

    try {
      // ========================================
      // STEP 1: Check for duplicate payment (idempotency)
      // ========================================
      const { data: existingPayment } = await supabase
        .from("wallet_ledger")
        .select("id, status")
        .eq("reference", paymentReference)
        .maybeSingle();

      if (existingPayment) {
        if (existingPayment.status === 'success') {
          throw new Error("Payment already processed. Please check your orders.");
        }
        // If previous attempt failed, we can proceed
      }

      // ========================================
      // STEP 2: Create PENDING payment ledger entry
      // We mark it as 'pending' first, only mark 'success' after orders are created
      // ========================================
      const totalInCents = Math.round(totalPrice * 100); // Ensure integer
      const { data: paymentEntry, error: ledgerError } = await supabase
        .from("wallet_ledger")
        .insert({
          user_id: user.id,
          amount: totalInCents,
          transaction_type: 'payment',
          status: 'pending', // PENDING until orders are created
          reference: paymentReference,
          metadata: { 
            payment_method: 'wallet', 
            order_count: items.length,
            order_batch_ref: orderBatchRef,
            items: items.map(i => ({ id: i.id, title: i.title, qty: i.quantity, price: i.price }))
          }
        })
        .select('id')
        .single();

      if (ledgerError || !paymentEntry) {
        console.error('Payment ledger error:', ledgerError);
        throw new Error("Failed to initiate payment. Please try again.");
      }

      paymentLedgerEntryId = paymentEntry.id;

      // ========================================
      // STEP 3: Create orders for each cart item
      // ========================================
      const createdOrders: string[] = [];
      const orderErrors: string[] = [];
      
      for (const item of items) {
        try {
          // Get product details including seller_id
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("store_id, images")
            .eq("id", item.id)
            .single();

          if (productError || !product) {
            orderErrors.push(`Product ${item.title} not found`);
            continue;
          }

          // Get store owner (seller) and store info
          const { data: store, error: storeError } = await supabase
            .from("stores")
            .select("owner_id, store_name")
            .eq("id", product.store_id)
            .single();

          if (storeError || !store) {
            orderErrors.push(`Store not found for ${item.title}`);
            continue;
          }

          // Create order with wallet payment
          const { data: newOrder, error: orderError } = await supabase
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
              delivery_notes: deliveryInfo.notes,
              status: "pending"
            })
            .select()
            .single();

          if (orderError || !newOrder) {
            console.error('Order creation error:', orderError);
            orderErrors.push(`Failed to create order for ${item.title}`);
            continue;
          }

          createdOrders.push(newOrder.id);

          // ========================================
          // Send notifications (non-blocking)
          // ========================================
          const orderNumber = `#360-${newOrder.id.substring(0, 8).toUpperCase()}`;
          const deliveryFullAddress = `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.region}`;
          const productImage = product.images?.[0] || '/placeholder.svg';

          // Get buyer and seller profiles for notifications
          const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
            supabase.from("profiles").select("email, name, phone").eq("id", user.id).single(),
            supabase.from("profiles").select("email, name, phone").eq("id", store.owner_id).single()
          ]);

          // Send notifications in background (don't await)
          Promise.all([
            // Notification to seller
            supabase.functions.invoke('create-order-notification', {
              body: {
                user_id: store.owner_id,
                type: 'order',
                title: '🛒 New Order Received!',
                body: `${buyerProfile?.name || 'A customer'} placed an order for ${item.title}`,
                link_url: `/seller/order/${newOrder.id}`,
                image_url: productImage,
                icon: '/pwa-192x192.png',
                requireInteraction: true,
                metadata: {
                  order_id: newOrder.id,
                  product_title: item.title,
                  buyer_name: buyerProfile?.name,
                  amount: item.price * item.quantity
                }
              }
            }).catch(e => console.error('Notification error:', e)),
            
            // SMS to seller
            sellerProfile?.phone ? supabase.functions.invoke('send-sms', {
              body: {
                to: sellerProfile.phone,
                message: `🛒 Market360 - New Order Alert!\n\n${buyerProfile?.name || 'A customer'} placed an order for ${item.title}.\n\nOrder: ${orderNumber}\nAmount: Le ${(item.price * item.quantity).toLocaleString()}\n\nLogin to process: market360.app`
              }
            }).catch(e => console.error('SMS error:', e)) : Promise.resolve(),
            
            // Email to buyer
            buyerProfile?.email ? sendOrderConfirmationEmail(buyerProfile.email, {
              orderNumber,
              orderId: newOrder.id,
              productName: item.title,
              productImage,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              deliveryAddress: deliveryFullAddress,
              storeName: store.store_name,
            }, user.id).catch(e => console.error('Email error:', e)) : Promise.resolve(),
            
            // Email to seller
            sellerProfile?.email ? sendNewOrderSellerEmail(sellerProfile.email, {
              orderNumber,
              orderId: newOrder.id,
              productName: item.title,
              productImage,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              buyerName: buyerProfile?.name || 'Customer',
              deliveryAddress: deliveryFullAddress,
            }, store.owner_id).catch(e => console.error('Email error:', e)) : Promise.resolve()
          ]);

        } catch (itemError) {
          console.error(`Error processing item ${item.title}:`, itemError);
          orderErrors.push(`Failed to process ${item.title}`);
        }
      }

      // ========================================
      // STEP 4: Finalize based on order creation results
      // ========================================
      if (createdOrders.length === 0) {
        // ALL orders failed - rollback the payment
        throw new Error("Failed to create any orders. Your payment has been cancelled.");
      }

      // At least some orders succeeded - mark payment as success
      await supabase
        .from("wallet_ledger")
        .update({ 
          status: 'success',
          metadata: { 
            payment_method: 'wallet', 
            order_count: createdOrders.length,
            order_batch_ref: orderBatchRef,
            order_ids: createdOrders,
            items: items.map(i => ({ id: i.id, title: i.title, qty: i.quantity, price: i.price }))
          }
        })
        .eq('id', paymentLedgerEntryId);

      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `${createdOrders.length} order(s) created. Your payment is in escrow. Track your orders in the Orders page.`,
      });

      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      
      // ========================================
      // CRITICAL: Rollback payment on failure
      // Mark the pending payment as 'failed'
      // ========================================
      if (paymentLedgerEntryId) {
        try {
          await supabase
            .from("wallet_ledger")
            .update({ 
              status: 'failed',
              metadata: { 
                error: error instanceof Error ? error.message : 'Unknown error',
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', paymentLedgerEntryId);
        } catch (rollbackError) {
          console.error('Failed to rollback payment:', rollbackError);
        }
      }
      
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