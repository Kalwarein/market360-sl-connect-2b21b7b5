import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Bell, Lock, Globe, User, Shield, Loader2, GraduationCap, Briefcase, MapPin, Heart, Calendar } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profile, setProfile] = useState({
    name: '',
    full_name: '',
    email: '',
    phone: '',
    phone_verified: false,
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

  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    promotions: false,
    updates: true,
    email_notifications: true,
  });

  const [language, setLanguage] = useState('english');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Format phone number for display (remove +232 prefix)
        const displayPhone = data.phone ? data.phone.replace('+232', '') : '';
        
        // Convert interests array to comma-separated string
        const interestsString = Array.isArray(data.interests) 
          ? data.interests.join(', ') 
          : '';
        
        setProfile({
          name: data.name || '',
          full_name: data.full_name || '',
          email: data.email || '',
          phone: displayPhone,
          phone_verified: data.phone_verified || false,
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
        
        const notifPrefs = data.notification_preferences as any;
        setNotifications(
          typeof notifPrefs === 'object' && notifPrefs !== null
            ? {
                orders: notifPrefs.orders ?? true,
                messages: notifPrefs.messages ?? true,
                promotions: notifPrefs.promotions ?? false,
                updates: notifPrefs.updates ?? true,
                email_notifications: notifPrefs.email_notifications ?? true,
              }
            : {
                orders: true,
                messages: true,
                promotions: false,
                updates: true,
                email_notifications: true,
              }
        );
        setLanguage(data.language || 'english');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Convert comma-separated interests to array
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
          notification_preferences: notifications,
          language: language,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your password has been changed successfully',
      });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Sign out and redirect
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20">
      <div className="bg-card border-b border-border/50 backdrop-blur-lg p-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-muted/50 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Account Settings */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                placeholder="Your name"
                className="mt-2"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="Your complete name"
                className="mt-2"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                placeholder="your@email.com"
                type="email"
                className="mt-2"
                value={profile.email}
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Date of Birth
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                className="mt-2"
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
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 py-2 border border-border rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">+232</span>
                </div>
                <Input
                  placeholder="76123456"
                  type="tel"
                  className="flex-1"
                  value={profile.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setProfile({ ...profile, phone: value });
                  }}
                  maxLength={9}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your number without the leading zero (e.g., 76123456)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Street Address</Label>
              <Input
                placeholder="House number, street name"
                className="mt-2"
                value={profile.street_address}
                onChange={(e) => setProfile({ ...profile, street_address: e.target.value })}
              />
            </div>
            <div>
              <Label>City/Town</Label>
              <Input
                placeholder="Enter your city"
                className="mt-2"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              />
            </div>
            <div>
              <Label>Region/District</Label>
              <Input
                placeholder="Enter your region"
                className="mt-2"
                value={profile.region}
                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Education & Career */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Education & Career
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School(s) Attended</Label>
              <Input
                placeholder="High school, secondary school"
                className="mt-2"
                value={profile.school_name}
                onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
              />
            </div>
            <div>
              <Label>University/College</Label>
              <Input
                placeholder="University or college name"
                className="mt-2"
                value={profile.university_name}
                onChange={(e) => setProfile({ ...profile, university_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="occupation" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Occupation/Profession
              </Label>
              <Input
                id="occupation"
                placeholder="What do you do?"
                className="mt-2"
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* About & Interests */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              About & Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Bio</Label>
              <Textarea
                placeholder="Tell us about yourself..."
                className="mt-2 min-h-[120px]"
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
                className="mt-2"
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate interests with commas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="orders">Order Updates</Label>
              <Switch
                id="orders"
                checked={notifications.orders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, orders: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="messages">Messages</Label>
              <Switch
                id="messages"
                checked={notifications.messages}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, messages: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="promotions">Promotions</Label>
              <Switch
                id="promotions"
                checked={notifications.promotions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, promotions: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="updates">App Updates</Label>
              <Switch
                id="updates"
                checked={notifications.updates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, updates: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications" className="font-semibold">Email Notifications</Label>
                <p className="text-xs text-muted-foreground mt-1">Receive email alerts for orders, messages, and updates</p>
              </div>
              <Switch
                id="email_notifications"
                checked={notifications.email_notifications}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email_notifications: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="english">English</option>
              <option value="french">Français</option>
              <option value="spanish">Español</option>
            </select>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl"
              onClick={() => setPasswordDialogOpen(true)}
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Two-factor authentication will be available soon',
                });
              }}
            >
              Two-Factor Authentication
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl"
              onClick={() => navigate('/privacy')}
            >
              Privacy Policy
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl"
              onClick={() => navigate('/terms')}
            >
              Terms of Service
            </Button>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl shadow-sm"
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

      {/* Delete Account Dialog */}
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

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. It must be at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} className="flex-1">
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Settings;