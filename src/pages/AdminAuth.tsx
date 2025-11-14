import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ADMIN_PASS_1 = '#market360762635375363';
const ADMIN_PASS_2 = '#market360848844747477';

const AdminAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (password1 === ADMIN_PASS_1) {
        setStep(2);
        setPassword1('');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          toast({
            title: 'Access Denied',
            description: 'Too many failed attempts. Please try again later.',
            variant: 'destructive',
          });
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          toast({
            title: 'Access Denied',
            description: 'Invalid key. Please try again.',
            variant: 'destructive',
          });
        }
        setPassword1('');
      }
      setLoading(false);
    }, 500);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (password2 === ADMIN_PASS_2) {
        // Store admin session
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_auth_time', Date.now().toString());
        
        toast({
          title: 'Access Granted',
          description: 'Welcome to Admin Dashboard',
        });
        
        navigate('/admin-dashboard');
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          toast({
            title: 'Access Denied',
            description: 'Too many failed attempts. Returning to home.',
            variant: 'destructive',
          });
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          toast({
            title: 'Access Denied',
            description: 'Invalid key. Please try again.',
            variant: 'destructive',
          });
          setStep(1);
        }
        setPassword2('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Step {step} of 2 - Secure Authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <Label htmlFor="password1">First Access Key</Label>
                <Input
                  id="password1"
                  type="password"
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value)}
                  placeholder="Enter first key"
                  required
                  disabled={loading || attempts >= 5}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || attempts >= 5}
              >
                {loading ? 'Verifying...' : 'Continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <Label htmlFor="password2">Second Access Key</Label>
                <Input
                  id="password2"
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="Enter second key"
                  required
                  disabled={loading || attempts >= 5}
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || attempts >= 5}
              >
                {loading ? 'Verifying...' : 'Access Dashboard'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setPassword2('');
                }}
              >
                Back
              </Button>
            </form>
          )}
          
          {attempts > 0 && attempts < 5 && (
            <p className="text-sm text-destructive mt-4 text-center">
              {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuth;
