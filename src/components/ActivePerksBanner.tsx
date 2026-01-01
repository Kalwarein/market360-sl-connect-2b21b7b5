import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Award, 
  Zap, 
  Star, 
  TrendingUp, 
  Sparkles, 
  Crown, 
  Megaphone,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { getRemainingDays, isExpiringSoon } from '@/hooks/usePerkAnalytics';
import { cn } from '@/lib/utils';

interface ActivePerk {
  id: string;
  perk_type: string;
  perk_name: string;
  expires_at: string | null;
  purchased_at: string;
}

const perkIcons: Record<string, any> = {
  verified_badge: Award,
  boosted_visibility: Zap,
  top_of_category: Star,
  trending_placement: TrendingUp,
  product_highlights: Sparkles,
  premium_theme: Crown,
  featured_spotlight: Megaphone,
};

const perkColors: Record<string, string> = {
  verified_badge: 'from-blue-500 to-blue-600',
  boosted_visibility: 'from-purple-500 to-purple-600',
  top_of_category: 'from-amber-500 to-amber-600',
  trending_placement: 'from-rose-500 to-rose-600',
  product_highlights: 'from-emerald-500 to-emerald-600',
  premium_theme: 'from-violet-500 to-violet-600',
  featured_spotlight: 'from-red-500 to-red-600',
};

export const ActivePerksBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activePerks, setActivePerks] = useState<ActivePerk[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadActivePerks();
    }
  }, [user]);

  const loadActivePerks = async () => {
    if (!user) return;

    try {
      // Get user's store
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!store) {
        setLoading(false);
        return;
      }

      setStoreId(store.id);

      // Get active perks
      const { data: perks } = await supabase
        .from('store_perks')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      setActivePerks(perks || []);
    } catch (error) {
      console.error('Error loading active perks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || activePerks.length === 0) return null;

  const expiringSoonPerks = activePerks.filter(p => isExpiringSoon(p.expires_at));

  return (
    <div className="space-y-3">
      {/* Expiring Soon Warning */}
      {expiringSoonPerks.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {expiringSoonPerks.length} perk{expiringSoonPerks.length > 1 ? 's' : ''} expiring soon!
              </span>
              <Button
                variant="link"
                size="sm"
                className="text-amber-700 dark:text-amber-400 p-0 h-auto"
                onClick={() => navigate('/perks')}
              >
                Renew now →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Perks */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {activePerks.map((perk) => {
          const Icon = perkIcons[perk.perk_type] || Crown;
          const colorClass = perkColors[perk.perk_type] || 'from-primary to-primary-hover';
          const remaining = perk.expires_at ? getRemainingDays(perk.expires_at) : 0;
          const expiringSoon = perk.expires_at ? isExpiringSoon(perk.expires_at) : false;

          return (
            <Badge
              key={perk.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap",
                `bg-gradient-to-r ${colorClass} text-white border-0`,
                expiringSoon && "animate-pulse"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{perk.perk_name}</span>
              <span className="flex items-center gap-1 text-xs opacity-90">
                <Clock className="h-3 w-3" />
                {remaining}d
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
