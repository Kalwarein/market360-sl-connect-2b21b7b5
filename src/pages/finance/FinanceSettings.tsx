import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, Shield, Bell, Lock, Users, Database,
  RefreshCw, Download, AlertTriangle
} from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const FinanceSettings = () => {
  const { toast } = useToast();
  const [runningDetection, setRunningDetection] = useState(false);

  const handleRunFraudDetection = async () => {
    setRunningDetection(true);
    try {
      await supabase.rpc('detect_fraud_patterns');
      toast({ 
        title: 'Fraud Detection Complete', 
        description: 'All patterns have been scanned for suspicious activity.' 
      });
    } catch (error) {
      console.error('Error:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to run fraud detection', 
        variant: 'destructive' 
      });
    } finally {
      setRunningDetection(false);
    }
  };

  return (
    <FinanceLayout title="Settings" subtitle="Finance portal configuration">
      <div className="space-y-6 max-w-4xl">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure fraud detection and security policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Fraud Detection</p>
                <p className="text-sm text-muted-foreground">
                  Automatically scan for suspicious patterns every hour
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Freeze Critical Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Automatically freeze wallets when critical fraud is detected
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require 2FA for Admin Actions</p>
                <p className="text-sm text-muted-foreground">
                  Require two-factor authentication for sensitive actions
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleRunFraudDetection} 
                disabled={runningDetection}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${runningDetection ? 'animate-spin' : ''}`} />
                Run Fraud Detection Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Detection Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fraud Detection Rules
            </CardTitle>
            <CardDescription>
              Current fraud detection thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Rapid Deposits</p>
                <p className="text-sm text-muted-foreground">5+ deposits in 1 hour</p>
                <Badge className="mt-2 bg-orange-500">High Severity</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Rapid Withdrawals</p>
                <p className="text-sm text-muted-foreground">5+ withdrawals in 1 hour</p>
                <Badge className="mt-2 bg-orange-500">High Severity</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Deposit-Withdrawal Abuse</p>
                <p className="text-sm text-muted-foreground">Deposit and withdraw within 10 mins</p>
                <Badge className="mt-2" variant="destructive">Critical Severity</Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-medium">Failed Attempts</p>
                <p className="text-sm text-muted-foreground">5+ failed transactions in 24 hours</p>
                <Badge className="mt-2 bg-warning text-warning-foreground">Medium Severity</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Critical Alert Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive immediate notifications for critical alerts
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Summary Email</p>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of financial activity
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Large Transaction Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Notify when transactions exceed SLE 10,000
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Admin Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Access Levels
            </CardTitle>
            <CardDescription>
              Role-based access control for the finance portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Super Admin</p>
                  <p className="text-sm text-muted-foreground">
                    Full access to all finance features
                  </p>
                </div>
                <Badge variant="default">Full Access</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Finance Admin</p>
                  <p className="text-sm text-muted-foreground">
                    Wallets, transactions, analytics
                  </p>
                </div>
                <Badge variant="secondary">Limited</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Support Admin</p>
                  <p className="text-sm text-muted-foreground">
                    Read-only access, user lookup only
                  </p>
                </div>
                <Badge variant="outline">Read Only</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Export financial data for reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Transactions (CSV)
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export User Wallets (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinanceLayout>
  );
};

export default FinanceSettings;
