import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, XCircle, User, Building2, MapPin, Store, CreditCard, Clock } from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';
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

interface Application {
  id: string;
  user_id: string;
  business_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  business_category: string;
  business_description: string | null;
  store_name: string | null;
  store_description: string | null;
  store_city: string | null;
  store_region: string | null;
  store_country: string | null;
  store_logo_url: string | null;
  store_banner_url: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
}

export default function AdminSellerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Ensure store_name exists, fallback to business_name
      const appData: Application = {
        ...data,
        store_name: data.store_name || data.business_name,
        store_description: data.store_description || null,
        store_city: data.store_city || null,
        store_region: data.store_region || null,
        store_country: data.store_country || 'Sierra Leone',
        business_description: data.business_description || null,
        store_logo_url: data.store_logo_url || null,
        store_banner_url: data.store_banner_url || null,
        bank_name: data.bank_name || null,
        bank_account_number: data.bank_account_number || null,
        bank_account_name: data.bank_account_name || null,
        reviewed_at: data.reviewed_at || null,
        reviewer_id: data.reviewer_id || null,
      };
      
      setApplication(appData);
    } catch (error) {
      console.error('Error loading application:', error);
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!application) return;
    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('approve-seller', {
        body: { applicationId: application.id }
      });

      if (error) throw error;

      toast.success('Application approved successfully!');
      navigate('/admin/seller-applications');
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error(error.message || 'Failed to approve application');
    } finally {
      setProcessing(false);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke('reject-seller', {
        body: { 
          applicationId: application.id,
          reason: 'Application does not meet requirements'
        }
      });

      if (error) throw error;

      toast.success('Application rejected');
      navigate('/admin/seller-applications');
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast.error(error.message || 'Failed to reject application');
    } finally {
      setProcessing(false);
      setShowRejectDialog(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!application) return <div className="p-4">Application not found</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20 mb-4"
          onClick={() => navigate('/admin/seller-applications')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{application.business_name}</h1>
            <p className="text-sm opacity-90">Application Details</p>
          </div>
          <Badge variant={application.status === 'pending' ? 'secondary' : application.status === 'approved' ? 'default' : 'destructive'}>
            {application.status}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Store Images */}
        {(application.store_logo_url || application.store_banner_url) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5" />
                Store Visuals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.store_logo_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Logo</p>
                  <img
                    src={application.store_logo_url}
                    alt="Store Logo"
                    className="w-24 h-24 rounded-lg object-cover border"
                  />
                </div>
              )}
              {application.store_banner_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Banner</p>
                  <img
                    src={application.store_banner_url}
                    alt="Store Banner"
                    className="w-full h-32 rounded-lg object-cover border"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{application.contact_person}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{application.contact_email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{application.contact_phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Business Name</p>
              <p className="font-medium">{application.business_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{application.business_category}</p>
            </div>
            {application.business_description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{application.business_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Region</p>
              <p className="font-medium">{application.store_region}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">District</p>
              <p className="font-medium">{application.store_city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{application.store_country}</p>
            </div>
          </CardContent>
        </Card>

        {/* Store Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5" />
              Store Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Store Name</p>
              <p className="font-medium">{application.store_name}</p>
            </div>
            {application.store_description && (
              <div>
                <p className="text-sm text-muted-foreground">Store Description</p>
                <p className="font-medium">{application.store_description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Banking Information */}
        {(application.bank_name || application.bank_account_number) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Banking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {application.bank_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{application.bank_name}</p>
                </div>
              )}
              {application.bank_account_name && (
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">{application.bank_account_name}</p>
                </div>
              )}
              {application.bank_account_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{application.bank_account_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">{new Date(application.created_at).toLocaleString()}</p>
            </div>
            {application.reviewed_at && (
              <div>
                <p className="text-sm text-muted-foreground">Reviewed</p>
                <p className="font-medium">{new Date(application.reviewed_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {application.status === 'pending' && (
          <div className="flex gap-3">
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="flex-1"
              disabled={processing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              variant="destructive"
              className="flex-1"
              disabled={processing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a store for {application.business_name}, assign seller role, and notify the applicant via email and in-app notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={processing}>
              {processing ? 'Processing...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the seller application and notify the applicant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={processing}>
              {processing ? 'Processing...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
