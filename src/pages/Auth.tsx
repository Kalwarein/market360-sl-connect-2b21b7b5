import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Lock, User, MapPin } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional()
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    country: 'Sierra Leone',
    region: '',
    city: ''
  });
  const { signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(false);

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
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.email) {
      toast.error('Please enter your email');
      return;
    }
    if (step === 2 && (!formData.name || !formData.password)) {
      toast.error('Please complete all fields');
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
              M360
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Join Market360 today' : 'Sign in to continue'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSignUp ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Create account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {step === 1 && (
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="button" onClick={nextStep} className="w-full mt-4">
                    Continue
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="region"
                        type="text"
                        placeholder="Western Area"
                        className="pl-10"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        type="text"
                        placeholder="Freetown"
                        className="pl-10"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setStep(1);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;