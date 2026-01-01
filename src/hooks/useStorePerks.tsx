import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StorePerk {
  id: string;
  perk_type: string;
  perk_name: string;
  expires_at: string;
  is_active: boolean;
}

export const useStorePerks = (storeId: string | null | undefined) => {
  const [perks, setPerks] = useState<StorePerk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    loadPerks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`store-perks-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_perks',
          filter: `store_id=eq.${storeId}`
        },
        () => {
          loadPerks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const loadPerks = async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('store_perks')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString());

      if (error) throw error;
      setPerks(data || []);
    } catch (error) {
      console.error('Error loading perks:', error);
      setPerks([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPerk = (perkType: string) => {
    return perks.some(p => p.perk_type === perkType);
  };

  return {
    perks,
    loading,
    hasPerk,
    // Trust perk - NO visibility boost, just badge display
    hasVerifiedBadge: hasPerk('verified_badge'),
    // Visibility perk - Store appears in Premium Stores section
    hasBoostedVisibility: hasPerk('boosted_visibility'),
    // UI perk - Premium styling for product cards and product details
    hasProductHighlights: hasPerk('product_highlights'),
    // UI perk - Premium store page layout
    hasPremiumTheme: hasPerk('premium_theme'),
    // Maximum power perk - Spotlight banners, badges, maximum visibility
    hasFeaturedSpotlight: hasPerk('featured_spotlight')
  };
};
