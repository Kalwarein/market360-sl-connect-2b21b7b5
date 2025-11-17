import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Edit2, Wallet, ShoppingBag, Bell, Store, Gift, Settings, Lock, FileText, Mail, Crown, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { useUserRoles } from '@/hooks/useUserRoles';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { isSeller, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const [sellerApplicationStatus, setSellerApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUnreadNotifications();
      checkSellerApplication();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .is('read_at', null);

      setHasUnreadNotif((count || 0) > 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkSellerApplication = async () => {
    try {
      const { data } = await supabase
        .from('seller_applications')
        .select('status')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setSellerApplicationStatus(data?.status || null);
    } catch (error) {
      setSellerApplicationStatus(null);
    }
  };

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 10px 30px -5px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.3);
          }
          50% {
            box-shadow: 0 15px 40px -5px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.5);
          }
        }

        .perks-card {
          position: relative;
          cursor: pointer;
          overflow: hidden;
          background: linear-gradient(135deg, #ffffff 0%, #d1fae5 50%, #10b981 100%);
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .perks-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(16, 185, 129, 0.03) 2px,
              rgba(16, 185, 129, 0.03) 4px
            ),
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(16, 185, 129, 0.15) 50%,
              transparent 100%
            );
          background-size: 100% 100%, 200% 100%;
          animation: shimmer 3s linear infinite;
          pointer-events: none;
        }

        .perks-card:hover {
          transform: translateY(-2px);
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        .perks-icon-wrapper {
          position: relative;
          animation: float 3s ease-in-out infinite;
        }

        .perks-icon {
          filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.5));
        }

        .perks-card:hover .perks-icon-wrapper {
          animation: float 1.5s ease-in-out infinite;
        }

        .perks-card:hover .perks-icon {
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.8));
        }

        .perks-arrow {
          transition: transform 0.3s ease;
        }

        .perks-card:hover .perks-arrow {
          transform: translateX(4px);
        }
      `}</style>

      <div className="min-h-screen bg-white pb-20 flex flex-col">
        {/* Header Section with Profile Info */}
        <div className="p-6 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              {/* Circular Avatar */}
              <Avatar className="h-20 w-20 rounded-full border-2 border-gray-200">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-xl font-semibold">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'User'}</h1>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{profile?.email}</p>
                {profile?.phone && <p className="text-sm text-gray-600">{profile?.phone}</p>}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all bg-blue-50 border-blue-100"
              onClick={() => navigate('/wallet')}
            >
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Wallet</p>
                <p className="text-2xl font-bold text-blue-600">${profile?.wallet_balance || 0}</p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-all bg-blue-50 border-blue-100"
              onClick={() => navigate('/orders')}
            >
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Orders</p>
                <p className="text-2xl font-bold text-blue-600">{profile?.total_orders || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Seller Stats if applicable */}
          {isSeller && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Products</p>
                  <p className="text-2xl font-bold text-amber-600">{profile?.total_products || 0}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Store Orders</p>
                  <p className="text-2xl font-bold text-amber-600">{profile?.store_orders || 0}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="p-6 space-y-3 flex-1">
          <div 
            className="perks-card group p-6 flex items-center justify-between gap-4 rounded-2xl transition-all duration-300"
            onClick={() => navigate('/perks')}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="perks-icon-wrapper">
                <Crown className="perks-icon text-green-600" size={32} />
              </div>
              <div className="text-green-900">
                <h3 className="text-lg font-bold mb-1">Unlock Premium</h3>
                <p className="text-sm text-green-700">Get exclusive perks & benefits</p>
              </div>
            </div>
            <ChevronRight className="perks-arrow text-green-600" size={24} />
          </div>

          {/* My Wallet */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/wallet')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">My Wallet</span>
              </div>
            </CardContent>
          </Card>

          {/* My Orders */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/orders')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">My Orders</span>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setHasUnreadNotif(false);
              navigate('/notifications');
            }}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center relative">
                  <Bell className="h-5 w-5 text-cyan-600" />
                  {hasUnreadNotif && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
                  )}
                </div>
                <span className="font-medium text-gray-900">Notifications</span>
              </div>
              {hasUnreadNotif && <Badge variant="destructive">New</Badge>}
            </CardContent>
          </Card>

          {/* Promotions */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/promotions')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900">Promotions</span>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">Settings</span>
              </div>
            </CardContent>
          </Card>

          {/* Seller Options */}
          {isSeller ? (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-amber-50 border-amber-100"
              onClick={() => navigate('/seller-dashboard')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">Manage Your Store</span>
                </div>
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'approved' ? (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-100"
              onClick={() => navigate('/seller-dashboard')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">Setup Your Store</span>
                </div>
                <Badge className="bg-green-600">Approved!</Badge>
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'pending' ? (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">Seller Application</span>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </CardContent>
            </Card>
          ) : (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/become-seller')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Store className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="font-medium text-gray-900">Become a Seller</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logout Button */}
          <Button 
            variant="destructive" 
            className="w-full mt-6 h-12 text-base font-semibold" 
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Log Out
          </Button>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => navigate('/privacy')}
              className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <Lock className="h-6 w-6 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Privacy</span>
            </button>
            
            <button
              onClick={() => navigate('/terms')}
              className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <FileText className="h-6 w-6 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Terms</span>
            </button>
            
            <button
              onClick={() => navigate('/contact')}
              className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <Mail className="h-6 w-6 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Contact</span>
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default Profile;
                    
