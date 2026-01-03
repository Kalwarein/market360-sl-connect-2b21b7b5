import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Copy, Share2, Download, CheckCircle, XCircle, Clock, Loader2, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  reference: string | null;
  monime_id: string | null;
  monime_ussd_code: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
  metadata: unknown;
}

const TransactionDetail = () => {
  const { transactionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && transactionId) {
      loadTransaction();
    }
  }, [user, transactionId]);

  const loadTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Transaction fetch error:', error);
        toast.error('Transaction not found');
        navigate('/wallet');
        return;
      }

      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
      toast.error('Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-success" />;
      case 'pending':
      case 'processing':
        return <Loader2 className="h-12 w-12 text-warning animate-spin" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-destructive" />;
      default:
        return <Clock className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success/10 text-success border-success/20 text-base px-4 py-1">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-base px-4 py-1">Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-base px-4 py-1">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-base px-4 py-1">Failed</Badge>;
      case 'reversed':
        return <Badge variant="outline" className="text-base px-4 py-1">Reversed</Badge>;
      default:
        return <Badge variant="secondary" className="text-base px-4 py-1">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'earning':
      case 'refund':
        return <ArrowDownCircle className="h-6 w-6 text-success" />;
      case 'withdrawal':
      case 'payment':
        return <ArrowUpCircle className="h-6 w-6 text-primary" />;
      default:
        return <Wallet className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const isCredit = (type: string) => ['deposit', 'earning', 'refund'].includes(type);

  const exportReceipt = async () => {
    if (!receiptRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.download = `receipt-${transaction?.reference || transaction?.id}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export receipt');
    } finally {
      setExporting(false);
    }
  };

  const shareReceipt = async () => {
    if (!receiptRef.current) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate receipt image');
          setExporting(false);
          return;
        }
        
        const file = new File([blob], `receipt-${transaction?.reference || transaction?.id}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Transaction Receipt',
            text: `Transaction Receipt - ${transaction?.transaction_type.toUpperCase()} - SLE ${(transaction?.amount || 0) / 100}`,
            files: [file],
          });
          toast.success('Receipt shared successfully');
        } else {
          // Fallback: download the file
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `receipt-${transaction?.reference || transaction?.id}.png`;
          link.href = dataUrl;
          link.click();
          toast.success('Receipt downloaded (sharing not supported on this device)');
        }
        setExporting(false);
      });
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share receipt');
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Transaction not found</p>
      </div>
    );
  }

  const amountInSLE = transaction.amount / 100;
  const metadata = (typeof transaction.metadata === 'object' && transaction.metadata !== null) 
    ? transaction.metadata as Record<string, unknown> 
    : null;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-background border-b shadow-sm sticky top-0 z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/wallet')}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold">Transaction Details</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Receipt Card - This is what gets exported */}
        <div ref={receiptRef} className="bg-white p-6 rounded-2xl">
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center border-b pb-6">
              <div className="flex justify-center mb-4">
                {getStatusIcon(transaction.status)}
              </div>
              <CardTitle className="text-2xl">
                {isCredit(transaction.transaction_type) ? '+' : '-'}SLE {amountInSLE.toLocaleString()}
              </CardTitle>
              <p className="text-muted-foreground capitalize mt-1">
                {transaction.transaction_type}
              </p>
              <div className="mt-3">
                {getStatusBadge(transaction.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Transaction Type */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Type</span>
                <div className="flex items-center gap-2">
                  {getTransactionIcon(transaction.transaction_type)}
                  <span className="font-medium capitalize">{transaction.transaction_type}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Amount</span>
                <span className={`font-bold text-lg ${isCredit(transaction.transaction_type) ? 'text-success' : 'text-foreground'}`}>
                  SLE {amountInSLE.toLocaleString()}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(transaction.status)}
              </div>

              {/* Date */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</span>
              </div>

              {/* Time */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{format(new Date(transaction.created_at), 'HH:mm:ss')}</span>
              </div>

              {/* Transaction ID */}
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Transaction ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{transaction.id.substring(0, 8)}...</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(transaction.id, 'Transaction ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Reference */}
              {transaction.reference && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{transaction.reference}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(transaction.reference!, 'Reference')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Monime ID */}
              {transaction.monime_id && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Payment ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{transaction.monime_id.substring(0, 12)}...</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(transaction.monime_id!, 'Payment ID')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Provider */}
              {transaction.provider && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Provider</span>
                  <Badge variant="secondary" className="capitalize">{transaction.provider}</Badge>
                </div>
              )}

              {/* USSD Code (for pending deposits) */}
              {transaction.monime_ussd_code && transaction.status === 'pending' && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">USSD Code</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary font-bold">{transaction.monime_ussd_code}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(transaction.monime_ussd_code!, 'USSD Code')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Destination Phone (from metadata) */}
              {metadata?.destination_phone && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Recipient Phone</span>
                  <span className="font-mono">{metadata.destination_phone as string}</span>
                </div>
              )}

              {/* Destination Provider (from metadata) */}
              {metadata?.destination_provider && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Mobile Money</span>
                  <Badge variant="secondary">
                    {metadata.destination_provider === 'm17' ? '🟠 Orange Money' : '🔵 Africell Money'}
                  </Badge>
                </div>
              )}

              {/* Fee (from metadata) */}
              {metadata?.fee && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">SLE {((metadata.fee as number) / 100).toLocaleString()}</span>
                </div>
              )}

              {/* Last Updated */}
              {transaction.updated_at !== transaction.created_at && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{format(new Date(transaction.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-4 text-sm text-muted-foreground">
                <p>Market360 Wallet</p>
                <p className="text-xs mt-1">Powered by Monime</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={exportReceipt}
            disabled={exporting}
            className="h-14 rounded-2xl font-semibold"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Download className="mr-2 h-5 w-5" />
            )}
            Download
          </Button>
          <Button
            size="lg"
            onClick={shareReceipt}
            disabled={exporting}
            className="h-14 rounded-2xl font-semibold"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-5 w-5" />
            )}
            Share
          </Button>
        </div>

        {/* Back to Wallet */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate('/wallet')}
          className="w-full h-12 rounded-2xl"
        >
          Back to Wallet
        </Button>
      </div>
    </div>
  );
};

export default TransactionDetail;
