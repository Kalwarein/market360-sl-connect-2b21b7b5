import { Home, Store, MessageCircle, ShoppingCart, User } from 'lucide-react';
import { NavLink } from './NavLink';
import { cn } from '@/lib/utils';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useLocation } from 'react-router-dom';

const BottomNav = () => {
  const { hasPendingOrders } = useSellerNotifications();
  const { isSeller } = useUserRoles();
  const location = useLocation();
  
  // Hide notification dot if user is on profile or seller dashboard pages
  const isOnProfilePages = location.pathname === '/profile' || 
                          location.pathname === '/seller-dashboard';
  const showProfileDot = isSeller && hasPendingOrders && !isOnProfilePages;

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/categories', icon: Store, label: 'Markets' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart' },
    { to: '/profile', icon: User, label: 'Profile', showDot: showProfileDot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-all"
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2 rounded-xl transition-all relative",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5",
                    isActive && "text-primary"
                  )} />
                  {item.showDot && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;