import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSellerNotifications = () => {
  const { user } = useAuth();
  const [hasPendingOrders, setHasPendingOrders] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkPendingOrders = async () => {
      try {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('status', 'pending');

        const pendingOrders = count || 0;
        setPendingCount(pendingOrders);
        setHasPendingOrders(pendingOrders > 0);
      } catch (error) {
        console.error('Error checking pending orders:', error);
      }
    };

    checkPendingOrders();

    // Set up realtime subscription for order updates
    const channel = supabase
      .channel('seller-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${user.id}`
        },
        () => {
          checkPendingOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { hasPendingOrders, pendingCount };
};
