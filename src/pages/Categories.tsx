import { Grid3x3, Smartphone, Shirt, Home as HomeIcon, Zap, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const categories = [
  { name: 'Electronics', icon: Smartphone, color: 'from-blue-500 to-blue-600' },
  { name: 'Fashion', icon: Shirt, color: 'from-pink-500 to-pink-600' },
  { name: 'Home & Garden', icon: HomeIcon, color: 'from-green-500 to-green-600' },
  { name: 'Industrial', icon: Wrench, color: 'from-gray-500 to-gray-600' },
  { name: 'Beauty & Health', icon: Zap, color: 'from-purple-500 to-purple-600' },
  { name: 'Sports', icon: Grid3x3, color: 'from-orange-500 to-orange-600' },
];

const Categories = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm opacity-90">Browse products by category</p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <Card 
            key={category.name}
            className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
          >
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${category.color} h-32 flex items-center justify-center`}>
                <category.icon className="h-12 w-12 text-white" />
              </div>
              <div className="p-3 text-center">
                <h3 className="font-medium">{category.name}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Categories;