import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check moderation status when user logs in
        if (session?.user) {
          setTimeout(async () => {
            const { data: moderation } = await supabase
              .from('user_moderation')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (moderation) {
              // Check if suspension has expired
              if (moderation.type === 'suspension' && moderation.expires_at) {
                const expiresAt = new Date(moderation.expires_at);
                if (expiresAt < new Date()) {
                  // Suspension expired, deactivate it
                  await supabase
                    .from('user_moderation')
                    .update({ is_active: false })
                    .eq('id', moderation.id);
                } else {
                  // Suspension still active, redirect
                  navigate('/moderation');
                }
              } else {
                // Ban is active, redirect
                navigate('/moderation');
              }
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check moderation status for existing session
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
          // Check if suspension has expired
          if (moderation.type === 'suspension' && moderation.expires_at) {
            const expiresAt = new Date(moderation.expires_at);
            if (expiresAt < new Date()) {
              // Suspension expired, deactivate it
              await supabase
                .from('user_moderation')
                .update({ is_active: false })
                .eq('id', moderation.id);
            } else {
              // Suspension still active, redirect
              navigate('/moderation');
            }
          } else {
            // Ban is active, redirect
            navigate('/moderation');
          }
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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