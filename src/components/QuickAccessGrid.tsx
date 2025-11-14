import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Grid3x3, 
  Zap, 
  TrendingUp, 
  Package, 
  MessageCircle, 
  Settings,
  HelpCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAccessItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  path: string;
}

const quickAccessItems: QuickAccessItem[] = [
  { name: 'RFQ', icon: FileText, color: 'from-blue-500 to-blue-600', path: '/become-seller' },
  { name: 'Categories', icon: Grid3x3, color: 'from-purple-500 to-purple-600', path: '/categories' },
  { name: 'Fast Ship', icon: Zap, color: 'from-orange-500 to-orange-600', path: '/' },
  { name: 'Trending', icon: TrendingUp, color: 'from-green-500 to-green-600', path: '/' },
  { name: 'Stores', icon: Package, color: 'from-red-500 to-red-600', path: '/stores' },
  { name: 'Messages', icon: MessageCircle, color: 'from-pink-500 to-pink-600', path: '/messages' },
  { name: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-600', path: '/profile' },
  { name: 'Support', icon: HelpCircle, color: 'from-teal-500 to-teal-600', path: '/support' },
];

export const QuickAccessGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
      {quickAccessItems.map((item) => (
        <Card
          key={item.name}
          className="cursor-pointer hover-scale transition-transform border-0 shadow-md overflow-hidden"
          onClick={() => navigate(item.path)}
        >
          <CardContent className="p-0">
            <div className={`bg-gradient-to-br ${item.color} aspect-square flex items-center justify-center`}>
              <item.icon className="h-7 w-7 text-white" />
            </div>
            <div className="p-2 text-center">
              <p className="text-xs font-medium truncate">{item.name}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
