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
import { NumericInput } from "@/components/NumericInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SIERRA_LEONE_REGIONS, getDistrictsByRegion } from "@/lib/sierraLeoneData";
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
      const { data, error } = await supabase
        .from("wallets")
        .select("balance_leones")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error('Wallet fetch error:', error);
        throw error;
      }

      if (!data) {
        console.log('No wallet found for user, creating one...');
        // Try to create a wallet if it doesn't exist
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance_leones: 0 })
          .select()
          .single();
        setWalletBalance(newWallet?.balance_leones || 0);
        return;
      }

      setWalletBalance(data.balance_leones || 0);
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
          .select("store_id, images")
          .eq("id", item.id)
          .single();

        if (!product) throw new Error("Product not found");

        // Get store owner (seller) and store info
        const { data: store } = await supabase
          .from("stores")
          .select("owner_id, store_name")
          .eq("id", product.store_id)
          .single();

        if (!store) throw new Error("Store not found");

        // Get buyer and seller profiles for emails
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

        // Create order
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
            status: "pending"
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderNumber = `#360-${newOrder.id.substring(0, 8).toUpperCase()}`;
        const deliveryFullAddress = `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.region}`;
        const productImage = product.images?.[0] || '/placeholder.svg';

        // Send notification to seller via edge function (bypasses RLS)
        try {
          await supabase.functions.invoke('create-order-notification', {
            body: {
              user_id: store.owner_id,
              type: 'order',
              title: '🛒 New Order Received!',
              body: `${buyerProfile?.name || 'A customer'} placed an order for ${item.title}`,
              link_url: newOrder?.id ? `/seller/order/${newOrder.id}` : '/seller-dashboard',
              image_url: productImage,
              icon: '/pwa-192x192.png',
              requireInteraction: true,
              metadata: {
                order_id: newOrder?.id || null,
                product_title: item.title,
                buyer_name: buyerProfile?.name,
                amount: item.price * item.quantity
              }
            }
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the order if notification fails
        }

        // Send SMS notification to seller for new order
        try {
          if (sellerProfile?.phone) {
            await supabase.functions.invoke('send-sms', {
              body: {
                to: sellerProfile.phone,
                message: `🛒 Market360 - New Order Alert!\n\n${buyerProfile?.name || 'A customer'} placed an order for ${item.title}.\n\nOrder: ${orderNumber}\nAmount: Le ${(item.price * item.quantity).toLocaleString()}\n\nLogin to process: market360.app`
              }
            });
          }
        } catch (smsError) {
          console.error('Failed to send SMS to seller:', smsError);
          // Don't fail the order if SMS fails
        }

        // Send email notifications
        try {
          // Send order confirmation to buyer
          if (buyerProfile?.email) {
            await sendOrderConfirmationEmail(buyerProfile.email, {
              orderNumber,
              orderId: newOrder.id,
              productName: item.title,
              productImage,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              deliveryAddress: deliveryFullAddress,
              storeName: store.store_name,
            }, user.id);
          }

          // Send new order notification to seller
          if (sellerProfile?.email) {
            await sendNewOrderSellerEmail(sellerProfile.email, {
              orderNumber,
              orderId: newOrder.id,
              productName: item.title,
              productImage,
              quantity: item.quantity,
              totalAmount: item.price * item.quantity,
              buyerName: buyerProfile?.name || 'Customer',
              deliveryAddress: deliveryFullAddress,
            }, store.owner_id);
          }
        } catch (emailError) {
          console.error('Failed to send email notifications:', emailError);
          // Don't fail the order if email fails
        }
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
                  onValueChange={(value) => {
                    setDeliveryInfo({ ...deliveryInfo, region: value, city: "" });
                  }}
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
                  disabled={!deliveryInfo.region}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={deliveryInfo.region ? "Select District" : "Select Region first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-[300px]">
                    {deliveryInfo.region && getDistrictsByRegion(deliveryInfo.region as any).map((district) => (
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