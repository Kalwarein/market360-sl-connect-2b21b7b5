import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  storeId: string;
  perkId: string;
  productId?: string;
  eventType: 'impression' | 'click' | 'conversion';
  source?: 'home' | 'search' | 'category' | 'store' | 'recommendations';
  metadata?: Record<string, any>;
}

export const usePerkAnalytics = () => {
  const trackEvent = async (event: AnalyticsEvent) => {
    try {
      // Direct insert with type casting for the new table
      const { error } = await (supabase as any).from('perk_analytics').insert({
        store_id: event.storeId,
        perk_id: event.perkId,
        product_id: event.productId || null,
        event_type: event.eventType,
        source: event.source || null,
        metadata: event.metadata || {},
      });
      if (error) console.error('Analytics tracking error:', error);
    } catch (error) {
      console.error('Error tracking perk analytics:', error);
    }
  };

  const trackImpression = (storeId: string, perkId: string, source?: string, productId?: string) => {
    trackEvent({
      storeId,
      perkId,
      productId,
      eventType: 'impression',
      source: source as any,
    });
  };

  const trackClick = (storeId: string, perkId: string, source?: string, productId?: string) => {
    trackEvent({
      storeId,
      perkId,
      productId,
      eventType: 'click',
      source: source as any,
    });
  };

  const trackConversion = (storeId: string, perkId: string, productId?: string, metadata?: Record<string, any>) => {
    trackEvent({
      storeId,
      perkId,
      productId,
      eventType: 'conversion',
      metadata,
    });
  };

  return {
    trackEvent,
    trackImpression,
    trackClick,
    trackConversion,
  };
};

// Utility to get active perks with ranking boost
export const getActivePerksForStore = async (storeId: string) => {
  const now = new Date().toISOString();
  
  const { data: perks, error } = await supabase
    .from('store_perks')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .gte('expires_at', now);

  if (error) {
    console.error('Error fetching perks:', error);
    return [];
  }

  return perks || [];
};

// Calculate ranking boost based on active perks
export const calculateRankingBoost = (perks: any[]): number => {
  let boost = 0;

  perks.forEach((perk) => {
    switch (perk.perk_type) {
      case 'verified_badge':
        boost += 10;
        break;
      case 'boosted_visibility':
        boost += 50;
        break;
      case 'top_of_category':
        boost += 30;
        break;
      case 'trending_placement':
        boost += 70;
        break;
      case 'product_highlights':
        boost += 20;
        break;
      case 'premium_theme':
        boost += 15;
        break;
      case 'featured_spotlight':
        boost += 100;
        break;
      default:
        break;
    }
  });

  return boost;
};

// Get remaining days for a perk
export const getRemainingDays = (expiresAt: string): number => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// Check if perk is expiring soon (within 3 days)
export const isExpiringSoon = (expiresAt: string): boolean => {
  return getRemainingDays(expiresAt) <= 3;
};
