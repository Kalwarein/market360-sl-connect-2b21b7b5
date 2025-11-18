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
          .select('id, title, price, images, product_code, store_id, stores(store_name)')
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
  }, [user]);

  // Persist guest cart only
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, user]);

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    if (user) {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          const updated = prev.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
          // Fire and forget DB update
          supabase
            .from('cart_items')
            .update({ quantity: (existing.quantity || 1) + 1 })
            .match({ user_id: user.id, product_id: item.id });
          return updated;
        }
        // Insert in DB
        supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: item.id,
          quantity: 1,
        });
        return [...prev, { ...item, quantity: 1 }];
      });
      return;
    }

    // Guest cart
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
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
    if (quantity < 1) {
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
