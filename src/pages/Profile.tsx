import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, MapPin, Store, Wallet, ShoppingBag, Bell } from 'lucide-react';
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
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-white/20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-2xl">
              {profile?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name || 'User'}</h1>
            <p className="text-sm opacity-90">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-3">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow relative"
            onClick={() => {
              setHasUnreadNotif(false);
              navigate('/notifications');
            }}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                  <Bell className="h-5 w-5 text-primary" />
                  {hasUnreadNotif && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
                  )}
                </div>
                <span className="font-medium">Notifications</span>
              </div>
              {hasUnreadNotif && <Badge variant="destructive">New</Badge>}
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/wallet')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">My Wallet</span>
              </div>
            </CardContent>
          </Card>

          {isSeller ? (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/seller-dashboard')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Manage Your Store</span>
                </div>
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'approved' ? (
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => navigate('/seller-dashboard')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center relative">
                    <Store className="h-5 w-5 text-success" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  </div>
                  <span className="font-medium">Setup Your Store</span>
                </div>
                <Badge className="bg-success">Approved!</Badge>
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'pending' ? (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Seller Application</span>
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
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Become a Seller</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;