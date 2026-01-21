import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isProcessingOAuth: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for OAuth callback parameters in URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    // Check if this is an OAuth callback (has access_token or code in URL)
    const hasOAuthCallback = hashParams.has('access_token') || 
                             queryParams.has('code') || 
                             hashParams.has('error') ||
                             queryParams.has('error');
    
    // Check for OAuth error in URL (e.g., invalid_client)
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
    const error = hashParams.get('error') || queryParams.get('error');
    
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      setIsProcessingOAuth(false);
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (hasOAuthCallback) {
      setIsProcessingOAuth(true);
    }
  }, [location]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsProcessingOAuth(false);
        
        // Handle successful sign in from OAuth
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user profile exists, create if not (for Google OAuth users)
          setTimeout(async () => {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (!existingProfile) {
              // Create profile for new Google OAuth user
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                  full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                  avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null,
                  onboarding_completed: false,
                });
              
              if (profileError) {
                console.error('Error creating profile:', profileError);
              }
            }
            
            // Check moderation status
            const { data: moderation } = await supabase
              .from('user_moderation')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (moderation) {
              if (moderation.type === 'suspension' && moderation.expires_at) {
                const expiresAt = new Date(moderation.expires_at);
                if (expiresAt < new Date()) {
                  await supabase
                    .from('user_moderation')
                    .update({ is_active: false })
                    .eq('id', moderation.id);
                } else {
                  navigate('/moderation');
                  return;
                }
              } else {
                navigate('/moderation');
                return;
              }
            }
            
            // Redirect to home after successful OAuth login
            if (location.pathname === '/auth' || location.pathname === '/splash') {
              navigate('/', { replace: true });
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: moderation } = await supabase
          .from('user_moderation')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (moderation) {
          if (moderation.type === 'suspension' && moderation.expires_at) {
            const expiresAt = new Date(moderation.expires_at);
            if (expiresAt < new Date()) {
              await supabase
                .from('user_moderation')
                .update({ is_active: false })
                .eq('id', moderation.id);
            } else {
              navigate('/moderation');
            }
          } else {
            navigate('/moderation');
          }
        }
      }
      
      setLoading(false);
      setIsProcessingOAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error) {
      navigate('/');
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    setIsProcessingOAuth(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) {
      setIsProcessingOAuth(false);
    }
    
    return { error };
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isProcessingOAuth, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};