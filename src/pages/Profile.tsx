import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Edit2, Wallet, ShoppingBag, Bell, Store, Gift, Settings, Lock, FileText, Mail, Crown, ChevronRight, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { toast } from 'sonner';
import BecomeSellerModal from '@/components/BecomeSellerModal';
import ImageCropModal from '@/components/ImageCropModal';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { isSeller, loading: rolesLoading } = useUserRoles();
  const { hasPendingOrders, pendingCount } = useSellerNotifications();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
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
      const { data, error } = await supabase
        .from('wallets')
        .select('balance_leones')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Wallet fetch error:', error);
        throw error;
      }

      if (!data) {
        console.log('No wallet found, may need to create one');
        setWalletBalance(0);
        return;
      }

      setWalletBalance(data.balance_leones || 0);
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

  const shouldShowSellerBadge = !isSeller && !sellerApplicationStatus && !hasSeenSellerPromo;

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

        @keyframes shimmer-overlay {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
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
            box-shadow: 0 4px 15px -3px rgba(16, 185, 129, 0.2), 0 0 8px rgba(16, 185, 129, 0.1);
          }
          50% {
            box-shadow: 0 6px 20px -3px rgba(16, 185, 129, 0.3), 0 0 12px rgba(16, 185, 129, 0.15);
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
              rgba(255, 255, 255, 0.4) 50%,
              transparent 100%
            );
          background-size: 100% 100%, 200% 100%;
          animation: shimmer 2.5s linear infinite;
          pointer-events: none;
        }

        .perks-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 30%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.8),
            transparent
          );
          animation: shimmer-overlay 3s ease-in-out infinite;
          pointer-events: none;
        }

        .perks-card:hover {
          transform: translateY(-2px);
        }

        .perks-card:hover::after {
          animation: shimmer-overlay 1.5s ease-in-out infinite;
        }

        .perks-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
        }

        .perks-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(1.1) saturate(1.2);
        }

        .perks-image-shimmer {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          animation: shimmer-overlay 2s ease-in-out infinite;
          pointer-events: none;
        }

        .perks-icon-wrapper {
          position: relative;
          animation: float 3s ease-in-out infinite;
        }

        .perks-icon {
          filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.3));
        }

        .perks-card:hover .perks-icon-wrapper {
          animation: float 1.5s ease-in-out infinite;
        }

        .perks-card:hover .perks-icon {
          filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.5));
        }

        .perks-arrow {
          transition: transform 0.3s ease;
        }

        .perks-card:hover .perks-arrow {
          transform: translateX(4px);
        }
      `}</style>

      <div className="min-h-screen bg-white pb-20 flex flex-col">
        {/* Header Section */}
        <div className="p-6 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <Avatar className="h-20 w-20 rounded-full border-2 border-gray-200">
                  <AvatarImage src={profile?.avatar_url || "https://i.imghippo.com/files/mJWJ8998ds.jpg"} />
                  <AvatarFallback className="text-xl font-semibold">
                    {profile?.name?.charAt(0) || (user?.user_metadata?.name?.charAt(0)) || (user?.email?.charAt(0)?.toUpperCase()) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
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
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || (user?.user_metadata?.name as string) || user?.email}</h1>
                  <button
                    onClick={() => navigate('/settings')}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">{profile?.email || user?.email}</p>
                {profile?.phone && <p className="text-sm text-gray-600">{profile?.phone}</p>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all bg-blue-50 border-blue-100"
              onClick={() => navigate('/wallet')}
            >
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Wallet</p>
                {walletLoading ? (
                  <Skeleton className="h-8 w-20 mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">SLL {walletBalance?.toLocaleString() || 0}</p>
                )}
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-all bg-blue-50 border-blue-100"
              onClick={() => navigate('/orders')}
            >
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-600 mb-1">Orders</p>
                <p className="text-2xl font-bold text-blue-600">{buyerOrdersCount}</p>
              </CardContent>
            </Card>
          </div>

          {isSeller && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Card 
                className="bg-amber-50 border-amber-100 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/seller-dashboard')}
              >
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Products</p>
                  <p className="text-2xl font-bold text-amber-600">{productsCount}</p>
                </CardContent>
              </Card>
              
              <Card 
                className="bg-amber-50 border-amber-100 cursor-pointer hover:shadow-md transition-all"
                onClick={() => navigate('/seller-dashboard')}
              >
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-600 mb-1">Store Orders</p>
                  <p className="text-2xl font-bold text-amber-600">{storeOrdersCount}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="p-6 space-y-3 flex-1">
          
          {/* 🔥 PERKS CARD WITH NEW IMAGE */}
          <div 
            className="perks-card group p-4 flex items-center justify-between gap-4 rounded-2xl transition-all duration-300"
            onClick={() => navigate('/perks')}
          >
            <div className="flex items-center gap-4 flex-1">
              
              <div className="perks-image-container w-16 h-16 flex-shrink-0">
                <img 
                  src="https://i.imghippo.com/files/lEJ5601RT.jpg"
                  alt="Premium Perks"
                  className="perks-image"
                />
                <div className="perks-image-shimmer"></div>
              </div>

              <div className="text-green-900 flex-1">
                <h3 className="text-lg font-bold mb-1">Unlock Premium</h3>
                <p className="text-sm text-green-700">Get exclusive perks & benefits</p>
              </div>
            </div>
            <ChevronRight className="perks-arrow text-green-600 flex-shrink-0" size={24} />
          </div>

          {/* Wallet */}
          <Card onClick={() => navigate('/wallet')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">My Wallet</span>
              </div>
            </CardContent>
          </Card>

          {/* Orders */}
          <Card onClick={() => navigate('/orders')} className="cursor-pointer hover:shadow-md transition-shadow">
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
          <Card onClick={() => { setHasUnreadNotif(false); navigate('/notifications'); }} className="cursor-pointer hover:shadow-md transition-shadow">
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
          <Card onClick={() => navigate('/admin-auth')} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-900">Gifts </span>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card onClick={() => navigate('/settings')} className="cursor-pointer hover:shadow-md transition-shadow">
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
            <Card onClick={() => navigate('/seller-dashboard')} className="cursor-pointer hover:shadow-md transition-shadow bg-amber-50 border-amber-100">
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
                  <span className="font-medium text-gray-900">Manage Your Store</span>
                </div>
                {hasPendingOrders && (
                  <Badge className="bg-red-500 text-white">
                    {pendingCount} New
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : sellerApplicationStatus === 'approved' ? (
            <Card onClick={() => navigate('/seller-dashboard')} className="cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-100">
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
            <Card onClick={handleBecomeSellerClick} className="cursor-pointer hover:shadow-md transition-shadow relative">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center relative">
                    <Store className="h-5 w-5 text-indigo-600" />
                    {shouldShowSellerBadge && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Become a Seller</span>
                </div>
                {shouldShowSellerBadge && (
                  <Badge className="bg-red-500 text-white text-xs">New</Badge>
                )}
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

        {/* Footer */}
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
      </div>
    </>
  );
};

export default Profile;
