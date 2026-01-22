import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Download, Shield, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface RecoveryCodeImageProps {
  codes: string[];
  onDownload?: () => void;
  showDownloadButton?: boolean;
  userName?: string;
}

export const RecoveryCodeImage = ({ 
  codes, 
  onDownload, 
  showDownloadButton = true,
  userName = ''
}: RecoveryCodeImageProps) => {
  const imageRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!imageRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(imageRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `market360-recovery-codes-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      onDownload?.();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* The image container that will be captured */}
      <div 
        ref={imageRef}
        className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0FA86C 0%, #0B8A6D 50%, #0077CC 100%)',
          padding: '2px',
        }}
      >
        <div 
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'linear-gradient(180deg, #0F1A15 0%, #0A1410 100%)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-center gap-2 pb-2">
            <Shield className="h-6 w-6 text-primary" />
            <span 
              className="text-xl font-bold"
              style={{ 
                background: 'linear-gradient(90deg, #0FA86C, #0077CC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Market360
            </span>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-white">
              Account Recovery Codes
            </h2>
            <p className="text-xs text-gray-400">
              Keep these codes safe and secure
            </p>
          </div>

          {/* User info if available */}
          {userName && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Account: {userName}</p>
            </div>
          )}

          {/* Recovery codes display */}
          <div className="space-y-3 py-4">
            {codes.map((code, index) => (
              <div 
                key={index}
                className="text-center py-3 px-4 rounded-xl"
                style={{
                  background: 'rgba(15, 168, 108, 0.1)',
                  border: '1px solid rgba(15, 168, 108, 0.3)',
                }}
              >
                <p className="text-xs text-gray-400 mb-1">Code {index + 1}</p>
                <p 
                  className="text-2xl font-mono font-bold tracking-widest text-white"
                  style={{ letterSpacing: '0.2em' }}
                >
                  {code}
                </p>
              </div>
            ))}
          </div>

          {/* Warning text */}
          <div 
            className="p-3 rounded-lg text-center"
            style={{
              background: 'rgba(255, 153, 0, 0.1)',
              border: '1px solid rgba(255, 153, 0, 0.3)',
            }}
          >
            <p className="text-xs text-yellow-500 font-medium">
              ⚠️ Keep this code safe
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You may need it to reset your password
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              market360-sl-connect.lovable.app
            </p>
          </div>
        </div>
      </div>

      {/* Download button */}
      {showDownloadButton && (
        <Button 
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white font-medium py-3 rounded-xl"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Image...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Download Recovery Codes
            </>
          )}
        </Button>
      )}
    </div>
  );
};
