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
    hasVerifiedBadge: hasPerk('verified_badge'),
    hasBoostedVisibility: hasPerk('boosted_visibility'),
    hasTopOfCategory: hasPerk('top_of_category'),
    hasTrendingPlacement: hasPerk('trending_placement'),
    hasProductHighlights: hasPerk('product_highlights'),
    hasPremiumTheme: hasPerk('premium_theme'),
    hasFeaturedSpotlight: hasPerk('featured_spotlight')
  };
};
