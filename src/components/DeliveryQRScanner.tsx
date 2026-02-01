import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  AlertTriangle,
  Hash,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryQRScannerProps {
  sellerId: string;
  orderId?: string; // Optional - if provided, enables code entry
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

type VerificationMode = 'choice' | 'qr' | 'code';

const DeliveryQRScanner = ({ sellerId, orderId, onSuccess }: DeliveryQRScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<VerificationMode>('choice');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
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
    // Use BarcodeDetector API if available
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
      setCameraError('QR scanning not fully supported on this browser. Please use Chrome or Safari, or enter the code manually.');
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

  const handleCodeSubmit = async () => {
    if (!codeInput || codeInput.length !== 7 || !orderId) {
      toast.error('Please enter a valid 7-digit code');
      return;
    }

    setProcessing(true);

    try {
      console.log('[Code Entry] Validating delivery code...');

      const { data, error } = await supabase.functions.invoke('delivery-qr', {
        body: {
          action: 'validate_code',
          code: codeInput,
          order_id: orderId,
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
      console.error('[Code Entry] Validation error:', error);
      
      const errorMessage = error.message || 'Failed to validate code';
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
    setCodeInput('');
    setMode('choice');
    setIsOpen(false);
  };

  const handleRetry = () => {
    setScanResult(null);
    setCameraError(null);
    setCodeInput('');
    if (mode === 'qr') {
      startCamera();
    }
  };

  const selectQRMode = () => {
    setMode('qr');
    startCamera();
  };

  const selectCodeMode = () => {
    setMode('code');
    setCodeInput('');
  };

  const goBackToChoice = () => {
    stopCamera();
    setMode('choice');
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getErrorIcon = (code?: string) => {
    switch (code) {
      case 'EXPIRED':
        return <AlertTriangle className="h-12 w-12 text-amber-500" />;
      case 'ALREADY_SCANNED':
        return <CheckCircle2 className="h-12 w-12 text-blue-500" />;
      case 'WRONG_SELLER':
        return <Shield className="h-12 w-12 text-red-500" />;
      case 'INVALID_CODE':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  // Handle code input - only allow digits
  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 7);
    setCodeInput(cleaned);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full"
        size="lg"
      >
        <Camera className="h-5 w-5 mr-2" />
        Confirm Delivery
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === 'choice' && <Shield className="h-5 w-5" />}
              {mode === 'qr' && <QrCode className="h-5 w-5" />}
              {mode === 'code' && <Hash className="h-5 w-5" />}
              {mode === 'choice' ? 'Confirm Delivery' : mode === 'qr' ? 'Scan QR Code' : 'Enter Delivery Code'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'choice' && 'Choose how to verify delivery'}
              {mode === 'qr' && 'Point your camera at the buyer\'s QR code'}
              {mode === 'code' && 'Enter the 7-digit code from the buyer'}
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
                    Verification Failed
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-500 mb-4">
                    {scanResult.error}
                  </p>
                  
                  {scanResult.code === 'EXPIRED' && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                      Ask the buyer to regenerate their QR code or delivery code
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

            {/* Choice Mode - Select QR or Code */}
            {!scanResult && mode === 'choice' && (
              <div className="space-y-3">
                <Button 
                  onClick={selectQRMode}
                  className="w-full h-auto py-4"
                  variant="outline"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <QrCode className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Scan QR Code</p>
                      <p className="text-xs text-muted-foreground">Use camera to scan buyer's QR</p>
                    </div>
                  </div>
                </Button>

                {orderId && (
                  <Button 
                    onClick={selectCodeMode}
                    className="w-full h-auto py-4"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary/50 p-3 rounded-full">
                        <Hash className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Enter Code Instead</p>
                        <p className="text-xs text-muted-foreground">Type the 7-digit delivery code</p>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            )}

            {/* Code Entry Mode */}
            {!scanResult && mode === 'code' && (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goBackToChoice}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter the 7-digit code shown on buyer's screen
                  </p>

                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000000"
                    value={codeInput}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="text-center text-2xl font-mono tracking-widest h-14"
                    maxLength={7}
                    autoFocus
                  />

                  <p className="text-xs text-muted-foreground mt-2">
                    {codeInput.length}/7 digits
                  </p>
                </div>

                <Button 
                  onClick={handleCodeSubmit}
                  disabled={codeInput.length !== 7 || processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify Code
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* QR Camera View */}
            {!scanResult && mode === 'qr' && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goBackToChoice}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {cameraError ? (
                  <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="p-6 text-center">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-amber-600" />
                      <p className="text-sm text-amber-800 dark:text-amber-400 mb-4">
                        {cameraError}
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={handleRetry} variant="outline" className="flex-1">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Camera
                        </Button>
                        {orderId && (
                          <Button onClick={selectCodeMode} variant="default" className="flex-1">
                            <Hash className="h-4 w-4 mr-2" />
                            Enter Code
                          </Button>
                        )}
                      </div>
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

                {/* Option to switch to code entry */}
                {orderId && !cameraError && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={selectCodeMode}
                    className="w-full"
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    Enter Code Instead
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeliveryQRScanner;
