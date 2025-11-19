import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Building2, MapPin, FileCheck, Store } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { MultiStepForm } from '@/components/MultiStepForm';
import { LocationPicker } from '@/components/LocationPicker';
import ImageCropModal from '@/components/ImageCropModal';
import { CategorySelector } from '@/components/CategorySelector';

const applicationSchema = z.object({
  contactPerson: z.string().min(2, 'Full name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Valid phone number is required (10-15 digits)'),
  businessName: z.string().min(2, 'Business name is required'),
  businessCategory: z.string().min(1, 'Business category is required'),
  businessDescription: z.string().min(10, 'Please provide a brief description (min 10 characters)'),
  storeCountry: z.string().default('Sierra Leone'),
  storeRegion: z.string().min(1, 'Region is required'),
  storeCity: z.string().min(1, 'District is required'),
  storeName: z.string().min(2, 'Store name is required'),
  storeDescription: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export default function BecomeSellerMultiStep() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    contactPerson: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    businessName: '',
    businessCategory: '',
    businessDescription: '',
    storeCountry: 'Sierra Leone',
    storeRegion: '',
    storeCity: '',
    storeName: '',
    storeDescription: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [showLogoCrop, setShowLogoCrop] = useState(false);
  const [showBannerCrop, setShowBannerCrop] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const uploadImage = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${user!.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setShowLogoCrop(true);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setShowBannerCrop(true);
    }
  };

  const handleLogoCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], logoFile!.name, { type: 'image/png' });
    setLogoFile(croppedFile);
    setLogoPreview(URL.createObjectURL(croppedBlob));
    setShowLogoCrop(false);
  };

  const handleBannerCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], bannerFile!.name, { type: 'image/png' });
    setBannerFile(croppedFile);
    setBannerPreview(URL.createObjectURL(croppedBlob));
    setShowBannerCrop(false);
  };

  const handleSubmit = async () => {
    try {
      const validated = applicationSchema.parse(formData);

      let logoUrl = '';
      let bannerUrl = '';

      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'store-logos', 'logos');
      }

      if (bannerFile) {
        bannerUrl = await uploadImage(bannerFile, 'store-banners', 'banners');
      }

      const { error } = await supabase
        .from('seller_applications')
        .insert({
          user_id: user!.id,
          contact_person: validated.contactPerson,
          contact_email: validated.contactEmail,
          contact_phone: validated.contactPhone,
          business_name: validated.businessName,
          business_category: validated.businessCategory,
          business_description: validated.businessDescription,
          store_country: validated.storeCountry,
          store_region: validated.storeRegion,
          store_city: validated.storeCity,
          store_name: validated.storeName,
          store_logo_url: logoUrl,
          store_banner_url: bannerUrl,
          store_description: validated.storeDescription,
          bank_name: validated.bankName,
          bank_account_number: validated.bankAccountNumber,
          bank_account_name: validated.bankAccountName,
          status: 'pending',
        });

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'seller_application_submitted',
        actor_id: user!.id,
        description: `User ${validated.contactEmail} submitted seller application`,
        metadata: { business_name: validated.businessName },
      });

      toast.success('Application submitted successfully! We will review it soon.');
      navigate('/');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error submitting application:', error);
        toast.error('Failed to submit application. Please try again.');
      }
    }
  };

  const steps = [
    {
      title: 'Personal Information',
      description: 'Let us know who you are',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactPerson" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full Name *
            </Label>
            <Input
              id="contactPerson"
              placeholder="Enter your full name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Email Address *
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your.email@example.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Phone Number *
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+232 XX XXX XXXX"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">Format: +232XXXXXXXXX or 10-15 digits</p>
          </div>
        </div>
      ),
      validate: async () => {
        try {
          applicationSchema.pick({
            contactPerson: true,
            contactEmail: true,
            contactPhone: true,
          }).parse(formData);
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
          }
          return false;
        }
      },
    },
    {
      title: 'Business Information',
      description: 'Tell us about your business',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Business Name *
            </Label>
            <Input
              id="businessName"
              placeholder="Your registered business name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <CategorySelector
              value={formData.businessCategory}
              onChange={(value) => setFormData({ ...formData, businessCategory: value })}
              label="Business Category *"
              placeholder="Select or add category..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessDescription" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Business Description *
            </Label>
            <Textarea
              id="businessDescription"
              placeholder="Describe what your business does (min 10 characters)"
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              rows={4}
              required
            />
          </div>
        </div>
      ),
      validate: async () => {
        try {
          applicationSchema.pick({
            businessName: true,
            businessCategory: true,
            businessDescription: true,
          }).parse(formData);
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
          }
          return false;
        }
      },
    },
    {
      title: 'Location',
      description: 'Where is your business located?',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Business Location *
            </Label>
            <LocationPicker
              region={formData.storeRegion}
              district={formData.storeCity}
              onRegionChange={(region) => setFormData({ ...formData, storeRegion: region })}
              onDistrictChange={(district) => setFormData({ ...formData, storeCity: district })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Select the region and district where your business operates
            </p>
          </div>
        </div>
      ),
      validate: async () => {
        try {
          applicationSchema.pick({
            storeRegion: true,
            storeCity: true,
          }).parse(formData);
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
          }
          return false;
        }
      },
    },
    {
      title: 'Store Setup',
      description: 'Create your store presence',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName" className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Store Name *
            </Label>
            <Input
              id="storeName"
              placeholder="Your store display name"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription" className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Store Description (Optional)
            </Label>
            <Textarea
              id="storeDescription"
              placeholder="Brief description of your store"
              value={formData.storeDescription}
              onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Store Logo (Optional)
            </Label>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="cursor-pointer"
              />
              {logoPreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                  <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Store Banner (Optional)
            </Label>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="cursor-pointer"
              />
              {bannerPreview && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-border">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      validate: async () => {
        try {
          applicationSchema.pick({
            storeName: true,
          }).parse(formData);
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            toast.error(error.errors[0].message);
          }
          return false;
        }
      },
    },
    {
      title: 'Banking Information',
      description: 'Add your banking details for payments (Optional)',
      content: (
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Banking information is optional but recommended for faster payment processing.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="Name of your bank"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Account Number</Label>
            <Input
              id="bankAccountNumber"
              placeholder="Your bank account number"
              value={formData.bankAccountNumber}
              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankAccountName">Account Name</Label>
            <Input
              id="bankAccountName"
              placeholder="Account holder name"
              value={formData.bankAccountName}
              onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Review & Submit',
      description: 'Review your application before submitting',
      content: (
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium">Name:</span> {formData.contactPerson}</p>
                <p><span className="font-medium">Email:</span> {formData.contactEmail}</p>
                <p><span className="font-medium">Phone:</span> {formData.contactPhone}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                Business Information
              </h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium">Business Name:</span> {formData.businessName}</p>
                <p><span className="font-medium">Category:</span> {formData.businessCategory}</p>
                <p><span className="font-medium">Description:</span> {formData.businessDescription}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                Location
              </h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium">Region:</span> {formData.storeRegion}</p>
                <p><span className="font-medium">District:</span> {formData.storeCity}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <Store className="h-4 w-4 text-primary" />
                Store Details
              </h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><span className="font-medium">Store Name:</span> {formData.storeName}</p>
                {formData.storeDescription && (
                  <p><span className="font-medium">Description:</span> {formData.storeDescription}</p>
                )}
                {logoPreview && <p className="text-primary">✓ Logo uploaded</p>}
                {bannerPreview && <p className="text-primary">✓ Banner uploaded</p>}
              </div>
            </div>

            {formData.bankName && (
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Banking Information
                </h3>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><span className="font-medium">Bank:</span> {formData.bankName}</p>
                  <p><span className="font-medium">Account Number:</span> {formData.bankAccountNumber}</p>
                  <p><span className="font-medium">Account Name:</span> {formData.bankAccountName}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm text-primary font-medium">
              By submitting this application, you agree to our terms and conditions for sellers.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Become a Seller</h1>
          </div>
        </div>

        <div className="container max-w-2xl mx-auto p-4">
          <MultiStepForm
            steps={steps}
            onComplete={handleSubmit}
            onBack={() => navigate(-1)}
            submitText="Submit Application"
            backText="Cancel"
          />
        </div>
      </div>

      {showLogoCrop && logoPreview && (
        <ImageCropModal
          open={showLogoCrop}
          imageUrl={logoPreview}
          onClose={() => setShowLogoCrop(false)}
          onCropComplete={handleLogoCropComplete}
        />
      )}

      {showBannerCrop && bannerPreview && (
        <ImageCropModal
          open={showBannerCrop}
          imageUrl={bannerPreview}
          onClose={() => setShowBannerCrop(false)}
          onCropComplete={handleBannerCropComplete}
        />
      )}
    </>
  );
}
