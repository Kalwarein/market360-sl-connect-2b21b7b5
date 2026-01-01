import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Gift, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerkSpinWheelProps {
  open: boolean;
  onClose: () => void;
  onComplete: (durationDays: number) => void;
  perkTitle: string;
  minDays: number;
  maxDays: number;
  perkColor: string;
}

export const PerkSpinWheel = ({
  open,
  onClose,
  onComplete,
  perkTitle,
  minDays,
  maxDays,
  perkColor,
}: PerkSpinWheelProps) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Generate segments for the wheel
  const segments = 8;
  const range = maxDays - minDays;
  const segmentValues = Array.from({ length: segments }, (_, i) => {
    // Distribute values across the range, ensuring minimum 20% of max is guaranteed
    const minGuaranteed = Math.ceil(maxDays * 0.2);
    const effectiveMin = Math.max(minDays, minGuaranteed);
    const step = (maxDays - effectiveMin) / (segments - 1);
    return Math.round(effectiveMin + (step * i));
  });

  const segmentColors = [
    'from-amber-400 to-amber-500',
    'from-orange-400 to-orange-500',
    'from-rose-400 to-rose-500',
    'from-pink-400 to-pink-500',
    'from-purple-400 to-purple-500',
    'from-violet-400 to-violet-500',
    'from-indigo-400 to-indigo-500',
    'from-blue-400 to-blue-500',
  ];

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);

    // Calculate random result (guaranteed minimum 20% of max)
    const minGuaranteed = Math.ceil(maxDays * 0.2);
    const effectiveMin = Math.max(minDays, minGuaranteed);
    const finalResult = Math.floor(Math.random() * (maxDays - effectiveMin + 1)) + effectiveMin;

    // Find the segment closest to the result
    const closestSegmentIndex = segmentValues.reduce((closest, value, index) => {
      return Math.abs(value - finalResult) < Math.abs(segmentValues[closest] - finalResult) ? index : closest;
    }, 0);

    // Calculate rotation (multiple full spins + landing on segment)
    const segmentAngle = 360 / segments;
    const targetAngle = closestSegmentIndex * segmentAngle;
    const spins = 5 + Math.random() * 3; // 5-8 full spins
    const totalRotation = spins * 360 + (360 - targetAngle) + segmentAngle / 2;

    setRotation(prev => prev + totalRotation);

    // Set result after animation
    setTimeout(() => {
      setSpinning(false);
      setResult(finalResult);
    }, 4000);
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result);
    }
  };

  useEffect(() => {
    if (!open) {
      setResult(null);
      setSpinning(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !spinning && onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background to-muted border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl">
            <Gift className="h-6 w-6 text-primary" />
            Spin for {perkTitle}!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Wheel Container */}
          <div className="relative w-72 h-72">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-primary/30 relative"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              }}
            >
              {segmentValues.map((value, index) => {
                const angle = (360 / segments) * index;
                return (
                  <div
                    key={index}
                    className={cn(
                      "absolute w-1/2 h-1/2 origin-bottom-right",
                      `bg-gradient-to-r ${segmentColors[index % segmentColors.length]}`
                    )}
                    style={{
                      transform: `rotate(${angle}deg) skewY(${90 - 360 / segments}deg)`,
                      transformOrigin: 'bottom right',
                      top: 0,
                      left: 0,
                    }}
                  >
                    <span
                      className="absolute text-white font-bold text-sm drop-shadow-lg"
                      style={{
                        transform: `skewY(${-90 + 360 / segments}deg) rotate(${45}deg)`,
                        top: '35%',
                        left: '15%',
                      }}
                    >
                      {value}d
                    </span>
                  </div>
                );
              })}
              
              {/* Center circle */}
              <div className="absolute inset-1/4 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-inner">
                <Crown className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Spin to reveal your duration! 
            </p>
            <p className="text-xs text-primary font-medium">
              ✨ Guaranteed minimum: {Math.ceil(maxDays * 0.2)} days
            </p>
          </div>

          {/* Result Display */}
          {result && (
            <div className="animate-in zoom-in-50 duration-300 text-center space-y-3 p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border-2 border-primary/30 w-full">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="h-8 w-8 text-primary animate-bounce" />
                <span className="text-4xl font-black text-primary">{result}</span>
                <span className="text-xl font-bold text-muted-foreground">Days!</span>
                <PartyPopper className="h-8 w-8 text-primary animate-bounce" style={{ transform: 'scaleX(-1)' }} />
              </div>
              <p className="text-sm text-muted-foreground">
                Congratulations! Your {perkTitle} will be active for {result} days!
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            {!result ? (
              <Button
                className={cn(
                  "flex-1 h-14 text-lg font-bold",
                  `bg-gradient-to-r ${perkColor} text-white`,
                  "hover:opacity-90 transition-all duration-300",
                  spinning && "opacity-50 cursor-not-allowed"
                )}
                onClick={spin}
                disabled={spinning}
              >
                {spinning ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5 mr-2" />
                    Spin the Wheel!
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                onClick={handleComplete}
              >
                <PartyPopper className="h-5 w-5 mr-2" />
                Activate Perk!
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
