import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

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

export default function AdminSellerApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20 mb-4"
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Seller Applications</h1>
        <p className="text-sm opacity-90">Review and manage seller applications</p>
      </div>

      <div className="p-4 space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No applications yet</p>
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              onClick={() => navigate(`/admin/seller-application/${app.id}`)}
              className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:border-primary transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{app.business_name}</h3>
                  <p className="text-sm text-muted-foreground">{app.contact_person}</p>
                </div>
                <Badge variant={getStatusColor(app.status) as any} className="flex items-center gap-1">
                  {getStatusIcon(app.status)}
                  {app.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{app.business_category}</span>
                <span className="text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
