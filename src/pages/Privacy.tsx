import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
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
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm opacity-90">Last updated: November 2024</p>
      </div>

      <div className="p-4">
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We collect the following types of information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Personal information (name, email, phone number, address)</li>
                <li>Business information (company name, tax ID, business license)</li>
                <li>Transaction history and payment information</li>
                <li>Device information and usage data</li>
                <li>Communication records with other users and support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide and improve our services</li>
                <li>Process transactions and send notifications</li>
                <li>Verify seller identities and maintain platform security</li>
                <li>Communicate important updates and promotional offers</li>
                <li>Comply with legal obligations and resolve disputes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We share information only when necessary to complete transactions (with
                buyers and sellers), comply with legal requirements, protect our rights and
                users' safety, or with your explicit consent. We never sell your personal
                information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your data,
                including encryption, secure servers, and regular security audits. However,
                no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance user experience,
                analyze platform usage, and provide personalized content. You can control
                cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access and update your personal information</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
                <li>Lodge a complaint with data protection authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your information for as long as necessary to provide services,
                comply with legal obligations, and resolve disputes. Inactive accounts may
                be deleted after a period of inactivity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform is not intended for users under 18 years of age. We do not
                knowingly collect information from children. If you believe a child has
                provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other
                than your country of residence. We ensure appropriate safeguards are in
                place to protect your data during such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy periodically. We will notify users of
                significant changes via email or platform notifications. Continued use of
                our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For privacy-related questions or to exercise your rights, contact us at
                privacy@market360.com or write to our Data Protection Officer at our
                business address.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Privacy;
