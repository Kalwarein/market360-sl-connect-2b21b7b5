import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User, 
  Camera, 
  Loader2, 
  Calendar,
  Trash2,
  MapPin,
  GraduationCap,
  Briefcase,
  Heart
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ImageCropModal from '@/components/ImageCropModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: '',
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    date_of_birth: '',
    gender: '',
    street_address: '',
    city: '',
    region: '',
    school_name: '',
    university_name: '',
    occupation: '',
    bio: '',
    interests: '',
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const displayPhone = data.phone ? data.phone.replace('+232', '') : '';
        const interestsString = Array.isArray(data.interests) 
          ? data.interests.join(', ') 
          : '';
        
        setProfile({
          name: data.name || '',
          full_name: data.full_name || '',
          email: data.email || '',
          phone: displayPhone,
          avatar_url: data.avatar_url || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          street_address: data.street_address || '',
          city: data.city || '',
          region: data.region || '',
          school_name: data.school_name || '',
          university_name: data.university_name || '',
          occupation: data.occupation || '',
          bio: data.bio || '',
          interests: interestsString,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const interestsArray = profile.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          full_name: profile.full_name,
          phone: profile.phone ? `+232${profile.phone}` : null,
          date_of_birth: profile.date_of_birth || null,
          gender: profile.gender,
          street_address: profile.street_address,
          city: profile.city,
          region: profile.region,
          school_name: profile.school_name,
          university_name: profile.university_name,
          occupation: profile.occupation,
          bio: profile.bio,
          interests: interestsArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Your profile has been updated',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setShowCropModal(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setShowCropModal(false);
      setUploading(true);
      
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        await supabase.storage
          .from('profile-pictures')
          .remove([`${user?.id}/${oldPath}`]);
      }

      const fileName = `${Date.now()}.jpg`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast({ title: 'Success', description: 'Profile picture updated' });
      
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Error', description: 'Failed to upload picture', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);

      if (profileError) throw profileError;

      await signOut();
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
      });
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-muted/50 mb-4"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Picture */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 rounded-full border-4 border-primary/20">
                  <AvatarImage src={profile.avatar_url || "https://i.imghippo.com/files/mJWJ8998ds.jpg"} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {profile.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 border-2 border-background"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">Upload a new photo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                placeholder="Your name"
                className="mt-2 rounded-xl"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="Your complete name"
                className="mt-2 rounded-xl"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                className="mt-2 rounded-xl bg-muted/30"
                value={profile.email}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Date of Birth
              </Label>
              <Input
                type="date"
                className="mt-2 rounded-xl"
                value={profile.date_of_birth}
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary mt-2"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <Label>Phone Number</Label>
              <div className="flex gap-2 mt-2">
                <div className="flex items-center px-3 py-2 border border-border rounded-xl bg-muted/30">
                  <span className="text-sm font-medium">+232</span>
                </div>
                <Input
                  placeholder="76123456"
                  type="tel"
                  className="flex-1 rounded-xl"
                  value={profile.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setProfile({ ...profile, phone: value });
                  }}
                  maxLength={9}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Street Address</Label>
              <Input
                placeholder="House number, street name"
                className="mt-2 rounded-xl"
                value={profile.street_address}
                onChange={(e) => setProfile({ ...profile, street_address: e.target.value })}
              />
            </div>
            <div>
              <Label>City/Town</Label>
              <Input
                placeholder="Enter your city"
                className="mt-2 rounded-xl"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Region/District</Label>
              <Input
                placeholder="Enter your region"
                className="mt-2 rounded-xl"
                value={profile.region}
                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Education & Career */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Education & Career
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School(s) Attended</Label>
              <Input
                placeholder="High school, secondary school"
                className="mt-2 rounded-xl"
                value={profile.school_name}
                onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
              />
            </div>
            <div>
              <Label>University/College</Label>
              <Input
                placeholder="University or college name"
                className="mt-2 rounded-xl"
                value={profile.university_name}
                onChange={(e) => setProfile({ ...profile, university_name: e.target.value })}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Occupation
              </Label>
              <Input
                placeholder="What do you do?"
                className="mt-2 rounded-xl"
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* About & Interests */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              About & Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bio</Label>
              <Textarea
                placeholder="Tell us about yourself..."
                className="mt-2 min-h-[100px] rounded-xl"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {profile.bio.length}/500 characters
              </p>
            </div>
            <div>
              <Label>Interests & Hobbies</Label>
              <Input
                placeholder="Sports, Music, Reading, etc. (comma-separated)"
                className="mt-2 rounded-xl"
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="destructive"
              className="w-full rounded-xl"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl h-12 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <BottomNav />
    </div>
  );
};

export default AccountSettings;
