import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, AlertTriangle, Upload, X } from 'lucide-react';
import { NumericInput } from '@/components/NumericInput';

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    storeName: '',
    sellerName: '',
    orderId: '',
    description: '',
    amount: '',
    evidenceUrls: [] as string[],
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('report-evidence')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        evidenceUrls: [...prev.evidenceUrls, ...uploadedUrls]
      }));

      toast.success(`${uploadedUrls.length} file(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidenceUrls: prev.evidenceUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user?.id,
          store_name: formData.storeName || null,
          seller_name: formData.sellerName || null,
          order_id: formData.orderId || null,
          description: formData.description,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          evidence_urls: formData.evidenceUrls,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Report submitted successfully. Our team will review it shortly.');
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Report an Issue</h1>
            <p className="text-sm text-muted-foreground">Help us maintain a safe marketplace</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Warning Banner */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Fraud & Security Reports</p>
                <p className="text-muted-foreground">
                  Only submit reports for serious issues like fraud, scams, or suspicious activity. 
                  False reports may result in account restrictions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>
              Provide as much information as possible to help us investigate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name (Optional)</Label>
                <Input
                  id="storeName"
                  placeholder="Enter the store name if applicable"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              {/* Seller Name */}
              <div className="space-y-2">
                <Label htmlFor="sellerName">Seller Name (Optional)</Label>
                <Input
                  id="sellerName"
                  placeholder="Enter the seller's name if known"
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              {/* Order ID */}
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID (Optional)</Label>
                <Input
                  id="orderId"
                  placeholder="Enter order ID if this relates to a specific order"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              {/* Amount Involved */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Involved (Leones) (Optional)</Label>
                <NumericInput
                  id="amount"
                  placeholder="Enter the amount if money is involved"
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  className="rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Describe the Issue *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of what happened, including dates, actions taken, and any other relevant information..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl min-h-[150px]"
                  required
                />
              </div>

              {/* Evidence Upload */}
              <div className="space-y-2">
                <Label htmlFor="evidence">Evidence (Screenshots, Images)</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('evidence')?.click()}
                      disabled={uploadingImages}
                      className="rounded-xl"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImages ? 'Uploading...' : 'Upload Files'}
                    </Button>
                    <input
                      id="evidence"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload screenshots or images as evidence
                    </p>
                  </div>

                  {/* Preview uploaded images */}
                  {formData.evidenceUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.evidenceUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {loading ? 'Submitting Report...' : 'Submit Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Our team will review your report within 24-48 hours</li>
              <li>• You'll receive a notification once the investigation begins</li>
              <li>• We may contact you for additional information</li>
              <li>• Appropriate action will be taken if fraud is confirmed</li>
              <li>• You can track your report status in your notifications</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportIssue;
