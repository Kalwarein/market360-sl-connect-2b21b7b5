import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  id: string; // product_id
  title: string;
  price: number;
  image: string;
  quantity: number;
  store_name: string;
  product_code: string;
  moq: number; // Minimum order quantity
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from DB for authenticated users, or from localStorage for guests
  useEffect(() => {
    const load = async () => {
      if (user) {
        // Ensure local guest cart doesn't leak across accounts
        localStorage.removeItem('cart');

        const { data: rows, error } = await supabase
          .from('cart_items')
          .select('product_id, quantity')
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to load cart items:', error);
          setItems([]);
          return;
        }

        if (!rows || rows.length === 0) {
          setItems([]);
          return;
        }

        const productIds = rows.map((r) => r.product_id);
        const { data: products, error: pErr } = await supabase
          .from('products')
          .select('id, title, price, images, product_code, moq, store_id, stores(store_name)')
          .in('id', productIds);

        if (pErr) {
          console.error('Failed to load products for cart:', pErr);
          setItems([]);
          return;
        }

        const qtyMap = new Map(rows.map((r) => [r.product_id, r.quantity]));
        const mapped: CartItem[] = (products || []).map((p) => ({
          id: p.id as string,
          title: (p as any).title,
          price: Number((p as any).price || 0),
          image: ((p as any).images?.[0]) || '',
          quantity: qtyMap.get(p.id as string) || 1,
          store_name: (p as any).stores?.store_name || '',
          product_code: (p as any).product_code || '',
          moq: Number((p as any).moq || 1),
        }));

        // Keep original order based on rows
        mapped.sort(
          (a, b) => productIds.indexOf(a.id) - productIds.indexOf(b.id)
        );

        setItems(mapped);
      } else {
        // Guest cart from localStorage
        const saved = localStorage.getItem('cart');
        setItems(saved ? JSON.parse(saved) : []);
      }
    };

    load();

    // Set up realtime subscription for cart changes
    if (user) {
      const channel = supabase
        .channel('cart-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            load();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Persist guest cart only
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, user]);

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    if (user) {
      const existing = items.find((i) => i.id === item.id);
      
      if (existing) {
        // Update quantity - ensure it meets MOQ
        const newQuantity = Math.max(existing.quantity + item.moq, item.moq);
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .match({ user_id: user.id, product_id: item.id });

        if (error) {
          console.error('Failed to update cart item:', error);
          return;
        }

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, quantity: newQuantity } : i
          )
        );
      } else {
        // Insert new item with MOQ as initial quantity
        const initialQuantity = item.moq || 1;
        const { error } = await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: item.id,
          quantity: initialQuantity,
        });

        if (error) {
          console.error('Failed to add cart item:', error);
          return;
        }

        setItems((prev) => [...prev, { ...item, quantity: initialQuantity }]);
      }
      return;
    }

    // Guest cart
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const initialQuantity = item.moq || 1;
      if (existing) {
        const newQuantity = Math.max(existing.quantity + initialQuantity, item.moq);
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: newQuantity } : i));
      }
      return [...prev, { ...item, quantity: initialQuantity }];
    });
  };

  const removeFromCart = async (id: string) => {
    if (user) {
      // Remove from DB
      await supabase.from('cart_items').delete().match({ user_id: user.id, product_id: id });
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = async (id: string, quantity: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Enforce MOQ - if quantity is less than MOQ, remove the item
    if (quantity < item.moq) {
      await removeFromCart(id);
      return;
    }

    if (user) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .match({ user_id: user.id, product_id: id });
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const clearCart = async () => {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
