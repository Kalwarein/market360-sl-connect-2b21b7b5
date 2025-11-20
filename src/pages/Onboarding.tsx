import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, MapPin, GraduationCap, Briefcase, Heart, Calendar, Users } from 'lucide-react';
import { MultiStepForm } from '@/components/MultiStepForm';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
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

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Convert comma-separated interests to array
      const interestsArray = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender,
          street_address: formData.street_address,
          city: formData.city,
          region: formData.region,
          school_name: formData.school_name,
          university_name: formData.university_name,
          occupation: formData.occupation,
          bio: formData.bio,
          interests: interestsArray,
          onboarding_completed: true,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Welcome to Market360! Your profile is complete.');
      navigate('/');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePersonalInfo = () => {
    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.gender) {
      toast.error('Please select your gender');
      return false;
    }
    return true;
  };

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full Name *
            </Label>
            <Input
              id="full_name"
              placeholder="Enter your complete name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date of Birth
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Gender *
            </Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      ),
      validation: validatePersonalInfo,
    },
    {
      title: 'Location',
      description: 'Where are you from?',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street_address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Street Address
            </Label>
            <Input
              id="street_address"
              placeholder="House number, street name"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City/Town</Label>
            <Input
              id="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region/District</Label>
            <Input
              id="region"
              placeholder="Enter your region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Education & Career',
      description: 'Your academic and professional background',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school_name" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              School(s) Attended
            </Label>
            <Input
              id="school_name"
              placeholder="High school, secondary school"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="university_name">University/College</Label>
            <Input
              id="university_name"
              placeholder="University or college name"
              value={formData.university_name}
              onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Occupation/Profession
            </Label>
            <Input
              id="occupation"
              placeholder="What do you do?"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'About You',
      description: 'Share your story and interests',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="rounded-xl min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Interests & Hobbies
            </Label>
            <Input
              id="interests"
              placeholder="Sports, Music, Reading, etc. (comma-separated)"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Separate interests with commas
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help others get to know you better by sharing your information
          </p>
        </div>

        <div className="bg-card rounded-3xl shadow-xl p-8 border border-border/50">
          <MultiStepForm
            steps={steps}
            onComplete={handleComplete}
            submitText={loading ? 'Saving...' : 'Complete Setup'}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
