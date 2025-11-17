import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import BottomNav from '@/components/BottomNav';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-sm opacity-90">Review your items</p>
        </div>

        <div className="p-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm mt-2 mb-4">
                Browse products and add items to your cart
              </p>
              <Button onClick={() => navigate('/')}>Start Shopping</Button>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <p className="text-sm opacity-90">{totalItems} items</p>
      </div>

      <div className="p-4 space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="h-20 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.store_name}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.product_code}
                  </p>
                  <p className="text-primary font-bold">
                    Le {item.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-card border-t p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">
            Le {totalPrice.toLocaleString()}
          </span>
        </div>
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;