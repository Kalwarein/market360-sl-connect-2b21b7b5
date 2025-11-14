import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Users, Store, Package, ShoppingBag, 
  FileText, MessageSquare, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SellerApplication {
  id: string;
  business_name: string;
  contact_person: string;
  contact_email: string;
  business_category: string;
  status: string;
  created_at: string;
  user_id: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    products: 0,
    orders: 0,
  });

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    const authTime = sessionStorage.getItem('admin_auth_time');
    
    if (!isAuthenticated || !authTime) {
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
      });
      navigate('/admin-auth');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [usersCount, storesCount, productsCount, ordersCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('stores').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        users: usersCount.count || 0,
        stores: storesCount.count || 0,
        products: productsCount.count || 0,
        orders: ordersCount.count || 0,
      });

      // Load pending applications
      const { data: appsData } = await supabase
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });

      setApplications(appsData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleApplicationAction = async () => {
    if (!selectedApp || !actionType) return;

    try {
      const functionName = actionType === 'approve' ? 'approve-seller' : 'reject-seller';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          applicationId: selectedApp.id,
          reason: actionType === 'reject' ? 'Does not meet requirements' : undefined
        }
      });

      if (error) throw error;

      if (actionType === 'approve') {
        toast({
          title: 'Application Approved',
          description: `${selectedApp.business_name} is now a seller`,
        });
      } else {
        // Reject application
        await supabase
          .from('seller_applications')
          .update({ 
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            rejection_reason: 'Application did not meet requirements',
          })
          .eq('id', selectedApp.id);

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedApp.user_id,
            type: 'system',
            title: 'Seller Application Rejected',
            body: 'Unfortunately, your seller application was not approved at this time.',
          });

        toast({
          title: 'Application Rejected',
          description: 'User has been notified',
        });
      }

      loadDashboardData();
    } catch (error) {
      console.error('Error processing application:', error);
      toast({
        title: 'Error',
        description: 'Failed to process application',
        variant: 'destructive',
      });
    } finally {
      setSelectedApp(null);
      setActionType(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_auth_time');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm opacity-90">Market360 Control Center</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.users}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Store className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.stores}</p>
              <p className="text-sm text-muted-foreground">Active Stores</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Package className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.products}</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <ShoppingBag className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{stats.orders}</p>
              <p className="text-sm text-muted-foreground">Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="applications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-3">
            {applications.filter(a => a.status === 'pending').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No pending applications</p>
                </CardContent>
              </Card>
            ) : (
              applications
                .filter(a => a.status === 'pending')
                .map((app) => (
                  <Card key={app.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{app.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{app.contact_person}</p>
                          <p className="text-sm text-muted-foreground">{app.contact_email}</p>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{app.business_category}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedApp(app);
                            setActionType('approve');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            setSelectedApp(app);
                            setActionType('reject');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}

            {applications.filter(a => a.status !== 'pending').length > 0 && (
              <>
                <h3 className="font-medium mt-6 mb-3">Processed Applications</h3>
                {applications
                  .filter(a => a.status !== 'pending')
                  .map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{app.business_name}</h3>
                            <p className="text-sm text-muted-foreground">{app.business_category}</p>
                          </div>
                          <Badge variant={app.status === 'approved' ? 'default' : 'destructive'}>
                            {app.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="broadcast">
            <Card>
              <CardHeader>
                <CardTitle>Broadcast Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Broadcast messaging coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Audit logs coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Application' : 'Reject Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? `Are you sure you want to approve ${selectedApp?.business_name}? This will create a store and grant seller privileges.`
                : `Are you sure you want to reject ${selectedApp?.business_name}? The user will be notified.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplicationAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
