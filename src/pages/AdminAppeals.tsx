import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
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

interface Appeal {
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
}

const AdminAppeals = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_appeals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Load related data
      const appealsWithData = await Promise.all(
        (data || []).map(async (appeal: any) => {
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
          };
        })
      );
      
      setAppeals(appealsWithData);
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppeal = (appealId: string) => {
    navigate(`/admin/appeals/${appealId}`);
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
      appeal.appeal_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || appeal.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

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
        <h1 className="text-2xl font-bold">User Appeals</h1>
        <p className="text-sm opacity-90">
          {appeals.filter((a) => a.status === 'pending').length} pending appeals
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search appeals by user name or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                  key={appeal.id}
                  className="shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewAppeal(appeal.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={appeal.profiles?.avatar_url} />
                        <AvatarFallback>
                          {appeal.profiles?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">
                            {appeal.profiles?.name || 'Unknown User'}
                          </h3>
                          <Badge className={`${getStatusColor(appeal.status)} text-white`}>
                            {appeal.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {appeal.profiles?.email}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {appeal.user_moderation?.type}
                          </Badge>
                        </div>
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
