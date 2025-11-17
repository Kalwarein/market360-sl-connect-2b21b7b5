import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Crown, Zap, Star, Gift, Sparkles, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const Perks = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const perks = [
    {
      id: 1,
      icon: Crown,
      title: 'Premium Membership',
      subtitle: 'Unlock all exclusive features',
      price: '$9.99/month',
      features: ['Ad-free experience', 'Priority support', 'Early access to new features'],
      gradient: 'from-purple-500 to-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 2,
      icon: Zap,
      title: 'Boost Your Store',
      subtitle: 'Get featured on homepage',
      price: '$14.99/week',
      features: ['10x more visibility', 'Featured badge', 'Analytics dashboard'],
      gradient: 'from-blue-500 to-blue-700',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 3,
      icon: Star,
      title: 'VIP Access',
      subtitle: 'Join the elite circle',
      price: '$29.99/month',
      features: ['Exclusive deals', 'VIP badge', 'Private community access'],
      gradient: 'from-amber-500 to-amber-700',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      id: 4,
      icon: Gift,
      title: 'Rewards Bundle',
      subtitle: 'Earn points with every purchase',
      price: '$4.99/month',
      features: ['5% cashback', 'Birthday rewards', 'Referral bonuses'],
      gradient: 'from-pink-500 to-pink-700',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    }
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer-light {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes float-subtle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(124, 58, 237, 0.2);
          }
          50% {
            box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
          }
        }

        .perk-card {
          position: relative;
          cursor: pointer;
          overflow: hidden;
          background: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .perk-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(124, 58, 237, 0.02) 2px,
              rgba(124, 58, 237, 0.02) 4px
            );
          pointer-events: none;
        }

        .perk-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer-light 3s linear infinite;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .perk-card:hover::after {
          opacity: 1;
        }

        .perk-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(124, 58, 237, 0.3);
        }

        .perk-icon-wrapper {
          transition: all 0.3s ease;
        }

        .perk-card:hover .perk-icon-wrapper {
          animation: float-subtle 2s ease-in-out infinite;
          transform: scale(1.1);
        }

        .perk-image {
          position: relative;
          overflow: hidden;
        }

        .perk-image::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.6) 50%,
            transparent 70%
          );
          transform: rotate(45deg);
          animation: shimmer-light 3s linear infinite;
        }

        .buy-button {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .buy-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .buy-button:hover::before {
          width: 300px;
          height: 300px;
        }

        .feature-badge {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
          border: 1px solid rgba(124, 58, 237, 0.2);
        }
      `}</style>

      <div className="min-h-screen bg-white pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Premium Features</h1>
              <p className="text-sm text-gray-600">Unlock exclusive perks & benefits</p>
            </div>
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        {/* Hero Section */}
        <div className="p-6 bg-gradient-to-br from-purple-50 via-white to-purple-50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-4">
              <Crown className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Perk</h2>
            <p className="text-gray-600">Select the perfect plan to enhance your experience</p>
          </div>
        </div>

        {/* Perks Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {perks.map((perk) => (
            <Card
              key={perk.id}
              className="perk-card border-gray-200"
              onMouseEnter={() => setHoveredCard(perk.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardContent className="p-6">
                {/* Icon and Image Section */}
                <div className="perk-image mb-4 flex items-center justify-center">
                  <div className={`perk-icon-wrapper h-16 w-16 rounded-full ${perk.iconBg} flex items-center justify-center`}>
                    <perk.icon className={`h-8 w-8 ${perk.iconColor}`} />
                  </div>
                </div>

                {/* Title and Subtitle */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{perk.title}</h3>
                  <p className="text-sm text-gray-600">{perk.subtitle}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {perk.price}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-6">
                  {perk.features.map((feature, index) => (
                    <div key={index} className="feature-badge rounded-lg px-3 py-2 flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Buy Button */}
                <Button
                  className={`buy-button w-full bg-gradient-to-r ${perk.gradient} text-white font-semibold py-6 text-base hover:opacity-90 transition-all relative z-10`}
                  onClick={() => {
                    // Handle purchase logic here
                    console.log(`Purchasing ${perk.title}`);
                  }}
                >
                  Buy Now
                  <ChevronRight className={`ml-2 h-5 w-5 transition-transform ${hoveredCard === perk.id ? 'translate-x-1' : ''}`} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="p-6 text-center text-sm text-gray-500">
          <p>All purchases are secure and can be cancelled anytime</p>
        </div>

        <BottomNav />
      </div>
    </>
  );
};

export default Perks;
      
