import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bell, Lock, Globe, User, Shield } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    orders: true,
    messages: true,
    promotions: false,
    updates: true,
  });
  const [language, setLanguage] = useState('english');

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm opacity-90">Manage your preferences</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Settings */}
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input placeholder="Your name" className="mt-2" />
            </div>
            <div>
              <Label>Email</Label>
              <Input placeholder="your@email.com" type="email" className="mt-2" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="+1234567890" type="tel" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="orders">Order Updates</Label>
              <Switch
                id="orders"
                checked={notifications.orders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, orders: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="messages">Messages</Label>
              <Switch
                id="messages"
                checked={notifications.messages}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, messages: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="promotions">Promotions</Label>
              <Switch
                id="promotions"
                checked={notifications.promotions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, promotions: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="updates">App Updates</Label>
              <Switch
                id="updates"
                checked={notifications.updates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, updates: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="english">English</option>
              <option value="french">Français</option>
              <option value="spanish">Español</option>
            </select>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/privacy')}
            >
              Privacy Policy
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/terms')}
            >
              Terms of Service
            </Button>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
