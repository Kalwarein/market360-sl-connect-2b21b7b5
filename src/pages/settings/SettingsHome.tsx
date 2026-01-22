import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Bell, 
  Lock, 
  Headset, 
  Info,
  ChevronRight 
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const settingsCategories = [
  {
    id: 'account',
    icon: User,
    title: 'Account',
    description: 'Manage your profile and personal information',
    path: '/settings/account',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    description: 'Password, PIN, and recovery options',
    path: '/settings/security',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Push, email, and SMS preferences',
    path: '/settings/notifications',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy',
    description: 'Profile visibility and data settings',
    path: '/settings/privacy',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'support',
    icon: Headset,
    title: 'Support',
    description: 'Get help and report problems',
    path: '/settings/support',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'about',
    icon: Info,
    title: 'About',
    description: 'App version, terms, and policies',
    path: '/settings/about',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
  },
];

const SettingsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-muted/50 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Settings Categories */}
      <div className="p-4 space-y-3">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card 
              key={category.id}
              onClick={() => navigate(category.path)}
              className="cursor-pointer hover:shadow-md transition-all duration-200 rounded-2xl border-border/50 hover:border-primary/30 active:scale-[0.99]"
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base">
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {category.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsHome;
