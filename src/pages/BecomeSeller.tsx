import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Store } from 'lucide-react';
import { z } from 'zod';

const applicationSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100),
  contact_person: z.string().min(1, 'Contact person is required').max(100),
  contact_email: z.string().email('Invalid email').max(255),
  contact_phone: z.string().min(1, 'Phone is required').max(20),
  business_category: z.string().min(1, 'Category is required'),
  business_description: z.string().max(1000)
});

const BecomeSeller = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      applicationSchema.parse(formData);
      setLoading(true);

      const { error } = await supabase
        .from('seller_applications')
        .insert([
          {
            user_id: user?.id,
            ...formData
          }
        ]);

      if (error) throw error;

      // Create audit log
      await supabase
        .from('audit_logs')
        .insert([
          {
            actor_id: user?.id,
            action: 'seller_application_submitted',
            description: `User applied to become a seller: ${formData.business_name}`
          }
        ]);

      toast.success('Application submitted! We will review it shortly.');
      navigate('/profile');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        console.error('Error submitting application:', err);
        toast.error('Failed to submit application');
      }
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Become a Seller</h1>
        <p className="text-sm opacity-90">Start your journey on Market360</p>
      </div>

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Seller Application
            </CardTitle>
            <CardDescription>
              Fill out the form below to apply as a seller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Your business name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="business@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone *</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+232 XX XXX XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_category">Business Category *</Label>
                <Input
                  id="business_category"
                  value={formData.business_category}
                  onChange={(e) => setFormData({ ...formData, business_category: e.target.value })}
                  placeholder="e.g., Electronics, Fashion, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_description">Business Description</Label>
                <Textarea
                  id="business_description"
                  value={formData.business_description}
                  onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                  placeholder="Tell us about your business..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="how_heard_about">How did you hear about Market360?</Label>
                <Input
                  id="how_heard_about"
                  value={formData.how_heard_about}
                  onChange={(e) => setFormData({ ...formData, how_heard_about: e.target.value })}
                  placeholder="Social media, friend, etc."
                />
              </div>

              <div className="pt-6 pb-2">
                <h3 className="text-lg font-semibold mb-4">Store Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_description">Store Description *</Label>
                <Textarea
                  id="store_description"
                  value={formData.store_description}
                  onChange={(e) => setFormData({ ...formData, store_description: e.target.value })}
                  placeholder="Describe what your store will offer..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_address">Store Address *</Label>
                <Input
                  id="store_address"
                  value={formData.store_address}
                  onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                  placeholder="Physical store address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store_city">City *</Label>
                  <Input
                    id="store_city"
                    value={formData.store_city}
                    onChange={(e) => setFormData({ ...formData, store_city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_region">Region *</Label>
                  <Input
                    id="store_region"
                    value={formData.store_region}
                    onChange={(e) => setFormData({ ...formData, store_region: e.target.value })}
                    placeholder="Region"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 pb-2">
                <h3 className="text-lg font-semibold mb-4">Business Registration</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_registration_number">Business Registration Number</Label>
                <Input
                  id="business_registration_number"
                  value={formData.business_registration_number}
                  onChange={(e) => setFormData({ ...formData, business_registration_number: e.target.value })}
                  placeholder="Official registration number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="Tax identification number"
                />
              </div>

              <div className="pt-6 pb-2">
                <h3 className="text-lg font-semibold mb-4">Banking Information</h3>
                <p className="text-sm text-muted-foreground">For payments and transfers</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name *</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Your bank name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Name *</Label>
                <Input
                  id="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                  placeholder="Name on account"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number *</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="Bank account number"
                  required
                />
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  * Required fields. All information will be verified during review.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BecomeSeller;