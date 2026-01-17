import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldX,
  Clock, CheckCircle, XCircle, Search, RefreshCw, Eye,
  Lock, Flag, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import FinanceLayout from './FinanceLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface FraudAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  description: string;
  metadata: any;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const FinanceFraudRisk = () => {
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolve' | 'dismiss' | 'escalate' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const { data: alertsData } = await supabase
        .from('fraud_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!alertsData) return;

      // Get user info
      const userIds = [...new Set(alertsData.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedAlerts = alertsData.map(alert => ({
        ...alert,
        user_name: profileMap.get(alert.user_id)?.name || 'Unknown',
        user_email: profileMap.get(alert.user_id)?.email || ''
      }));

      setAlerts(enrichedAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRunDetection = async () => {
    setRefreshing(true);
    try {
      await supabase.rpc('detect_fraud_patterns');
      toast({ title: 'Fraud detection completed', description: 'New alerts may have been generated.' });
      await loadAlerts();
    } catch (error) {
      console.error('Error running detection:', error);
      toast({ title: 'Error', description: 'Failed to run fraud detection', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert || !resolveAction || !adminUser) return;

    setActionLoading(true);
    try {
      const newStatus = resolveAction === 'escalate' ? 'investigating' : resolveAction === 'dismiss' ? 'dismissed' : 'resolved';

      const { error } = await supabase
        .from('fraud_alerts')
        .update({
          status: newStatus,
          resolved_by: adminUser.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null
        })
        .eq('id', selectedAlert.id);

      if (error) throw error;

      // If escalating, freeze wallet
      if (resolveAction === 'escalate') {
        await supabase.from('wallet_freezes').insert({
          user_id: selectedAlert.user_id,
          frozen_by: adminUser.id,
          reason: `Fraud alert: ${selectedAlert.description}`
        });
      }

      // Log activity
      await supabase.from('finance_activity_log').insert({
        admin_id: adminUser.id,
        action: `fraud_alert_${resolveAction}`,
        target_user_id: selectedAlert.user_id,
        target_type: 'fraud_alert',
        target_id: selectedAlert.id,
        details: { notes: resolutionNotes }
      });

      toast({ title: 'Alert Updated', description: `Alert has been ${newStatus}.` });
      setSelectedAlert(null);
      setResolveAction(null);
      setResolutionNotes('');
      loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({ title: 'Error', description: 'Failed to update alert', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="font-bold">CRITICAL</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">HIGH</Badge>;
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">MEDIUM</Badge>;
      case 'low':
        return <Badge variant="secondary">LOW</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Open
          </Badge>
        );
      case 'investigating':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Search className="h-3 w-3 mr-1" />
            Investigating
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
      case 'dismissed':
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Dismissed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      rapid_deposits: 'Rapid Deposits',
      rapid_withdrawals: 'Rapid Withdrawals',
      deposit_withdrawal_abuse: 'Deposit-Withdrawal Abuse',
      duplicate_phone: 'Duplicate Phone',
      failed_attempts: 'Multiple Failed Attempts'
    };
    return labels[type] || type;
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const openAlerts = alerts.filter(a => a.status === 'open');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'open');

  if (loading) {
    return (
      <FinanceLayout title="Fraud & Risk" subtitle="Fraud detection and risk monitoring">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </FinanceLayout>
    );
  }

  return (
    <FinanceLayout title="Fraud & Risk" subtitle="Advanced fraud detection and risk monitoring">
      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="mb-6 border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <ShieldX className="h-8 w-8 text-destructive" />
            <div className="flex-1">
              <p className="font-bold text-destructive">Critical Alerts Detected</p>
              <p className="text-sm text-muted-foreground">
                {criticalAlerts.length} critical security alert{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Open Alerts</p>
              <p className="text-2xl font-bold text-destructive">{openAlerts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Shield className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-orange-500">{criticalAlerts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Search className="h-8 w-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Investigating</p>
              <p className="text-2xl font-bold text-warning">
                {alerts.filter(a => a.status === 'investigating').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-success">
                {alerts.filter(a => a.status === 'resolved').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleRunDetection} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Run Fraud Detection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Fraud Alerts ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Alert Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No fraud alerts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className={alert.severity === 'critical' ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alert.user_name}</p>
                        <p className="text-xs text-muted-foreground">{alert.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getAlertTypeLabel(alert.alert_type)}</span>
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>{getStatusBadge(alert.status)}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate" title={alert.description}>
                        {alert.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(alert.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/finance/users/${alert.user_id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {alert.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setResolveAction('resolve');
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Alert Dialog */}
      <AlertDialog open={!!resolveAction} onOpenChange={() => setResolveAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Handle Fraud Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how to handle this alert for {selectedAlert?.user_name}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={resolveAction === 'resolve' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setResolveAction('resolve')}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
              <Button
                variant={resolveAction === 'dismiss' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setResolveAction('dismiss')}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
              <Button
                variant={resolveAction === 'escalate' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setResolveAction('escalate')}
                className="flex-1"
              >
                <Lock className="h-4 w-4 mr-2" />
                Freeze Wallet
              </Button>
            </div>

            <Textarea
              placeholder="Add notes (optional)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAlert(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolveAlert} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FinanceLayout>
  );
};

export default FinanceFraudRisk;
