import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Edit2, Wallet, ShoppingBag, Bell, Store, Shield, Settings, Lock, FileText, Mail, ChevronRight, Camera, Headset } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { toast } from 'sonner';
import BecomeSellerModal from '@/components/BecomeSellerModal';
import ImageCropModal from '@/components/ImageCropModal';
import { LogoutConfirmationModal } from '@/components/LogoutConfirmationModal';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { isSeller, isAdmin, loading: rolesLoading } = useUserRoles();
  const { hasPendingOrders, pendingCount } = useSellerNotifications();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sellerApplicationStatus, setSellerApplicationStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [buyerOrdersCount, setBuyerOrdersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [storeOrdersCount, setStoreOrdersCount] = useState(0);
  const [showBecomeSellerModal, setShowBecomeSellerModal] = useState(false);
  const [hasSeenSellerPromo, setHasSeenSellerPromo] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadWalletBalance();
      loadUnreadNotifications();
      checkSellerApplication();
      loadBuyerOrdersCount();
      if (isSeller) {
        loadProductsCount();
        loadStoreOrdersCount();
      }
      
      // Check if user has seen seller promo
      const seen = localStorage.getItem(`seller_promo_seen_${user.id}`);
      setHasSeenSellerPromo(!!seen);
    }
  }, [user, isSeller]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      // Get ledger-based balance (Monime wallet system)
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_wallet_balance', { 
        p_user_id: user?.id 
      });

      if (balanceError) {
        console.error('Balance fetch error:', balanceError);
        setWalletBalance(0);
      } else {
        // Balance from ledger is in Leones (not cents)
        setWalletBalance(balanceData || 0);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .is('read_at', null);

      setUnreadCount(count || 0);
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

  const loadBuyerOrdersCount = async () => {
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user?.id);

      setBuyerOrdersCount(count || 0);
    } catch (error) {
      console.error('Error loading buyer orders count:', error);
      setBuyerOrdersCount(0);
    }
  };

  const loadProductsCount = async () => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (storeData) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id);

        setProductsCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading products count:', error);
      setProductsCount(0);
    }
  };

  const loadStoreOrdersCount = async () => {
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user?.id);

      setStoreOrdersCount(count || 0);
    } catch (error) {
      console.error('Error loading store orders count:', error);
      setStoreOrdersCount(0);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Create object URL for cropping
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setShowCropModal(true);
    } catch (error) {
      console.error('Error selecting avatar:', error);
      toast.error('Failed to select image');
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setShowCropModal(false);
      setUploading(true);
      
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        await supabase.storage
          .from('profile-pictures')
          .remove([`${user?.id}/${oldPath}`]);
      }

      // Upload cropped avatar
      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Profile picture updated successfully');
      
      // Clean up
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleBecomeSellerClick = () => {
    if (!hasSeenSellerPromo && !isSeller && !sellerApplicationStatus) {
      setShowBecomeSellerModal(true);
      localStorage.setItem(`seller_promo_seen_${user?.id}`, 'true');
      setHasSeenSellerPromo(true);
    } else {
      navigate('/become-seller');
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  const shouldShowSellerBadge = !isSeller && !sellerApplicationStatus && !hasSeenSellerPromo;

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
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
      <div className="min-h-screen bg-background dark:bg-background pb-20 flex flex-col">
        {/* Header Section with Notifications and Logout */}
        <div className="p-6 bg-card dark:bg-card border-b border-border shadow-sm">
          {/* Top Header Row - Notifications & Logout */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">My Profile</h2>
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <Bell className="h-6 w-6 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Log Out</span>
              </button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Avatar className="h-24 w-24 rounded-full border-4 border-primary/20 shadow-lg ring-2 ring-background">
                  <AvatarImage src={profile?.avatar_url || "https://i.imghippo.com/files/mJWJ8998ds.jpg"} />
                  <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                    {profile?.name?.charAt(0) || (user?.user_metadata?.name?.charAt(0)) || (user?.email?.charAt(0)?.toUpperCase()) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary-hover transition-smooth disabled:opacity-50 border-2 border-background"
                >
                  {uploading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground dark:text-foreground">
                    {profile?.name || (user?.user_metadata?.name as string) || user?.email}
                  </h1>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-2 hover:bg-muted rounded-xl transition-smooth"
                  >
                    <Edit2 className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">{profile?.email || user?.email}</p>
                {profile?.phone && <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-0.5">{profile?.phone}</p>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card 
              className="cursor-pointer hover:shadow-elevated transition-smooth bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 rounded-2xl group"
              onClick={() => navigate('/wallet')}
            >
              <CardContent className="p-5 text-center">
                <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-2 uppercase tracking-wide">Wallet</p>
                {walletLoading ? (
                  <Skeleton className="h-10 w-24 mx-auto rounded-lg" />
                ) : (
                  <p className="text-3xl font-bold text-primary dark:text-primary group-hover:scale-105 transition-transform">
                    Le {walletBalance?.toLocaleString() || 0}
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-elevated transition-smooth bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:border-secondary/40 rounded-2xl group"
              onClick={() => navigate('/orders')}
            >
              <CardContent className="p-5 text-center">
                <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-2 uppercase tracking-wide">Orders</p>
                <p className="text-3xl font-bold text-secondary dark:text-secondary group-hover:scale-105 transition-transform">{buyerOrdersCount}</p>
              </CardContent>
            </Card>
          </div>

          {isSeller && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Card 
                className="bg-gradient-to-br from-warning/10 to-warning/20 border-warning/30 hover:border-warning/50 cursor-pointer hover:shadow-elevated transition-smooth rounded-2xl group"
                onClick={() => navigate('/seller-dashboard')}
              >
                <CardContent className="p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-2 uppercase tracking-wide">Products</p>
                  <p className="text-3xl font-bold text-warning dark:text-warning group-hover:scale-105 transition-transform">{productsCount}</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-gradient-to-br from-warning/10 to-warning/20 border-warning/30 hover:border-warning/50 cursor-pointer hover:shadow-elevated transition-smooth rounded-2xl group"
                onClick={() => navigate('/seller-dashboard')}
              >
                <CardContent className="p-5 text-center">
                  <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground mb-2 uppercase tracking-wide">Store Orders</p>
                  <p className="text-3xl font-bold text-warning dark:text-warning group-hover:scale-105 transition-transform">{storeOrdersCount}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="p-6 space-y-3 flex-1">
          
          {/* Wallet */}
          <Card onClick={() => navigate('/wallet')} className="cursor-pointer hover:shadow-elevated transition-smooth rounded-2xl border-border/50 hover:border-primary/30">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary dark:text-primary" />
                </div>
                <span className="font-semibold text-foreground dark:text-foreground text-lg">My Wallet</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Orders */}
          <Card onClick={() => navigate('/orders')} className="cursor-pointer hover:shadow-elevated transition-smooth rounded-2xl border-border/50 hover:border-secondary/30">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-secondary dark:text-secondary" />
                </div>
                <span className="font-semibold text-foreground dark:text-foreground text-lg">My Orders</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Administration - Admin Only */}
          {isAdmin && (
            <Card onClick={() => navigate('/admin-auth')} className="cursor-pointer hover:shadow-elevated transition-smooth rounded-2xl border-border/50 hover:border-warning/30">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-warning dark:text-warning" />
                  </div>
                  <span className="font-semibold text-foreground dark:text-foreground text-lg">Administration Page</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card onClick={() => navigate('/settings')} className="cursor-pointer hover:shadow-elevated transition-smooth rounded-2xl border-border/50 hover:border-muted/50">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-muted dark:bg-muted flex items-center justify-center">
                  <Settings className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
                </div>
                <span className="font-semibold text-foreground dark:text-foreground text-lg">Settings</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Seller Options */}
          {isSeller ? (
            <Card onClick={() => navigate('/seller-dashboard')} className="cursor-pointer hover:shadow-md transition-shadow bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center relative">
                    <Store className="h-5 w-5 text-white" />
                    {hasPendingOrders && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
                          <span className="text-[8px] font-bold text-white">{pendingCount}</span>
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-foreground">Manage Your Store</span>
                </div>
                {hasPendingOrders && (
                  <Badge className="bg-red-500 text-white">
                    {pendingCount} New
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'approved' ? (
            <Card onClick={() => navigate('/seller-dashboard')} className="cursor-pointer hover:shadow-md transition-shadow bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-foreground">Setup Your Store</span>
                </div>
                <Badge className="bg-green-600">Approved!</Badge>
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'pending' ? (
            <Card className="bg-muted/50 dark:bg-muted/20 border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted-foreground/30 flex items-center justify-center">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-foreground">Seller Application</span>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </CardContent>
            </Card>
          ) : (
            <Card onClick={handleBecomeSellerClick} className="cursor-pointer hover:shadow-md transition-shadow relative">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center relative">
                    <Store className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    {shouldShowSellerBadge && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-foreground">Become a Seller</span>
                </div>
                {shouldShowSellerBadge && (
                  <Badge className="bg-red-500 text-white text-xs">New</Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 dark:bg-muted/10 p-6">
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => navigate('/report-issue')}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-smooth group"
            >
              <div className="p-3 bg-background dark:bg-card rounded-2xl group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-smooth">
                <Headset className="h-6 w-6 text-muted-foreground dark:text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">Customer Care</span>
            </button>
            
            <button
              onClick={() => navigate('/privacy')}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-smooth group"
            >
              <div className="p-3 bg-background dark:bg-card rounded-2xl group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-smooth">
                <Lock className="h-6 w-6 text-muted-foreground dark:text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">Privacy</span>
            </button>
            
            <button
              onClick={() => navigate('/terms')}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-smooth group"
            >
              <div className="p-3 bg-background dark:bg-card rounded-2xl group-hover:bg-secondary/10 dark:group-hover:bg-secondary/20 transition-smooth">
                <FileText className="h-6 w-6 text-muted-foreground dark:text-muted-foreground group-hover:text-secondary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">Terms</span>
            </button>
            
            <button
              onClick={() => navigate('/contact')}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-smooth group"
            >
              <div className="p-3 bg-background dark:bg-card rounded-2xl group-hover:bg-accent/10 dark:group-hover:bg-accent/20 transition-smooth">
                <Mail className="h-6 w-6 text-muted-foreground dark:text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">Contact</span>
            </button>
          </div>
        </div>

        <BottomNav />

        {/* Become Seller Onboarding Modal */}
        <BecomeSellerModal 
          open={showBecomeSellerModal} 
          onClose={() => setShowBecomeSellerModal(false)} 
        />

        {/* Image Crop Modal */}
        {selectedImage && (
          <ImageCropModal
            open={showCropModal}
            imageUrl={selectedImage}
            onClose={() => {
              setShowCropModal(false);
              if (selectedImage) {
                URL.revokeObjectURL(selectedImage);
                setSelectedImage(null);
              }
            }}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Logout Confirmation Modal */}
        <LogoutConfirmationModal
          open={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      </div>
    </>
  );
};

export default Profile;
