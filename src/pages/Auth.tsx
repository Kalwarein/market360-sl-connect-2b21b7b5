import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Leaf, Loader2 } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode');
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const { signUp, signIn, signInWithGoogle, user, loading: authLoading, isProcessingOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Update isSignUp based on URL mode parameter
  useEffect(() => {
    if (mode === 'signup') {
      setIsSignUp(true);
    } else if (mode === 'signin') {
      setIsSignUp(false);
    }
  }, [mode]);

  // Redirect authenticated users to home (with delay to ensure session is established)
  useEffect(() => {
    if (user && !authLoading && !isProcessingOAuth) {
      // Small delay to ensure session is fully established
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, isProcessingOAuth, navigate]);

  // Show loading screen while processing OAuth callback
  if (isProcessingOAuth || (authLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signInSchema.parse(formData);
      setLoading(true);
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Welcome to Market360!');
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signUpSchema.parse(formData);
      setLoading(true);
      const { error } = await signUp(formData.email, formData.password, formData.name);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('This email is already registered');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created! Welcome to Market360!');
        // Automatically sign in after successful sign up
        await signIn(formData.email, formData.password);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } catch (err) {
      toast.error('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        {isSignUp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSignUp(false)}
            className="mb-4 text-foreground/70 hover:text-foreground hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        )}

        <div className="bg-card rounded-[2rem] shadow-2xl p-8 backdrop-blur-sm border border-border/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isSignUp ? 'Register' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? 'Create your new account' : 'Login to your account'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-12 h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 pr-12 h-12 rounded-2xl bg-muted/30 border-muted focus:bg-background transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-end text-sm">
                <button type="button" className="text-primary hover:text-primary-hover font-medium">
                  Forgot Password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? 'Please wait...' : isSignUp ? 'Register' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full h-12 rounded-2xl mt-6 border-2 hover:bg-muted/50 transition-all"
          >
            <FaGoogle className="h-5 w-5 mr-2" />
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {!isSignUp && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:text-primary-hover font-semibold"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
