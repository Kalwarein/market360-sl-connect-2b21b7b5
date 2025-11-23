import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface UserReport {
  id: string;
  reporter_id: string;
  store_name: string | null;
  seller_name: string | null;
  order_id: string | null;
  description: string;
  amount: number | null;
  status: string;
  created_at: string;
  reporter?: {
    name: string;
    email: string;
  };
}

const AdminUserReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'resolved'>('all');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch reporter profiles
      if (data && data.length > 0) {
        const reporterIds = data.map(r => r.reporter_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', reporterIds);

        const reportsWithProfiles = data.map(report => ({
          ...report,
          reporter: profiles?.find(p => p.id === report.reporter_id)
        }));

        setReports(reportsWithProfiles || []);
      } else {
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'under_review':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'under_review':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'dismissed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">User Reports</h1>
              <p className="text-sm text-muted-foreground">Fraud & security reports from users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'under_review', 'resolved'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="rounded-full capitalize whitespace-nowrap"
            >
              {status === 'all' ? 'All Reports' : status.replace('_', ' ')}
              {filter === status && (
                <Badge variant="secondary" className="ml-2">
                  {reports.length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'No user reports have been submitted yet' 
                  : `No ${filter.replace('_', ' ')} reports`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/30"
                onClick={() => navigate(`/admin/user-reports/${report.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(report.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            {report.status.replace('_', ' ')}
                          </span>
                        </Badge>
                        {report.amount && (
                          <Badge variant="outline" className="border-destructive/30 text-destructive">
                            Le {report.amount.toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      {/* Report Details */}
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>Reported by:</span>
                          <span className="font-medium text-foreground">
                            {report.reporter?.name || report.reporter?.email || 'Unknown'}
                          </span>
                        </div>
                        {report.store_name && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Store:</span> {report.store_name}
                          </div>
                        )}
                        {report.seller_name && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Seller:</span> {report.seller_name}
                          </div>
                        )}
                      </div>

                      {/* Description Preview */}
                      <p className="text-foreground line-clamp-2">
                        {report.description}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground">
                        Reported {format(new Date(report.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="h-4 w-4 text-primary rotate-180" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserReports;
