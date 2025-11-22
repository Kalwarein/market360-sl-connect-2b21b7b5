import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Phone, Mail, Briefcase, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  date_of_birth: string | null;
  gender: string | null;
  street_address: string | null;
  school_name: string | null;
  university_name: string | null;
  occupation: string | null;
  bio: string | null;
  interests: string[] | null;
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
        <div className="bg-card border-b border-border p-4 flex items-center gap-3 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <Avatar
              className="h-32 w-32 cursor-pointer border-4 border-card shadow-xl relative hover:scale-105 transition-transform duration-300"
              onClick={() => profile.avatar_url && window.open(profile.avatar_url, '_blank')}
            >
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-4xl font-bold">
                {profile.full_name?.[0]?.toUpperCase() || profile.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-3xl font-black mt-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {profile.full_name || profile.name || 'Unknown User'}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 font-medium">{profile.email}</p>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="mb-6 p-5 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              About
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Info Cards Grid */}
        <div className="space-y-3">
          {profile.occupation && (
            <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Occupation</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.occupation}</p>
              </div>
            </div>
          )}

          {profile.school_name && (
            <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="p-3 bg-primary/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">School</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.school_name}</p>
              </div>
            </div>
          )}

          {profile.university_name && (
            <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="p-3 bg-primary/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">University</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.university_name}</p>
              </div>
            </div>
          )}

          {profile.phone && (
            <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phone</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile.email && (
            <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Email</p>
                <p className="font-semibold text-foreground mt-0.5">{profile.email}</p>
              </div>
            </div>
          )}

          {(profile.street_address || location) && (
            <div className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="p-3 bg-primary/10 rounded-xl">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Address</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {[profile.street_address, location].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-8 p-5 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" />
              Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-br from-primary/10 to-accent/10 text-primary text-sm font-semibold rounded-full border border-primary/20 hover:border-primary/40 hover:scale-105 transition-all duration-200 shadow-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileViewer;
