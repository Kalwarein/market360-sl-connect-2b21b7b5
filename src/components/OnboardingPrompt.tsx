import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ProfileData {
  full_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  city: string | null;
  region: string | null;
  bio: string | null;
  interests: string[] | null;
  onboarding_completed: boolean | null;
}

const OnboardingPrompt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [completedFields, setCompletedFields] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const requiredFields = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'city', label: 'City' },
    { key: 'region', label: 'Region' },
    { key: 'bio', label: 'About You' },
    { key: 'interests', label: 'Interests' },
  ];

  useEffect(() => {
    if (user && !dismissed) {
      checkOnboardingStatus();
    }
  }, [user, dismissed]);

  const checkOnboardingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, date_of_birth, gender, city, region, bio, interests, onboarding_completed')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfileData(data);

      // Count completed fields
      let completed = 0;
      if (data.full_name) completed++;
      if (data.date_of_birth) completed++;
      if (data.gender) completed++;
      if (data.city) completed++;
      if (data.region) completed++;
      if (data.bio) completed++;
      if (data.interests && data.interests.length > 0) completed++;

      setCompletedFields(completed);

      // Show prompt if onboarding not completed and less than 5 fields filled
      if (!data.onboarding_completed && completed < 5) {
        // Check if user dismissed today
        const dismissedToday = localStorage.getItem('onboarding_prompt_dismissed');
        if (dismissedToday) {
          const dismissedDate = new Date(dismissedToday);
          const today = new Date();
          if (dismissedDate.toDateString() === today.toDateString()) {
            return; // Already dismissed today
          }
        }
        setShowPrompt(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('onboarding_prompt_dismissed', new Date().toISOString());
  };

  const handleCompleteProfile = () => {
    navigate('/onboarding');
  };

  if (!showPrompt || !profileData) return null;

  const progress = Math.round((completedFields / requiredFields.length) * 100);
  const missingCount = requiredFields.length - completedFields;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Complete Your Profile</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/20"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-white/90 mb-3">
          Fill in {missingCount} more field{missingCount !== 1 ? 's' : ''} to unlock all features and personalize your experience.
        </p>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>{completedFields}/{requiredFields.length} completed</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/30" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-white text-orange-600 hover:bg-white/90"
            onClick={handleCompleteProfile}
          >
            <User className="w-4 h-4 mr-1" />
            Complete Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={handleDismiss}
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPrompt;
