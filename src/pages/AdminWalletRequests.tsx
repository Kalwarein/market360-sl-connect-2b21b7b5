import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WalletRequest {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  phone_number: string;
  screenshot_url: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  profiles: {
    name: string;
    email: string;
  };
}

const AdminWalletRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('admin-wallet-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_requests',
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', request.user_id)
            .single();
          
          return {
            ...request,
            profiles: profile || { name: '', email: '' },
          };
        })
      );
      
      setRequests(requestsWithProfiles as WalletRequest[]);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  const processingRequests = requests.filter((r) => r.status === 'processing');
  const processedRequests = requests.filter((r) => r.status !== 'processing');
  const depositRequests = requests.filter((r) => r.type === 'deposit');
  const withdrawalRequests = requests.filter((r) => r.type === 'withdrawal');

  const RequestCard = ({ request }: { request: WalletRequest }) => (
    <Card 
      className="shadow-sm border-2 hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/admin-wallet-requests/${request.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {request.screenshot_url ? (
              <img 
                src={request.screenshot_url} 
                alt="Evidence" 
                className="w-12 h-12 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                {request.type === 'deposit' ? (
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-semibold capitalize">{request.type}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {request.profiles?.name || 'Unknown User'}
              </p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <p className="text-xl font-bold">
              SLL {request.amount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(request.created_at), 'MMM dd, yyyy • HH:mm')}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            Review →
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border p-6 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Deposits & Withdrawals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {processingRequests.length} pending review
        </p>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="pending" className="relative">
              Pending
              {processingRequests.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {processingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {processingRequests.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-semibold">All caught up!</p>
                  <p className="text-sm">No pending requests to review</p>
                </CardContent>
              </Card>
            ) : (
              processingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            {depositRequests.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No deposit requests found
                </CardContent>
              </Card>
            ) : (
              depositRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawalRequests.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No withdrawal requests found
                </CardContent>
              </Card>
            ) : (
              withdrawalRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {requests.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No requests found
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminWalletRequests;