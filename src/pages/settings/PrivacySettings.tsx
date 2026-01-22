import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Lock, 
  Eye,
  UserX,
  Database,
  FileText,
  Shield,
  ChevronRight
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const PrivacySettings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-6">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-muted/50 mb-4"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lock className="h-6 w-6 text-purple-600" />
          Privacy Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control your privacy and data preferences
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Visibility */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Profile Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show Online Status</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Let others see when you're online
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Show Last Seen</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Let others see when you were last active
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Public Profile</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Allow anyone to view your profile
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Block List */}
        <Card 
          className="rounded-2xl border-border/50 cursor-pointer hover:shadow-md transition-all"
          onClick={() => {/* Navigate to block list */}}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium">Blocked Users</h3>
                <p className="text-xs text-muted-foreground">Manage your block list</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Analytics</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Help improve the app with usage data
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Personalized Recommendations</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Get product suggestions based on your activity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => navigate('/privacy')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Privacy Policy
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl"
              onClick={() => navigate('/terms')}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Terms of Service
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default PrivacySettings;
