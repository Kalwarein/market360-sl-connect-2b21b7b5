import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, MapPin, GraduationCap, Briefcase, Heart, Calendar, Users } from 'lucide-react';
import { MultiStepForm } from '@/components/MultiStepForm';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    birth_day: '',
    birth_month: '',
    birth_year: '',
    gender: '',
    street_address: '',
    city: '',
    region: '',
    school_name: '',
    university_name: '',
    occupation: '',
    bio: '',
    interests: '',
  });

  // Calculate days in selected month
  const daysInMonth = useMemo(() => {
    if (!formData.birth_month || !formData.birth_year) return 31;
    
    const month = parseInt(formData.birth_month);
    const year = parseInt(formData.birth_year);
    
    if (month === 2) {
      // Check for leap year
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      return isLeapYear ? 29 : 28;
    }
    
    // Months with 30 days: April, June, September, November
    if ([4, 6, 9, 11].includes(month)) {
      return 30;
    }
    
    return 31;
  }, [formData.birth_month, formData.birth_year]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleComplete = async () => {
    if (loading) return;
    
    try {
      setLoading(true);

      if (!user?.id) {
        toast.error('User session not found. Please login again.');
        return;
      }

      // Convert comma-separated interests to array
      const interestsArray = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      // Construct date_of_birth from day, month, year
      let dateOfBirth = null;
      if (formData.birth_year && formData.birth_month && formData.birth_day) {
        const month = formData.birth_month.padStart(2, '0');
        const day = formData.birth_day.padStart(2, '0');
        dateOfBirth = `${formData.birth_year}-${month}-${day}`;
      }

      console.log('Updating profile for user:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          date_of_birth: dateOfBirth,
          gender: formData.gender,
          street_address: formData.street_address,
          city: formData.city,
          region: formData.region,
          school_name: formData.school_name,
          university_name: formData.university_name,
          occupation: formData.occupation,
          bio: formData.bio,
          interests: interestsArray,
          onboarding_completed: true,
        })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
      toast.success('Welcome to Market360! Your profile is complete.');
      
      // Force a full page reload to re-check onboarding status
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      toast.error(error?.message || 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePersonalInfo = () => {
    if (!formData.full_name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!formData.gender) {
      toast.error('Please select your gender');
      return false;
    }
    return true;
  };

  const steps = [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full Name *
            </Label>
            <Input
              id="full_name"
              placeholder="Enter your complete name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date of Birth
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Month Dropdown */}
              <div>
                <select
                  value={formData.birth_month}
                  onChange={(e) => {
                    const newMonth = e.target.value;
                    const newDaysInMonth = newMonth === '2' 
                      ? (formData.birth_year && ((parseInt(formData.birth_year) % 4 === 0 && parseInt(formData.birth_year) % 100 !== 0) || (parseInt(formData.birth_year) % 400 === 0)) ? 29 : 28)
                      : ['4', '6', '9', '11'].includes(newMonth) ? 30 : 31;
                    
                    setFormData({ 
                      ...formData, 
                      birth_month: newMonth,
                      birth_day: parseInt(formData.birth_day) > newDaysInMonth ? '' : formData.birth_day
                    });
                  }}
                  className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Month</option>
                  {months.map((month, index) => (
                    <option key={month} value={String(index + 1)}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day Input */}
              <div>
                <Input
                  type="number"
                  placeholder="Day"
                  min="1"
                  max={daysInMonth}
                  value={formData.birth_day}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty or valid numbers
                    if (value === '') {
                      setFormData({ ...formData, birth_day: '' });
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= daysInMonth) {
                        setFormData({ ...formData, birth_day: value });
                      }
                    }
                  }}
                  className="rounded-xl"
                />
              </div>

              {/* Year Input */}
              <div>
                <Input
                  type="number"
                  placeholder="Year"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.birth_year}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow typing freely, just update state
                    setFormData({ ...formData, birth_year: value });
                  }}
                  onBlur={(e) => {
                    // Validate on blur
                    const value = e.target.value;
                    if (value !== '') {
                      const numValue = parseInt(value);
                      const currentYear = new Date().getFullYear();
                      if (isNaN(numValue) || numValue < 1900 || numValue > currentYear) {
                        toast.error(`Please enter a year between 1900 and ${currentYear}`);
                        setFormData({ ...formData, birth_year: '' });
                      }
                    }
                  }}
                  className="rounded-xl"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Select or type your birth date (Month, Day, Year)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Gender *
            </Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      ),
      validation: validatePersonalInfo,
    },
    {
      title: 'Location',
      description: 'Where are you from?',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street_address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Street Address
            </Label>
            <Input
              id="street_address"
              placeholder="House number, street name"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City/Town</Label>
            <Input
              id="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region/District</Label>
            <Input
              id="region"
              placeholder="Enter your region"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Education & Career',
      description: 'Your academic and professional background',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school_name" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              School(s) Attended
            </Label>
            <Input
              id="school_name"
              placeholder="High school, secondary school"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="university_name">University/College</Label>
            <Input
              id="university_name"
              placeholder="University or college name"
              value={formData.university_name}
              onChange={(e) => setFormData({ ...formData, university_name: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Occupation/Profession
            </Label>
            <Input
              id="occupation"
              placeholder="What do you do?"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="rounded-xl"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'About You',
      description: 'Share your story and interests',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="rounded-xl min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Interests & Hobbies
            </Label>
            <Input
              id="interests"
              placeholder="Sports, Music, Reading, etc. (comma-separated)"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Separate interests with commas
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help others get to know you better by sharing your information
          </p>
        </div>

        <div className="bg-card rounded-3xl shadow-xl p-8 border border-border/50">
          <MultiStepForm
            steps={steps}
            onComplete={handleComplete}
            submitText={loading ? 'Saving...' : 'Complete Setup'}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
