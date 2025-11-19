import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Store } from 'lucide-react';
import { z } from 'zod';
import { MultiStepForm } from '@/components/MultiStepForm';
import { LocationPicker } from '@/components/LocationPicker';
import { NumericInput } from '@/components/NumericInput';

const applicationSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100),
  contact_person: z.string().min(1, 'Contact person is required').max(100),
  contact_email: z.string().email('Invalid email').max(255),
  contact_phone: z.string().min(1, 'Phone is required').max(20),
  business_category: z.string().min(1, 'Category is required'),
  business_description: z.string().max(1000),
  store_region: z.string().min(1, 'Region is required'),
  store_city: z.string().min(1, 'District is required'),
});

const BecomeSellerMultiStep = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    contact_email: user?.email || '',
    contact_phone: '',
    business_category: '',
    business_description: '',
    how_heard_about: '',
    store_description: '',
    store_address: '',
    store_city: '',
    store_region: '',
    store_country: 'Sierra Leone',
    business_registration_number: '',
    tax_id: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: ''
  });

  const handleSubmit = async () => {
    try {
      applicationSchema.parse(formData);

      const { error } = await supabase
        .from('seller_applications')
        .insert([{ user_id: user?.id, ...formData }]);

      if (error) throw error;

      await supabase
        .from('audit_logs')
        .insert([{
          actor_id: user?.id,
          action: 'seller_application_submitted',
          description: `User applied to become a seller: ${formData.business_name}`
        }]);

      toast.success('Application submitted! We will review it shortly.');
      navigate('/profile');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        console.error('Error submitting application:', err);
        toast.error('Failed to submit application');
      }
      throw err;
    }
  };

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself and how to contact you',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person Name *</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email Address *</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
              placeholder="john@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Phone Number *</Label>
            <NumericInput
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(value) => setFormData({...formData, contact_phone: value})}
              placeholder="076123456"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="how_heard_about">How did you hear about us?</Label>
            <Input
              id="how_heard_about"
              value={formData.how_heard_about}
              onChange={(e) => setFormData({...formData, how_heard_about: e.target.value})}
              placeholder="Social media, friend, advertisement..."
            />
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.contact_person || !formData.contact_email || !formData.contact_phone) {
          toast.error('Please fill in all required personal information fields');
          return false;
        }
        return true;
      }
    },
    {
      title: 'Business Details',
      description: 'Provide information about your business',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              value={formData.business_name}
              onChange={(e) => setFormData({...formData, business_name: e.target.value})}
              placeholder="Your Business Name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_category">Business Category *</Label>
            <Input
              id="business_category"
              value={formData.business_category}
              onChange={(e) => setFormData({...formData, business_category: e.target.value})}
              placeholder="e.g., Electronics, Fashion, Food"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_description">Business Description</Label>
            <Textarea
              id="business_description"
              value={formData.business_description}
              onChange={(e) => setFormData({...formData, business_description: e.target.value})}
              placeholder="Describe your business and what you sell"
              rows={4}
            />
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.business_name || !formData.business_category) {
          toast.error('Please fill in all required business information fields');
          return false;
        }
        return true;
      }
    },
    {
      title: 'Store Location',
      description: 'Where is your business located?',
      content: (
        <div className="space-y-4">
          <LocationPicker
            region={formData.store_region}
            district={formData.store_city}
            onRegionChange={(value) => setFormData({...formData, store_region: value})}
            onDistrictChange={(value) => setFormData({...formData, store_city: value})}
            required
          />
          <div className="space-y-2">
            <Label htmlFor="store_address">Street Address</Label>
            <Input
              id="store_address"
              value={formData.store_address}
              onChange={(e) => setFormData({...formData, store_address: e.target.value})}
              placeholder="123 Main Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_description">Store Description</Label>
            <Textarea
              id="store_description"
              value={formData.store_description}
              onChange={(e) => setFormData({...formData, store_description: e.target.value})}
              placeholder="Tell customers about your store"
              rows={3}
            />
          </div>
        </div>
      ),
      validate: () => {
        if (!formData.store_region || !formData.store_city) {
          toast.error('Please select region and district');
          return false;
        }
        return true;
      }
    },
    {
      title: 'Banking Information',
      description: 'Add your banking details for payments (optional)',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
              placeholder="e.g., Sierra Leone Commercial Bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_name">Account Name</Label>
            <Input
              id="bank_account_name"
              value={formData.bank_account_name}
              onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
              placeholder="Account holder name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account_number">Account Number</Label>
            <NumericInput
              id="bank_account_number"
              value={formData.bank_account_number}
              onChange={(value) => setFormData({...formData, bank_account_number: value})}
              placeholder="1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_registration_number">Business Registration Number</Label>
            <Input
              id="business_registration_number"
              value={formData.business_registration_number}
              onChange={(e) => setFormData({...formData, business_registration_number: e.target.value})}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">Tax ID</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
              placeholder="Optional"
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Become a Seller</h1>
            <p className="text-sm opacity-90">Join Market360 as a verified seller</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <MultiStepForm
          steps={steps}
          onComplete={handleSubmit}
          onBack={() => navigate(-1)}
          submitText="Submit Application"
        />
      </div>
    </div>
  );
};

export default BecomeSellerMultiStep;
