import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, LayoutDashboard, Eye, Plus } from 'lucide-react';

const ProductCreationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-primary/20 animate-fade-in">
        <CardContent className="p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-14 w-14 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Product Created Successfully!
          </h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            Your product has been added to your store and is now live on Market360.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/seller-dashboard')} 
              className="w-full h-12 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full h-12 text-base font-medium rounded-xl hover:bg-primary/5 transition-all"
              size="lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              View Marketplace
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => navigate('/add-product')} 
              className="w-full h-12 text-base text-muted-foreground hover:text-primary rounded-xl transition-all"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Another Product
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCreationSuccess;
