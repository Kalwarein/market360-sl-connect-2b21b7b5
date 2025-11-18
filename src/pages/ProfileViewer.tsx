import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

const ProfileViewer = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-6 flex flex-col items-center">
          <Skeleton className="h-32 w-32 rounded-full" />
          <Skeleton className="h-8 w-48 mt-4" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const location = [profile.city, profile.region, profile.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Profile</h1>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center text-center mb-8">
          <Avatar
            className="h-32 w-32 cursor-pointer"
            onClick={() => profile.avatar_url && window.open(profile.avatar_url, '_blank')}
          >
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl font-semibold">
              {profile.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mt-4">{profile.name || 'Unknown User'}</h2>
          <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
        </div>

        <div className="space-y-4">
          {profile.phone && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile.email && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{location}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewer;
