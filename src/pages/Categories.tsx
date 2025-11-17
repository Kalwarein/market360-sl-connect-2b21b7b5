import { Grid3x3, Smartphone, Shirt, HomeIcon, Zap, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const styles = `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes typewriter {
    0% { content: 'Browse categories'; width: 0; }
    20% { content: 'Find what you need'; width: 100%; }
    40% { content: 'Shop by category'; width: 100%; }
    60% { content: 'Explore products'; width: 100%; }
    80% { content: 'Browse categories'; width: 0; }
    100% { content: 'Browse categories'; width: 0; }
  }
  
  @keyframes particleFloat {
    0% { opacity: 0; transform: translate(0, 100px); }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { opacity: 0; transform: translate(0, -100px); }
  }
  
  @keyframes headerShimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .shimmer-animation {
    background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 1000px 100%;
    animation: shimmer 3s infinite;
  }
  
  .float-animation {
    animation: float 3s ease-in-out infinite;
  }
  
  .fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  
  .particle {
    position: fixed;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    pointer-events: none;
  }
  
  .particle-float {
    animation: particleFloat 4s ease-in forwards;
  }
  
  .header-shimmer {
    background: linear-gradient(90deg, #10b981 0%, #14b8a6 25%, #0ea5e9 50%, #8b5cf6 75%, #10b981 100%);
    background-size: 200% 100%;
    animation: headerShimmer 8s ease infinite;
  }
`;

const categories = [
  { name: 'Electronics', icon: Smartphone, color: 'from-blue-500 to-blue-600' },
  { name: 'Fashion', icon: Shirt, color: 'from-pink-500 to-pink-600' },
  { name: 'Home & Garden', icon: HomeIcon, color: 'from-green-500 to-green-600' },
  { name: 'Industrial', icon: Wrench, color: 'from-gray-500 to-gray-600' },
  { name: 'Beauty & Health', icon: Zap, color: 'from-purple-500 to-purple-600' },
  { name: 'Sports', icon: Grid3x3, color: 'from-orange-500 to-orange-600' },
];

const Categories = () => {
  React.useEffect(() => {
    const particleContainer = document.getElementById('particle-container');
    if (!particleContainer) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle particle-float';
      particle.style.left = Math.random() * window.innerWidth + 'px';
      particle.style.top = '0px';
      particleContainer.appendChild(particle);

      setTimeout(() => particle.remove(), 4000);
    };

    const interval = setInterval(createParticle, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <style>{styles}</style>

      <div className="relative overflow-hidden">
        <div id="particle-container" className="absolute inset-0 pointer-events-none" />
        <div className="header-shimmer text-white p-8 shadow-lg relative z-10">
          <div className="fade-in-up">
            <h1 className="text-4xl font-bold mb-2">Categories</h1>
            <p className="text-lg opacity-95">Browse products by category</p>
          </div>
          <div className="absolute top-4 right-4 opacity-30">
            <div className="shimmer-animation absolute inset-0 rounded-full w-16 h-16" />
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4 md:gap-5 lg:gap-6">
        {categories.map((category, index) => (
          <Card 
            key={category.name}
            className="cursor-pointer hover:shadow-xl transition-all overflow-hidden border-0 float-animation"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              animation: `fadeInUp 0.6s ease-out forwards`,
              animationDelay: `${index * 0.08}s`
            }}
          >
            <CardContent className="p-0">
              <div className={`relative bg-gradient-to-br ${category.color} h-32 flex items-center justify-center overflow-hidden group`}>
                <div className="absolute inset-0 shimmer-animation opacity-40" />
                <category.icon className="h-12 w-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              
              <div className="p-4 text-center bg-white">
                <h3 className="font-semibold text-base text-gray-900">{category.name}</h3>
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
      
