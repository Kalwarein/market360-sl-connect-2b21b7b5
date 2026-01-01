import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, CheckCircle, XCircle, MessageSquare, Store, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface UserProfile {
  name: string;
  email: string;
  avatar_url: string;
}

interface UserModeration {
  type: string;
  reason: string;
}

interface StoreInfo {
  store_name: string;
  logo_url: string | null;
}

interface UserAppeal {
  id: string;
  appeal_message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_id: string;
  moderation_id: string;
  profiles: UserProfile;
  user_moderation: UserModeration;
  type: 'user';
}

interface StoreAppeal {
  id: string;
  appeal_message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  reviewed_at: string | null;
  user_id: string;
  store_id: string;
  stores: StoreInfo;
  profiles: UserProfile;
  type: 'store';
}

type Appeal = UserAppeal | StoreAppeal;

const AdminAppeals = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [appealType, setAppealType] = useState<'all' | 'user' | 'store'>('all');

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      // Load user moderation appeals
      const { data: userAppeals, error: userError } = await supabase
        .from('moderation_appeals')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      
      // Load store moderation appeals
      const { data: storeAppeals, error: storeError } = await supabase
        .from('store_moderation_appeals')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeError) throw storeError;

      // Enrich user appeals with related data
      const enrichedUserAppeals = await Promise.all(
        (userAppeals || []).map(async (appeal: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email, avatar_url')
            .eq('id', appeal.user_id)
            .single();
          
          const { data: moderation } = await supabase
            .from('user_moderation')
            .select('type, reason')
            .eq('id', appeal.moderation_id)
            .single();
          
          return {
            ...appeal,
            profiles: profile || { name: '', email: '', avatar_url: '' },
            user_moderation: moderation || { type: '', reason: '' },
            type: 'user' as const,
          };
        })
      );

      // Enrich store appeals with related data
      const enrichedStoreAppeals = await Promise.all(
        (storeAppeals || []).map(async (appeal: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email, avatar_url')
            .eq('id', appeal.user_id)
            .single();
          
          const { data: store } = await supabase
            .from('stores')
            .select('store_name, logo_url')
            .eq('id', appeal.store_id)
            .single();
          
          return {
            ...appeal,
            profiles: profile || { name: '', email: '', avatar_url: '' },
            stores: store || { store_name: '', logo_url: null },
            type: 'store' as const,
          };
        })
      );

      // Combine and sort by date
      const allAppeals = [...enrichedUserAppeals, ...enrichedStoreAppeals]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAppeals(allAppeals);
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppeal = (appeal: Appeal) => {
    if (appeal.type === 'user') {
      navigate(`/admin/appeals/${appeal.id}`);
    } else {
      navigate(`/admin/store-appeals/${appeal.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-destructive';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredAppeals = appeals.filter((appeal) => {
    const matchesSearch =
      appeal.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appeal.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appeal.appeal_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appeal.type === 'store' && (appeal as StoreAppeal).stores?.store_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = activeTab === 'all' || appeal.status === activeTab;
    const matchesType = appealType === 'all' || appeal.type === appealType;
    
    return matchesSearch && matchesTab && matchesType;
  });

  const pendingCount = appeals.filter(a => a.status === 'pending').length;
  const userAppealsCount = appeals.filter(a => a.type === 'user').length;
  const storeAppealsCount = appeals.filter(a => a.type === 'store').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Appeals</h1>
        <p className="text-sm opacity-90">
          {pendingCount} pending appeals ({userAppealsCount} user, {storeAppealsCount} store)
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search appeals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          <Button
            variant={appealType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAppealType('all')}
          >
            All ({appeals.length})
          </Button>
          <Button
            variant={appealType === 'user' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAppealType('user')}
          >
            <User className="h-4 w-4 mr-1" />
            User ({userAppealsCount})
          </Button>
          <Button
            variant={appealType === 'store' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAppealType('store')}
          >
            <Store className="h-4 w-4 mr-1" />
            Store ({storeAppealsCount})
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {filteredAppeals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No appeals found</p>
                </CardContent>
              </Card>
            ) : (
              filteredAppeals.map((appeal) => (
                <Card
                  key={`${appeal.type}-${appeal.id}`}
                  className="shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewAppeal(appeal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {appeal.type === 'store' ? (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          {(appeal as StoreAppeal).stores?.logo_url ? (
                            <img 
                              src={(appeal as StoreAppeal).stores.logo_url!} 
                              alt="Store" 
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <Store className="h-6 w-6 text-primary" />
                          )}
                        </div>
                      ) : (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={appeal.profiles?.avatar_url} />
                          <AvatarFallback>
                            {appeal.profiles?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {appeal.type === 'store' 
                                ? (appeal as StoreAppeal).stores?.store_name || 'Unknown Store'
                                : appeal.profiles?.name || 'Unknown User'
                              }
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {appeal.profiles?.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {appeal.type === 'store' ? 'Store' : 'User'}
                            </Badge>
                            <Badge className={`${getStatusColor(appeal.status)} text-white`}>
                              {appeal.status}
                            </Badge>
                          </div>
                        </div>
                        {appeal.type === 'user' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {(appeal as UserAppeal).user_moderation?.type}
                            </Badge>
                          </div>
                        )}
                        <p className="text-sm line-clamp-2 mb-2">
                          {appeal.appeal_message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appeal.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminAppeals;
