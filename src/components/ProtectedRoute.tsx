import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [checkingModeration, setCheckingModeration] = useState(true);
  const [hasActiveModeration, setHasActiveModeration] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  useEffect(() => {
    if (user) {
      checkModeration();
      checkOnboardingStatus();
    } else {
      setCheckingModeration(false);
      setCheckingOnboarding(false);
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_tour_completed')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Error checking onboarding status:', error);
        // Default to completed if error to prevent blocking access
        setOnboardingCompleted(true);
      } else {
        const isOnboardingComplete = data?.onboarding_completed === true;
        setOnboardingCompleted(isOnboardingComplete);
        
        // If onboarding is complete but tour isn't, ensure tour will trigger on home page
        if (isOnboardingComplete && data?.onboarding_tour_completed === false) {
          console.log('Onboarding complete, tour will start on home page');
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to completed if error to prevent blocking access
      setOnboardingCompleted(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const checkModeration = async () => {
    try {
      const { data, error } = await supabase
        .from('user_moderation')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check if suspension has expired
        if (data.type === 'suspension' && data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          if (expiresAt < new Date()) {
            // Suspension expired, deactivate it
            await supabase
              .from('user_moderation')
              .update({ is_active: false })
              .eq('id', data.id);
            
            setHasActiveModeration(false);
          } else {
            setHasActiveModeration(true);
          }
        } else {
          setHasActiveModeration(true);
        }
      }
    } catch (error) {
      console.error('Error checking moderation:', error);
    } finally {
      setCheckingModeration(false);
    }
  };

  if (loading || checkingModeration || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/splash" replace />;
  }

  if (hasActiveModeration) {
    return <Navigate to="/moderation" replace />;
  }

  // Check onboarding completion (allow access to onboarding page itself)
  const currentPath = window.location.pathname;
  if (!onboardingCompleted && currentPath !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;