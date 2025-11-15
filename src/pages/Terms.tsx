import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const Terms = () => {
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
        <h1 className="text-2xl font-bold">Terms & Conditions</h1>
        <p className="text-sm opacity-90">Last updated: November 2024</p>
      </div>

      <div className="p-4">
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Market360, you accept and agree to be bound by the
                terms and provisions of this agreement. If you do not agree to these terms,
                please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your account. You must
                immediately notify us of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Seller Obligations</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Sellers on Market360 agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide accurate product descriptions and pricing</li>
                <li>Fulfill orders in a timely manner</li>
                <li>Maintain quality standards for all products</li>
                <li>Respond to buyer inquiries promptly</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Buyer Obligations</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Buyers on Market360 agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide accurate shipping and contact information</li>
                <li>Make timely payments for orders</li>
                <li>Communicate professionally with sellers</li>
                <li>Review products fairly and honestly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Users are prohibited from:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Posting false or misleading information</li>
                <li>Infringing on intellectual property rights</li>
                <li>Engaging in fraudulent activities</li>
                <li>Harassing or threatening other users</li>
                <li>Attempting to bypass security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Payment Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed securely through our platform. Sellers will
                receive payment after successful order completion, minus applicable fees.
                Buyers may be eligible for refunds according to our refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                In case of disputes between buyers and sellers, Market360 will mediate to
                reach a fair resolution. Both parties agree to provide necessary
                documentation and cooperate in good faith.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Market360 is a platform connecting buyers and sellers. We are not
                responsible for the quality, safety, or legality of products listed, the
                truth or accuracy of listings, or the ability of sellers to complete
                transactions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of
                the platform after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these terms, please contact us at legal@market360.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Terms;
