import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ImageCropModalProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
}

const ImageCropModal = ({ open, imageUrl, onClose, onCropComplete }: ImageCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (newCrop: any) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const image = new Image();
      image.src = imageUrl;
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error creating cropped image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    const croppedImage = await createCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Crop Profile Picture
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-[350px] bg-accent/10 rounded-2xl overflow-hidden shadow-inner border-2 border-border">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>
        <div className="px-2 py-3 space-y-3">
          <label className="text-sm font-semibold text-foreground block">Zoom Level</label>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(values) => setZoom(values[0])}
            className="py-2"
          />
        </div>
        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-semibold transition-all hover:scale-105"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl font-semibold shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
