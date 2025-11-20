import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Ban, Clock, ShieldAlert, Mail, Phone, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { SuspendUserModal } from '@/components/SuspendUserModal';
import { BanUserModal } from '@/components/BanUserModal';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  phone: string;
  city: string;
  region: string;
  country: string;
  role: string;
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  metadata: any;
}

interface Moderation {
  type: string;
  reason: string;
  is_active: boolean;
  expires_at: string;
}

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [moderation, setModeration] = useState<Moderation | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setUser(profile);

      // Load audit logs for this user
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setAuditLogs(logs || []);

      // Check for active moderation
      const { data: moderationData } = await supabase
        .from('user_moderation')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setModeration(moderationData);
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-green-500';
    if (action.includes('delete') || action.includes('ban')) return 'bg-red-500';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
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
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-2xl font-bold">User Details</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name || 'No name'}</h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <Badge className="mt-2">{user.role}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              )}
              {(user.city || user.region || user.country) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[user.city, user.region, user.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Joined: {format(new Date(user.created_at), 'MMM dd, yyyy')}
              </div>
            </div>

            {moderation && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">
                    {moderation.type === 'suspension' ? 'SUSPENDED' : 'BANNED'}
                  </span>
                </div>
                <p className="text-sm">{moderation.reason}</p>
                {moderation.expires_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {format(new Date(moderation.expires_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => setSuspendModalOpen(true)}
            variant="outline"
            className="w-full"
            disabled={moderation?.is_active}
          >
            <Clock className="h-4 w-4 mr-2" />
            Suspend User
          </Button>
          <Button
            onClick={() => setBanModalOpen(true)}
            variant="destructive"
            className="w-full"
            disabled={moderation?.is_active}
          >
            <Ban className="h-4 w-4 mr-2" />
            Ban User
          </Button>
        </div>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No activity logged yet
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <Badge className={`${getActionColor(log.action)} text-white mt-1`}>
                      {log.action}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SuspendUserModal
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        userId={userId!}
        userName={user.name || user.email}
        onSuccess={() => {
          setSuspendModalOpen(false);
          loadUserDetails();
        }}
      />

      <BanUserModal
        open={banModalOpen}
        onOpenChange={setBanModalOpen}
        userId={userId!}
        userName={user.name || user.email}
        onSuccess={() => {
          setBanModalOpen(false);
          loadUserDetails();
        }}
      />
    </div>
  );
};

export default AdminUserDetail;
