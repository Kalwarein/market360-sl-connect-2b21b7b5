import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Shield,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryQRScannerProps {
  sellerId: string;
  onSuccess?: (data: { amount_released: number; order_id: string; product_title: string }) => void;
}

interface ScanResult {
  success: boolean;
  amount_released?: number;
  fee_deducted?: number;
  order_id?: string;
  product_title?: string;
  error?: string;
  code?: string;
}

const DeliveryQRScanner = ({ sellerId, onSuccess }: DeliveryQRScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        startScanning();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setCameraError(
        error.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera access to scan QR codes.'
          : 'Failed to access camera. Please check your device settings.'
      );
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setScanning(false);
  };

  const startScanning = () => {
    // Use BarcodeDetector API if available, otherwise fallback
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || processing) return;
        
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;
            handleQRDetected(qrData);
          }
        } catch (err) {
          // Silent fail, keep scanning
        }
      }, 200);
    } else {
      // Fallback: Use canvas-based detection (requires jsQR library)
      // For now, show manual input option
      setCameraError('QR scanning not fully supported on this browser. Please use Chrome or Safari.');
    }
  };

  const handleQRDetected = async (rawData: string) => {
    if (processing) return;
    
    setProcessing(true);
    stopCamera();

    try {
      // Parse QR data
      let qrPayload;
      try {
        qrPayload = JSON.parse(rawData);
      } catch {
        throw new Error('Invalid QR code format');
      }

      if (qrPayload.type !== 'market360_delivery' || !qrPayload.token) {
        throw new Error('This is not a valid Market360 delivery QR code');
      }

      console.log('[QR Scanner] Validating QR token...');

      // Validate with backend
      const { data, error } = await supabase.functions.invoke('delivery-qr', {
        body: {
          action: 'validate',
          token: qrPayload.token,
          seller_id: sellerId
        }
      });

      if (error) throw error;

      if (data.success) {
        setScanResult({
          success: true,
          amount_released: data.amount_released,
          fee_deducted: data.fee_deducted,
          order_id: data.order_id,
          product_title: data.product_title
        });

        toast.success('Payment released to your wallet!');
        
        if (onSuccess) {
          onSuccess({
            amount_released: data.amount_released,
            order_id: data.order_id,
            product_title: data.product_title
          });
        }
      } else {
        throw new Error(data.error || 'Validation failed');
      }
    } catch (error: any) {
      console.error('[QR Scanner] Validation error:', error);
      
      const errorMessage = error.message || 'Failed to validate QR code';
      setScanResult({
        success: false,
        error: errorMessage,
        code: error.code
      });
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setScanResult(null);
    setCameraError(null);
    setIsOpen(false);
  };

  const handleRetry = () => {
    setScanResult(null);
    setCameraError(null);
    startCamera();
  };

  useEffect(() => {
    if (isOpen && !scanResult) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const getErrorIcon = (code?: string) => {
    switch (code) {
      case 'EXPIRED':
        return <AlertTriangle className="h-12 w-12 text-amber-500" />;
      case 'ALREADY_SCANNED':
        return <CheckCircle2 className="h-12 w-12 text-blue-500" />;
      case 'WRONG_SELLER':
        return <Shield className="h-12 w-12 text-red-500" />;
      default:
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full"
        size="lg"
      >
        <Camera className="h-5 w-5 mr-2" />
        Scan Buyer QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan Delivery QR Code
            </DialogTitle>
            <DialogDescription>
              Point your camera at the buyer's QR code to confirm delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Success State */}
            {scanResult?.success && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
                    Delivery Confirmed!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-500 mb-4">
                    {scanResult.product_title}
                  </p>
                  
                  <div className="bg-white dark:bg-green-900/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400">Amount Released</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                      Le {scanResult.amount_released?.toLocaleString()}
                    </p>
                    {scanResult.fee_deducted && (
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Platform fee: Le {scanResult.fee_deducted.toLocaleString()} (2%)
                      </p>
                    )}
                  </div>

                  <Button onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {scanResult && !scanResult.success && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-6 text-center">
                  {getErrorIcon(scanResult.code)}
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mt-4 mb-2">
                    Scan Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-500 mb-4">
                    {scanResult.error}
                  </p>
                  
                  {scanResult.code === 'EXPIRED' && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                      Ask the buyer to regenerate their QR code
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleRetry} className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Camera View */}
            {!scanResult && (
              <>
                {cameraError ? (
                  <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-6 text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-amber-600" />
                      <p className="text-sm text-amber-800 dark:text-amber-400 mb-4">
                        {cameraError}
                      </p>
                      <Button onClick={handleRetry} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full aspect-square object-cover rounded-lg bg-black"
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <Badge variant="secondary" className="bg-black/50 text-white">
                        {processing ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : scanning ? (
                          <>
                            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            Scanning...
                          </>
                        ) : (
                          'Starting camera...'
                        )}
                      </Badge>
                    </div>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Position the QR code within the frame to scan
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeliveryQRScanner;
