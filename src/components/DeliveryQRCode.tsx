import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, RefreshCw, Clock, Shield, AlertCircle, Hash, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryQRCodeProps {
  orderId: string;
  buyerId: string;
  orderStatus: string;
  escrowStatus: string;
}

interface QRData {
  id: string;
  token: string;
  expires_at: string;
}

interface CodeData {
  id: string;
  code: string;
  expires_at: string;
}

type ViewMode = 'qr' | 'code';

const DeliveryQRCode = ({ orderId, buyerId, orderStatus, escrowStatus }: DeliveryQRCodeProps) => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [codeData, setCodeData] = useState<CodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('qr');

  const canShowQR = ['shipped', 'delivered'].includes(orderStatus) && escrowStatus === 'holding';

  const loadStatus = useCallback(async () => {
    if (!canShowQR) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('delivery-qr', {
        body: { action: 'status', order_id: orderId }
      });

      if (error) throw error;

      if (data.has_active_qr && data.qr_data) {
        setQrData(data.qr_data);
        setCodeData(null);
        setViewMode('qr');
      } else if (data.has_active_code && data.code_data) {
        setCodeData({ ...data.code_data, code: '' }); // Code not returned from status for security
        setQrData(null);
        setViewMode('code');
      } else {
        setQrData(null);
        setCodeData(null);
      }
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId, canShowQR]);

  const generateQR = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-qr', {
        body: { 
          action: 'generate', 
          order_id: orderId,
          buyer_id: buyerId
        }
      });

      if (error) throw error;

      if (data.success && data.qr_data) {
        setQrData(data.qr_data);
        setCodeData(null);
        setViewMode('qr');
        toast.success('QR Code generated! Valid for 30 minutes.');
      }
    } catch (error: any) {
      console.error('Error generating QR:', error);
      toast.error(error.message || 'Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-qr', {
        body: { 
          action: 'generate_code', 
          order_id: orderId,
          buyer_id: buyerId
        }
      });

      if (error) throw error;

      if (data.success && data.code_data) {
        setCodeData(data.code_data);
        setQrData(null);
        setViewMode('code');
        toast.success('Delivery code generated! Valid for 30 minutes.');
      }
    } catch (error: any) {
      console.error('Error generating code:', error);
      toast.error(error.message || 'Failed to generate delivery code');
    } finally {
      setGenerating(false);
    }
  };

  const switchToQR = () => {
    generateQR();
  };

  const switchToCode = () => {
    generateCode();
  };

  // Update countdown timer
  useEffect(() => {
    const expiresAt = qrData?.expires_at || codeData?.expires_at;
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setQrData(null);
        setCodeData(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrData?.expires_at, codeData?.expires_at]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Format code for display (XXX XXXX)
  const formatCode = (code: string) => {
    if (!code || code.length !== 7) return code;
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  };

  // Order already completed
  if (orderStatus === 'completed' || escrowStatus === 'released') {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-4 text-center">
          <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="font-semibold text-green-800 dark:text-green-400">Order Completed</p>
          <p className="text-sm text-green-600 dark:text-green-500">Payment has been released to seller</p>
        </CardContent>
      </Card>
    );
  }

  // Order not ready for QR
  if (!canShowQR) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="font-semibold">QR Code Not Available</p>
          <p className="text-sm text-muted-foreground">
            QR code will be available once your order is shipped
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {viewMode === 'qr' ? (
              <QrCode className="h-5 w-5 text-primary" />
            ) : (
              <Hash className="h-5 w-5 text-primary" />
            )}
            <h3 className="font-semibold">
              {viewMode === 'qr' ? 'Delivery Verification QR' : 'Delivery Code'}
            </h3>
          </div>

          {/* QR Code View */}
          {viewMode === 'qr' && qrData && (
            <>
              <div className="bg-white p-4 rounded-xl inline-block shadow-md mb-4">
                <QRCodeSVG
                  value={JSON.stringify({
                    type: 'market360_delivery',
                    token: qrData.token,
                    order_id: orderId
                  })}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge variant={timeLeft === 'Expired' ? 'destructive' : 'secondary'}>
                  {timeLeft === 'Expired' ? 'Expired' : `Expires in ${timeLeft}`}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Show this QR code to the seller when they deliver your order.
              </p>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateQR}
                  disabled={generating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  Regenerate QR
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={switchToCode}
                  disabled={generating}
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Use Code Instead
                </Button>
              </div>
            </>
          )}

          {/* Delivery Code View */}
          {viewMode === 'code' && codeData && codeData.code && (
            <>
              <div className="bg-white dark:bg-muted p-6 rounded-xl shadow-md mb-4">
                <p className="text-4xl font-mono font-bold tracking-wider text-foreground">
                  {formatCode(codeData.code)}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge variant={timeLeft === 'Expired' ? 'destructive' : 'secondary'}>
                  {timeLeft === 'Expired' ? 'Expired' : `Expires in ${timeLeft}`}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Share this code with the seller to confirm delivery.
              </p>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateCode}
                  disabled={generating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  Regenerate Code
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={switchToQR}
                  disabled={generating}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Use QR Code Instead
                </Button>
              </div>
            </>
          )}

          {/* No QR or Code - Initial State */}
          {!qrData && !codeData && (
            <>
              <div className="bg-muted/50 p-8 rounded-xl mb-4">
                <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Generate a QR code or delivery code for the seller to confirm delivery.
              </p>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={generateQR}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>

                <Button 
                  variant="outline"
                  onClick={generateCode}
                  disabled={generating}
                  className="w-full"
                >
                  <Hash className="h-4 w-4 mr-2" />
                  Use Code Instead
                </Button>
              </div>
            </>
          )}

          {/* Security Warning */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
              <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Secure:</strong> Only share the {viewMode === 'qr' ? 'QR code' : 'code'} after you've received and verified your order. 
                Payment will be released immediately upon verification.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryQRCode;
