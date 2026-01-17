import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Wallet,
  Users,
  ArrowLeftRight,
  Gift,
  ShieldAlert,
  Settings,
  Menu,
  X,
  LogOut,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';

interface FinanceLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const navItems = [
  { path: '/finance', icon: LayoutDashboard, label: 'Overview' },
  { path: '/finance/analytics', icon: TrendingUp, label: 'Wallet Analytics' },
  { path: '/finance/users', icon: Users, label: 'Users Wallets' },
  { path: '/finance/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/finance/perks', icon: Gift, label: 'Perks Revenue' },
  { path: '/finance/fraud', icon: ShieldAlert, label: 'Fraud & Risk' },
  { path: '/finance/settings', icon: Settings, label: 'Settings' },
];

const FinanceLayout = ({ children, title, subtitle }: FinanceLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check admin authentication on mount
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    const authTime = sessionStorage.getItem('admin_auth_time');
    
    if (!isAuthenticated || !authTime) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access the Finance Portal',
        variant: 'destructive',
      });
      navigate('/admin-auth');
      return;
    }

    // Check if session expired (24 hours)
    const elapsed = Date.now() - parseInt(authTime);
    if (elapsed > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem('admin_authenticated');
      sessionStorage.removeItem('admin_auth_time');
      toast({
        title: 'Session Expired',
        description: 'Please authenticate again',
        variant: 'destructive',
      });
      navigate('/admin-auth');
      return;
    }

    setIsAuthorized(true);
  }, [navigate, toast]);

  // Show nothing while checking auth
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b z-50 flex items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Finance Portal</h1>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-background border-r z-50 transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold">Market360</h2>
              <p className="text-xs text-muted-foreground">Finance Portal</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => navigate('/admin-dashboard')}
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Admin
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {/* Page Header */}
        <div className="bg-background border-b px-6 py-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default FinanceLayout;
