import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, XCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface WalletRequest {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  phone_number: string;
  screenshot_url: string;
  status: string;
  created_at: string;
  admin_notes: string;
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
      
      setRequests(requestsWithProfiles as any);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b border-border p-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Wallet Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pendingRequests.length} pending requests
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Pending Requests</h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin-wallet-requests/${request.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {request.type === 'deposit' ? (
                          <ArrowUpCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-8 w-8 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.profiles?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold text-foreground">
                          Le {request.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">
                          {request.phone_number}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Processed Requests</h2>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <Card 
                  key={request.id} 
                  className="shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => navigate(`/admin-wallet-requests/${request.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {request.type === 'deposit' ? (
                          <ArrowUpCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="h-8 w-8 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.profiles?.name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        request.status === 'approved' 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      } text-white flex items-center gap-1`}>
                        {request.status === 'approved' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {request.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-semibold text-foreground">
                          Le {request.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium text-foreground">
                          {request.phone_number}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length === 0 && processedRequests.length === 0 && (
          <Card className="shadow-sm border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              No wallet requests found.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminWalletRequests;
